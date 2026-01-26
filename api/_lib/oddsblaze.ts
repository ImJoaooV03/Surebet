import { calculateSurebet, normalizeOutcomeName } from './engine.js';

// --- Interfaces para a Odds Blaze API ---
interface OddsBlazeEvent {
  id: string;
  sport: string;
  league: string;
  home_team: string;
  away_team: string;
  start_time: string;
  bookmakers: OddsBlazeBookmaker[];
}

interface OddsBlazeBookmaker {
  key: string;
  name: string;
  markets: OddsBlazeMarket[];
}

interface OddsBlazeMarket {
  key: string; // 'h2h', 'totals', etc.
  outcomes: OddsBlazeOutcome[];
}

interface OddsBlazeOutcome {
  name: string;
  price: number;
}

// URL Base da Odds Blaze
const BASE_URL_V1 = 'https://api.oddsblaze.com/v1'; 
const BASE_URL_API_V1 = 'https://api.oddsblaze.com/api/v1';

/**
 * Testa a conexão com a API buscando Odds de Futebol (Endpoint principal)
 * Mudamos de /sports para /odds pois /sports estava retornando 404 (R2 Error).
 */
export async function testOddsBlazeConnection(apiKey: string) {
  try {
    console.log("[OddsBlaze] Testando conexão via /odds (soccer)...");
    
    // Tenta URL padrão buscando odds de futebol (limite pequeno para ser rápido)
    // Nota: Algumas APIs exigem parâmetros. Vamos tentar o mais comum.
    let url = `${BASE_URL_V1}/odds?sport=soccer&regions=br&markets=h2h`;
    
    let response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
    });

    // Se der 404, tenta a rota alternativa (/api/v1)
    if (response.status === 404) {
      console.log("[OddsBlaze] 404 na rota padrão, tentando /api/v1...");
      url = `${BASE_URL_API_V1}/odds?sport=soccer&regions=br&markets=h2h`;
      response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
      });
    }

    // Se ainda der erro, verifica se é HTML (Erro do Cloudflare/R2)
    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.includes("application/json")) {
      throw new Error(`A API da Odds Blaze retornou uma página HTML (Erro ${response.status}). O serviço pode estar instável ou a URL mudou.`);
    }

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(`Erro ${response.status}: ${errorJson.message || 'Falha na autenticação ou limites.'}`);
    }

    const data = await response.json();
    
    // Validação básica se retornou array
    if (!Array.isArray(data)) {
      // Se não for array, pode ser sucesso mas sem dados, ou estrutura diferente.
      // Mas se chegou aqui com 200 OK, a chave é válida.
      return { success: true, message: "Conexão estabelecida! (Nenhum evento encontrado no momento, mas a chave funciona)." };
    }

    return { 
      success: true, 
      count: data.length, 
      message: `Conexão Perfeita! ${data.length} eventos encontrados.` 
    };

  } catch (error: any) {
    console.error("Erro no teste OddsBlaze:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Busca dados da Odds Blaze
 */
export async function fetchOddsBlazeData(apiKey: string, sport: string = 'soccer', throwOnError: boolean = false) {
  try {
    console.log(`[OddsBlaze] Fetching ${sport}...`);
    
    // Tenta URL padrão
    let url = `${BASE_URL_V1}/odds?sport=${sport}&regions=br,eu`;
    let response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
    });

    // Fallback de URL se necessário
    if (response.status === 404) {
      url = `${BASE_URL_API_V1}/odds?sport=${sport}&regions=br,eu`;
      response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
      });
    }

    if (!response.ok) {
      if (throwOnError) {
        throw new Error(`Falha na API Odds Blaze: ${response.status}`);
      }
      return [];
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      return [];
    }

    return data as OddsBlazeEvent[];
  } catch (error: any) {
    console.error("Erro na integração Odds Blaze:", error.message);
    if (throwOnError) throw error;
    return [];
  }
}

/**
 * Processa os dados da Odds Blaze e encontra Surebets
 */
export function processOddsBlazeEvents(events: OddsBlazeEvent[], minRoi: number = 0.01) {
  const opportunities = [];

  if (!Array.isArray(events)) return [];

  for (const event of events) {
    const marketMap = new Map<string, any[]>();

    if (!event.bookmakers) continue;

    event.bookmakers.forEach(bookie => {
      bookie.markets.forEach(market => {
        const normalizedMarketKey = market.key.toLowerCase();

        if (!marketMap.has(normalizedMarketKey)) {
          marketMap.set(normalizedMarketKey, []);
        }
        
        market.outcomes.forEach(outcome => {
          marketMap.get(normalizedMarketKey)?.push({
            book_id: bookie.key,
            book_name: bookie.name,
            outcome_key: normalizeOutcomeName(outcome.name, event.home_team, event.away_team),
            odd: outcome.price
          });
        });
      });
    });

    for (const [marketKey, legs] of marketMap.entries()) {
      const bestOdds = getBestOddsPerOutcome(legs);
      const bestLegs = Object.values(bestOdds);
      
      if (isMarketCovered(marketKey, bestOdds)) {
        const result = calculateSurebet(bestLegs, 1000, minRoi);

        if (result.isArb) {
          opportunities.push({
            event_id: event.id,
            home_team: event.home_team,
            away_team: event.away_team,
            sport: event.sport,
            league: event.league,
            start_time: event.start_time,
            market: marketKey,
            roi: result.roi,
            legs: result.legs
          });
        }
      }
    }
  }

  return opportunities;
}

// --- Helpers Internos ---

function getBestOddsPerOutcome(legs: any[]) {
  const best: Record<string, any> = {};
  legs.forEach(leg => {
    if (!best[leg.outcome_key] || leg.odd > best[leg.outcome_key].odd) {
      best[leg.outcome_key] = leg;
    }
  });
  return best;
}

function isMarketCovered(marketKey: string, bestOdds: Record<string, any>): boolean {
  const outcomes = Object.keys(bestOdds);
  if (marketKey.includes('h2h') || marketKey.includes('winner') || marketKey.includes('moneyline')) {
    const hasHomeAway = outcomes.includes('HOME') && outcomes.includes('AWAY');
    return hasHomeAway; 
  }
  if (marketKey.includes('totals') || marketKey.includes('over') || marketKey.includes('under')) {
    return outcomes.includes('OVER') && outcomes.includes('UNDER');
  }
  return false;
}
