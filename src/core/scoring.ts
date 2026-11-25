import {
  LOYALTY_POINTS_CAP,
  NORMAL_WEIGHTS,
  TICKET_VALUE_CAP,
  WAIT_MINUTES_CAP,
} from "./config";
import type { RankedEntry, TicketQueueEntry } from "../types";

function getScorePoints(factor: number, weight: number, totalWeight: number): number {
  return (100 * factor * weight) / totalWeight;
}

export function scoreEntry(
  entry: TicketQueueEntry,
  now: Date,
): RankedEntry {
  const loyaltyPoints = Math.max(entry.loyaltyPoints ?? 0, 0);
  const loyaltyFactor = Math.min(loyaltyPoints, LOYALTY_POINTS_CAP) / LOYALTY_POINTS_CAP;

  const joinedQueueTime = new Date(entry.joinedQueueAt).getTime();
  const waitMinutes = Math.max((now.getTime() - joinedQueueTime) / 60_000, 0);
  const waitingFactor = Math.min(waitMinutes, WAIT_MINUTES_CAP) / WAIT_MINUTES_CAP;

  const ticketValue = Number(entry.ticketValue);
  const ticketFactor = Math.min(
    Math.log10(1 + ticketValue) / Math.log10(1 + TICKET_VALUE_CAP),
    1,
  );

  const vipFactor = entry.membership === "vip" ? 1 : 0;
  const upgradesLast30Days = Math.max(entry.upgradesLast30Days ?? 0, 0);
  const recentUpgradesFactor = Math.pow(2, -upgradesLast30Days);

  const totalWeight = Object.values(NORMAL_WEIGHTS).reduce(
    (total, weight) => total + weight,
    0,
  );
  const loyaltyPointsEarned = getScorePoints(
    loyaltyFactor,
    NORMAL_WEIGHTS.loyalty,
    totalWeight,
  );
  const waitingPointsEarned = getScorePoints(
    waitingFactor,
    NORMAL_WEIGHTS.waiting,
    totalWeight,
  );
  const ticketPointsEarned = getScorePoints(
    ticketFactor,
    NORMAL_WEIGHTS.ticket,
    totalWeight,
  );
  const vipPointsEarned = getScorePoints(
    vipFactor,
    NORMAL_WEIGHTS.vip,
    totalWeight,
  );
  const recentUpgradesPointsEarned = getScorePoints(
    recentUpgradesFactor,
    NORMAL_WEIGHTS.recentUpgrades,
    totalWeight,
  );

  const score =
    loyaltyPointsEarned +
    waitingPointsEarned +
    ticketPointsEarned +
    vipPointsEarned +
    recentUpgradesPointsEarned;

  return {
    entry,
    score,
    reasons: [
      `Loyalty points: ${loyaltyPoints} / ${LOYALTY_POINTS_CAP}, adds ${loyaltyPointsEarned.toFixed(2)} points.`,
      `Waiting time: ${waitMinutes.toFixed(1)} / ${WAIT_MINUTES_CAP} minutes, adds ${waitingPointsEarned.toFixed(2)} points.`,
      `Ticket value: ${ticketValue}, normalized to ${ticketFactor.toFixed(2)}, adds ${ticketPointsEarned.toFixed(2)} points.`,
      `VIP membership: ${vipFactor === 1 ? "yes" : "no"}, adds ${vipPointsEarned.toFixed(2)} points.`,
      `Recent upgrades: ${upgradesLast30Days}, adds ${recentUpgradesPointsEarned.toFixed(2)} points.`,
    ],
  };
}
