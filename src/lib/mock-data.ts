import { Surebet, Sport } from "../types";
import { addSeconds, addMinutes } from "date-fns";

const LEAGUES = {
  soccer: ["Premier League", "La Liga", "Brasileirão Série A", "Champions League"],
  basketball: ["NBA", "EuroLeague", "NBB"]
};

const TEAMS = {
  soccer: [
    ["Arsenal", "Liverpool"], ["Real Madrid", "Barcelona"], 
    ["Flamengo", "Palmeiras"], ["Man City", "Inter Milan"]
  ],
  basketball: [
    ["Lakers", "Celtics"], ["Warriors", "Suns"], 
    ["Franca", "Minas"], ["Bulls", "Heat"]
  ]
};

const BOOKMAKERS = ["Bet365", "Pinnacle", "Betano", "Sportingbet", "1xBet", "Betfair"];

function randomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function generateMockSurebet(): Surebet {
  const sport: Sport = Math.random() > 0.5 ? 'soccer' : 'basketball';
  const league = LEAGUES[sport][randomInt(0, LEAGUES[sport].length - 1)];
  const match = TEAMS[sport][randomInt(0, TEAMS[sport].length - 1)];
  const isLive = Math.random() > 0.7;
  
  // Generate realistic arb odds (Sum of inverse < 1)
  // Target sum inverse around 0.95 - 0.99 for realistic arbs
  const targetSumInv = randomFloat(0.92, 0.995);
  
  let legs = [];
  let market = "";

  if (sport === 'soccer') {
    // 3-way 1x2
    market = "1x2 (90min)";
    const prob1 = randomFloat(0.3, 0.5);
    const prob2 = randomFloat(0.2, 0.3);
    const prob3 = targetSumInv - prob1 - prob2;
    
    legs = [
      { outcome: match[0], odd: 1/prob1, bookmaker: BOOKMAKERS[randomInt(0, 5)], impliedProb: prob1 },
      { outcome: "Empate", odd: 1/prob2, bookmaker: BOOKMAKERS[randomInt(0, 5)], impliedProb: prob2 },
      { outcome: match[1], odd: 1/prob3, bookmaker: BOOKMAKERS[randomInt(0, 5)], impliedProb: prob3 },
    ];
  } else {
    // 2-way Moneyline
    market = "Moneyline";
    const prob1 = randomFloat(0.4, 0.6);
    const prob2 = targetSumInv - prob1;
    
    legs = [
      { outcome: match[0], odd: 1/prob1, bookmaker: BOOKMAKERS[randomInt(0, 5)], impliedProb: prob1 },
      { outcome: match[1], odd: 1/prob2, bookmaker: BOOKMAKERS[randomInt(0, 5)], impliedProb: prob2 },
    ];
  }

  // Calculate ROI
  const roi = (1 / targetSumInv) - 1;

  return {
    id: Math.random().toString(36).substr(2, 9),
    sport,
    league,
    homeTeam: match[0],
    awayTeam: match[1],
    market,
    startTime: isLive ? addMinutes(new Date(), -randomInt(10, 80)) : addMinutes(new Date(), randomInt(60, 24 * 60)),
    isLive,
    roi,
    totalImpliedProb: targetSumInv,
    legs,
    createdAt: new Date(),
    expiresAt: addSeconds(new Date(), isLive ? 30 : 300)
  };
}

export const MOCK_SUREBETS = Array.from({ length: 12 }, generateMockSurebet);
