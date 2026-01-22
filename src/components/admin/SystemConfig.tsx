import { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { Save, Info, Copy, Play, AlertTriangle, Radio, Zap, Activity } from 'lucide-react';

export function SystemConfig() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest('/status').then(setStatus);
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiRequest('/admin/save', {
        method: 'POST',
        body: JSON.stringify({ apisportsKey: apiKey })
      });
      alert('Chave Mestra Salva! Agora configure os robôs abaixo.');
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getCronUrl = (endpoint: string) => {
    if (!status?.cronToken) return '⚠️ Salve a Chave Mestra acima primeiro...';
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/cron/${endpoint}?token=${status.cronToken}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copiado!');
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Coluna da Esquerda: Explicação */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/30 p-6 rounded-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Info className="text-indigo-400" /> Como funciona?
          </h3>
          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <p>
              Para o sistema rodar 24h, precisamos de um <strong>despertador</strong> externo.
            </p>
            <div className="flex flex-col gap-3 my-4">
              <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <div className="p-2 bg-emerald-500/20 rounded text-emerald-400"><Radio size={18} /></div>
                <div>
                  <strong className="text-white block">1. Combustível</strong>
                  <span className="text-xs">Chaves de API (Menu Conexões)</span>
                </div>
              </div>
              <div className="flex justify-center text-slate-600"><Zap size={16} /></div>
              <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <div className="p-2 bg-blue-500/20 rounded text-blue-400"><Activity size={18} /></div>
                <div>
                  <strong className="text-white block">2. O Motor</strong>
                  <span className="text-xs">Links de Ativação (Ao lado)</span>
                </div>
              </div>
            </div>
            <p>
              Configure os links ao lado em um site gratuito (ex: cron-job.org).
            </p>
          </div>
        </div>
      </div>

      {/* Coluna da Direita: Configuração */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Passo 1: Chave Mestra */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 font-bold">1</div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Chave Mestra do Sistema</h2>
              <p className="text-sm text-slate-400">Necessária para gerar os links seguros dos robôs.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <input 
              type="text" 
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={status?.hasKey ? "✅ Chave Mestra Configurada" : "Cole sua API Key da API-Sports aqui"}
              className={`flex-1 bg-slate-950 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all ${status?.hasKey ? 'border-emerald-500/30 text-emerald-400' : 'border-slate-700'}`}
            />
            <button 
              onClick={handleSave}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-900/20 whitespace-nowrap"
            >
              {loading ? <Activity className="animate-spin" /> : <Save size={18} />} 
              {status?.hasKey ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </div>

        {/* Passo 2: Robôs */}
        {status?.cronToken ? (
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Links de Ativação Automática</h2>
                <p className="text-sm text-slate-400">Copie estes links e configure no <strong>cron-job.org</strong>.</p>
              </div>
            </div>

            <div className="space-y-6">
              <CronRow 
                label="ROBÔ DE OPORTUNIDADES (TICK)" 
                desc="Busca odds e calcula lucros."
                freq="1 min"
                url={getCronUrl('tick')} 
                onCopy={() => copyToClipboard(getCronUrl('tick'))}
                color="text-emerald-400"
                icon={<Zap size={18} />}
              />
              <CronRow 
                label="ROBÔ DE AGENDA (FIXTURES)" 
                desc="Busca novos jogos."
                freq="30 min"
                url={getCronUrl('fixtures')} 
                onCopy={() => copyToClipboard(getCronUrl('fixtures'))}
                color="text-blue-400"
                icon={<Save size={18} />}
              />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
            <AlertTriangle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Salve a Chave Mestra acima para gerar os links.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CronRow({ label, desc, freq, url, onCopy, color, icon }: any) {
  return (
    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-slate-900 ${color}`}>{icon}</div>
          <div>
            <label className={`text-sm font-bold ${color} block`}>{label}</label>
            <span className="text-xs text-slate-500">{desc}</span>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400 whitespace-nowrap">
          ⏰ {freq}
        </div>
      </div>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input type="text" readOnly value={url} className="w-full bg-slate-900 p-3 rounded-lg text-xs font-mono text-slate-300 border border-slate-800 focus:outline-none" />
        </div>
        <button onClick={onCopy} className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs transition-colors shadow-lg shadow-indigo-900/20" title="Copiar">
          <Copy size={14} />
        </button>
        <a href={url} target="_blank" rel="noreferrer" className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center justify-center transition-colors">
          <Play size={14} />
        </a>
      </div>
    </div>
  );
}
