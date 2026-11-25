import type {
  ExcludedEntry,
  ExclusionReason,
  TicketQueueEntry,
} from "../types";

export type { ExcludedEntry, ExclusionReason } from "../types";

export type EligibilityResult = {
  eligible: TicketQueueEntry[];
  excludedEntries: ExcludedEntry[];
};

function getExclusionReason(
  entry: TicketQueueEntry,
  now: Date,
): ExclusionReason | null {
  if (entry.status === "cancelled") {
    return "Cancelled entry";
  }

  if (entry.status === "upgraded") {
    return "Already upgraded";
  }

  const eventStartsAt = new Date(entry.eventStartsAt);
  if (Number.isNaN(eventStartsAt.getTime())) {
    return "Invalid event start time";
  }

  if (eventStartsAt.getTime() <= now.getTime()) {
    return "Concert already started";
  }

  if (entry.membership === "blocked") {
    return "Blocked fan";
  }

  if (!hasValidTicketValue(entry.ticketValue)) {
    return "Invalid ticket value";
  }

  if (Number.isNaN(new Date(entry.joinedQueueAt).getTime())) {
    return "Invalid queue join time";
  }

  if (typeof entry.id !== "string" || entry.id.trim().length === 0) {
    return "Invalid entry id";
  }

  return null;
}

function hasValidTicketValue(ticketValue: TicketQueueEntry["ticketValue"]): boolean {
  if (ticketValue === null) {
    return false;
  }

  const numericValue =
    typeof ticketValue === "number" ? ticketValue : Number(ticketValue);

  return Number.isFinite(numericValue) && numericValue > 0;
}

export function filterEligibleEntries(
  entries: TicketQueueEntry[],
  now: Date,
): EligibilityResult {
  const eligible: TicketQueueEntry[] = [];
  const excludedEntries: ExcludedEntry[] = [];

  for (const entry of entries) {
    const reason = getExclusionReason(entry, now);

    if (reason === null) {
      eligible.push(entry);
    } else {
      excludedEntries.push({ entry, reason });
    }
  }

  return { eligible, excludedEntries };
}
