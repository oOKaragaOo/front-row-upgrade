export const LOYALTY_POINTS_CAP = 1_000;
export const WAIT_MINUTES_CAP = 240;
export const TICKET_VALUE_CAP = 10_000;

export type ScoringMode = "normal" | "rushHour" | "vipHour" | "fairQueue";

type ScoringWeights = {
  loyalty: number;
  waiting: number;
  ticket: number;
  vip: number;
  recentUpgrades: number;
};

export const NORMAL_WEIGHTS: ScoringWeights = {
  loyalty: 30,
  waiting: 30,
  ticket: 10,
  vip: 10,
  recentUpgrades: 20,
};

export const SCORING_WEIGHTS: Record<ScoringMode, ScoringWeights> = {
  normal: NORMAL_WEIGHTS,
  rushHour: {
    loyalty: 20,
    waiting: 50,
    ticket: 10,
    vip: 10,
    recentUpgrades: 10,
  },
  vipHour: {
    loyalty: 30,
    waiting: 30,
    ticket: 10,
    vip: 20,
    recentUpgrades: 20,
  },
  fairQueue: {
    loyalty: 25,
    waiting: 30,
    ticket: 10,
    vip: 10,
    recentUpgrades: 40,
  },
};
