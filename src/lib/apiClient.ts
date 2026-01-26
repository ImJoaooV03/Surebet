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

// Mock data para outras rotas (Fallback apenas)
const getMockData = (endpoint: string, options?: RequestInit) => {
  
  // --- MOCK INTELIGENTE PARA USUÁRIOS (PERSISTENTE) ---
  if (endpoint.includes('/admin/users')) {
    const users = getLocalUsers();
    const method = options?.method || 'GET';

    if (method === 'GET') return users;

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

    if (method === 'PUT') {
      const body = JSON.parse(options?.body as string || '{}');
      const updatedUsers = users.map((u: any) => 
        u.id === body.id ? { ...u, ...body } : u
      );
      saveLocalUsers(updatedUsers);
      return { success: true };
    }

    if (method === 'DELETE') {
      const idMatch = endpoint.match(/id=([^&]+)/);
      const idToDelete = idMatch ? idMatch[1] : null;
      if (idToDelete) {
        const updatedUsers = users.filter((u: any) => u.id !== idToDelete);
        saveLocalUsers(updatedUsers);
        return { success: true };
      }
    }
  }

  // --- MOCKS ESTÁTICOS PARA DASHBOARD (Visualização apenas) ---
  if (endpoint.includes('status') || endpoint.includes('dashboard')) {
    return {
      budget: [],
      queueStats: { LIVE: 0 },
      totalOpportunities: 0,
      hasKey: false,
      cronToken: 'deploy-para-ver-token'
    };
  }
  
  // Retorna vazio para forçar o usuário a perceber que precisa do backend
  return [];
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

    // Verificação de Content-Type
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // Se não for JSON, provavelmente é um erro 404/500 do servidor web retornando HTML
      console.warn(`[API] Resposta não-JSON de ${endpoint}. Status: ${res.status}`);
      
      // Se for o teste da OddsBlaze, lançamos erro detalhado para a UI mostrar
      if (endpoint.includes('test-oddsblaze')) {
        let errorMsg = `O backend não respondeu (Status ${res.status}).`;
        if (res.status === 404) errorMsg = "Erro 404: A função da API não foi encontrada. Verifique se o arquivo 'api/admin/test-oddsblaze.ts' foi deployado.";
        if (res.status === 500) errorMsg = "Erro 500: O servidor encontrou um erro interno. Verifique os logs do Vercel.";
        
        throw new Error(errorMsg);
      }

      return getMockData(endpoint, options) as unknown as T;
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `API Error: ${res.status}`);
    }

    return res.json();
  } catch (error: any) {
    console.error(`API Request Error (${endpoint}):`, error);
    
    // Propaga o erro se for o teste de conexão, para o usuário ver o feedback real
    if (endpoint.includes('test-oddsblaze')) {
      throw error;
    }

    return getMockData(endpoint, options) as unknown as T;
  }
}
