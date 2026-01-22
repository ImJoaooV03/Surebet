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

// Transforma os dados da API (/api/opportunities) para o modelo da UI
export function transformArbData(data: any): Surebet {
  // O endpoint /api/opportunities retorna um join com events:
  // { id, roi, legs_json, bucket, sport_key, market_key, events: { home_name, away_name, start_time_utc, league_id } }
  
  const evt = data.events || {};

  return {
    id: data.id.toString(),
    sport: data.sport_key,
    league: evt.league_id || 'Liga', // API-Sports as vezes manda ID, ideal seria nome
    homeTeam: evt.home_name || 'Casa',
    awayTeam: evt.away_name || 'Fora',
    market: data.market_key,
    startTime: new Date(evt.start_time_utc || Date.now()),
    isLive: data.bucket === 'LIVE',
    bucket: data.bucket,
    roi: Number(data.roi),
    legs: (data.legs_json || []).map((leg: any) => ({
      bookmaker: leg.bookmaker,
      outcome: leg.outcome,
      odd: Number(leg.odd),
      stake_percent: Number(leg.stake_percent),
      suggestedStake: 0
    })),
    createdAt: new Date(data.created_at)
  };
}
