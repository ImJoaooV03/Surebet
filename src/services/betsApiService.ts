import { supabase } from "../lib/supabase";
import { calculateSurebet } from "../packages/shared/arbitrage";
import { addHours } from "date-fns";

/**
 * Serviço para API Terciária (BetsAPI)
 * Documentação: https://betsapi.com/docs/
 */

const BASE_URL = 'https://api.betsapi.com/v1';

interface BetsApiEvent {
  id: string;
  sport_id: string;
  time: string; // Unix timestamp
  time_status: string;
  league: {
    id: string;
    name: string;
  };
  home: {
    id: string;
    name: string;
  };
  away: {
    id: string;
    name: string;
  };
  odds?: Record<string, any>; // Estrutura variável
}

export const betsApiService = {
  /**
   * Busca odds da BetsAPI
   */
  async fetchAndProcessOdds(apiKey: string) {
    let totalEvents = 0;
    let totalArbs = 0;

    console.group("📡 [BetsAPI] Starting Scan...");

    try {
      // 1. Buscar Eventos "In Play" (Ao Vivo) ou "Upcoming" (Próximos)
      // BetsAPI usa sport_id=1 para Futebol
      const response = await fetch(`${BASE_URL}/events/upcoming?sport_id=1&token=${apiKey}`);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw new Error("Chave BetsAPI inválida.");
        throw new Error(`BetsAPI Error: ${response.status}`);
      }

      const json = await response.json();
      
      if (!json.success || !json.results) {
         console.warn("BetsAPI returned no results or error:", json.error);
         return { success: false, error: json.error || "Sem dados" };
      }

      const events: BetsApiEvent[] = json.results;
      totalEvents += events.length;

      // 2. Para cada evento, precisaríamos buscar as odds (endpoint separado na BetsAPI geralmente)
      // Para este MVP, vamos simular que já temos as odds ou pegar de um endpoint de odds diretas se disponível
      // BetsAPI tem endpoint /v1/bet365/result ou similar.
      
      // Como a BetsAPI cobra por requisição detalhada, vamos fazer um processamento otimizado:
      // Apenas processar os 5 primeiros eventos para não gastar cota do usuário no teste
      for (const event of events.slice(0, 5)) {
         // Placeholder: Em produção, faríamos fetch(`${BASE_URL}/event/odds?token=${apiKey}&event_id=${event.id}`)
         // Aqui vamos apenas registrar que o evento foi "visto"
         await this.processBetsApiEvent(event);
      }

      console.log(`✅ BetsAPI Scan Complete. Saw ${totalEvents} events.`);

    } catch (error: any) {
      console.error("❌ Error fetching BetsAPI:", error.message);
      console.groupEnd();
      return { success: false, error: error.message };
    }

    console.groupEnd();
    return { success: true, events: totalEvents, arbs: totalArbs };
  },

  async processBetsApiEvent(item: BetsApiEvent): Promise<boolean> {
    try {
      // 1. Resolver Esporte
      let { data: sport } = await supabase.from('sports').select('id').eq('key', 'soccer').single();
      if (!sport) {
         const { data } = await supabase.from('sports').insert({ name: 'Futebol', key: 'soccer' }).select().single();
         sport = data;
      }

      // 2. Resolver Liga
      let { data: league } = await supabase.from('leagues').select('id').eq('name', item.league.name).single();
      if (!league) {
        const { data } = await supabase.from('leagues').insert({ name: item.league.name, sport_id: sport!.id }).select().single();
        league = data;
      }

      // 3. Resolver Times
      const homeName = item.home.name;
      const awayName = item.away.name;
      
      // (Lógica simplificada de resolução de times - idealmente usaria cache)
      // ...

      // Retorna false pois não estamos processando odds reais neste stub para economizar cota
      return false; 
      
    } catch (err) {
      return false;
    }
  }
};
