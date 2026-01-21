export type Sport = 'soccer' | 'basketball';

export type MarketType = '1x2' | 'moneyline' | 'totals' | 'handicap';

export interface Bookmaker {
  id: string;
  name: string;
  color: string;
}

export interface Odd {
  id: string;
  bookmakerId: string;
  bookmakerName: string;
  outcome: string; // 'Home', 'Draw', 'Away', 'Over 2.5', etc.
  value: number;
  timestamp: Date;
}

export interface ArbLeg {
  outcome: string;
  odd: number;
  bookmaker: string;
  impliedProb: number;
  suggestedStake?: number;
}

export interface Surebet {
  id: string;
  sport: Sport;
  league: string;
  homeTeam: string;
  awayTeam: string;
  market: string; // e.g., "Match Winner", "Over/Under 2.5"
  startTime: Date;
  isLive: boolean;
  roi: number;
  totalImpliedProb: number;
  legs: ArbLeg[];
  createdAt: Date;
  expiresAt: Date;
}

export interface UserSettings {
  bankroll: number;
  stakeMode: 'fixed' | 'percent';
  stakeFixedValue: number;
  stakePercentValue: number;
  minRoi: number;
  telegramEnabled: boolean;
  whatsappEnabled: boolean;
}
