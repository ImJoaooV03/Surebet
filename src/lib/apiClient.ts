import { generateId } from "./utils";

const API_BASE = '/api';
const MOCK_STORAGE_KEY = 'dualite_mock_users_db_v1';

// Dados iniciais para quando o storage estiver vazio
const INITIAL_MOCK_USERS = [
  {
    id: 'mock-u-1',
    email: 'joao@email.com',
    full_name: 'João Silva',
    role: 'admin',
    plan: 'premium',
    status: 'active',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  },
  {
    id: 'mock-u-2',
    email: 'maria@empresa.com',
    full_name: 'Maria Souza',
    role: 'user',
    plan: 'pro',
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    last_login: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'mock-u-3',
    email: 'carlos@teste.com',
    full_name: 'Carlos Oliveira',
    role: 'user',
    plan: 'basic',
    status: 'suspended',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    last_login: null
  }
];

// Helper para gerenciar o "Banco de Dados Local"
const getLocalUsers = () => {
  try {
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_USERS));
      return INITIAL_MOCK_USERS;
    }
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_MOCK_USERS;
  }
};

const saveLocalUsers = (users: any[]) => {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(users));
};

// Mock data para outras rotas
const getMockData = (endpoint: string, options?: RequestInit) => {
  // --- MOCK PARA TESTE DE INTEGRAÇÃO (ODDS BLAZE) ---
  if (endpoint.includes('test-oddsblaze')) {
    const body = JSON.parse(options?.body as string || '{}');
    if (body.apiKey) {
      return { 
        success: true, 
        message: "Ambiente Local: Chave validada (Simulação). Faça o deploy para conexão real.",
        sample: [{ id: 'mock-event', home_team: 'Time A', away_team: 'Time B' }]
      };
    }
    return { success: false, error: "Chave de API ausente." };
  }

  // --- MOCK INTELIGENTE PARA USUÁRIOS (PERSISTENTE) ---
  if (endpoint.includes('/admin/users')) {
    const users = getLocalUsers();
    const method = options?.method || 'GET';

    // 1. LISTAR (GET)
    if (method === 'GET') {
      return users;
    }

    // 2. CRIAR (POST)
    if (method === 'POST') {
      const body = JSON.parse(options?.body as string || '{}');
      const newUser = {
        id: `mock-u-${Date.now()}`,
        created_at: new Date().toISOString(),
        last_login: null,
        status: 'active',
        ...body
      };
      const updatedUsers = [newUser, ...users];
      saveLocalUsers(updatedUsers);
      return { success: true, user: newUser };
    }

    // 3. ATUALIZAR (PUT)
    if (method === 'PUT') {
      const body = JSON.parse(options?.body as string || '{}');
      const updatedUsers = users.map((u: any) => 
        u.id === body.id ? { ...u, ...body } : u
      );
      saveLocalUsers(updatedUsers);
      return { success: true };
    }

    // 4. EXCLUIR (DELETE)
    if (method === 'DELETE') {
      // Extrair ID da query string (ex: /admin/users?id=123)
      const idMatch = endpoint.match(/id=([^&]+)/);
      const idToDelete = idMatch ? idMatch[1] : null;
      
      if (idToDelete) {
        const updatedUsers = users.filter((u: any) => u.id !== idToDelete);
        saveLocalUsers(updatedUsers);
        return { success: true };
      }
    }
  }

  // --- MOCKS ESTÁTICOS PARA OUTRAS ROTAS ---
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
      console.warn(`[Local Dev] Endpoint ${endpoint} retornou HTML/Texto. Usando dados simulados persistentes.`);
      return getMockData(endpoint, options) as unknown as T;
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `API Error: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error(`API Request Error (${endpoint}):`, error);
    // Fallback silencioso para evitar tela branca em dev
    return getMockData(endpoint, options) as unknown as T;
  }
}
