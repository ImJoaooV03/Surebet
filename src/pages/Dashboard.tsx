import { Activity, DollarSign, Target, AlertTriangle, Loader2, Globe, TestTube } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import { SurebetCard } from "../components/surebet/SurebetCard";
import { useSurebets } from "../hooks/useSurebets";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

function StatCard({ title, value, subtext, icon: Icon, color }: any) {
  return (
    <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl flex items-start justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-100">{value}</h3>
        {subtext && <p className={`text-xs mt-1 ${color}`}>{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg bg-slate-900 border border-slate-800 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [apiMode, setApiMode] = useState<'real' | 'simulated'>('simulated');
  
  // Use the robust hook for Dashboard too
  const { data: recentArbs, loading } = useSurebets({
    limit: 4,
    minRoi: 0,
    autoRefresh: true
  });

  // Check API Mode
  useEffect(() => {
    if (!user) return;
    supabase.from('user_settings').select('external_api_key').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data?.external_api_key) setApiMode('real');
      });
  }, [user]);

  // Calculate Stats on the fly based on validated data
  const activeCount = recentArbs.length;
  const avgRoiVal = activeCount > 0 
    ? recentArbs.reduce((acc, curr) => acc + curr.roi, 0) / activeCount 
    : 0;
  const potProfit = recentArbs.reduce((acc, curr) => acc + (1000 * curr.roi), 0);

  if (loading && recentArbs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Visão Geral</h1>
        <p className="text-slate-400">Monitoramento em tempo real de oportunidades validadas.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Surebets Ativas" 
          value={activeCount} 
          subtext="Validadas e Ativas"
          color="text-emerald-400"
          icon={Activity}
        />
        <StatCard 
          title="ROI Médio" 
          value={(avgRoiVal * 100).toFixed(2) + "%"} 
          subtext="Baseado no feed atual"
          color="text-blue-400"
          icon={Target}
        />
        <StatCard 
          title="Lucro Potencial (Hoje)" 
          value={formatCurrency(potProfit)} 
          subtext="Baseado em stake de R$ 1.000"
          color="text-emerald-400"
          icon={DollarSign}
        />
        <StatCard 
          title="Status da API" 
          value={apiMode === 'real' ? "Modo Real" : "Simulação"} 
          subtext={apiMode === 'real' ? "The-Odds-API Conectada" : "Dados Gerados (Mock)"}
          color={apiMode === 'real' ? "text-purple-400" : "text-amber-400"}
          icon={apiMode === 'real' ? Globe : TestTube}
        />
      </div>

      {/* Recent Opportunities */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-200">Oportunidades Recentes</h2>
          <button className="text-sm text-emerald-400 hover:text-emerald-300 font-medium">Ver todas</button>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {recentArbs.length > 0 ? (
            recentArbs.map(arb => (
              <SurebetCard key={arb.id} surebet={arb} bankroll={1000} />
            ))
          ) : (
            <div className="col-span-full py-10 text-center bg-slate-950/50 rounded-xl border border-slate-800 border-dashed">
              <p className="text-slate-500">Nenhuma oportunidade ativa no momento.</p>
              <p className="text-xs text-slate-600 mt-1">O sistema está escaneando novos jogos...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
