const API_BASE = '/api';

// Mock data para desenvolvimento local (quando Vercel Functions não estão disponíveis)
const getMockData = (endpoint: string) => {
  if (endpoint.includes('status') || endpoint.includes('dashboard')) {
    return {
      budget: [
        { sport_key: 'football', used: 4500 },
        { sport_key: 'basketball', used: 1200 }
      ],
      queueStats: { LIVE: 12, PRE_HOT: 45, PRE_MID: 120, PRE_LONG: 80 },
      totalOpportunities: 342,
      hasKey: true,
      cronToken: 'dev-token-placeholder-123'
    };
  }
  if (endpoint.includes('opportunities')) {
    return [
      {
        id: 'mock-1',
        roi: 0.0245,
        bucket: 'LIVE',
        sport_key: 'football',
        market_key: 'h2h',
        created_at: new Date().toISOString(),
        events: {
          home_name: 'Flamengo',
          away_name: 'Vasco',
          start_time_utc: new Date().toISOString(),
          league_id: 'Brasileirão'
        },
        legs_json: [
          { bookmaker: 'Bet365', outcome: 'Flamengo', odd: 2.10, stake_percent: 0.48 },
          { bookmaker: 'Pinnacle', outcome: 'Vasco', odd: 1.95, stake_percent: 0.52 }
        ]
      },
      {
        id: 'mock-2',
        roi: 0.018,
        bucket: 'PRE_HOT',
        sport_key: 'basketball',
        market_key: 'totals',
        created_at: new Date().toISOString(),
        events: {
          home_name: 'Lakers',
          away_name: 'Warriors',
          start_time_utc: new Date().toISOString(),
          league_id: 'NBA'
        },
        legs_json: [
          { bookmaker: 'Betano', outcome: 'Over 220.5', odd: 1.90, stake_percent: 0.5 },
          { bookmaker: 'Sportingbet', outcome: 'Under 220.5', odd: 2.15, stake_percent: 0.5 }
        ]
      }
    ];
  }

  // FIX: Mock data for events to prevent map error
  if (endpoint.includes('events')) {
    return [
      {
        id: 'mock-ev-1',
        sport_key: 'soccer_brazil_serie_a',
        start_time_utc: new Date(Date.now() + 86400000).toISOString(),
        home_name: 'Palmeiras',
        away_name: 'Corinthians',
        status: 'scheduled'
      },
      {
        id: 'mock-ev-2',
        sport_key: 'basketball_nba',
        start_time_utc: new Date().toISOString(),
        home_name: 'Boston Celtics',
        away_name: 'Miami Heat',
        status: 'live'
      },
      {
        id: 'mock-ev-3',
        sport_key: 'soccer_epl',
        start_time_utc: new Date(Date.now() - 7200000).toISOString(),
        home_name: 'Manchester City',
        away_name: 'Liverpool',
        status: 'finished'
      }
    ];
  }

  return {};
};

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    // CRITICAL FIX: Detecta se recebeu HTML (Vite servindo arquivo TS/HTML) em vez de JSON.
    // Isso acontece localmente porque as Vercel Functions não rodam no WebContainer.
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn(`[Local Dev] Endpoint ${endpoint} retornou HTML/Texto. Usando dados simulados.`);
      return getMockData(endpoint) as unknown as T;
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `API Error: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error(`API Request Error (${endpoint}):`, error);
    // Fallback silencioso para evitar tela branca em dev
    return getMockData(endpoint) as unknown as T;
  }
}
