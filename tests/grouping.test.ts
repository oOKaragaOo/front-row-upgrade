import { describe, expect, test } from "@jest/globals";
import { groupEligibleEntries } from "../src/core/grouping";
import type { TicketQueueEntry } from "../src/types";

function createEntry(
  id: string,
  overrides: Partial<TicketQueueEntry> = {},
): TicketQueueEntry {
  return {
    id,
    fanId: `fan-${id}`,
    fanName: `Fan ${id}`,
    ticketValue: "100",
    joinedQueueAt: "2026-06-01T10:00:00.000Z",
    eventStartsAt: "2026-06-01T14:00:00.000Z",
    status: "waiting",
    ...overrides,
  };
}

describe("groupEligibleEntries", () => {
  test("groups phone numbers with different formatting", () => {
    const firstEntry = createEntry("a", { phoneNumber: "081-234-5678" });
    const secondEntry = createEntry("b", { phoneNumber: "081 234 5678" });

    expect(groupEligibleEntries([firstEntry, secondEntry])).toEqual([
      {
        id: "fan-group-1",
        entries: [firstEntry, secondEntry],
        representative: null,
        connectionReasons: ["Shared phone number"],
      },
    ]);
  });

  test("lists a shared connection reason only once per group", () => {
    const entries = [
      createEntry("a", { phoneNumber: "0812345678" }),
      createEntry("b", { phoneNumber: "0812345678" }),
      createEntry("c", { phoneNumber: "0812345678" }),
    ];

    expect(groupEligibleEntries(entries)[0].connectionReasons).toEqual([
      "Shared phone number",
    ]);
  });

  test("joins indirect phone and device connections in one group", () => {
    const firstEntry = createEntry("a", { phoneNumber: "0812345678" });
    const secondEntry = createEntry("b", {
      phoneNumber: "081-234-5678",
      deviceId: "device-1",
    });
    const thirdEntry = createEntry("c", { deviceId: "device-1" });

    expect(groupEligibleEntries([firstEntry, secondEntry, thirdEntry])).toEqual(
      [
        {
          id: "fan-group-1",
          entries: [firstEntry, secondEntry, thirdEntry],
          representative: null,
          connectionReasons: ["Shared phone number", "Shared device ID"],
        },
      ],
    );
  });

  test("groups entries with the same payment account", () => {
    const firstEntry = createEntry("a", { paymentAccount: "pay-1" });
    const secondEntry = createEntry("b", { paymentAccount: "pay-1" });

    expect(groupEligibleEntries([firstEntry, secondEntry])[0].connectionReasons)
      .toEqual(["Shared payment account"]);
  });

  test("trims device IDs and payment accounts before matching", () => {
    const firstEntry = createEntry("a", { deviceId: " device-1 " });
    const secondEntry = createEntry("b", { deviceId: "device-1" });

    expect(groupEligibleEntries([firstEntry, secondEntry])).toHaveLength(1);
  });

  test("does not connect entries with missing or blank values", () => {
    const firstEntry = createEntry("a", {
      phoneNumber: null,
      deviceId: "   ",
      paymentAccount: "",
    });
    const secondEntry = createEntry("b", {
      phoneNumber: null,
      deviceId: "   ",
      paymentAccount: "",
    });

    expect(groupEligibleEntries([firstEntry, secondEntry])).toEqual([
      {
        id: "fan-group-1",
        entries: [firstEntry],
        representative: null,
        connectionReasons: [],
      },
      {
        id: "fan-group-2",
        entries: [secondEntry],
        representative: null,
        connectionReasons: [],
      },
    ]);
  });

  test("does not connect entries only because their fan IDs match", () => {
    const firstEntry = createEntry("a", { fanId: "same-fan" });
    const secondEntry = createEntry("b", { fanId: "same-fan" });

    expect(groupEligibleEntries([firstEntry, secondEntry])).toHaveLength(2);
  });

  test("keeps identical values in different fields separate", () => {
    const firstEntry = createEntry("a", { phoneNumber: "12345" });
    const secondEntry = createEntry("b", { deviceId: "12345" });

    expect(groupEligibleEntries([firstEntry, secondEntry])).toHaveLength(2);
  });

  test("does not mutate the input entries array", () => {
    const entries = [
      createEntry("a", { phoneNumber: "0812345678" }),
      createEntry("b", { phoneNumber: "0812345678" }),
    ];
    const originalEntries = [...entries];

    groupEligibleEntries(entries);

    expect(entries).toEqual(originalEntries);
  });
});
