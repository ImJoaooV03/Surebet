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

// Lista de URLs Base para tentar (Redundância)
const BASE_URLS = [
  'https://api.oddsblaze.com/v1',
  'https://api.oddsblaze.com/api/v1',
  'https://data.oddsblaze.com/v1'
];

/**
 * Testa a conexão com a API tentando múltiplos endpoints e URLs base.
 * Garante que encontremos a rota correta mesmo se a documentação estiver desatualizada.
 */
export async function testOddsBlazeConnection(apiKey: string) {
  let lastError = "";

  // Estratégia: Tentar URLs base diferentes
  for (const baseUrl of BASE_URLS) {
    // Estratégia: Tentar endpoints diferentes (do mais específico para o mais genérico)
    const endpoints = [
      '/odds?sport=soccer&limit=1', // Tenta pegar 1 odd (teste real)
      '/sports',                    // Tenta listar esportes (leve)
      '/status'                     // Tenta status do servidor
    ];

    for (const endpoint of endpoints) {
      const url = `${baseUrl}${endpoint}`;
      console.log(`[OddsBlaze] Testando conexão em: ${url}`);

      try {
        const response = await fetch(url, {
          headers: { 
            'Authorization': `Bearer ${apiKey}`, 
            'Accept': 'application/json' 
          }
        });

        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        // SUCESSO: 200 OK e JSON válido
        if (response.ok && isJson) {
          const data = await response.json();
          return { 
            success: true, 
            message: `Conexão estabelecida com sucesso via ${baseUrl}!`,
            count: Array.isArray(data) ? data.length : 1
          };
        }

        // ERRO DE CHAVE: 401/403 (A conexão funcionou, mas a chave foi recusada)
        if (response.status === 401 || response.status === 403) {
          return { success: false, error: "Chave de API recusada (Erro 401/403). Verifique se sua assinatura está ativa." };
        }

        // ERRO 404 HTML (Rota errada): Apenas loga e tenta a próxima
        if (!response.ok) {
          lastError = `Erro ${response.status} ao tentar conectar.`;
        }

      } catch (e: any) {
        console.error(`[OddsBlaze] Falha ao conectar em ${url}:`, e.message);
        lastError = e.message;
      }
    }
  }

  return { success: false, error: lastError || "Não foi possível conectar a nenhum servidor da Odds Blaze. O serviço pode estar offline." };
}

/**
 * Busca dados da Odds Blaze usando a estratégia de multi-tentativa
 */
export async function fetchOddsBlazeData(apiKey: string, sport: string = 'soccer') {
  // Tenta encontrar uma URL que funcione
  for (const baseUrl of BASE_URLS) {
    const url = `${baseUrl}/odds?sport=${sport}&regions=br,eu&markets=h2h,totals`;
    
    try {
      console.log(`[OddsBlaze] Fetching data from: ${url}`);
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) return data as OddsBlazeEvent[];
      }
    } catch (e) {
      console.warn(`[OddsBlaze] Failed to fetch from ${baseUrl}`);
    }
  }

  console.error("[OddsBlaze] Todas as tentativas de busca falharam.");
  return [];
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
