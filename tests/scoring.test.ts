import { describe, expect, test } from "@jest/globals";
import {
  LOYALTY_POINTS_CAP,
  TICKET_VALUE_CAP,
  WAIT_MINUTES_CAP,
} from "../src/core/config";
import { scoreEntry } from "../src/core/scoring";
import type { TicketQueueEntry } from "../src/types";

const now = new Date("2026-06-01T12:00:00.000Z");

function createEntry(
  overrides: Partial<TicketQueueEntry> = {},
): TicketQueueEntry {
  return {
    id: "entry-1",
    fanId: "fan-1",
    fanName: "Alex",
    ticketValue: 1,
    joinedQueueAt: now.toISOString(),
    eventStartsAt: "2026-06-01T14:00:00.000Z",
    status: "waiting",
    ...overrides,
  };
}

describe("scoreEntry", () => {
  test("gives the maximum score when every factor is at its maximum", () => {
    const entry = createEntry({
      ticketValue: TICKET_VALUE_CAP,
      joinedQueueAt: new Date(
        now.getTime() - WAIT_MINUTES_CAP * 60_000,
      ).toISOString(),
      loyaltyPoints: LOYALTY_POINTS_CAP,
      upgradesLast30Days: 0,
      membership: "vip",
    });

    expect(scoreEntry(entry, now).score).toBeCloseTo(100);
  });

  test.each(["normal", "rushHour", "vipHour", "fairQueue"] as const)(
    "keeps a maximum score at 100 in %s mode",
    (mode) => {
      const entry = createEntry({
        ticketValue: TICKET_VALUE_CAP,
        joinedQueueAt: new Date(
          now.getTime() - WAIT_MINUTES_CAP * 60_000,
        ).toISOString(),
        loyaltyPoints: LOYALTY_POINTS_CAP,
        upgradesLast30Days: 0,
        membership: "vip",
      });

      expect(scoreEntry(entry, now, mode).score).toBeCloseTo(100);
    },
  );

  test("uses Normal mode when no mode is provided", () => {
    const entry = createEntry({ loyaltyPoints: 500, membership: "vip" });

    expect(scoreEntry(entry, now).score).toBe(scoreEntry(entry, now, "normal").score);
  });

  test("caps loyalty points at the configured maximum", () => {
    const atCap = createEntry({ loyaltyPoints: LOYALTY_POINTS_CAP });
    const overCap = createEntry({ loyaltyPoints: LOYALTY_POINTS_CAP * 2 });

    expect(scoreEntry(overCap, now).score).toBe(scoreEntry(atCap, now).score);
  });

  test("caps waiting time at the configured maximum", () => {
    const atCap = createEntry({
      joinedQueueAt: new Date(
        now.getTime() - WAIT_MINUTES_CAP * 60_000,
      ).toISOString(),
    });
    const overCap = createEntry({
      joinedQueueAt: new Date(
        now.getTime() - WAIT_MINUTES_CAP * 2 * 60_000,
      ).toISOString(),
    });

    expect(scoreEntry(overCap, now).score).toBe(scoreEntry(atCap, now).score);
  });

  test("normalizes ticket value with the logarithmic formula", () => {
    const entry = createEntry({ ticketValue: 100 });
    const scoreWithoutTicketContribution = scoreEntry(
      createEntry({ ticketValue: 1 }),
      now,
    ).score;
    const expectedTicketContribution =
      (10 * Math.log10(101)) / Math.log10(1 + TICKET_VALUE_CAP) -
      (10 * Math.log10(2)) / Math.log10(1 + TICKET_VALUE_CAP);

    expect(scoreEntry(entry, now).score - scoreWithoutTicketContribution)
      .toBeCloseTo(expectedTicketContribution);
  });

  test("gives VIP membership the configured normal-mode boost", () => {
    const regularEntry = createEntry({ membership: "regular" });
    const vipEntry = createEntry({ membership: "vip" });

    expect(scoreEntry(vipEntry, now).score - scoreEntry(regularEntry, now).score)
      .toBeCloseTo(10);
  });

  test("gives VIP membership a larger boost in VIP Hour", () => {
    const regularEntry = createEntry({ membership: "regular" });
    const vipEntry = createEntry({ membership: "vip" });
    const boost =
      scoreEntry(vipEntry, now, "vipHour").score -
      scoreEntry(regularEntry, now, "vipHour").score;

    expect(boost).toBeCloseTo((100 * 20) / 110);
    expect(boost).toBeGreaterThan(10);
  });

  test("gives waiting time more influence in Rush Hour", () => {
    const waitedEntry = createEntry({
      joinedQueueAt: new Date(
        now.getTime() - WAIT_MINUTES_CAP * 60_000,
      ).toISOString(),
    });
    const justJoinedEntry = createEntry();
    const normalDifference =
      scoreEntry(waitedEntry, now, "normal").score -
      scoreEntry(justJoinedEntry, now, "normal").score;
    const rushDifference =
      scoreEntry(waitedEntry, now, "rushHour").score -
      scoreEntry(justJoinedEntry, now, "rushHour").score;

    expect(rushDifference).toBeGreaterThan(normalDifference);
  });

  test("reduces the recent-upgrade factor for each recent upgrade", () => {
    const noRecentUpgrades = createEntry({ upgradesLast30Days: 0 });
    const oneRecentUpgrade = createEntry({ upgradesLast30Days: 1 });

    expect(scoreEntry(noRecentUpgrades, now).score - scoreEntry(oneRecentUpgrade, now).score)
      .toBeCloseTo(10);
  });

  test("makes recent upgrades a stronger penalty in Fair Queue", () => {
    const noRecentUpgrades = createEntry({ upgradesLast30Days: 0 });
    const oneRecentUpgrade = createEntry({ upgradesLast30Days: 1 });
    const fairQueueDifference =
      scoreEntry(noRecentUpgrades, now, "fairQueue").score -
      scoreEntry(oneRecentUpgrade, now, "fairQueue").score;
    const normalDifference =
      scoreEntry(noRecentUpgrades, now, "normal").score -
      scoreEntry(oneRecentUpgrade, now, "normal").score;

    expect(fairQueueDifference).toBeGreaterThan(normalDifference);
    expect(fairQueueDifference).toBeCloseTo((100 * 40 * 0.5) / 115);
  });

  test("treats null score values as zero", () => {
    const nullValues = createEntry({
      loyaltyPoints: null,
      upgradesLast30Days: null,
    });
    const zeroValues = createEntry({ loyaltyPoints: 0, upgradesLast30Days: 0 });

    expect(scoreEntry(nullValues, now).score).toBe(scoreEntry(zeroValues, now).score);
  });

  test("clamps negative score values to zero", () => {
    const negativeValues = createEntry({
      loyaltyPoints: -100,
      upgradesLast30Days: -2,
    });
    const zeroValues = createEntry({ loyaltyPoints: 0, upgradesLast30Days: 0 });

    expect(scoreEntry(negativeValues, now).score).toBe(scoreEntry(zeroValues, now).score);
  });

  test("gives a future queue time zero waiting minutes", () => {
    const entry = createEntry({ joinedQueueAt: "2026-06-01T13:00:00.000Z" });
    const entryJoinedNow = createEntry();

    expect(scoreEntry(entry, now).score).toBe(scoreEntry(entryJoinedNow, now).score);
  });

  test("returns a reason for each scoring factor", () => {
    const result = scoreEntry(
      createEntry({ membership: "vip", loyaltyPoints: 500 }),
      now,
    );

    expect(result.reasons).toHaveLength(5);
    expect(result.reasons[0]).toContain("Loyalty points");
    expect(result.reasons[1]).toContain("Waiting time");
    expect(result.reasons[2]).toContain("Ticket value");
    expect(result.reasons[3]).toContain("VIP membership");
    expect(result.reasons[4]).toContain("Recent upgrades");
  });

  test("does not mutate the entry", () => {
    const entry = createEntry({ loyaltyPoints: 500, upgradesLast30Days: 1 });
    const originalEntry = { ...entry };

    scoreEntry(entry, now);

    expect(entry).toEqual(originalEntry);
  });
});
