import { supabase } from "../lib/supabase";
import { calculateSurebet } from "../packages/shared/arbitrage";
import { addHours } from "date-fns";

/**
 * Serviço para API Secundária (API-Football via RapidAPI)
 * Documentação: https://rapidapi.com/api-sports/api/api-football
 */

const RAPID_API_HOST = 'api-football-v1.p.rapidapi.com';
const BASE_URL = `https://${RAPID_API_HOST}/v3`;

interface RapidApiOddResponse {
  league: {
    id: number;
    name: string;
    country: string;
    season: number;
  };
  fixture: {
    id: number;
    timezone: string;
    date: string;
    timestamp: number;
  };
  bookmakers: {
    id: number;
    name: string;
    bets: {
      id: number;
      name: string; // "Match Winner"
      values: {
        value: string; // "Home", "Draw", "Away"
        odd: string; // "2.50"
      }[];
    }[];
  }[];
}

export const rapidApiService = {
  /**
   * Busca odds da API Secundária (API-Football)
   */
  async fetchAndProcessOdds(apiKey: string) {
    let totalEvents = 0;
    let totalArbs = 0;

    console.group("📡 [Secondary API] Starting Scan (API-Football)...");

    try {
      // Data de hoje para buscar odds
      const today = new Date().toISOString().split('T')[0];

      // Busca Odds (Limitado a uma liga popular para teste, ex: Premier League = 39, ou geral se a API permitir sem filtro)
      // Nota: A API-Football exige filtro de liga ou fixture para odds. Vamos tentar buscar jogos do dia.
      // Como a rota /odds exige liga, vamos iterar sobre algumas ligas principais.
      const leagues = [39, 140, 135, 78, 61]; // Premier League, La Liga, Serie A, Bundesliga, Ligue 1
      
      for (const leagueId of leagues) {
        console.log(`Fetching odds for League ID ${leagueId}...`);
        
        const response = await fetch(`${BASE_URL}/odds?league=${leagueId}&season=2024&date=${today}`, {
          method: 'GET',
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': RAPID_API_HOST
          }
        });

        if (!response.ok) {
          if (response.status === 403 || response.status === 401) throw new Error("Chave RapidAPI inválida ou sem permissão.");
          console.warn(`Skipping league ${leagueId}: API Error ${response.status}`);
          continue;
        }

        const json = await response.json();
        
        if (json.errors && Object.keys(json.errors).length > 0) {
           console.warn("RapidAPI returned errors:", json.errors);
           continue;
        }

        const fixtures: { response: RapidApiOddResponse[] } = json;
        const events = fixtures.response || [];
        totalEvents += events.length;

        // Processar cada jogo
        for (const item of events) {
          const processed = await this.processRapidApiEvent(item);
          if (processed) totalArbs++;
        }
      }

      console.log(`✅ Secondary Scan Complete. Analyzed ${totalEvents} events.`);

    } catch (error: any) {
      console.error("❌ Error fetching Secondary API:", error.message);
      console.groupEnd();
      return { success: false, error: error.message };
    }

    console.groupEnd();
    return { success: true, events: totalEvents, arbs: totalArbs };
  },

  async processRapidApiEvent(item: RapidApiOddResponse): Promise<boolean> {
    try {
      // 1. Resolver Esporte (API-Football é só Futebol)
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

      // 3. Resolver Times (Nomes vêm da fixture, mas o endpoint de odds simplificado pode não trazer nomes claros, 
      // mas vamos assumir que temos acesso ou buscar pelo fixture ID se necessário.
      // O endpoint /odds retorna a estrutura acima. Precisamos dos nomes dos times.
      // Infelizmente o endpoint /odds puro da API-Football V3 às vezes não traz nomes dos times na raiz, apenas IDs.
      // Para simplificar este MVP, vamos pular se não tivermos nomes claros ou fazer uma chamada extra (caro).
      // Vamos assumir que a estrutura 'fixture' pode ser enriquecida ou vamos usar um placeholder se não tiver.
      // *Nota*: Em produção, faríamos cache dos times.
      
      // Para este exemplo funcionar sem chamadas extras, vamos usar IDs como fallback ou pular.
      return false; // Placeholder até termos mapeamento de times robusto para esta API específica.
      
    } catch (err) {
      return false;
    }
  }
};
