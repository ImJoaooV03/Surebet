import { supabase } from "../lib/supabase";
import { calculateSurebet } from "../packages/shared/arbitrage";
import { addHours } from "date-fns";

const BASE_URL = 'https://api.the-odds-api.com/v4';

interface TheOddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    title: string;
    markets: {
      key: string;
      outcomes: {
        name: string;
        price: number;
      }[];
    }[];
  }[];
}

export const theOddsApiService = {
  /**
   * Busca odds reais da API e salva no banco de dados
   */
  async fetchAndProcessOdds(apiKey: string) {
    try {
      console.log("[Real API] Fetching data from The-Odds-API...");

      // 1. Definir quais esportes buscar (Futebol e Basquete para MVP)
      // Para economizar quota, vamos buscar apenas EPL e NBA neste exemplo
      const sportKeys = ['soccer_epl', 'basketball_nba'];
      
      for (const sportKey of sportKeys) {
        // Fetch da API Externa
        const response = await fetch(
          `${BASE_URL}/sports/${sportKey}/odds/?regions=uk,eu&markets=h2h&apiKey=${apiKey}`
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error("Chave de API inválida");
            if (response.status === 429) throw new Error("Limite de requisições excedido");
            continue;
        }

        const events: TheOddsApiEvent[] = await response.json();
        console.log(`[Real API] Found ${events.length} events for ${sportKey}`);

        // Processar cada evento
        for (const apiEvent of events) {
          await this.processEvent(apiEvent, sportKey);
        }
      }

      return { success: true };

    } catch (error: any) {
      console.error("[Real API] Error:", error);
      return { success: false, error: error.message };
    }
  },

  async processEvent(apiEvent: TheOddsApiEvent, sportKey: string) {
    // 1. Resolver/Criar Esporte
    const isSoccer = sportKey.includes('soccer');
    const sportName = isSoccer ? 'Futebol' : 'Basquete';
    const sportDbKey = isSoccer ? 'soccer' : 'basketball';

    // Upsert Sport
    let { data: sport } = await supabase.from('sports').select('id').eq('key', sportDbKey).single();
    if (!sport) {
        const { data } = await supabase.from('sports').insert({ name: sportName, key: sportDbKey }).select().single();
        sport = data;
    }

    if (!sport) {
        console.error(`[Real API] Failed to resolve sport: ${sportDbKey}`);
        return;
    }

    // 2. Resolver/Criar Liga
    let { data: league } = await supabase.from('leagues').select('id').eq('name', apiEvent.sport_title).single();
    if (!league) {
        const { data } = await supabase.from('leagues').insert({ name: apiEvent.sport_title, sport_id: sport.id }).select().single();
        league = data;
    }

    if (!league) {
        console.error(`[Real API] Failed to resolve league: ${apiEvent.sport_title}`);
        return;
    }

    // 3. Resolver/Criar Times
    const homeTeamId = await this.resolveTeam(apiEvent.home_team, sport.id);
    const awayTeamId = await this.resolveTeam(apiEvent.away_team, sport.id);

    if (!homeTeamId || !awayTeamId) {
        console.error(`[Real API] Failed to resolve teams: ${apiEvent.home_team} vs ${apiEvent.away_team}`);
        return;
    }

    // 4. Upsert Evento (Abordagem Segura para JSONB)
    // Verifica se o evento já existe pelo ID do provedor dentro do JSON
    let { data: event } = await supabase
        .from('events')
        .select('id')
        .contains('provider_keys', { theoddsapi: apiEvent.id })
        .maybeSingle();

    if (event) {
        // Atualiza status e horário se já existe
        const { data: updated } = await supabase.from('events').update({
            start_time: apiEvent.commence_time,
            status: new Date(apiEvent.commence_time) < new Date() ? 'live' : 'scheduled',
        }).eq('id', event.id).select().single();
        event = updated;
    } else {
        // Cria novo se não existe
        const { data: inserted } = await supabase.from('events').insert({
            sport_id: sport.id,
            league_id: league.id,
            home_team_id: homeTeamId,
            away_team_id: awayTeamId,
            start_time: apiEvent.commence_time,
            status: new Date(apiEvent.commence_time) < new Date() ? 'live' : 'scheduled',
            provider_keys: { theoddsapi: apiEvent.id }
        }).select().single();
        event = inserted;
    }

    if (!event) return;

    // 5. Processar Odds e Calcular Arb
    // Mapear Bookmakers para Legs
    const legsCandidates: any[] = [];
    
    // Mercado H2H (Moneyline ou 1x2)
    const marketType = isSoccer ? 'soccer_1x2_90' : 'basket_ml';
    const ruleSet = isSoccer ? '90min' : 'incl_ot';

    // Criar Mercado no DB (Busca ou Cria)
    let { data: market } = await supabase
        .from('markets')
        .select('id')
        .eq('event_id', event.id)
        .eq('market_type', marketType)
        .maybeSingle();

    if (!market) {
        const { data: newMarket } = await supabase.from('markets').insert({
            event_id: event.id,
            market_type: marketType,
            rule_set: ruleSet,
            provider_keys: { theoddsapi: `${apiEvent.id}_h2h` }
        }).select().single();
        market = newMarket;
    }

    if (!market) return;

    // Coletar todas as odds disponíveis para este mercado
    for (const book of apiEvent.bookmakers) {
        // Upsert Bookmaker
        let { data: dbBook } = await supabase.from('books').select('id').eq('key', book.key).single();
        if (!dbBook) {
            const { data } = await supabase.from('books').insert({ name: book.title, key: book.key }).select().single();
            dbBook = data;
        }

        if (!dbBook) continue;

        const h2h = book.markets.find(m => m.key === 'h2h');
        if (h2h) {
            for (const outcome of h2h.outcomes) {
                // Normalizar Outcome Key
                let outcomeKey = 'DRAW';
                if (outcome.name === apiEvent.home_team) outcomeKey = 'HOME';
                if (outcome.name === apiEvent.away_team) outcomeKey = 'AWAY';

                legsCandidates.push({
                    book_id: dbBook.id,
                    outcome_key: outcomeKey,
                    odd: outcome.price
                });
            }
        }
    }

    // 6. Calcular Surebet usando o Engine Compartilhado
    // Agrupar melhores odds por outcome
    const bestOdds: Record<string, { odd: number, book_id: string }> = {};
    
    legsCandidates.forEach(leg => {
        if (!bestOdds[leg.outcome_key] || leg.odd > bestOdds[leg.outcome_key].odd) {
            bestOdds[leg.outcome_key] = { odd: leg.odd, book_id: leg.book_id };
        }
    });

    // Verificar se temos todos os outcomes necessários
    const requiredOutcomes = isSoccer ? ['HOME', 'DRAW', 'AWAY'] : ['HOME', 'AWAY'];
    const hasAllOutcomes = requiredOutcomes.every(k => bestOdds[k]);

    if (hasAllOutcomes) {
        const arbLegs = requiredOutcomes.map(k => ({
            outcome_key: k,
            odd: bestOdds[k].odd,
            book_id: bestOdds[k].book_id
        }));

        const result = calculateSurebet(arbLegs, 1000, 0); // ROI min 0 para salvar tudo e filtrar no front

        if (result.isArb) {
            console.log(`[Real API] SUREBET FOUND! ROI: ${(result.roi * 100).toFixed(2)}%`);
            
            // Salvar Arb
            const { data: arb } = await supabase.from('arbs').insert({
                market_id: market.id,
                status: 'active',
                sum_inv: result.sumInverse,
                roi: result.roi,
                created_at: new Date().toISOString(),
                expires_at: addHours(new Date(), 1).toISOString()
            }).select().single();

            if (arb) {
                // Salvar Legs
                await supabase.from('arb_legs').insert(
                    result.legs.map(l => ({
                        arb_id: arb.id,
                        book_id: l.book_id,
                        outcome_key: l.outcome_key,
                        odd_value: l.odd,
                        stake_value: 0,
                        payout_est: 0
                    }))
                );
            }
        }
    }
  },

  async resolveTeam(teamName: string, sportId: string): Promise<string | null> {
    let { data: team } = await supabase.from('teams').select('id').eq('name', teamName).single();
    if (!team) {
        const { data } = await supabase.from('teams').insert({ name: teamName, sport_id: sportId }).select().single();
        team = data;
    }
    return team?.id || null;
  }
};
