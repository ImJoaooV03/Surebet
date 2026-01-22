import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: string | null;
  plan: string; // Adicionado: Plano atual (basic, pro, premium)
  isAdmin: boolean;
  isPremium: boolean; // Helper para verificar se é pago (pro ou premium)
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>; // Nova função para atualizar dados sem reload
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  plan: 'basic',
  isAdmin: false,
  isPremium: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>('basic');
  const [loading, setLoading] = useState(true);

  // Função para buscar o perfil, role e plano
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('role, plan')
        .eq('user_id', userId)
        .single();
      
      if (data) {
        setRole(data.role || 'user');
        setPlan(data.plan || 'basic');
      } else {
        // Fallback seguro
        setRole('user');
        setPlan('basic');
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      setRole('user');
      setPlan('basic');
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // CORREÇÃO: Se o token for inválido (usuário deletado ou token expirado), faz logout forçado
      if (error) {
        console.warn('Session validation failed, signing out:', error.message);
        supabase.auth.signOut(); // Limpa tokens inválidos do localStorage
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setRole(null);
        setPlan('basic');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setPlan('basic');
    setUser(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const isAdmin = role === 'admin';
  const isPremium = plan === 'pro' || plan === 'premium';

  return (
    <AuthContext.Provider value={{ session, user, role, plan, isAdmin, isPremium, signOut, refreshProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
