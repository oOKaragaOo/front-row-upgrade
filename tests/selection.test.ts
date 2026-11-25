import { describe, expect, test } from "@jest/globals";
import { selectWinners } from "../src/core/selection";
import type { FanGroup, TicketQueueEntry } from "../src/types";

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
    joinedQueueAt: new Date(now.getTime() - 300 * 60_000).toISOString(),
    eventStartsAt: "2026-06-01T14:00:00.000Z",
    status: "waiting",
    ...overrides,
  };
}

function createGroup(id: string, entries: TicketQueueEntry[]): FanGroup {
  return {
    id,
    entries,
    representative: null,
    connectionReasons: [],
  };
}

describe("selectWinners", () => {
  test("selects one highest-scoring representative from each group", () => {
    const lowerScore = createEntry("entry-a", { loyaltyPoints: 0 });
    const higherScore = createEntry("entry-b", { loyaltyPoints: 1_000 });
    const groups = [createGroup("group-1", [lowerScore, higherScore])];

    const result = selectWinners(groups, now);

    expect(result.fanGroups[0].representative?.entry).toBe(higherScore);
    expect(result.topCandidates).toHaveLength(1);
  });

  test("selects the winner and top three from group representatives", () => {
    const groups = [
      createGroup("group-1", [createEntry("entry-a", { loyaltyPoints: 1_000 })]),
      createGroup("group-2", [createEntry("entry-b", { loyaltyPoints: 900 })]),
      createGroup("group-3", [createEntry("entry-c", { loyaltyPoints: 800 })]),
      createGroup("group-4", [createEntry("entry-d", { loyaltyPoints: 700 })]),
    ];

    const result = selectWinners(groups, now);

    expect(result.winner?.entry.id).toBe("entry-a");
    expect(result.topCandidates.map(({ entry }) => entry.id)).toEqual([
      "entry-a",
      "entry-b",
      "entry-c",
    ]);
  });

  test("uses earlier queue time to break equal-score ties", () => {
    const laterEntry = createEntry("entry-a", {
      joinedQueueAt: new Date(now.getTime() - 300 * 60_000).toISOString(),
    });
    const earlierEntry = createEntry("entry-z", {
      joinedQueueAt: new Date(now.getTime() - 400 * 60_000).toISOString(),
    });

    const result = selectWinners(
      [createGroup("group-1", [laterEntry]), createGroup("group-2", [earlierEntry])],
      now,
    );

    expect(result.winner?.entry).toBe(earlierEntry);
  });

  test("uses alphabetical IDs to break equal-score and equal-time ties", () => {
    const laterId = createEntry("entry-b");
    const earlierId = createEntry("entry-a");

    const result = selectWinners(
      [createGroup("group-1", [laterId]), createGroup("group-2", [earlierId])],
      now,
    );

    expect(result.winner?.entry).toBe(earlierId);
  });

  test("keeps the first input entry when all tie-break fields are equal", () => {
    const firstEntry = createEntry("duplicate-id", { fanName: "First" });
    const secondEntry = createEntry("duplicate-id", { fanName: "Second" });

    const result = selectWinners(
      [createGroup("group-1", [firstEntry]), createGroup("group-2", [secondEntry])],
      now,
    );

    expect(result.winner?.entry).toBe(firstEntry);
  });

  test("returns no winner when there are no fan groups", () => {
    expect(selectWinners([], now)).toEqual({
      fanGroups: [],
      winner: null,
      topCandidates: [],
    });
  });

  test("does not mutate the input groups or entries", () => {
    const entry = createEntry("entry-a", { loyaltyPoints: 500 });
    const group = createGroup("group-1", [entry]);
    const groups = [group];
    const originalGroups = [...groups];
    const originalGroup = { ...group, entries: [...group.entries] };
    const originalEntry = { ...entry };

    selectWinners(groups, now);

    expect(groups).toEqual(originalGroups);
    expect(group).toEqual(originalGroup);
    expect(entry).toEqual(originalEntry);
  });
});
