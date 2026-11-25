import { scoreEntry } from "./scoring";
import type { FanGroup, RankedEntry } from "../types";

export type SelectionResult = {
  fanGroups: FanGroup[];
  winner: RankedEntry | null;
  topCandidates: RankedEntry[];
};

function compareRankedEntries(
  firstEntry: RankedEntry,
  secondEntry: RankedEntry,
): number {
  if (firstEntry.score > secondEntry.score) {
    return -1;
  }

  if (firstEntry.score < secondEntry.score) {
    return 1;
  }

  const firstJoinedAt = new Date(firstEntry.entry.joinedQueueAt).getTime();
  const secondJoinedAt = new Date(secondEntry.entry.joinedQueueAt).getTime();

  if (firstJoinedAt < secondJoinedAt) {
    return -1;
  }

  if (firstJoinedAt > secondJoinedAt) {
    return 1;
  }

  if (firstEntry.entry.id < secondEntry.entry.id) {
    return -1;
  }

  if (firstEntry.entry.id > secondEntry.entry.id) {
    return 1;
  }

  return 0;
}

function addTopCandidate(
  topCandidates: RankedEntry[],
  candidate: RankedEntry,
): void {
  let candidateIndex = topCandidates.length;

  for (let index = 0; index < topCandidates.length; index += 1) {
    if (compareRankedEntries(candidate, topCandidates[index]) < 0) {
      candidateIndex = index;
      break;
    }
  }

  topCandidates.splice(candidateIndex, 0, candidate);

  if (topCandidates.length > 3) {
    topCandidates.pop();
  }
}

export function selectWinners(fanGroups: FanGroup[], now: Date): SelectionResult {
  const rankedGroups: FanGroup[] = [];
  const topCandidates: RankedEntry[] = [];

  for (const fanGroup of fanGroups) {
    let representative: RankedEntry | null = null;

    for (const entry of fanGroup.entries) {
      const rankedEntry = scoreEntry(entry, now);

      if (
        representative === null ||
        compareRankedEntries(rankedEntry, representative) < 0
      ) {
        representative = rankedEntry;
      }
    }

    const rankedGroup = { ...fanGroup, representative };
    rankedGroups.push(rankedGroup);

    if (representative !== null) {
      addTopCandidate(topCandidates, representative);
    }
  }

  return {
    fanGroups: rankedGroups,
    winner: topCandidates[0] ?? null,
    topCandidates,
  };
}
