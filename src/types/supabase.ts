export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: number
          apisports_key: string | null
          cron_token: string | null
          sports_enabled: Json | null
          roi_min_pre: number
          roi_min_live: number
          updated_at: string
        }
        Insert: {
          id?: number
          apisports_key?: string | null
          cron_token?: string | null
          sports_enabled?: Json | null
          roi_min_pre?: number
          roi_min_live?: number
          updated_at?: string
        }
        Update: {
          id?: number
          apisports_key?: string | null
          cron_token?: string | null
          sports_enabled?: Json | null
          roi_min_pre?: number
          roi_min_live?: number
          updated_at?: string
        }
      }
      request_budget: {
        Row: {
          day: string
          sport_key: string
          used: number
        }
        Insert: {
          day: string
          sport_key: string
          used?: number
        }
        Update: {
          day?: string
          sport_key?: string
          used?: number
        }
      }
      events: {
        Row: {
          id: number
          sport_key: string
          provider_event_id: string
          league_id: string | null
          start_time_utc: string
          home_name: string
          away_name: string
          status: string
          score_json: Json | null
          updated_at: string
        }
        Insert: {
          id?: number
          sport_key: string
          provider_event_id: string
          league_id?: string | null
          start_time_utc: string
          home_name: string
          away_name: string
          status?: string
          score_json?: Json | null
          updated_at?: string
        }
        Update: {
          id?: number
          sport_key?: string
          provider_event_id?: string
          league_id?: string | null
          start_time_utc?: string
          home_name?: string
          away_name?: string
          status?: string
          score_json?: Json | null
          updated_at?: string
        }
      }
      event_queue: {
        Row: {
          event_id: number
          bucket: string
          priority_score: number
          last_odds_fetch_at: string | null
          updated_at: string
        }
        Insert: {
          event_id: number
          bucket: string
          priority_score?: number
          last_odds_fetch_at?: string | null
          updated_at?: string
        }
        Update: {
          event_id?: number
          bucket?: string
          priority_score?: number
          last_odds_fetch_at?: string | null
          updated_at?: string
        }
      }
      odds_snapshots: {
        Row: {
          event_id: number
          snapshot_hash: string
          snapshot_json: Json
          updated_at: string
        }
        Insert: {
          event_id: number
          snapshot_hash: string
          snapshot_json: Json
          updated_at?: string
        }
        Update: {
          event_id?: number
          snapshot_hash?: string
          snapshot_json?: Json
          updated_at?: string
        }
      }
      opportunities: {
        Row: {
          id: number
          event_id: number | null
          sport_key: string
          bucket: string
          market_key: string
          line_value: string | null
          period: string
          include_ot: boolean
          roi: number
          legs_json: Json
          created_at: string
        }
        Insert: {
          id?: number
          event_id?: number | null
          sport_key: string
          bucket: string
          market_key: string
          line_value?: string | null
          period?: string
          include_ot?: boolean
          roi: number
          legs_json: Json
          created_at?: string
        }
        Update: {
          id?: number
          event_id?: number | null
          sport_key?: string
          bucket?: string
          market_key?: string
          line_value?: string | null
          period?: string
          include_ot?: boolean
          roi?: number
          legs_json?: Json
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          bankroll_total: number
          stake_mode: 'fixed' | 'percent'
          stake_fixed_value: number
          stake_percent_value: number
          roi_min: number
          is_premium: boolean
          role: string
        }
        Insert: {
          user_id: string
          bankroll_total?: number
          stake_mode?: 'fixed' | 'percent'
          stake_fixed_value?: number
          stake_percent_value?: number
          roi_min?: number
          is_premium?: boolean
          role?: string
        }
        Update: {
          user_id?: string
          bankroll_total?: number
          stake_mode?: 'fixed' | 'percent'
          stake_fixed_value?: number
          stake_percent_value?: number
          roi_min?: number
          is_premium?: boolean
          role?: string
        }
      }
    }
  }
}
