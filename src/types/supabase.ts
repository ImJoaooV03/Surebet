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
      user_settings: {
        Row: {
          user_id: string
          bankroll_total: number
          stake_mode: 'fixed' | 'percent'
          stake_fixed_value: number
          stake_percent_value: number
          roi_min: number
          freshness_live_sec: number
          freshness_pre_sec: number
          cooldown_sec: number
          channels: Json | null
          external_api_key: string | null
          api_enabled: boolean
          secondary_api_key: string | null
          secondary_api_enabled: boolean
          tertiary_api_key: string | null
          tertiary_api_enabled: boolean
          quaternary_api_key: string | null // Novo (Sportmonks)
          quaternary_api_enabled: boolean // Novo (Sportmonks)
        }
        Insert: {
          user_id: string
          bankroll_total?: number
          stake_mode?: 'fixed' | 'percent'
          stake_fixed_value?: number
          stake_percent_value?: number
          roi_min?: number
          freshness_live_sec?: number
          freshness_pre_sec?: number
          cooldown_sec?: number
          channels?: Json | null
          external_api_key?: string | null
          api_enabled?: boolean
          secondary_api_key?: string | null
          secondary_api_enabled?: boolean
          tertiary_api_key?: string | null
          tertiary_api_enabled?: boolean
          quaternary_api_key?: string | null // Novo
          quaternary_api_enabled?: boolean // Novo
        }
        Update: {
          user_id?: string
          bankroll_total?: number
          stake_mode?: 'fixed' | 'percent'
          stake_fixed_value?: number
          stake_percent_value?: number
          roi_min?: number
          freshness_live_sec?: number
          freshness_pre_sec?: number
          cooldown_sec?: number
          channels?: Json | null
          external_api_key?: string | null
          api_enabled?: boolean
          secondary_api_key?: string | null
          secondary_api_enabled?: boolean
          tertiary_api_key?: string | null
          tertiary_api_enabled?: boolean
          quaternary_api_key?: string | null // Novo
          quaternary_api_enabled?: boolean // Novo
        }
      }
      // ... (outras tabelas permanecem iguais, omitindo para brevidade pois não mudaram)
      arbs: {
        Row: {
          id: string
          market_id: string
          status: 'active' | 'expired' | 'sent'
          sum_inv: number
          roi: number
          signature: string | null
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          market_id: string
          status?: 'active' | 'expired' | 'sent'
          sum_inv: number
          roi: number
          signature?: string | null
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          market_id?: string
          status?: 'active' | 'expired' | 'sent'
          sum_inv?: number
          roi?: number
          signature?: string | null
          created_at?: string
          expires_at?: string
        }
      }
      markets: {
        Row: {
          id: string
          event_id: string
          market_type: string
          rule_set: string
          line_value: number | null
          provider_keys: Json | null
        }
        Insert: {
          id?: string
          event_id: string
          market_type: string
          rule_set?: string
          line_value?: number | null
          provider_keys?: Json | null
        }
      }
      events: {
        Row: {
          id: string
          sport_id: string
          league_id: string | null
          start_time: string
          status: 'scheduled' | 'live' | 'finished'
          home_team_id: string | null
          away_team_id: string | null
          provider_keys: Json | null
        }
        Insert: {
          id?: string
          sport_id: string
          league_id?: string | null
          start_time: string
          status?: 'scheduled' | 'live' | 'finished'
          home_team_id?: string | null
          away_team_id?: string | null
          provider_keys?: Json | null
        }
      }
      arb_legs: {
        Row: {
          id: string
          arb_id: string
          book_id: string
          outcome_key: string
          odd_value: number
          stake_value: number | null
          payout_est: number | null
        }
        Insert: {
          id?: string
          arb_id: string
          book_id: string
          outcome_key: string
          odd_value: number
          stake_value?: number | null
          payout_est?: number | null
        }
      }
      books: {
        Row: {
          id: string
          name: string
          key: string | null
        }
        Insert: {
          id?: string
          name: string
          key?: string | null
        }
      }
      sports: {
        Row: {
          id: string
          name: string
          key: string | null
        }
        Insert: {
          id?: string
          name: string
          key?: string | null
        }
      }
      leagues: {
        Row: {
          id: string
          name: string
          sport_id: string | null
        }
        Insert: {
          id?: string
          name: string
          sport_id?: string | null
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          sport_id: string | null
        }
        Insert: {
          id?: string
          name: string
          sport_id?: string | null
        }
      }
      odds: {
        Row: {
          id: string
          market_id: string
          book_id: string
          outcome_key: string
          odd_value: number
        }
        Insert: {
          id?: string
          market_id: string
          book_id: string
          outcome_key: string
          odd_value: number
        }
      }
    }
  }
}
