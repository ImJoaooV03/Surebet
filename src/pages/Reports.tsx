import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, Calendar, 
  PieChart, DollarSign, Target, Filter 
} from "lucide-react";
import KpiCard from "../components/dashboard/KpiCard";
import { formatCurrency, formatPercent } from "../lib/utils";
import { format, subDays, isAfter, startOfDay, endOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { Database } from "../types/supabase";

type Bet = Database['public']['Tables']['bets']['Row'];

export default function Reports() {
  const { user } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    if (user) fetchBets();
  }, [user]);

  const fetchBets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bets')
      .select('*')
      .order('event_date', { ascending: true });
    
    if (data) setBets(data);
    setLoading(false);
  };

  // --- Analytics Logic ---
  const filteredBets = useMemo(() => {
    if (dateRange === 'all') return bets;
    
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const cutoff = subDays(new Date(), days);
    
    return bets.filter(b => isAfter(new Date(b.event_date), cutoff));
  }, [bets, dateRange]);

  const metrics = useMemo(() => {
    const settled = filteredBets.filter(b => b.status !== 'pending');
    const won = settled.filter(b => b.status === 'won');
    
    const totalInvested = filteredBets.reduce((acc, b) => acc + Number(b.stake), 0);
    
    const netProfit = filteredBets.reduce((acc, b) => {
      if (b.status === 'won' || b.status === 'cashout') return acc + (Number(b.return_value) - Number(b.stake));
      if (b.status === 'lost') return acc - Number(b.stake);
      return acc;
    }, 0);

    const roi = totalInvested > 0 ? (netProfit / totalInvested) : 0;
    const winRate = settled.length > 0 ? (won.length / settled.length) : 0;
    const avgProfit = settled.length > 0 ? (netProfit / settled.length) : 0;

    // Daily Volume Chart Data
    const volumeMap = filteredBets.reduce((acc: any, bet) => {
      const day = format(new Date(bet.event_date), 'dd/MM');
      if (!acc[day]) acc[day] = { date: day, amount: 0, count: 0 };
      acc[day].amount += Number(bet.stake);
      acc[day].count += 1;
      return acc;
    }, {});
    const volumeData = Object.values(volumeMap);

    // Bankroll Evolution Chart Data
    let currentBankroll = 0; // Starts relative to 0 for profit tracking
    const evolutionData = filteredBets.map(bet => {
      let profit = 0;
      if (bet.status === 'won' || bet.status === 'cashout') profit = Number(bet.return_value) - Number(bet.stake);
      if (bet.status === 'lost') profit = -Number(bet.stake);
      
      currentBankroll += profit;
      
      return {
        date: format(new Date(bet.event_date), 'dd/MM'),
        profit: currentBankroll,
        stake: bet.stake
      };
    });

    return { totalInvested, netProfit, roi, winRate, avgProfit, volumeData, evolutionData, totalBets: filteredBets.length };
  }, [filteredBets]);

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-emerald-500" /> Relatórios de Performance
          </h1>
          <p className="text-slate-400 text-sm">Análise detalhada dos seus resultados.</p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
          {[
            { id: '7d', label: '7 Dias' },
            { id: '30d', label: '30 Dias' },
            { id: '90d', label: '3 Meses' },
            { id: 'all', label: 'Tudo' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setDateRange(opt.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                dateRange === opt.id 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Lucro Líquido" 
          value={formatCurrency(metrics.netProfit)} 
          icon={metrics.netProfit >= 0 ? TrendingUp : TrendingDown} 
          color={metrics.netProfit >= 0 ? "emerald" : "rose"}
          trend={formatPercent(metrics.roi)}
          description="Retorno sobre Investimento (ROI)"
        />
        <KpiCard 
          title="Win Rate" 
          value={formatPercent(metrics.winRate)} 
          icon={Target} 
          color="blue"
          description="Taxa de assertividade"
        />
        <KpiCard 
          title="Volume Apostado" 
          value={formatCurrency(metrics.totalInvested)} 
          icon={DollarSign} 
          color="indigo"
          description={`${metrics.totalBets} apostas realizadas`}
        />
        <KpiCard 
          title="Lucro Médio / Aposta" 
          value={formatCurrency(metrics.avgProfit)} 
          icon={PieChart} 
          color="amber"
          description="Média por operação finalizada"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Bankroll Evolution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" /> Evolução da Banca
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.evolutionData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  tick={{fontSize: 12}} 
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{fontSize: 12}} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#10b981' }}
                  formatter={(value: number) => [formatCurrency(value), "Lucro Acumulado"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" /> Volume Diário
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  tick={{fontSize: 12}} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{fontSize: 12}} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip 
                  cursor={{fill: '#1e293b', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(value: number) => [formatCurrency(value), "Volume Apostado"]}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
