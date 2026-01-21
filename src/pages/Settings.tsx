import { Save, MessageCircle, Smartphone, Loader2, Key, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings State
  const [bankroll, setBankroll] = useState(5000);
  const [stakeMode, setStakeMode] = useState<'fixed' | 'percent'>('percent');
  const [stakePercent, setStakePercent] = useState(10);
  const [roiMin, setRoiMin] = useState(0.8);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");

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
          
          // Correção: Ler do objeto JSON 'channels'
          const channels = data.channels as any || {};
          setTelegramEnabled(channels.telegram || false);
          setWhatsappEnabled(channels.whatsapp || false);
          
          setApiKey(data.external_api_key || "");
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
        // Correção: Salvar dentro do objeto JSON 'channels'
        channels: {
          telegram: telegramEnabled,
          whatsapp: whatsappEnabled
        },
        external_api_key: apiKey
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert(updates);

      if (error) throw error;
      
      toast("Configurações salvas com sucesso!", "success");
      // Recarrega a página para o Worker pegar a nova chave
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (err: any) {
      console.error(err);
      toast("Erro ao salvar: " + err.message, "error");
    } finally {
      setSaving(false);
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
          
          <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
            Provedor de Dados (Odds Reais)
          </h2>
          
          <div className="space-y-4">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-purple-400 mt-1" />
                <div>
                  <h3 className="text-sm font-medium text-slate-200">The-Odds-API</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Para obter odds reais, você precisa de uma chave de API. 
                    <a href="https://the-odds-api.com/" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline ml-1">
                      Obter chave grátis aqui
                    </a>.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Key className="w-4 h-4" /> Chave de API
              </label>
              <input 
                type="text" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Cole sua API Key aqui..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-sm"
              />
              <p className="text-xs text-slate-600">
                Se deixar em branco, o sistema rodará em <strong>Modo Simulação</strong>.
              </p>
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
