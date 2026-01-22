import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { supabase } from "../lib/supabase";
import { 
  User, Lock, Bell, Shield, Camera, Loader2, Save, 
  Mail, Smartphone, AlertTriangle, CreditCard, Crown,
  Filter, Zap, Send, CheckCircle2, Play, Settings2,
  DollarSign, Percent, Globe, Briefcase, Layers
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Switch } from "../components/ui/Switch";
import { MultiSelect } from "../components/ui/MultiSelect";

// --- Types ---
type SettingsTab = 'profile' | 'account' | 'notifications' | 'betting' | 'security';

interface TabItem {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
  description: string;
}

// --- Configuration ---
const TABS: TabItem[] = [
  { id: 'profile', label: 'Perfil Público', icon: User, description: 'Gerencie como os outros veem você.' },
  { id: 'account', label: 'Conta & Plano', icon: CreditCard, description: 'Detalhes da assinatura e dados de login.' },
  { id: 'betting', label: 'Casas & Mercados', icon: Briefcase, description: 'Configure suas bancas e estratégias.' },
  { id: 'notifications', label: 'Alertas & Filtros', icon: Bell, description: 'Configure o robô de monitoramento.' },
  { id: 'security', label: 'Segurança', icon: Lock, description: 'Proteja sua conta e altere sua senha.' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const { loading: authLoading } = useAuth();

  if (authLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-slate-400 text-sm">Gerencie suas preferências e dados da conta.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 shrink-0">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden min-h-[500px]">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10">
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'account' && <AccountSettings />}
              {activeTab === 'betting' && <BettingSettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'security' && <SecuritySettings />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Components (Existing) ---

function ProfileSettings() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (error) throw error;
      
      await refreshProfile();
      toast("Perfil atualizado com sucesso!", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Perfil Público</h2>
        <p className="text-sm text-slate-400">Essas informações serão exibidas publicamente.</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group cursor-pointer">
          <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden group-hover:border-emerald-500 transition-colors">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-slate-500" />
            )}
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>
        <div>
          <h3 className="font-bold text-white">Foto de Perfil</h3>
          <p className="text-xs text-slate-500 max-w-[200px] mt-1">
            Upload de imagem indisponível no modo demo.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-md">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Nome Completo</label>
          <input 
            type="text" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
            placeholder="Seu nome"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Alterações
        </button>
      </form>
    </div>
  );
}

