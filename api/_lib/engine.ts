/**
 * ENGINE DE CÁLCULO (BACKEND)
 * Implementação pura da lógica de arbitragem para uso nas Serverless Functions.
 * Duplicada do frontend para garantir independência e evitar erros de build.
 */

export interface ArbLegCandidate {
  book_id: string;
  book_name: string;
  outcome_key: string;
  odd: number;
}

export interface ArbResult {
  isArb: boolean;
  sumInverse: number;
  roi: number;
  profit: number;
  legs: {
    book_id: string;
    book_name: string;
    outcome_key: string;
    odd: number;
    stake: number;
    impliedProb: number;
    payout: number;
  }[];
}

export function calculateSurebet(
  legs: ArbLegCandidate[], 
  totalInvestment: number = 1000,
  minRoi: number = 0
): ArbResult {
  let sumInverse = 0;
  
  // 1. Calcular Soma dos Inversos
  const processedLegs = legs.map(leg => {
    // Proteção contra odds inválidas ou zeradas
    if (!leg.odd || leg.odd <= 1) return { ...leg, inv: 1 }; 
    const inv = 1 / leg.odd;
    sumInverse += inv;
    return { ...leg, inv };
  });

  // 2. Condição de Arbitragem: Soma < 1
  const isArb = sumInverse < 0.999999 && sumInverse > 0;
  const roi = sumInverse > 0 ? (1 / sumInverse) - 1 : 0;

  // 3. Filtros Iniciais
  if (!isArb || roi < minRoi) {
    return {
      isArb: false,
      sumInverse,
      roi,
      profit: 0,
      legs: []
    };
  }

  // 4. Cálculo de Stakes (Payout Igualitário)
  let calculatedLegs = processedLegs.map(leg => {
    const rawStake = (totalInvestment * leg.inv) / sumInverse;
    // Arredondamento para 2 casas decimais (padrão de moeda)
    const roundedStake = Math.floor(rawStake * 100) / 100;
    return {
      book_id: leg.book_id,
      book_name: leg.book_name,
      outcome_key: leg.outcome_key,
      odd: leg.odd,
      impliedProb: leg.inv,
      stake: roundedStake,
      payout: roundedStake * leg.odd
    };
  });

  // 5. Validação de Lucro Real (Pós-arredondamento)
  const totalStakedReal = calculatedLegs.reduce((sum, leg) => sum + leg.stake, 0);
  const minPayout = Math.min(...calculatedLegs.map(l => l.payout));
  const realProfit = minPayout - totalStakedReal;

  // Se o arredondamento comeu o lucro, descarta
  if (realProfit <= 0) {
    return {
      isArb: false,
      sumInverse,
      roi,
      profit: realProfit,
      legs: []
    };
  }

  return {
    isArb: true,
    sumInverse,
    roi,
    profit: realProfit,
    legs: calculatedLegs
  };
}

// Normalização de nomes de times/mercados (Simplificado para MVP)
export function normalizeOutcomeName(name: string, home: string, away: string): string {
  const n = name.toLowerCase().trim();
  const h = home.toLowerCase().trim();
  const a = away.toLowerCase().trim();

  if (n === h || n === '1' || n === 'home') return 'HOME';
  if (n === a || n === '2' || n === 'away') return 'AWAY';
  if (n === 'draw' || n === 'x') return 'DRAW';
  if (n.includes('over') || n.includes('acima')) return 'OVER';
  if (n.includes('under') || n.includes('abaixo')) return 'UNDER';
  
  return name; // Retorna o original se não identificar
}
