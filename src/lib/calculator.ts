import { ArbLeg } from "../types";

/**
 * Calculates the arbitrage stakes and ROI.
 * 
 * Formula:
 * Sum of Inverses (S) = Σ(1 / odd_i)
 * Arbitrage % = 100 - S * 100
 * ROI = (Total Investment / S) - Total Investment
 * Individual Stake (S_i) = (Total Investment * (1 / odd_i)) / S
 */
export function calculateArb(legs: Omit<ArbLeg, 'impliedProb' | 'suggestedStake'>[], totalInvestment: number) {
  let sumInverse = 0;
  
  const processedLegs = legs.map(leg => {
    const inv = 1 / leg.odd;
    sumInverse += inv;
    return { ...leg, inv };
  });

  const isArb = sumInverse < 1;
  const roiPercent = (1 / sumInverse) - 1;
  const profit = totalInvestment * roiPercent;

  const calculatedLegs = processedLegs.map(leg => ({
    ...leg,
    impliedProb: leg.inv,
    suggestedStake: (totalInvestment * leg.inv) / sumInverse
  }));

  return {
    isArb,
    roiPercent,
    profit,
    sumInverse,
    legs: calculatedLegs
  };
}
