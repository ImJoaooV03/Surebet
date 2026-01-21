import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Surebet } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper to transform Enterprise DB response to Frontend Surebet Type
export function transformArbData(arb: any): Surebet {
  // In Enterprise schema: arbs -> markets -> events
  const market = arb.markets || {};
  const event = market.events || {};
  
  // Handle potential missing joins safely
  const homeTeam = event.teams_home?.name || 'Time Casa';
  const awayTeam = event.teams_away?.name || 'Time Fora';
  const league = event.leagues?.name || 'Liga Desconhecida';
  const sport = event.sports?.name?.toLowerCase() || 'soccer';

  // Map market type to readable string
  let marketDisplay = market.market_type || 'Unknown';
  if (market.market_type === 'soccer_1x2_90') marketDisplay = '1x2 (90min)';
  else if (market.market_type === 'basket_ml') marketDisplay = 'Moneyline';
  else if (market.market_type === 'soccer_ou') marketDisplay = `O/U ${market.line_value}`;

  return {
    id: arb.id,
    sport: sport as any,
    league: league,
    homeTeam: homeTeam,
    awayTeam: awayTeam,
    market: marketDisplay,
    startTime: new Date(event.start_time || Date.now()),
    isLive: event.status === 'live',
    roi: Number(arb.roi),
    totalImpliedProb: Number(arb.sum_inv),
    createdAt: new Date(arb.created_at),
    expiresAt: new Date(arb.expires_at),
    legs: (arb.arb_legs || []).map((leg: any) => ({
      outcome: leg.outcome_key,
      odd: Number(leg.odd_value),
      bookmaker: leg.books?.name || 'Book',
      impliedProb: 1 / Number(leg.odd_value),
      suggestedStake: 0 // Calculated on frontend
    }))
  };
}
