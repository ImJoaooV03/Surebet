import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { SurebetSchema, ValidatedSurebet } from "../lib/schemas";
import { transformArbData } from "../lib/utils";
import { Surebet } from "../types";
import { z } from "zod";

interface UseSurebetsOptions {
  status?: 'active' | 'expired';
  sport?: string;
  minRoi?: number;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useSurebets({
  status = 'active',
  sport = 'all',
  minRoi = 0,
  limit = 50,
  autoRefresh = true,
  refreshInterval = 10000
}: UseSurebetsOptions = {}) {
  const [data, setData] = useState<Surebet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      // 1. Query Supabase with Strict Filters
      // Using !inner on joined tables to filter out finished games at the DB level
      let query = supabase
        .from('arbs')
        .select(`
          *,
          arb_legs (
            outcome_key,
            odd_value,
            books (name)
          ),
          markets!inner (
            market_type,
            rule_set,
            line_value,
            events!inner (
              start_time,
              status,
              leagues (name),
              sports (name),
              teams_home: home_team_id (name),
              teams_away: away_team_id (name)
            )
          )
        `)
        .eq('status', status)
        .neq('markets.events.status', 'finished') // Filter out finished games
        .gte('roi', minRoi / 100) // Filter ROI
        .order('roi', { ascending: false }) // Best opportunities first
        .limit(limit);

      const { data: rawData, error: dbError } = await query;

      if (dbError) throw new Error(dbError.message);

      if (!rawData) {
        setData([]);
        return;
      }

      // 2. Runtime Validation & Parsing (Zod)
      // We map over the raw data, validate each item, and filter out invalid ones
      const validItems: Surebet[] = [];
      
      for (const item of rawData) {
        try {
          // Validate structure
          const validated = SurebetSchema.parse(item);
          
          // Additional Logic Validation (e.g., check if dates are valid)
          if (validated.markets.events.status === 'scheduled' && validated.markets.events.start_time < new Date()) {
             // Optional: You might consider a scheduled game in the past as 'live' or 'invalid' depending on logic
             // For now, we accept it but could flag it.
          }

          // Transform to UI Model
          const uiModel = transformArbData(item);
          
          // Client-side Sport Filter (if not done in DB)
          if (sport !== 'all' && uiModel.sport !== sport) continue;

          validItems.push(uiModel);
        } catch (validationError) {
          console.warn("Skipping corrupted data item:", item.id, validationError);
          // We silently skip corrupted data so the UI doesn't break
        }
      }

      setData(validItems);

    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Falha ao buscar dados.");
    } finally {
      setLoading(false);
    }
  }, [status, sport, minRoi, limit]);

  useEffect(() => {
    fetchData();

    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(fetchData, refreshInterval);
    }

    // Real-time subscription for immediate updates
    const subscription = supabase
      .channel('public:arbs_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arbs' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      if (intervalId) clearInterval(intervalId);
      subscription.unsubscribe();
    };
  }, [fetchData, autoRefresh, refreshInterval]);

  return { data, loading, error, refresh: fetchData };
}
