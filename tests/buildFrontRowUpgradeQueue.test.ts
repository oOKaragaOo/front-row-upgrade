import { describe, expect, test } from "@jest/globals";
import { buildFrontRowUpgradeQueue } from "../src/buildFrontRowUpgradeQueue";
import { DEFAULT_NOW_ISO, SAMPLE_ENTRIES } from "../src/sampleEntries";
import type { TicketQueueEntry } from "../src/types";

const now = new Date("2026-06-01T12:00:00.000Z");

function createEntry(
  id: string,
  overrides: Partial<TicketQueueEntry> = {},
): TicketQueueEntry {
  return {
    id,
    fanId: `fan-${id}`,
    fanName: `Fan ${id}`,
    ticketValue: 100,
    joinedQueueAt: "2026-06-01T10:00:00.000Z",
    eventStartsAt: "2026-06-01T14:00:00.000Z",
    status: "waiting",
    ...overrides,
  };
}

describe("buildFrontRowUpgradeQueue", () => {
  test("returns the winner, top candidates, fan groups, and exclusions", () => {
    const entry = createEntry("entry-a", { loyaltyPoints: 1_000 });

    const result = buildFrontRowUpgradeQueue([entry], now);

    expect(result.winner?.entry).toBe(entry);
    expect(result.topCandidates).toHaveLength(1);
    expect(result.fanGroups[0].representative?.entry).toBe(entry);
    expect(result.excludedEntries).toEqual([]);
  });

  test("does not select a cancelled entry as the winner", () => {
    const cancelled = createEntry("entry-cancelled", { status: "cancelled" });
    const waiting = createEntry("entry-waiting");

    const result = buildFrontRowUpgradeQueue([cancelled, waiting], now);

    expect(result.winner?.entry).toBe(waiting);
    expect(result.excludedEntries[0].reason).toBe("Cancelled entry");
  });

  test("does not select an entry that was already upgraded", () => {
    const upgraded = createEntry("entry-upgraded", {
      status: "upgraded",
      loyaltyPoints: 1_000,
    });
    const waiting = createEntry("entry-waiting");

    const result = buildFrontRowUpgradeQueue([upgraded, waiting], now);

    expect(result.winner?.entry).toBe(waiting);
    expect(result.excludedEntries[0].reason).toBe("Already upgraded");
  });

  test("does not select an entry after the concert has started", () => {
    const started = createEntry("entry-started", {
      eventStartsAt: "2026-06-01T11:00:00.000Z",
      loyaltyPoints: 1_000,
    });
    const waiting = createEntry("entry-waiting");

    const result = buildFrontRowUpgradeQueue([started, waiting], now);

    expect(result.winner?.entry).toBe(waiting);
    expect(result.excludedEntries[0].reason).toBe("Concert already started");
  });

  test("does not select a blocked fan as the winner", () => {
    const blocked = createEntry("entry-blocked", {
      membership: "blocked",
      loyaltyPoints: 1_000,
    });
    const waiting = createEntry("entry-waiting");

    const result = buildFrontRowUpgradeQueue([blocked, waiting], now);

    expect(result.winner?.entry).toBe(waiting);
    expect(result.excludedEntries[0].reason).toBe("Blocked fan");
  });

  test("does not select an entry with an invalid or zero ticket value", () => {
    const invalid = createEntry("entry-invalid", {
      ticketValue: "not-a-number",
      loyaltyPoints: 1_000,
    });
    const zero = createEntry("entry-zero", { ticketValue: 0 });
    const waiting = createEntry("entry-waiting");

    const result = buildFrontRowUpgradeQueue([invalid, zero, waiting], now);

    expect(result.winner?.entry).toBe(waiting);
    expect(result.excludedEntries.map(({ reason }) => reason)).toEqual([
      "Invalid ticket value",
      "Invalid ticket value",
    ]);
  });

  test("groups accounts with differently formatted phone numbers", () => {
    const firstEntry = createEntry("entry-a", { phoneNumber: "081-234-5678" });
    const secondEntry = createEntry("entry-b", { phoneNumber: "081 234 5678" });

    const result = buildFrontRowUpgradeQueue([firstEntry, secondEntry], now);

    expect(result.fanGroups).toHaveLength(1);
    expect(result.fanGroups[0].entries).toEqual([firstEntry, secondEntry]);
  });

  test("groups indirect phone and device connections together", () => {
    const firstEntry = createEntry("entry-a", { phoneNumber: "0812345678" });
    const secondEntry = createEntry("entry-b", {
      phoneNumber: "081-234-5678",
      deviceId: "device-1",
    });
    const thirdEntry = createEntry("entry-c", { deviceId: "device-1" });

    const result = buildFrontRowUpgradeQueue(
      [firstEntry, secondEntry, thirdEntry],
      now,
    );

    expect(result.fanGroups).toHaveLength(1);
    expect(result.fanGroups[0].entries).toEqual([
      firstEntry,
      secondEntry,
      thirdEntry,
    ]);
    expect(result.fanGroups[0].connectionReasons).toEqual([
      "Shared phone number",
      "Shared device ID",
    ]);
  });

  test("returns the same winner for the same entries and time", () => {
    const entries = [
      createEntry("entry-a", { loyaltyPoints: 100 }),
      createEntry("entry-b", { loyaltyPoints: 900 }),
    ];

    const firstResult = buildFrontRowUpgradeQueue(entries, now);
    const secondResult = buildFrontRowUpgradeQueue(entries, now);

    expect(secondResult.winner?.entry.id).toBe(firstResult.winner?.entry.id);
    expect(secondResult).toEqual(firstResult);
  });

  test("changes the winner when Rush Hour gives waiting time more weight", () => {
    const longWaiting = createEntry("entry-waiting", {
      joinedQueueAt: "2026-06-01T08:00:00.000Z",
      upgradesLast30Days: 5,
    });
    const highLoyalty = createEntry("entry-loyalty", {
      loyaltyPoints: 1_000,
      joinedQueueAt: now.toISOString(),
      upgradesLast30Days: 0,
    });
    const entries = [longWaiting, highLoyalty];

    const normalResult = buildFrontRowUpgradeQueue(entries, now);
    const rushResult = buildFrontRowUpgradeQueue(entries, now, "rushHour");

    expect(normalResult.winner?.entry).toBe(highLoyalty);
    expect(rushResult.winner?.entry).toBe(longWaiting);
  });

  test("advancing sample time reshuffles candidates near the wait cap", () => {
    const startTime = new Date(DEFAULT_NOW_ISO);
    const laterTime = new Date(startTime.getTime() + 45 * 60_000);
    const hourLaterTime = new Date(startTime.getTime() + 60 * 60_000);

    const startResult = buildFrontRowUpgradeQueue(
      SAMPLE_ENTRIES,
      startTime,
    );
    const laterResult = buildFrontRowUpgradeQueue(SAMPLE_ENTRIES, laterTime);
    const hourLaterResult = buildFrontRowUpgradeQueue(
      SAMPLE_ENTRIES,
      hourLaterTime,
    );

    expect(startResult.topCandidates.map(({ entry }) => entry.id)).toEqual([
      "FR-208",
      "FR-601",
      "FR-602",
    ]);
    expect(laterResult.topCandidates.map(({ entry }) => entry.id)).toEqual([
      "FR-208",
      "FR-602",
      "FR-603",
    ]);
    expect(hourLaterResult.topCandidates.map(({ entry }) => entry.id)).toEqual([
      "FR-208",
      "FR-603",
      "FR-602",
    ]);
  });

  test("does not mutate the input entries or entry objects", () => {
    const entries = [
      createEntry("entry-a", { phoneNumber: "0812345678" }),
      createEntry("entry-b", { phoneNumber: "0812345678" }),
    ];
    const originalEntries = entries.map((entry) => ({ ...entry }));

    buildFrontRowUpgradeQueue(entries, now);

    expect(entries).toEqual(originalEntries);
  });

  test("returns no winner when every entry is excluded", () => {
    const cancelled = createEntry("entry-cancelled", { status: "cancelled" });

    const result = buildFrontRowUpgradeQueue([cancelled], now);

    expect(result.winner).toBeNull();
    expect(result.topCandidates).toEqual([]);
    expect(result.fanGroups).toEqual([]);
  });
});
