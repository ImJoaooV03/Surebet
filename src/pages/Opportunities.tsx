import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/apiClient';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

export default function Opportunities() {
  const [opps, setOpps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bucket, setBucket] = useState('LIVE');

  const fetchOpps = () => {
    setLoading(true);
    apiRequest(`/opportunities?bucket=${bucket}&limit=50`)
      .then((data: any) => setOpps(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOpps();
  }, [bucket]);

  const tabs = [
    { id: 'LIVE', label: 'AO VIVO 🔥' },
    { id: 'PRE_HOT', label: '0h - 2h' },
    { id: 'PRE_MID', label: '2h - 12h' },
    { id: 'PRE_LONG', label: '12h - 24h' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Oportunidades</h1>
        <button onClick={fetchOpps} className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-300">
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-800 pb-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setBucket(tab.id)}
            className={`px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors ${
              bucket === tab.id 
                ? 'text-emerald-400 border-b-2 border-emerald-500' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /></div>
      ) : opps.length > 0 ? (
        <div className="grid gap-4">
          {opps.map((arb) => (
            <div key={arb.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-emerald-500/30 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {arb.events?.home_name} <span className="text-slate-500 text-sm">vs</span> {arb.events?.away_name}
                  </h3>
                  <p className="text-xs text-slate-500 uppercase font-bold mt-1">
                    {arb.sport_key} • {arb.market_key} {arb.line_value ? `(${arb.line_value})` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-emerald-400">{(arb.roi * 100).toFixed(2)}%</span>
                  <p className="text-[10px] text-slate-500 uppercase">Lucro</p>
                </div>
              </div>
              
              <div className="bg-slate-950 rounded p-3 grid gap-2">
                {arb.legs_json.map((leg: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div className="flex gap-2 items-center">
                      <span className="w-1 h-4 bg-slate-700 rounded-full"></span>
                      <span className="text-slate-300 font-medium">{leg.outcome}</span>
                      <span className="text-xs text-slate-500">({leg.bookmaker})</span>
                    </div>
                    <span className="font-mono font-bold text-amber-400">{leg.odd.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-2">
          <AlertTriangle className="w-8 h-8 opacity-50" />
          <p>Nenhuma oportunidade neste bucket.</p>
        </div>
      )}
    </div>
  );
}
