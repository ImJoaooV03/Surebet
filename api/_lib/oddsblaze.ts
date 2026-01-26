import { calculateSurebet, normalizeOutcomeName } from './engine';

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

// URL Base da Odds Blaze (Ajustar conforme documentação oficial)
const BASE_URL = 'https://api.oddsblaze.com/v1'; 

/**
 * Busca dados da Odds Blaze
 * @param throwOnError Se true, lança o erro para ser capturado pelo chamador (útil para testes de conexão)
 */
export async function fetchOddsBlazeData(apiKey: string, sport: string = 'soccer', throwOnError: boolean = false) {
  try {
    // Endpoint simulado. Em produção, use o endpoint real da documentação da Odds Blaze.
    const response = await fetch(`${BASE_URL}/odds?sport=${sport}&regions=br,eu`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      const errorMessage = `Odds Blaze API Error (${response.status}): ${errText}`;
      
      if (throwOnError) {
        throw new Error(errorMessage);
      } else {
        console.error(errorMessage);
        return [];
      }
    }

    const data = await response.json();
    return data as OddsBlazeEvent[];
  } catch (error: any) {
    if (throwOnError) throw error;
    
    console.error("Erro na integração Odds Blaze:", error.message);
    return [];
  }
}

/**
 * Processa os dados da Odds Blaze e encontra Surebets
 * Usa o motor de cálculo interno (engine.ts) para garantir precisão.
 */
export function processOddsBlazeEvents(events: OddsBlazeEvent[], minRoi: number = 0.01) {
  const opportunities = [];

  if (!Array.isArray(events)) return [];

  for (const event of events) {
    // Mapa para agrupar odds por mercado: MarketKey -> Lista de Odds de várias casas
    const marketMap = new Map<string, any[]>();

    event.bookmakers.forEach(bookie => {
      bookie.markets.forEach(market => {
        // Normaliza a chave do mercado (ex: remover espaços, lowercase)
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

    // Para cada mercado agrupado, tenta encontrar arbitragem
    for (const [marketKey, legs] of marketMap.entries()) {
      // Filtra apenas a MELHOR odd para cada resultado (ex: Melhor Casa, Melhor Fora)
      const bestOdds = getBestOddsPerOutcome(legs);
      const bestLegs = Object.values(bestOdds);
      
      // Verifica se temos cobertura suficiente (ex: HOME + AWAY para Moneyline)
      if (isMarketCovered(marketKey, bestOdds)) {
        // O PULO DO GATO: Calcula a surebet com nossa matemática rigorosa
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
            legs: result.legs // Retorna as pernas calculadas com stakes
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
    // Mantém a maior odd encontrada para cada outcome (ex: HOME)
    if (!best[leg.outcome_key] || leg.odd > best[leg.outcome_key].odd) {
      best[leg.outcome_key] = leg;
    }
  });
  
  return best;
}

function isMarketCovered(marketKey: string, bestOdds: Record<string, any>): boolean {
  const outcomes = Object.keys(bestOdds);
  
  // Regras básicas de cobertura
  if (marketKey.includes('h2h') || marketKey.includes('winner') || marketKey.includes('moneyline')) {
    const hasHomeAway = outcomes.includes('HOME') && outcomes.includes('AWAY');
    return hasHomeAway; 
  }
  
  if (marketKey.includes('totals') || marketKey.includes('over') || marketKey.includes('under')) {
    return outcomes.includes('OVER') && outcomes.includes('UNDER');
  }

  return false;
}
