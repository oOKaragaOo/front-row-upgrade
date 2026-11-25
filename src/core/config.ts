export const LOYALTY_POINTS_CAP = 1_000;
export const WAIT_MINUTES_CAP = 240;
export const TICKET_VALUE_CAP = 10_000;

export const NORMAL_WEIGHTS = {
  loyalty: 30,
  waiting: 30,
  ticket: 10,
  vip: 10,
  recentUpgrades: 20,
} as const;
