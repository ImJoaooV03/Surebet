import { ArbLegCandidate } from "./types";

/**
 * Enterprise Arbitrage Engine Logic
 * Pure function to calculate ROI, SumInverse, and Stakes
 */

export interface ArbResult {
  isArb: boolean;
  sumInverse: number;
  roi: number;
  legs: {
    book_id: string;
    outcome_key: string;
    odd: number;
    stake: number;
    impliedProb: number;
  }[];
}

export function calculateSurebet(
  legs: ArbLegCandidate[], 
  totalInvestment: number,
  minRoi: number = 0
): ArbResult {
  let sumInverse = 0;
  
  // 1. Calculate Sum of Inverses
  const processedLegs = legs.map(leg => {
    const inv = 1 / leg.odd;
    sumInverse += inv;
    return { ...leg, inv };
  });

  // 2. Check Arbitrage Condition
  const isArb = sumInverse < 1;
  const roi = (1 / sumInverse) - 1;

  // 3. Filter by ROI
  if (!isArb || roi < minRoi) {
    return {
      isArb: false,
      sumInverse,
      roi,
      legs: []
    };
  }

  // 4. Calculate Stakes (Equal Profit Method)
  const calculatedLegs = processedLegs.map(leg => ({
    book_id: leg.book_id,
    outcome_key: leg.outcome_key,
    odd: leg.odd,
    impliedProb: leg.inv,
    stake: (totalInvestment * leg.inv) / sumInverse
  }));

  return {
    isArb: true,
    sumInverse,
    roi,
    legs: calculatedLegs
  };
}

/**
 * Generates a unique signature for deduplication
 * Hash: event_id + market_type + line + sorted(outcomes+books+odds)
 */
export function generateArbSignature(eventId: string, marketType: string, legs: ArbLegCandidate[]): string {
  // Sort legs to ensure consistent signature regardless of order
  const sortedLegs = [...legs].sort((a, b) => a.outcome_key.localeCompare(b.outcome_key));
  
  const legString = sortedLegs
    .map(l => `${l.book_id}:${l.outcome_key}:${l.odd.toFixed(2)}`)
    .join('|');
    
  return `${eventId}|${marketType}|${legString}`;
}
