export type Sport = 'soccer' | 'basketball' | 'american_football' | 'tennis' | 'esports';

export interface ArbLeg {
  bookmaker: string;
  outcome: string;
  odd: number;
  stake_percent: number;
  suggestedStake?: number;
}

export interface Surebet {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  market: string;
  startTime: Date;
  isLive: boolean;
  bucket: string;
  roi: number;
  legs: ArbLeg[];
  createdAt: Date;
}

// Interface específica para o Histórico de Oportunidades (Log do Sistema)
export interface SurebetOpportunity {
  id: string;
  detectedAt: string; // ISO String
  sport: string;
  event: string; // "Time A vs Time B"
  market: string;
  roi: number;
  bookmakers: string[]; // ["Bet365", "Pinnacle"]
  odds: string[]; // ["1.90", "2.10"]
  status: 'active' | 'expired';
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
