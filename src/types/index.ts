export type Sport = 'soccer' | 'basketball' | 'american_football' | 'tennis' | 'esports';

export interface ArbLeg {
  bookmaker: string;
  outcome: string;
  odd: number;
  stake_percent: number; // Vem calculado do backend (0.0 to 1.0)
  suggestedStake?: number; // Calculado no frontend baseado na banca
}

export interface Surebet {
  id: string; // Convertido de bigint para string no frontend
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  market: string;
  startTime: Date;
  isLive: boolean;
  bucket: string; // LIVE, PRE_HOT, PRE_MID, PRE_LONG
  roi: number;
  legs: ArbLeg[];
  createdAt: Date;
}

export interface GameEvent {
  id: string;
  sport_key: string;
  start_time: string;
  status: string;
  home_name: string;
  away_name: string;
  bucket: string;
}
