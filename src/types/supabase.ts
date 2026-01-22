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
      activation_codes: {
        Row: {
          id: string
          code: string
          plan_type: 'pro' | 'premium'
          billing_cycle: 'monthly' | 'quarterly' | 'yearly'
          is_used: boolean
          created_by: string | null
          used_by: string | null
          redeemed_by_name: string | null
          redeemed_by_email: string | null
          created_at: string
          used_at: string | null
        }
        Insert: {
          id?: string
          code: string
          plan_type: 'pro' | 'premium'
          billing_cycle?: 'monthly' | 'quarterly' | 'yearly'
          is_used?: boolean
          created_by?: string | null
          used_by?: string | null
          redeemed_by_name?: string | null
          redeemed_by_email?: string | null
          created_at?: string
          used_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          plan_type?: 'pro' | 'premium'
          billing_cycle?: 'monthly' | 'quarterly' | 'yearly'
          is_used?: boolean
          created_by?: string | null
          used_by?: string | null
          redeemed_by_name?: string | null
          redeemed_by_email?: string | null
          created_at?: string
          used_at?: string | null
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
          plan: 'basic' | 'pro' | 'premium'
          role: string
          external_api_key?: string | null
          api_enabled?: boolean
          secondary_api_key?: string | null
          secondary_api_enabled?: boolean
        }
        Insert: {
          user_id: string
          bankroll_total?: number
          stake_mode?: 'fixed' | 'percent'
          stake_fixed_value?: number
          stake_percent_value?: number
          roi_min?: number
          is_premium?: boolean
          plan?: 'basic' | 'pro' | 'premium'
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
          plan?: 'basic' | 'pro' | 'premium'
          role?: string
        }
      }
      opportunities: { Row: {} } // Placeholder
      events: { Row: {} } // Placeholder
      request_budget: { Row: {} } // Placeholder
      event_queue: { Row: {} } // Placeholder
    }
    Functions: {
      redeem_activation_code: {
        Args: { code_input: string }
        Returns: { success: boolean; message: string }
      }
    }
  }
}
