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
    let totalEvents = 0;
    let totalArbs = 0;
    let errorsCount = 0;

    console.group("🔍 [Real API] Starting Scan...");

    // 1. Lista expandida de ligas para cobrir mais jogos reais
    const sportKeys = [
      'soccer_epl',               // Premier League
      'basketball_nba',           // NBA
      'soccer_spain_la_liga',     // La Liga
      'soccer_italy_serie_a',     // Serie A
      'soccer_germany_bundesliga',// Bundesliga
      'soccer_france_ligue_one',  // Ligue 1
      'soccer_uefa_champs_league',// Champions League
      'soccer_brazil_campeonato', // Brasileirão (quando ativo)
      'soccer_portugal_primeira_liga' // Liga Portugal
    ];
    
    // Regiões expandidas para maximizar chances de arbitragem
    const regions = 'us,uk,eu,au'; 
    
    for (const sportKey of sportKeys) {
      try {
        console.log(`📡 Fetching ${sportKey}...`);
        
        // Busca odds (que inclui os eventos/jogos)
        const response = await fetch(
          `${BASE_URL}/sports/${sportKey}/odds/?regions=${regions}&markets=h2h&oddsFormat=decimal&apiKey=${apiKey}`
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error("Chave de API inválida");
            if (response.status === 429) throw new Error("Limite de requisições excedido");
            // Ignora erros 404 ou outros para não parar o loop
            console.warn(`Skipping ${sportKey}: API Error ${response.status}`);
            continue;
        }

        const events: TheOddsApiEvent[] = await response.json();
        console.log(`✅ Received ${events.length} events for ${sportKey}`);
        totalEvents += events.length;

        // Processar cada evento
        for (const apiEvent of events) {
          try {
            const arbsFound = await this.processEvent(apiEvent, sportKey);
            if (arbsFound) totalArbs++;
          } catch (eventError) {
            console.error(`Error processing event ${apiEvent.id}:`, eventError);
          }
        }
      } catch (sportError: any) {
        // Captura erro de rede (Failed to fetch) ou outros erros específicos DESTA liga
        // e continua para a próxima liga sem quebrar o processo inteiro.
        console.error(`❌ Error fetching/processing ${sportKey}:`, sportError.message);
        errorsCount++;
      }
    }

    console.log(`🏁 Scan Complete. Analyzed ${totalEvents} events, Found ${totalArbs} Surebets. Errors: ${errorsCount}`);
    console.groupEnd();

    // Consideramos sucesso se pelo menos uma liga foi processada ou se não houve erro fatal global
    // Se todas falharem, retornamos erro.
    if (totalEvents === 0 && errorsCount === sportKeys.length) {
        return { success: false, error: "Falha ao conectar com todas as ligas. Verifique sua conexão." };
    }

    return { success: true, events: totalEvents, arbs: totalArbs };
  },

  async processEvent(apiEvent: TheOddsApiEvent, sportKey: string): Promise<boolean> {
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
    if (!sport) return false;

    // 2. Resolver/Criar Liga
    let { data: league } = await supabase.from('leagues').select('id').eq('name', apiEvent.sport_title).single();
    if (!league) {
        const { data } = await supabase.from('leagues').insert({ name: apiEvent.sport_title, sport_id: sport.id }).select().single();
        league = data;
    }
    if (!league) return false;

    // 3. Resolver/Criar Times
    const homeTeamId = await this.resolveTeam(apiEvent.home_team, sport.id);
    const awayTeamId = await this.resolveTeam(apiEvent.away_team, sport.id);

    if (!homeTeamId || !awayTeamId) return false;

    // 4. Upsert Evento
    let { data: event } = await supabase
        .from('events')
        .select('id')
        .contains('provider_keys', { theoddsapi: apiEvent.id })
        .maybeSingle();

    if (event) {
        // Atualiza horário e status se mudou
        const { data: updated } = await supabase.from('events').update({
            start_time: apiEvent.commence_time,
            status: new Date(apiEvent.commence_time) < new Date() ? 'live' : 'scheduled',
        }).eq('id', event.id).select().single();
        event = updated;
    } else {
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

    if (!event) return false;

    // 5. Processar Odds
    const legsCandidates: any[] = [];
    const marketType = isSoccer ? 'soccer_1x2_90' : 'basket_ml';
    const ruleSet = isSoccer ? '90min' : 'incl_ot';

    // Criar Mercado
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

    if (!market) return false;

    // Coletar Odds
    for (const book of apiEvent.bookmakers) {
        let { data: dbBook } = await supabase.from('books').select('id').eq('key', book.key).single();
        if (!dbBook) {
            const { data } = await supabase.from('books').insert({ name: book.title, key: book.key }).select().single();
            dbBook = data;
        }
        if (!dbBook) continue;

        const h2h = book.markets.find(m => m.key === 'h2h');
        if (h2h) {
            for (const outcome of h2h.outcomes) {
                let outcomeKey = 'DRAW';
                if (outcome.name === apiEvent.home_team) outcomeKey = 'HOME';
                if (outcome.name === apiEvent.away_team) outcomeKey = 'AWAY';

                legsCandidates.push({
                    book_id: dbBook.id,
                    outcome_key: outcomeKey,
                    odd: outcome.price,
                    book_name: book.title
                });
            }
        }
    }

    // 6. Calcular Surebet
    const bestOdds: Record<string, { odd: number, book_id: string, book_name: string }> = {};
    
    legsCandidates.forEach(leg => {
        if (!bestOdds[leg.outcome_key] || leg.odd > bestOdds[leg.outcome_key].odd) {
            bestOdds[leg.outcome_key] = { odd: leg.odd, book_id: leg.book_id, book_name: leg.book_name };
        }
    });

    const requiredOutcomes = isSoccer ? ['HOME', 'DRAW', 'AWAY'] : ['HOME', 'AWAY'];
    const hasAllOutcomes = requiredOutcomes.every(k => bestOdds[k]);

    if (hasAllOutcomes) {
        const arbLegs = requiredOutcomes.map(k => ({
            outcome_key: k,
            odd: bestOdds[k].odd,
            book_id: bestOdds[k].book_id
        }));

        const result = calculateSurebet(arbLegs, 1000, 0);

        if (result.isArb) {
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
                return true;
            }
        }
    }
    
    return false;
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