function AccountSettings() {
  const { user, plan, isPremium, isAdmin } = useAuth();
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Conta & Plano</h2>
        <p className="text-sm text-slate-400">Gerencie os detalhes da sua assinatura e login.</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <div className={`p-5 rounded-lg border transition-all ${
          isAdmin 
            ? 'bg-slate-900/80 border-purple-500/30 shadow-lg shadow-purple-900/10' 
            : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Plano Atual</h3>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white capitalize">
                  {isAdmin ? "Enterprise" : `${plan} Plan`}
                </span>
                
                {isAdmin ? (
                   <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 flex items-center gap-1">
                     <Crown size={12} /> ADMIN
                   </Badge>
                ) : isPremium ? (
                   <Badge variant="success">ATIVO</Badge>
                ) : (
                   <Badge variant="default">GRÁTIS</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 text-sm text-slate-500">
            {isAdmin 
              ? "Sua conta possui privilégios administrativos com acesso ilimitado a todos os recursos." 
              : isPremium 
                ? "Sua próxima cobrança será em 15/03/2025." 
                : "Faça upgrade para desbloquear recursos exclusivos."}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">E-mail</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-400 flex items-center gap-2 cursor-not-allowed">
                <Mail className="w-4 h-4" />
                {user?.email}
              </div>
              <Badge variant="outline" className="h-full">Verificado</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast("A senha deve ter no mínimo 6 caracteres.", "error");
      return;
    }
    if (password !== confirmPassword) {
      toast("As senhas não coincidem.", "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast("Senha atualizada com sucesso!", "success");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Segurança</h2>
        <p className="text-sm text-slate-400">Proteja sua conta e atualize suas credenciais.</p>
      </div>

      <div className="max-w-md space-y-6">
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Confirmar Nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !password}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Atualizar Senha
          </button>
        </form>
      </div>
    </div>
  );
}

// --- NEW MODULE: BETTING SETTINGS (BOOKMAKERS & MARKETS) ---

interface BookmakerConfig {
  key: string;
  name: string;
  enabled: boolean;
  commission: number;
  currency: string;
  minStake: number;
}

interface MarketConfig {
  key: string;
  name: string;
  enabled: boolean;
  periods: string[]; // 'ft', 'ht'
  complexity: 'basic' | 'advanced';
}

const DEFAULT_BOOKMAKERS: BookmakerConfig[] = [
  { key: 'bet365', name: 'Bet365', enabled: true, commission: 0, currency: 'BRL', minStake: 1 },
  { key: 'pinnacle', name: 'Pinnacle', enabled: true, commission: 0, currency: 'BRL', minStake: 5 },
  { key: 'betano', name: 'Betano', enabled: true, commission: 0, currency: 'BRL', minStake: 1 },
  { key: 'betfair', name: 'Betfair Exchange', enabled: false, commission: 6.5, currency: 'BRL', minStake: 10 },
  { key: 'sportingbet', name: 'Sportingbet', enabled: true, commission: 0, currency: 'BRL', minStake: 2 },
  { key: '1xbet', name: '1xBet', enabled: false, commission: 0, currency: 'BRL', minStake: 1 },
];

const DEFAULT_MARKETS: MarketConfig[] = [
  { key: '1x2', name: '1X2 (Vencedor)', enabled: true, periods: ['ft'], complexity: 'basic' },
  { key: 'totals', name: 'Over/Under (Gols/Pontos)', enabled: true, periods: ['ft'], complexity: 'basic' },
  { key: 'btts', name: 'Ambos Marcam (BTTS)', enabled: true, periods: ['ft'], complexity: 'basic' },
  { key: 'ah', name: 'Handicap Asiático', enabled: false, periods: ['ft'], complexity: 'advanced' },
  { key: 'eh', name: 'Handicap Europeu', enabled: false, periods: ['ft'], complexity: 'advanced' },
  { key: 'dc', name: 'Dupla Chance', enabled: true, periods: ['ft'], complexity: 'basic' },
  { key: 'dnb', name: 'Empate Anula (DNB)', enabled: true, periods: ['ft'], complexity: 'basic' },
];

function BettingSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [bookmakers, setBookmakers] = useState<BookmakerConfig[]>(DEFAULT_BOOKMAKERS);
  const [markets, setMarkets] = useState<MarketConfig[]>(DEFAULT_MARKETS);
  const [marketComplexity, setMarketComplexity] = useState<'basic' | 'advanced'>('basic');

  useEffect(() => {
    if (user) loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('bookmaker_settings, market_settings')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // Merge saved settings with defaults to handle new keys in future
        if (data.bookmaker_settings && Array.isArray(data.bookmaker_settings)) {
          const savedBooks = data.bookmaker_settings as BookmakerConfig[];
          const mergedBooks = DEFAULT_BOOKMAKERS.map(def => {
            const saved = savedBooks.find(s => s.key === def.key);
            return saved ? { ...def, ...saved } : def;
          });
          setBookmakers(mergedBooks);
        }

        if (data.market_settings && Array.isArray(data.market_settings)) {
          const savedMarkets = data.market_settings as MarketConfig[];
          const mergedMarkets = DEFAULT_MARKETS.map(def => {
            const saved = savedMarkets.find(s => s.key === def.key);
            return saved ? { ...def, ...saved } : def;
          });
          setMarkets(mergedMarkets);
        }
      }
    } catch (err) {
      console.error(err);
      toast("Erro ao carregar configurações de apostas.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          bookmaker_settings: bookmakers,
          market_settings: markets
        })
        .eq('user_id', user!.id);

      if (error) throw error;
      toast("Configurações de apostas salvas!", "success");
    } catch (err) {
      console.error(err);
      toast("Erro ao salvar.", "error");
    } finally {
      setSaving(false);
    }
  };

  // --- Handlers for Bookmakers ---
  const toggleBookmaker = (key: string) => {
    setBookmakers(prev => prev.map(b => b.key === key ? { ...b, enabled: !b.enabled } : b));
  };

  const updateBookmaker = (key: string, field: keyof BookmakerConfig, value: any) => {
    setBookmakers(prev => prev.map(b => b.key === key ? { ...b, [field]: value } : b));
  };

  // --- Handlers for Markets ---
  const toggleMarket = (key: string) => {
    setMarkets(prev => prev.map(m => m.key === key ? { ...m, enabled: !m.enabled } : m));
  };

  const toggleMarketPeriod = (key: string, period: string) => {
    setMarkets(prev => prev.map(m => {
      if (m.key !== key) return m;
      const hasPeriod = m.periods.includes(period);
      const newPeriods = hasPeriod 
        ? m.periods.filter(p => p !== period)
        : [...m.periods, period];
      return { ...m, periods: newPeriods };
    }));
  };

  const filteredMarkets = markets.filter(m => 
    marketComplexity === 'advanced' ? true : m.complexity === 'basic'
  );

  if (loading) return <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <Briefcase className="text-emerald-500" size={20} />
          Casas & Mercados
        </h2>
        <p className="text-sm text-slate-400">
          Personalize onde e como você quer apostar.
        </p>
      </div>

      {/* --- BOOKMAKERS SECTION --- */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-200 font-bold">
            <Globe size={18} className="text-indigo-400" />
            Casas de Aposta
          </div>
          <span className="text-xs text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded">
            {bookmakers.filter(b => b.enabled).length} Ativas
          </span>
        </div>

        <div className="grid gap-4">
          {bookmakers.map((bookie) => (
            <div 
              key={bookie.key} 
              className={`p-4 rounded-lg border transition-all ${
                bookie.enabled 
                  ? 'bg-slate-900 border-slate-700' 
                  : 'bg-slate-900/50 border-slate-800 opacity-75'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                
                {/* Header: Name & Toggle */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <Switch checked={bookie.enabled} onChange={() => toggleBookmaker(bookie.key)} />
                  <div>
                    <h3 className={`font-bold ${bookie.enabled ? 'text-white' : 'text-slate-500'}`}>
                      {bookie.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                      {bookie.enabled ? 'Monitorando' : 'Ignorada'}
                    </p>
                  </div>
                </div>

                {/* Inputs: Settings */}
                {bookie.enabled && (
                  <div className="flex flex-wrap gap-3 items-center animate-in fade-in">
                    
                    {/* Commission */}
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                      <Percent size={14} className="text-slate-500 mr-2" />
                      <div className="flex flex-col">
                        <label className="text-[9px] text-slate-500 font-bold uppercase">Comissão</label>
                        <input 
                          type="number" 
                          min="0" max="100" step="0.1"
                          value={bookie.commission}
                          onChange={(e) => updateBookmaker(bookie.key, 'commission', parseFloat(e.target.value))}
                          className="w-12 bg-transparent text-xs font-bold text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Min Stake */}
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                      <DollarSign size={14} className="text-slate-500 mr-2" />
                      <div className="flex flex-col">
                        <label className="text-[9px] text-slate-500 font-bold uppercase">Stake Mín.</label>
                        <input 
                          type="number" 
                          min="0"
                          value={bookie.minStake}
                          onChange={(e) => updateBookmaker(bookie.key, 'minStake', parseFloat(e.target.value))}
                          className="w-16 bg-transparent text-xs font-bold text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Currency */}
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                      <div className="flex flex-col">
                        <label className="text-[9px] text-slate-500 font-bold uppercase">Moeda</label>
                        <select 
                          value={bookie.currency}
                          onChange={(e) => updateBookmaker(bookie.key, 'currency', e.target.value)}
                          className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer"
                        >
                          <option value="BRL">BRL</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MARKETS SECTION --- */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-200 font-bold">
            <Layers size={18} className="text-indigo-400" />
            Mercados Monitorados
          </div>
          
          {/* Complexity Toggle */}
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setMarketComplexity('basic')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                marketComplexity === 'basic' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Básico
            </button>
            <button
              onClick={() => setMarketComplexity('advanced')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                marketComplexity === 'advanced' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Avançado
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {filteredMarkets.map((market) => (
            <div 
              key={market.key}
              className={`p-4 rounded-lg border transition-all ${
                market.enabled 
                  ? 'bg-slate-900 border-slate-700' 
                  : 'bg-slate-900/50 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Switch checked={market.enabled} onChange={() => toggleMarket(market.key)} />
                  <span className={`text-sm font-bold ${market.enabled ? 'text-white' : 'text-slate-500'}`}>
                    {market.name}
                  </span>
                </div>
                {market.complexity === 'advanced' && (
                  <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-400">ADV</Badge>
                )}
              </div>

              {market.enabled && (
                <div className="pl-12 flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      market.periods.includes('ft') ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 group-hover:border-slate-500'
                    }`}>
                      {market.periods.includes('ft') && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={market.periods.includes('ft')}
                      onChange={() => toggleMarketPeriod(market.key, 'ft')}
                    />
                    <span className="text-xs text-slate-400 group-hover:text-slate-300">Tempo Regulamentar (FT)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      market.periods.includes('ht') ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 group-hover:border-slate-500'
                    }`}>
                      {market.periods.includes('ht') && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={market.periods.includes('ht')}
                      onChange={() => toggleMarketPeriod(market.key, 'ht')}
                    />
                    <span className="text-xs text-slate-400 group-hover:text-slate-300">1º Tempo (HT)</span>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Bar */}
      <div className="pt-4 flex justify-end">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </div>
  );
}

// --- NOTIFICATION SETTINGS MODULE (Existing - Kept for reference) ---

const SPORTS_OPTIONS = [
  { value: 'soccer', label: 'Futebol' },
  { value: 'basketball', label: 'Basquete' },
  { value: 'tennis', label: 'Tênis' },
  { value: 'esports', label: 'E-Sports' },
  { value: 'american_football', label: 'Futebol Americano' },
];

const MARKETS_OPTIONS = [
  { value: 'h2h', label: 'Vencedor (Moneyline/1x2)' },
  { value: 'totals', label: 'Over/Under (Totais)' },
  { value: 'handicap', label: 'Handicaps' },
  { value: 'btts', label: 'Ambos Marcam' },
];

const BOOKMAKERS_OPTIONS = [
  { value: 'bet365', label: 'Bet365' },
  { value: 'pinnacle', label: 'Pinnacle' },
  { value: 'betano', label: 'Betano' },
  { value: 'sportingbet', label: 'Sportingbet' },
  { value: 'betfair', label: 'Betfair' },
  { value: '1xbet', label: '1xBet' },
];

function NotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State
  const [roiMin, setRoiMin] = useState(1.5);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedBookies, setSelectedBookies] = useState<string[]>([]);
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [preEnabled, setPreEnabled] = useState(true);
  
  // Channels
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState("");

  useEffect(() => {
    if (user) loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('alert_preferences, telegram_chat_id')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setTelegramChatId(data.telegram_chat_id || "");
        
        const prefs = data.alert_preferences as any || {};
        setRoiMin(prefs.roi_min || 1.5);
        setSelectedSports(prefs.sports || []);
        setSelectedMarkets(prefs.markets || []);
        setSelectedBookies(prefs.bookmakers || []);
        setLiveEnabled(prefs.live_enabled ?? true);
        setPreEnabled(prefs.pre_enabled ?? true);
        
        if (prefs.channels) {
          setEmailEnabled(prefs.channels.email ?? true);
          setPushEnabled(prefs.channels.push ?? false);
          setTelegramEnabled(prefs.channels.telegram ?? false);
        }
      }
    } catch (err) {
      console.error(err);
      toast("Erro ao carregar preferências.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const preferences = {
        roi_min: roiMin,
        sports: selectedSports,
        markets: selectedMarkets,
        bookmakers: selectedBookies,
        live_enabled: liveEnabled,
        pre_enabled: preEnabled,
        channels: {
          email: emailEnabled,
          push: pushEnabled,
          telegram: telegramEnabled
        }
      };

      const { error } = await supabase
        .from('user_settings')
        .update({
          alert_preferences: preferences,
          telegram_chat_id: telegramChatId
        })
        .eq('user_id', user!.id);

      if (error) throw error;
      toast("Alertas configurados com sucesso!", "success");
    } catch (err) {
      console.error(err);
      toast("Erro ao salvar configurações.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = () => {
    if (!telegramChatId) {
      toast("Configure o Chat ID primeiro.", "error");
      return;
    }
    toast(`🔔 Teste enviado para o ID ${telegramChatId}! Verifique seu Telegram.`, "success");
  };

  if (loading) return <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-8 max-w-3xl animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <Zap className="text-emerald-500" size={20} />
          Monitoramento Automático
        </h2>
        <p className="text-sm text-slate-400">
          Defina os critérios exatos para o robô te avisar.
        </p>
      </div>

      {/* --- Critérios de Alerta --- */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-slate-800 pb-3">
          <Filter size={18} className="text-indigo-400" />
          Filtros de Oportunidade
        </div>

        {/* ROI e Tipos */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lucro Mínimo (ROI %)</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.1"
                min="0"
                max="100"
                value={roiMin}
                onChange={(e) => setRoiMin(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-4 pr-10 text-white font-bold focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">%</span>
            </div>
            <p className="text-[10px] text-slate-500">Alertar apenas acima deste valor.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Momento do Jogo</label>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <Switch checked={liveEnabled} onChange={setLiveEnabled} />
                <span className={`text-sm font-medium transition-colors ${liveEnabled ? 'text-white' : 'text-slate-500'}`}>Ao Vivo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <Switch checked={preEnabled} onChange={setPreEnabled} />
                <span className={`text-sm font-medium transition-colors ${preEnabled ? 'text-white' : 'text-slate-500'}`}>Pré-Jogo</span>
              </label>
            </div>
          </div>
        </div>

        {/* Multi Selects */}
        <div className="space-y-4">
          <MultiSelect 
            label="Esportes"
            options={SPORTS_OPTIONS}
            selected={selectedSports}
            onChange={setSelectedSports}
            placeholder="Todos os esportes (Padrão)"
          />
          
          <div className="grid md:grid-cols-2 gap-4">
            <MultiSelect 
              label="Mercados"
              options={MARKETS_OPTIONS}
              selected={selectedMarkets}
              onChange={setSelectedMarkets}
              placeholder="Todos os mercados"
            />
            <MultiSelect 
              label="Casas de Aposta"
              options={BOOKMAKERS_OPTIONS}
              selected={selectedBookies}
              onChange={setSelectedBookies}
              placeholder="Todas as casas"
            />
          </div>
        </div>
      </div>

      {/* --- Canais de Entrega --- */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-slate-800 pb-3">
          <Send size={18} className="text-indigo-400" />
          Canais de Entrega
        </div>

        <div className="space-y-4">
          {/* E-mail */}
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded text-slate-400"><Mail size={18} /></div>
              <div>
                <span className="block text-sm font-bold text-slate-200">Resumo por E-mail</span>
                <span className="text-xs text-slate-500">Receba as melhores do dia.</span>
              </div>
            </div>
            <Switch checked={emailEnabled} onChange={setEmailEnabled} />
          </div>

          {/* Push */}
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded text-slate-400"><Bell size={18} /></div>
              <div>
                <span className="block text-sm font-bold text-slate-200">Notificações Push</span>
                <span className="text-xs text-slate-500">Alerta no navegador (Desktop/Mobile).</span>
              </div>
            </div>
            <Switch checked={pushEnabled} onChange={setPushEnabled} />
          </div>

          {/* Telegram */}
          <div className={`p-4 rounded-lg border transition-all ${telegramEnabled ? 'bg-blue-500/5 border-blue-500/30' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded ${telegramEnabled ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Smartphone size={18} />
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-200">Telegram Bot</span>
                  <span className="text-xs text-slate-500">Alertas instantâneos no seu app.</span>
                </div>
              </div>
              <Switch checked={telegramEnabled} onChange={setTelegramEnabled} className={telegramEnabled ? 'bg-blue-500' : ''} />
            </div>

            {telegramEnabled && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 pt-2 border-t border-blue-500/20">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-blue-400 uppercase">Seu Chat ID</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="Ex: 123456789"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                    />
                    <button
                      onClick={handleTestTelegram}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-1"
                      title="Enviar notificação de teste"
                    >
                      <Play size={12} /> Testar
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[10px] text-slate-500">
                      1. Inicie o bot @SurebetProBot.<br/>
                      2. Pegue seu ID no @userinfobot.
                    </p>
                    <a 
                      href="https://t.me/userinfobot" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline"
                    >
                      Descobrir meu ID
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="pt-4 flex justify-end">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          {saving ? "Salvando..." : "Salvar Preferências"}
        </button>
      </div>
    </div>
  );
}
