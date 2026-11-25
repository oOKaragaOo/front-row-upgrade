import { normalizeIdentifier, normalizePhoneNumber } from "./normalize";
import type { FanGroup, TicketQueueEntry } from "../types";

const PHONE_CONNECTION_FLAG = 1;
const DEVICE_CONNECTION_FLAG = 2;
const PAYMENT_ACCOUNT_CONNECTION_FLAG = 4;

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
  reasonFlag: number,
  parent: number[],
  groupSize: number[],
  reasonFlags: Uint8Array,
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
  reasonFlags[entryIndex] |= reasonFlag;
}

export function groupEligibleEntries(
  entries: TicketQueueEntry[],
): FanGroup[] {
  const parent = entries.map((_, index) => index);
  const groupSize = entries.map(() => 1);
  const phoneToEntryIndex = new Map<string, number>();
  const deviceToEntryIndex = new Map<string, number>();
  const paymentToEntryIndex = new Map<string, number>();
  const reasonFlags = new Uint8Array(entries.length);

  for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
    const entry = entries[entryIndex];

    connectByValue(
      phoneToEntryIndex,
      normalizePhoneNumber(entry.phoneNumber),
      entryIndex,
      PHONE_CONNECTION_FLAG,
      parent,
      groupSize,
      reasonFlags,
    );
    connectByValue(
      deviceToEntryIndex,
      normalizeIdentifier(entry.deviceId),
      entryIndex,
      DEVICE_CONNECTION_FLAG,
      parent,
      groupSize,
      reasonFlags,
    );
    connectByValue(
      paymentToEntryIndex,
      normalizeIdentifier(entry.paymentAccount),
      entryIndex,
      PAYMENT_ACCOUNT_CONNECTION_FLAG,
      parent,
      groupSize,
      reasonFlags,
    );
  }

  const groupsByRoot = new Map<number, FanGroup>();
  for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
    const root = findRoot(parent, entryIndex);
    reasonFlags[root] |= reasonFlags[entryIndex];
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

  for (const [root, group] of groupsByRoot) {
    if ((reasonFlags[root] & PHONE_CONNECTION_FLAG) !== 0) {
      group.connectionReasons.push("Shared phone number");
    }

    if ((reasonFlags[root] & DEVICE_CONNECTION_FLAG) !== 0) {
      group.connectionReasons.push("Shared device ID");
    }

    if ((reasonFlags[root] & PAYMENT_ACCOUNT_CONNECTION_FLAG) !== 0) {
      group.connectionReasons.push("Shared payment account");
    }
  }

  return Array.from(groupsByRoot.values());
}
