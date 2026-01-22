import { useState, useEffect } from 'react';
import { apiRequest } from '../lib/apiClient';
import { Save, Play, Copy, Check, Loader2 } from 'lucide-react';

export default function Admin() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    apiRequest('/status').then(setStatus);
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res: any = await apiRequest('/admin/save', {
        method: 'POST',
        body: JSON.stringify({ apisportsKey: apiKey })
      });
      alert('Configuração Salva!');
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res: any = await apiRequest('/admin/test');
      alert(res.ok ? 'Conexão OK!' : 'Falha na conexão.');
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setTesting(false);
    }
  };

  const getCronUrl = (endpoint: string) => {
    if (!status?.cronToken) return 'Salve a chave primeiro...';
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/cron/${endpoint}?token=${status.cronToken}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado!');
  };

  return (
    <div className="max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold text-white">Administração & Cron</h1>

      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
        <h2 className="text-lg font-semibold text-white mb-4">1. Configuração API-SPORTS</h2>
        <div className="flex gap-4 mb-4">
          <input 
            type="text" 
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={status?.hasKey ? "Chave configurada (oculta)" : "Cole sua API Key aqui"}
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-4 py-2 text-white"
          />
          <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded font-medium flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />} Salvar
          </button>
        </div>
        <button 
          onClick={handleTest}
          disabled={testing || !status?.hasKey}
          className="text-sm text-blue-400 hover:text-blue-300 underline"
        >
          {testing ? 'Testando...' : 'Testar conexão com API'}
        </button>
      </div>

      {status?.cronToken && (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-lg font-semibold text-white mb-4">2. Configurar Cron Externo</h2>
          <p className="text-slate-400 text-sm mb-6">
            Configure estes endpoints no <strong>UptimeRobot</strong> ou <strong>cron-job.org</strong>.
          </p>

          <div className="space-y-6">
            <CronRow 
              label="TICK (A cada 1 min)" 
              desc="Busca odds e calcula surebets" 
              url={getCronUrl('tick')} 
              onCopy={() => copyToClipboard(getCronUrl('tick'))}
              color="text-emerald-400"
            />
            <CronRow 
              label="FIXTURES (A cada 30 min)" 
              desc="Busca novos jogos e atualiza fila" 
              url={getCronUrl('fixtures')} 
              onCopy={() => copyToClipboard(getCronUrl('fixtures'))}
              color="text-blue-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CronRow({ label, desc, url, onCopy, color }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className={`text-sm font-bold ${color}`}>{label}</label>
        <span className="text-xs text-slate-500">{desc}</span>
      </div>
      <div className="flex gap-2">
        <code className="flex-1 bg-slate-950 p-3 rounded text-xs font-mono text-slate-300 break-all border border-slate-800">
          {url}
        </code>
        <button onClick={onCopy} className="p-3 bg-slate-800 rounded hover:bg-slate-700 border border-slate-700">
          <Copy size={16} className="text-slate-400" />
        </button>
        <a href={url} target="_blank" rel="noreferrer" className="p-3 bg-slate-800 rounded hover:bg-slate-700 border border-slate-700">
          <Play size={16} className="text-slate-400" />
        </a>
      </div>
    </div>
  );
}
