import { ArbLegCandidate } from "./types";

/**
 * Enterprise Arbitrage Engine Logic (Enhanced)
 * Implementa as regras matemáticas estritas de Surebet.
 */

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
  }[];
}

export function calculateSurebet(
  legs: (ArbLegCandidate & { book_name: string })[], 
  totalInvestment: number,
  minRoi: number = 0
): ArbResult {
  let sumInverse = 0;
  
  // 1. Calcular Soma dos Inversos (Probabilidade Implícita Total)
  const processedLegs = legs.map(leg => {
    if (leg.odd <= 1) return { ...leg, inv: 1 }; // Proteção contra odds inválidas
    const inv = 1 / leg.odd;
    sumInverse += inv;
    return { ...leg, inv };
  });

  // 2. Condição de Arbitragem: Soma < 1
  // Usamos um pequeno epsilon para evitar erros de ponto flutuante
  const isArb = sumInverse < 0.999999; 
  const roi = (1 / sumInverse) - 1;

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

  // 4. Cálculo de Stakes (Payout Igual)
  // stake_i = (Total * (1/odd_i)) / sum_inv
  let calculatedLegs = processedLegs.map(leg => {
    const rawStake = (totalInvestment * leg.inv) / sumInverse;
    // Arredondamento para 2 casas decimais (Regra 5.2)
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

  // 5. Validação Pós-Arredondamento
  // O arredondamento para baixo pode comer o lucro. Verificamos se ainda sobra lucro.
  const totalStakedReal = calculatedLegs.reduce((sum, leg) => sum + leg.stake, 0);
  const minPayout = Math.min(...calculatedLegs.map(l => l.payout));
  const realProfit = minPayout - totalStakedReal;

  // Se o lucro real (após taxas e arredondamento) for <= 0, não é uma surebet executável
  if (realProfit <= 0) {
    return {
      isArb: false,
      sumInverse,
      roi, // ROI teórico
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
