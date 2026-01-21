// Normalized Data Types for the Enterprise System

export type Provider = 'opticodds' | 'uof' | 'genius';

export interface NormalizedEvent {
  sport_key: string;
  league_name: string;
  start_time_utc: string; // ISO string
  status: 'scheduled' | 'live' | 'finished';
  home_name: string;
  away_name: string;
  score_home?: number;
  score_away?: number;
  provider: Provider;
  provider_event_key: string;
}

export interface NormalizedMarket {
  market_type: string; // 'soccer_1x2_90', 'basket_ml'
  rule_set: string; // '90min', 'incl_ot'
  line_value?: number;
  outcomes: NormalizedOutcome[];
}

export interface NormalizedOutcome {
  outcome_key: string; // 'HOME', 'AWAY', 'DRAW', 'OVER', 'UNDER'
  odd_value: number;
  book_provider_key: string;
  book_name: string;
  ts_utc: string;
}

export interface ArbCandidate {
  event_id: string;
  market_id: string;
  legs: ArbLegCandidate[];
}

export interface ArbLegCandidate {
  book_id: string;
  outcome_key: string;
  odd: number;
}
