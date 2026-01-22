import { useEffect, useState } from 'react';
import { DollarSign, Activity, Target, TrendingUp, ArrowRight, Database, Server, Layers } from 'lucide-react';
import KpiCard from '../components/dashboard/KpiCard';
import { apiRequest } from '../lib/apiClient';
import { Link } from 'react-router-dom';

export default function Dashboard() {
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

  return (
    <div className="space-y-8">
      {/* Cabeçalho do Dashboard */}
      <div>
        <p className="text-slate-400 text-base md:text-lg">Visão geral das operações de arbitragem em tempo real.</p>
      </div>

      {/* KPI Grid - Responsivo: 1 coluna (mobile), 2 (tablet), 4 (desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KpiCard 
          title="Lucro Estimado (Hoje)" 
          value="R$ 145,50" 
          icon={DollarSign} 
          trend="+12%" 
          color="emerald" 
        />
        <KpiCard 
          title="Oportunidades Ativas" 
          value={status?.totalOpportunities || 0} 
          icon={Target} 
          color="indigo" 
        />
        <KpiCard 
          title="Eventos na Fila" 
          value={Object.values(status?.queueStats || {}).reduce((a: any, b: any) => a + b, 0) as number} 
          icon={Database} 
          trend="Estável"
          color="blue" 
        />
        <KpiCard 
          title="ROI Médio" 
          value="2.4%" 
          icon={Activity} 
          trend="+0.5%" 
          color="amber" 
        />
      </div>

      {/* Main Content Grid - Responsivo: Stack vertical (mobile), 3 colunas (desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Recent Opportunities Table - Ocupa 2 colunas no desktop */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <h3 className="text-lg font-bold text-white">Oportunidades Recentes</h3>
            <Link to="/opportunities" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              Ver Todas <ArrowRight size={14} />
            </Link>
          </div>
          
          {/* Container com scroll horizontal para tabelas em mobile */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm text-slate-400 min-w-[600px]">
              <thead className="bg-slate-950/30 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Evento</th>
                  <th className="px-6 py-4">Casas</th>
                  <th className="px-6 py-4">Lucro</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                <tr className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-200 group-hover:text-white transition-colors whitespace-nowrap">Lakers vs Warriors</div>
                    <div className="text-xs text-slate-500">NBA • Totals</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">Bet365 / Pinnacle</td>
                  <td className="px-6 py-4 text-emerald-400 font-bold font-mono">2.5%</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-bold whitespace-nowrap">Ao Vivo</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-200 group-hover:text-white transition-colors whitespace-nowrap">Flamengo vs Vasco</div>
                    <div className="text-xs text-slate-500">Brasileirão • 1x2</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">Betano / Sportingbet</td>
                  <td className="px-6 py-4 text-emerald-400 font-bold font-mono">1.8%</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-bold whitespace-nowrap">Pré-jogo</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* API Usage & Queue Stats - Ocupa 1 coluna no desktop */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Server size={18} className="text-slate-500" /> Consumo da API
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400 font-medium">Futebol</span>
                  <span className="text-white font-mono text-xs">{footballUsed} / {totalBudget}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                    style={{ width: `${Math.min((footballUsed / totalBudget) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400 font-medium">Basquete</span>
                  <span className="text-white font-mono text-xs">{basketballUsed} / {totalBudget}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                    style={{ width: `${Math.min((basketballUsed / totalBudget) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
             <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
               <Layers size={18} className="text-slate-500" /> Fila de Processamento
             </h3>
             <div className="space-y-3">
               {Object.entries(status?.queueStats || {}).map(([bucket, count]: any) => (
                 <div key={bucket} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{bucket}</span>
                     <span className="text-xs text-slate-400">Prioridade {bucket === 'LIVE' ? 'Alta' : 'Normal'}</span>
                   </div>
                   <div className="text-xl font-bold text-white font-mono">{count}</div>
                 </div>
               ))}
               {!status?.queueStats && (
                 <div className="text-center py-4">
                   <div className="inline-block w-6 h-6 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
