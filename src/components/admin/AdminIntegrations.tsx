import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Save, Globe, Loader2, Power, CheckCircle2, Flame, Play, AlertCircle } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import { apiRequest } from "../../lib/apiClient";

export function AdminIntegrations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // System API States
  const [apiKey, setApiKey] = useState("");
  const [apiEnabled, setApiEnabled] = useState(false);
  
  const [secApiKey, setSecApiKey] = useState("");
  const [secApiEnabled, setSecApiEnabled] = useState(false);

  // Odds Blaze States
  const [oddsBlazeKey, setOddsBlazeKey] = useState("");
  const [oddsBlazeEnabled, setOddsBlazeEnabled] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadAdminSettings();
  }, [user]);

  const loadAdminSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setApiKey(data.external_api_key || "");
        setApiEnabled(data.api_enabled || false);
        setSecApiKey(data.secondary_api_key || "");
        setSecApiEnabled(data.secondary_api_enabled || false);
        
        // Odds Blaze
        setOddsBlazeKey(data.oddsblaze_key || "");
        setOddsBlazeEnabled(data.oddsblaze_enabled || false);
      }
    } catch (err) {
      console.error(err);
      toast("Erro ao carregar configurações.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKeys = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const updates = {
        external_api_key: apiKey,
        api_enabled: apiEnabled,
        secondary_api_key: secApiKey,
        secondary_api_enabled: secApiEnabled,
        oddsblaze_key: oddsBlazeKey,
        oddsblaze_enabled: oddsBlazeEnabled,
      };

      const { error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast("Conexões salvas com sucesso!", "success");
      
    } catch (err: any) {
      console.error(err);
      toast("Erro ao salvar: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestOddsBlaze = async () => {
    if (!oddsBlazeKey) {
      toast("Insira a chave da API antes de testar.", "error");
      return;
    }
    
    setTesting(true);
    try {
      // Chama o endpoint de teste
      const res: any = await apiRequest('/admin/test-oddsblaze', {
        method: 'POST',
        body: JSON.stringify({ apiKey: oddsBlazeKey })
      });

      if (res.success) {
        toast(res.message, "success");
      } else {
        toast("Falha: " + (res.error || "Erro desconhecido"), "error");
      }
    } catch (err: any) {
      console.error("Erro no teste:", err);
      toast("Erro de Conexão: O backend não respondeu. Verifique o deploy.", "error");
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Globe className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Conexões de Dados (APIs)</h2>
            <p className="text-sm text-slate-400">Aqui você conecta o sistema aos fornecedores de odds e resultados.</p>
          </div>
        </div>

        <div className="grid gap-6">
          
          {/* ODDS BLAZE API (INTEGRADA) */}
          <div className={`p-5 rounded-lg border transition-all ${oddsBlazeEnabled ? 'bg-orange-950/20 border-orange-500/30' : 'bg-slate-950 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${oddsBlazeEnabled ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-slate-700'}`}></div>
                <div>
                  <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    Odds Blaze API <Flame size={14} className="text-orange-500 fill-orange-500" />
                  </h3>
                  <p className="text-xs text-slate-500">Scanner ultrarrápido e sugestões automáticas de Surebet.</p>
                </div>
              </div>
              <button
                onClick={() => setOddsBlazeEnabled(!oddsBlazeEnabled)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  oddsBlazeEnabled 
                    ? 'bg-orange-500 text-white hover:bg-orange-400' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Power className="w-3 h-3" />
                {oddsBlazeEnabled ? "CONECTADO" : "DESCONECTADO"}
              </button>
            </div>
            
            {oddsBlazeEnabled && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="text-xs font-bold text-orange-500 uppercase flex items-center gap-1 mb-1">
                    <CheckCircle2 size={12} /> Chave de API (Token)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={oddsBlazeKey}
                      onChange={(e) => setOddsBlazeKey(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:border-orange-500 focus:outline-none font-mono text-sm shadow-inner"
                      placeholder="Cole seu token da Odds Blaze aqui..."
                    />
                    <button 
                      onClick={handleTestOddsBlaze}
                      disabled={testing || !oddsBlazeKey}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                      title="Testar conexão com a API"
                    >
                      {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      Testar
                    </button>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-orange-200/80 leading-relaxed">
                    O sistema usará esta API para buscar oportunidades. Nosso motor interno recalculará todas as odds para garantir precisão matemática ("calculos certinhos") antes de exibir no dashboard.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* The-Odds-API (Backup) */}
          <div className={`p-5 rounded-lg border transition-all ${apiEnabled ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-950 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${apiEnabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                <div>
                  <h3 className="font-bold text-slate-200">The-Odds-API (Backup)</h3>
                  <p className="text-xs text-slate-500">Fonte secundária para esportes americanos.</p>
                </div>
              </div>
              <button
                onClick={() => setApiEnabled(!apiEnabled)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  apiEnabled 
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Power className="w-3 h-3" />
                {apiEnabled ? "CONECTADO" : "DESCONECTADO"}
              </button>
            </div>
            
            {apiEnabled && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-1">
                  <CheckCircle2 size={12} /> Chave de API Ativa
                </label>
                <input 
                  type="text" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:border-emerald-500 focus:outline-none font-mono text-sm shadow-inner"
                  placeholder="Cole sua chave da The-Odds-API aqui..."
                />
              </div>
            )}
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
          <button 
            onClick={handleSaveKeys}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20 hover:scale-105 active:scale-95"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "Salvando..." : "Salvar Conexões"}
          </button>
        </div>
      </div>
    </div>
  );
}
