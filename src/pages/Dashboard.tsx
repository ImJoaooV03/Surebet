import { useEffect, useState } from 'react';
import { DollarSign, Activity, Target, ArrowRight } from 'lucide-react';
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cabeçalho do Dashboard */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Visão Geral</h1>
        <p className="text-slate-400 text-base">Acompanhe seus resultados e as melhores oportunidades do mercado.</p>
      </div>

      {/* KPI Grid - Reorganizado para 3 colunas para preencher melhor o espaço */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
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
          title="ROI Médio" 
          value="2.4%" 
          icon={Activity} 
          trend="+0.5%" 
          color="amber" 
        />
      </div>

      {/* Main Content - Tabela expandida para largura total */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-lg font-bold text-white">Oportunidades Recentes</h3>
          <Link to="/opportunities" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
            Ver Todas <ArrowRight size={14} />
          </Link>
        </div>
        
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
    </div>
  );
}
