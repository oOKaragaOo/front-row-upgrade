export type TicketQueueEntry = {
  id: string;
  fanId: string;
  fanName: string;
  ticketValue: string | number | null;
  joinedQueueAt: string;
  eventStartsAt: string;
  status: "waiting" | "upgraded" | "cancelled";
  loyaltyPoints?: number | null;
  upgradesLast30Days?: number | null;
  membership?: "regular" | "vip" | "blocked";
  phoneNumber?: string | null;
  deviceId?: string | null;
  paymentAccount?: string | null;
};

export type RankedEntry = {
  entry: TicketQueueEntry;
  score: number;
  reasons: string[];
};

export type FanGroup = {
  id: string;
  entries: TicketQueueEntry[];
  representative: RankedEntry | null;
  connectionReasons: string[];
};

export type ExclusionReason =
  | "Cancelled entry"
  | "Already upgraded"
  | "Invalid event start time"
  | "Concert already started"
  | "Blocked fan"
  | "Invalid ticket value"
  | "Invalid queue join time"
  | "Invalid entry id";

export type ExcludedEntry = {
  entry: TicketQueueEntry;
  reason: ExclusionReason;
};

export type FrontRowUpgradeResult = {
  winner: RankedEntry | null;
  topCandidates: RankedEntry[];
  fanGroups: FanGroup[];
  excludedEntries: ExcludedEntry[];
};
