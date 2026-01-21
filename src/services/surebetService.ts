import { supabase } from "../lib/supabase";
import { SurebetSchema } from "../lib/schemas";
import { transformArbData } from "../lib/utils";
import { Surebet } from "../types";
import { addHours } from "date-fns";

export interface FetchSurebetsParams {
  status?: 'active' | 'expired';
  sport?: string;
  minRoi?: number;
  timeRange?: '1h' | '12h' | '24h' | '48h' | 'all'; // Adicionado 48h
  limit?: number;
}

/**
 * Serviço dedicado para buscar Surebets.
 * Abstrai a lógica do Supabase para facilitar o uso com React Query.
 */
export const surebetService = {
  async fetchSurebets({
    status = 'active',
    sport = 'all',
    minRoi = 0,
    timeRange = 'all',
    limit = 50
  }: FetchSurebetsParams): Promise<Surebet[]> {
    
    // Construção da Query
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
      .neq('markets.events.status', 'finished')
      .gte('roi', minRoi / 100)
      .order('roi', { ascending: false })
      .limit(limit);

    // Filtro de Tempo (Lógica aplicada na query do Supabase)
    if (timeRange !== 'all') {
      const now = new Date();
      let limitDate = new Date();
      
      if (timeRange === '1h') limitDate = addHours(now, 1);
      if (timeRange === '12h') limitDate = addHours(now, 12);
      if (timeRange === '24h') limitDate = addHours(now, 24);
      if (timeRange === '48h') limitDate = addHours(now, 48); // Lógica de 48h

      query = query.lte('markets.events.start_time', limitDate.toISOString());
    }

    const { data: rawData, error } = await query;

    if (error) throw new Error(error.message);
    if (!rawData) return [];

    // Validação e Transformação (Zod + Utils)
    const validItems: Surebet[] = [];
    
    for (const item of rawData) {
      try {
        // Validação Zod (Garante integridade)
        SurebetSchema.parse(item);
        
        // Transformação para Modelo de UI
        const uiModel = transformArbData(item);
        
        // Filtro de Esporte no Client-side (caso o join complexo falhe no filtro de DB)
        if (sport !== 'all' && uiModel.sport !== sport) continue;

        validItems.push(uiModel);
      } catch (validationError) {
        // Ignora itens corrompidos silenciosamente
      }
    }

    return validItems;
  }
};
