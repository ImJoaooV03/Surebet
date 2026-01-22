import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Save, Globe, Database, Server, Loader2, Power, Shield } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

export function AdminIntegrations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // System API States (Stored in Admin's user_settings for the Worker)
  const [apiKey, setApiKey] = useState("");
  const [apiEnabled, setApiEnabled] = useState(false);
  const [secApiKey, setSecApiKey] = useState("");
  const [secApiEnabled, setSecApiEnabled] = useState(false);
  const [terApiKey, setTerApiKey] = useState("");
  const [terApiEnabled, setTerApiEnabled] = useState(false);
  const [quatApiKey, setQuatApiKey] = useState("");
  const [quatApiEnabled, setQuatApiEnabled] = useState(false);

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
        setTerApiKey(data.tertiary_api_key || "");
        setTerApiEnabled(data.tertiary_api_enabled || false);
        setQuatApiKey(data.quaternary_api_key || "");
        setQuatApiEnabled(data.quaternary_api_enabled || false);
      }
    } catch (err) {
      console.error(err);
      toast("Erro ao carregar chaves do sistema.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKeys = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Atualiza APENAS as chaves de API e flags de ativação
      const updates = {
        external_api_key: apiKey,
        api_enabled: apiEnabled,
        secondary_api_key: secApiKey,
        secondary_api_enabled: secApiEnabled,
        tertiary_api_key: terApiKey,
        tertiary_api_enabled: terApiEnabled,
        quaternary_api_key: quatApiKey,
        quaternary_api_enabled: quatApiEnabled,
      };

      const { error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast("Configurações de API do sistema atualizadas!", "success");
      
    } catch (err: any) {
      console.error(err);
      toast("Erro ao salvar chaves: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Shield className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Provedores de Dados Oficiais</h2>
            <p className="text-sm text-slate-400">Configure as chaves que alimentam o sistema global de Surebets.</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* The-Odds-API */}
          <div className="bg-slate-950 p-5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-slate-200">The-Odds-API (Principal)</h3>
              </div>
              <button
                onClick={() => setApiEnabled(!apiEnabled)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  apiEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}
              >
                <Power className="w-3 h-3" />
                {apiEnabled ? "ATIVO" : "PAUSADO"}
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Chave de API</label>
              <input 
                type="text" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none font-mono text-sm"
                placeholder="Cole sua chave aqui..."
              />
              <p className="text-xs text-slate-500">Cobre: NBA, NFL, Premier League, La Liga, etc.</p>
            </div>
          </div>

          {/* API-Football */}
          <div className="bg-slate-950 p-5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-slate-200">API-Football (Secundária)</h3>
              </div>
              <button
                onClick={() => setSecApiEnabled(!secApiEnabled)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  secApiEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}
              >
                <Power className="w-3 h-3" />
                {secApiEnabled ? "ATIVO" : "PAUSADO"}
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Chave de API (Oficial)</label>
              <input 
                type="text" 
                value={secApiKey}
                onChange={(e) => setSecApiKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-blue-500 focus:outline-none font-mono text-sm"
                placeholder="Chave do dashboard.api-football.com"
              />
              <p className="text-xs text-slate-500">Cobre: Brasileirão, Ligas Menores, Estatísticas.</p>
            </div>
          </div>

          {/* BetsAPI */}
          <div className="bg-slate-950 p-5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-500" />
                <h3 className="font-bold text-slate-200">BetsAPI (Terciária)</h3>
              </div>
              <button
                onClick={() => setTerApiEnabled(!terApiEnabled)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  terApiEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}
              >
                <Power className="w-3 h-3" />
                {terApiEnabled ? "ATIVO" : "PAUSADO"}
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Token</label>
              <input 
                type="text" 
                value={terApiKey}
                onChange={(e) => setTerApiKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-purple-500 focus:outline-none font-mono text-sm"
                placeholder="Token da BetsAPI"
              />
              <p className="text-xs text-slate-500">Cobre: Jogos Ao Vivo, eSports, Tênis.</p>
            </div>
          </div>

          {/* Sportmonks */}
          <div className="bg-slate-950 p-5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-slate-200">Sportmonks (Quaternária)</h3>
              </div>
              <button
                onClick={() => setQuatApiEnabled(!quatApiEnabled)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  quatApiEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}
              >
                <Power className="w-3 h-3" />
                {quatApiEnabled ? "ATIVO" : "PAUSADO"}
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">API Token</label>
              <input 
                type="text" 
                value={quatApiKey}
                onChange={(e) => setQuatApiKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-orange-500 focus:outline-none font-mono text-sm"
                placeholder="Token da Sportmonks"
              />
              <p className="text-xs text-slate-500">Cobre: Dados profissionais, Ligas Europeias.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSaveKeys}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "Salvando..." : "Atualizar Conexões"}
          </button>
        </div>
      </div>
    </div>
  );
}
