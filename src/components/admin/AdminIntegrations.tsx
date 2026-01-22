import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Save, Globe, Database, Server, Loader2, Power, Shield, CheckCircle2 } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

export function AdminIntegrations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // System API States
  const [apiKey, setApiKey] = useState("");
  const [apiEnabled, setApiEnabled] = useState(false);
  const [secApiKey, setSecApiKey] = useState("");
  const [secApiEnabled, setSecApiEnabled] = useState(false);

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
          {/* The-Odds-API */}
          <div className={`p-5 rounded-lg border transition-all ${apiEnabled ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-950 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${apiEnabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                <div>
                  <h3 className="font-bold text-slate-200">The-Odds-API (Principal)</h3>
                  <p className="text-xs text-slate-500">Fornece odds da NBA, NFL, Premier League, etc.</p>
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

          {/* API-Football */}
          <div className={`p-5 rounded-lg border transition-all ${secApiEnabled ? 'bg-blue-950/20 border-blue-500/30' : 'bg-slate-950 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${secApiEnabled ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-700'}`}></div>
                <div>
                  <h3 className="font-bold text-slate-200">API-Football (Secundária)</h3>
                  <p className="text-xs text-slate-500">Especialista em Futebol (Brasileirão, Estaduais).</p>
                </div>
              </div>
              <button
                onClick={() => setSecApiEnabled(!secApiEnabled)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  secApiEnabled 
                    ? 'bg-blue-500 text-white hover:bg-blue-400' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Power className="w-3 h-3" />
                {secApiEnabled ? "CONECTADO" : "DESCONECTADO"}
              </button>
            </div>

            {secApiEnabled && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-xs font-bold text-blue-500 uppercase flex items-center gap-1">
                  <CheckCircle2 size={12} /> Chave de API Ativa
                </label>
                <input 
                  type="text" 
                  value={secApiKey}
                  onChange={(e) => setSecApiKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:border-blue-500 focus:outline-none font-mono text-sm shadow-inner"
                  placeholder="Cole sua chave da API-Football aqui..."
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
