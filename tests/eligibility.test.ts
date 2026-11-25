import { describe, expect, test } from "@jest/globals";
import { filterEligibleEntries } from "../src/core/eligibility";
import type { TicketQueueEntry } from "../src/types";

const now = new Date("2026-06-01T12:00:00.000Z");

function createEntry(
  overrides: Partial<TicketQueueEntry> = {},
): TicketQueueEntry {
  return {
    id: "entry-1",
    fanId: "fan-1",
    fanName: "Alex",
    ticketValue: "100",
    joinedQueueAt: "2026-06-01T10:00:00.000Z",
    eventStartsAt: "2026-06-01T14:00:00.000Z",
    status: "waiting",
    ...overrides,
  };
}

describe("filterEligibleEntries", () => {
  test("keeps a valid waiting entry eligible", () => {
    const entry = createEntry();

    expect(filterEligibleEntries([entry], now)).toEqual({
      eligible: [entry],
      excludedEntries: [],
    });
  });

  test("excludes a cancelled entry", () => {
    const entry = createEntry({ status: "cancelled" });

    expect(filterEligibleEntries([entry], now).excludedEntries).toEqual([
      { entry, reason: "Cancelled entry" },
    ]);
  });

  test("excludes an entry that was already upgraded", () => {
    const entry = createEntry({ status: "upgraded" });

    expect(filterEligibleEntries([entry], now).excludedEntries).toEqual([
      { entry, reason: "Already upgraded" },
    ]);
  });

  test("excludes an entry when the concert has started", () => {
    const entry = createEntry({ eventStartsAt: "2026-06-01T11:59:59.999Z" });

    expect(filterEligibleEntries([entry], now).excludedEntries).toEqual([
      { entry, reason: "Concert already started" },
    ]);
  });

  test("excludes an entry when the concert starts exactly now", () => {
    const entry = createEntry({ eventStartsAt: now.toISOString() });

    expect(filterEligibleEntries([entry], now).excludedEntries).toEqual([
      { entry, reason: "Concert already started" },
    ]);
  });

  test("excludes an entry when the event start time is invalid", () => {
    const entry = createEntry({ eventStartsAt: "not-a-date" });

    expect(filterEligibleEntries([entry], now).excludedEntries).toEqual([
      { entry, reason: "Invalid event start time" },
    ]);
  });

  test("excludes a blocked fan", () => {
    const entry = createEntry({ membership: "blocked" });

    expect(filterEligibleEntries([entry], now).excludedEntries).toEqual([
      { entry, reason: "Blocked fan" },
    ]);
  });

  test.each([null, 0, -1, "not-a-number", Number.NaN] as const)(
    "excludes an invalid ticket value: %s",
    (ticketValue) => {
      const entry = createEntry({ ticketValue });

      expect(filterEligibleEntries([entry], now).excludedEntries).toEqual([
        { entry, reason: "Invalid ticket value" },
      ]);
    },
  );

  test("excludes a ticket value containing only whitespace", () => {
    const entry = createEntry({ ticketValue: "   " });

    expect(filterEligibleEntries([entry], now).excludedEntries).toEqual([
      { entry, reason: "Invalid ticket value" },
    ]);
  });

  test("uses the first matching exclusion reason", () => {
    const entry = createEntry({
      status: "cancelled",
      membership: "blocked",
      ticketValue: 0,
    });

    expect(filterEligibleEntries([entry], now).excludedEntries).toEqual([
      { entry, reason: "Cancelled entry" },
    ]);
  });

  test("does not mutate the input entries array", () => {
    const entries = [createEntry(), createEntry({ id: "entry-2" })];
    const originalEntries = [...entries];

    filterEligibleEntries(entries, now);

    expect(entries).toEqual(originalEntries);
  });
});
