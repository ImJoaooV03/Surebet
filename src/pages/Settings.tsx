import { Save, Loader2, Key, Globe, PlayCircle, PauseCircle, RefreshCw, Server, Zap, Database } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { theOddsApiService } from "../services/theOddsApiService";
import { rapidApiService } from "../services/rapidApiService";
import { betsApiService } from "../services/betsApiService";
import { sportmonksService } from "../services/sportmonksService";

export function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingApi, setTestingApi] = useState(false);
  
  // Settings State
  const [bankroll, setBankroll] = useState(5000);
  const [stakeMode, setStakeMode] = useState<'fixed' | 'percent'>('percent');
  const [stakePercent, setStakePercent] = useState(10);
  const [roiMin, setRoiMin] = useState(0.8);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  
  // API 1: The-Odds-API
  const [apiKey, setApiKey] = useState("");
  const [apiEnabled, setApiEnabled] = useState(true);

  // API 2: Secondary (RapidAPI)
  const [secApiKey, setSecApiKey] = useState("");
  const [secApiEnabled, setSecApiEnabled] = useState(false);

  // API 3: Tertiary (BetsAPI)
  const [terApiKey, setTerApiKey] = useState("");
  const [terApiEnabled, setTerApiEnabled] = useState(false);

  // API 4: Quaternary (Sportmonks)
  const [quatApiKey, setQuatApiKey] = useState("");
  const [quatApiEnabled, setQuatApiEnabled] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user!.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setBankroll(data.bankroll_total);
          setStakeMode(data.stake_mode);
          setStakePercent(data.stake_percent_value);
          setRoiMin(data.roi_min);
          
          const channels = data.channels as any || {};
          setTelegramEnabled(channels.telegram || false);
          setWhatsappEnabled(channels.whatsapp || false);
          
          setApiKey(data.external_api_key || "");
          setApiEnabled(data.api_enabled !== false);

          setSecApiKey(data.secondary_api_key || "");
          setSecApiEnabled(data.secondary_api_enabled || false);

          setTerApiKey(data.tertiary_api_key || "");
          setTerApiEnabled(data.tertiary_api_enabled || false);

          setQuatApiKey(data.quaternary_api_key || "");
          setQuatApiEnabled(data.quaternary_api_enabled || false);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        toast("Erro ao carregar configurações.", "error");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [user, toast]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const updates = {
        user_id: user.id,
        bankroll_total: bankroll,
        stake_mode: stakeMode,
        stake_percent_value: stakePercent,
        roi_min: roiMin,
        channels: {
          telegram: telegramEnabled,
          whatsapp: whatsappEnabled
        },
        external_api_key: apiKey,
        api_enabled: apiEnabled,
        secondary_api_key: secApiKey,
        secondary_api_enabled: secApiEnabled,
        tertiary_api_key: terApiKey,
        tertiary_api_enabled: terApiEnabled,
        quaternary_api_key: quatApiKey,
        quaternary_api_enabled: quatApiEnabled
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert(updates);

      if (error) throw error;
      
      toast("Configurações salvas com sucesso!", "success");
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (err: any) {
      console.error(err);
      toast("Erro ao salvar: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestApi = async () => {
    if (!apiKey && !secApiKey && !terApiKey && !quatApiKey) {
      toast("Insira e salve pelo menos uma chave de API.", "error");
      return;
    }
    
    setTestingApi(true);
    toast("Iniciando varredura manual nas APIs ativas...", "info");

    try {
      // Testa API 1
      if (apiKey && apiEnabled) {
        const result = await theOddsApiService.fetchAndProcessOdds(apiKey);
        if (result.success) {
          toast(`The-Odds-API: ${result.events} jogos, ${result.arbs} arbs.`, "success");
        } else {
          toast(`Erro The-Odds-API: ${result.error}`, "error");
        }
      }

      // Testa API 2
      if (secApiKey && secApiEnabled) {
        const result = await rapidApiService.fetchAndProcessOdds(secApiKey);
        if (result.success) {
          toast(`RapidAPI: Conexão OK.`, "success");
        } else {
          toast(`Erro RapidAPI: ${result.error}`, "error");
        }
      }

      // Testa API 3
      if (terApiKey && terApiEnabled) {
        const result = await betsApiService.fetchAndProcessOdds(terApiKey);
        if (result.success) {
          toast(`BetsAPI: Conexão OK.`, "success");
        } else {
          toast(`Erro BetsAPI: ${result.error}`, "error");
        }
      }

      // Testa API 4
      if (quatApiKey && quatApiEnabled) {
        const result = await sportmonksService.fetchAndProcessOdds(quatApiKey);
        if (result.success) {
          toast(`Sportmonks: Conexão OK.`, "success");
        } else {
          toast(`Erro Sportmonks: ${result.error}`, "error");
        }
      }

    } catch (err) {
      toast("Erro inesperado ao testar APIs.", "error");
    } finally {
      setTestingApi(false);
    }
  };

  if (loading) {
     return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Configurações</h1>
        <p className="text-slate-400">Gerencie sua banca, filtros e integrações.</p>
      </div>

      <div className="grid gap-8">
        
        {/* API Integration Section */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
              Fontes de Dados (Odds)
            </h2>
            
            <button
              onClick={handleTestApi}
              disabled={testingApi}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingApi ? 'animate-spin' : ''}`} />
              {testingApi ? "Testando..." : "Testar Conexões"}
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* API 1: The-Odds-API */}
            <div className={`p-4 rounded-lg border transition-all ${apiEnabled ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-900/20 border-slate-800 opacity-70'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-400" />
                  <span className="font-bold text-slate-200 text-sm">The-Odds-API</span>
                </div>
                <button
                  onClick={() => setApiEnabled(!apiEnabled)}
                  className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${apiEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'}`}
                >
                  {apiEnabled ? "ON" : "OFF"}
                </button>
              </div>
              
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Chave The-Odds-API..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* API 2: Secondary */}
            <div className={`p-4 rounded-lg border transition-all ${secApiEnabled ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-900/20 border-slate-800 opacity-70'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-400" />
                  <span className="font-bold text-slate-200 text-sm">RapidAPI (Football)</span>
                </div>
                <button
                  onClick={() => setSecApiEnabled(!secApiEnabled)}
                  className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${secApiEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'}`}
                >
                  {secApiEnabled ? "ON" : "OFF"}
                </button>
              </div>
              
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={secApiKey}
                  onChange={(e) => setSecApiKey(e.target.value)}
                  placeholder="Chave RapidAPI..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* API 3: Tertiary (BetsAPI) */}
            <div className={`p-4 rounded-lg border transition-all ${terApiEnabled ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-900/20 border-slate-800 opacity-70'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-slate-200 text-sm">BetsAPI</span>
                </div>
                <button
                  onClick={() => setTerApiEnabled(!terApiEnabled)}
                  className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${terApiEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'}`}
                >
                  {terApiEnabled ? "ON" : "OFF"}
                </button>
              </div>
              
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={terApiKey}
                  onChange={(e) => setTerApiKey(e.target.value)}
                  placeholder="Token BetsAPI..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* API 4: Quaternary (Sportmonks) */}
            <div className={`p-4 rounded-lg border transition-all ${quatApiEnabled ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-900/20 border-slate-800 opacity-70'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-slate-200 text-sm">Sportmonks</span>
                </div>
                <button
                  onClick={() => setQuatApiEnabled(!quatApiEnabled)}
                  className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${quatApiEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'}`}
                >
                  {quatApiEnabled ? "ON" : "OFF"}
                </button>
              </div>
              
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={quatApiKey}
                  onChange={(e) => setQuatApiKey(e.target.value)}
                  placeholder="Token Sportmonks..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

          </div>
        </section>

        {/* Bankroll Section */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
            Gestão de Banca
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Banca Total (R$)</label>
              <input 
                type="number" 
                value={bankroll}
                onChange={(e) => setBankroll(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Modo de Stake</label>
              <select 
                value={stakeMode}
                onChange={(e) => setStakeMode(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="percent">Porcentagem (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Stake Padrão (%)</label>
              <input 
                type="number" 
                value={stakePercent}
                onChange={(e) => setStakePercent(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
            Filtros de Alerta
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">ROI Mínimo (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={roiMin}
                onChange={(e) => setRoiMin(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
