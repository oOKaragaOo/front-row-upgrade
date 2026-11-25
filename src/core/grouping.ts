import { normalizeIdentifier, normalizePhoneNumber } from "./normalize";
import type { FanGroup, TicketQueueEntry } from "../types";

type ConnectionReason =
  | "Shared phone number"
  | "Shared device ID"
  | "Shared payment account";

type Connection = {
  entryIndex: number;
  reason: ConnectionReason;
};

function findRoot(parent: number[], entryIndex: number): number {
  let root = entryIndex;

  while (parent[root] !== root) {
    parent[root] = parent[parent[root]];
    root = parent[root];
  }

  return root;
}

function union(
  parent: number[],
  groupSize: number[],
  firstEntryIndex: number,
  secondEntryIndex: number,
): void {
  let firstRoot = findRoot(parent, firstEntryIndex);
  let secondRoot = findRoot(parent, secondEntryIndex);

  if (firstRoot === secondRoot) {
    return;
  }

  if (groupSize[firstRoot] < groupSize[secondRoot]) {
    [firstRoot, secondRoot] = [secondRoot, firstRoot];
  }

  parent[secondRoot] = firstRoot;
  groupSize[firstRoot] += groupSize[secondRoot];
}

function connectByValue(
  valueToEntryIndex: Map<string, number>,
  value: string | null,
  entryIndex: number,
  reason: ConnectionReason,
  parent: number[],
  groupSize: number[],
  connections: Connection[],
): void {
  if (value === null) {
    return;
  }

  const firstEntryIndex = valueToEntryIndex.get(value);
  if (firstEntryIndex === undefined) {
    valueToEntryIndex.set(value, entryIndex);
    return;
  }

  union(parent, groupSize, firstEntryIndex, entryIndex);
  connections.push({ entryIndex, reason });
}

export function groupEligibleEntries(
  entries: TicketQueueEntry[],
): FanGroup[] {
  const parent = entries.map((_, index) => index);
  const groupSize = entries.map(() => 1);
  const phoneToEntryIndex = new Map<string, number>();
  const deviceToEntryIndex = new Map<string, number>();
  const paymentToEntryIndex = new Map<string, number>();
  const connections: Connection[] = [];

  for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
    const entry = entries[entryIndex];

    connectByValue(
      phoneToEntryIndex,
      normalizePhoneNumber(entry.phoneNumber),
      entryIndex,
      "Shared phone number",
      parent,
      groupSize,
      connections,
    );
    connectByValue(
      deviceToEntryIndex,
      normalizeIdentifier(entry.deviceId),
      entryIndex,
      "Shared device ID",
      parent,
      groupSize,
      connections,
    );
    connectByValue(
      paymentToEntryIndex,
      normalizeIdentifier(entry.paymentAccount),
      entryIndex,
      "Shared payment account",
      parent,
      groupSize,
      connections,
    );
  }

  const groupsByRoot = new Map<number, FanGroup>();
  for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
    const root = findRoot(parent, entryIndex);
    let group = groupsByRoot.get(root);

    if (group === undefined) {
      group = {
        id: `fan-group-${groupsByRoot.size + 1}`,
        entries: [],
        representative: null,
        connectionReasons: [],
      };
      groupsByRoot.set(root, group);
    }

    group.entries.push(entries[entryIndex]);
  }

  const reasonsByRoot = new Map<number, Set<ConnectionReason>>();
  for (const connection of connections) {
    const root = findRoot(parent, connection.entryIndex);
    let reasons = reasonsByRoot.get(root);

    if (reasons === undefined) {
      reasons = new Set<ConnectionReason>();
      reasonsByRoot.set(root, reasons);
    }

    reasons.add(connection.reason);
  }

  for (const [root, reasons] of reasonsByRoot) {
    const group = groupsByRoot.get(root);
    if (group !== undefined) {
      group.connectionReasons.push(...reasons);
    }
  }

  return Array.from(groupsByRoot.values());
}
