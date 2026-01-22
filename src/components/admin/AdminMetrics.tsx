import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { Database, Server, Layers, Loader2 } from 'lucide-react';
import KpiCard from '../dashboard/KpiCard';

export function AdminMetrics() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/status')
      .then(setStatus)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalBudget = 7500;
  const footballUsed = status?.budget?.find((b: any) => b.sport_key === 'football')?.used || 0;
  const basketballUsed = status?.budget?.find((b: any) => b.sport_key === 'basketball')?.used || 0;

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* KPI Principal - Eventos na Fila */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard 
          title="Eventos na Fila" 
          value={Object.values(status?.queueStats || {}).reduce((a: any, b: any) => a + b, 0) as number} 
          icon={Database} 
          trend="Estável"
          color="blue" 
        />
        {/* Espaço para futuros KPIs técnicos */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card de Consumo da API */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
              <Server size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">Consumo da API</h3>
          </div>
          
          <div className="space-y-8">
            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-slate-300 font-medium">Futebol</span>
                <span className="text-slate-400 font-mono text-xs tracking-wider">{footballUsed} / {totalBudget}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.6)]" 
                  style={{ width: `${Math.min((footballUsed / totalBudget) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-slate-300 font-medium">Basquete</span>
                <span className="text-slate-400 font-mono text-xs tracking-wider">{basketballUsed} / {totalBudget}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.6)]" 
                  style={{ width: `${Math.min((basketballUsed / totalBudget) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card de Fila de Processamento */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg h-full">
           <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
               <Layers size={20} />
             </div>
             <h3 className="text-lg font-bold text-white">Fila de Processamento</h3>
           </div>

           <div className="space-y-3">
             {Object.entries(status?.queueStats || {}).map(([bucket, count]: any) => (
               <div key={bucket} className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors group">
                 <div className="flex flex-col">
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-300 transition-colors">{bucket}</span>
                   <span className="text-[10px] text-slate-600 mt-0.5">
                     {bucket === 'LIVE' ? 'Prioridade Alta' : 'Prioridade Normal'}
                   </span>
                 </div>
                 <div className="text-2xl font-bold text-white font-mono">{count}</div>
               </div>
             ))}
             {!status?.queueStats && (
               <div className="text-center py-4">
                 <p className="text-slate-500 text-sm">Nenhum item na fila.</p>
               </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
}
