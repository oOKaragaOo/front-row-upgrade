import { filterEligibleEntries } from "./core/eligibility";
import { groupEligibleEntries } from "./core/grouping";
import { selectWinners } from "./core/selection";
import type { ScoringMode } from "./core/config";
import type { FrontRowUpgradeResult, TicketQueueEntry } from "./types";

export function buildFrontRowUpgradeQueue(
  entries: TicketQueueEntry[],
  now: Date,
  mode: ScoringMode = "normal",
): FrontRowUpgradeResult {
  const { eligible, excludedEntries } = filterEligibleEntries(entries, now);
  const fanGroups = groupEligibleEntries(eligible);
  const selection = selectWinners(fanGroups, now, mode);

  return {
    winner: selection.winner,
    topCandidates: selection.topCandidates,
    fanGroups: selection.fanGroups,
    excludedEntries,
  };
}
