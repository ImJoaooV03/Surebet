import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { formatCurrency, formatPercent } from "../lib/utils";
import { format } from "date-fns";
import { 
  Wallet, TrendingUp, TrendingDown, Plus, 
  Search, Edit, Trash2, X, Activity, Target, PieChart, Loader2 
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import KpiCard from "../components/dashboard/KpiCard";
import { EmptyState } from "../components/ui/EmptyState";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Database } from "../types/supabase";

// --- Types ---
type Bet = Database['public']['Tables']['bets']['Row'];

export default function Bankroll() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'settled'>('all');
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    event_name: "",
    market: "",
    selection: "",
    odds: "",
    stake: "",
    status: "pending" as Bet['status'],
    return_value: ""
  });

  // --- Data Fetching ---
  useEffect(() => {
    if (user) fetchBets();
  }, [user]);

  const fetchBets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setBets(data || []);
    } catch (err) {
      console.error(err);
      toast("Erro ao carregar apostas.", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Computed Metrics ---
  const metrics = useMemo(() => {
    const settledBets = bets.filter(b => b.status !== 'pending');
    const wonBets = bets.filter(b => b.status === 'won');
    
    const totalStake = bets.reduce((acc, b) => acc + Number(b.stake), 0);
    
    // Profit calculation considering losses
    const totalProfit = bets.reduce((acc, b) => {
      if (b.status === 'won') return acc + (Number(b.return_value) - Number(b.stake));
      if (b.status === 'cashout') return acc + (Number(b.return_value) - Number(b.stake));
      if (b.status === 'lost') return acc - Number(b.stake);
      return acc;
    }, 0);

    const roi = totalStake > 0 ? (totalProfit / totalStake) : 0;
    const winRate = settledBets.length > 0 ? (wonBets.length / settledBets.length) : 0;

    // Chart Data (Accumulated Profit over time)
    const chartData = [...bets]
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .reduce((acc: any[], bet) => {
        const prevProfit = acc.length > 0 ? acc[acc.length - 1].profit : 0;
        let betProfit = 0;
        
        if (bet.status === 'won') betProfit = Number(bet.return_value) - Number(bet.stake);
        else if (bet.status === 'cashout') betProfit = Number(bet.return_value) - Number(bet.stake);
        else if (bet.status === 'lost') betProfit = -Number(bet.stake);

        acc.push({
          date: format(new Date(bet.event_date), 'dd/MM'),
          profit: prevProfit + betProfit,
          dailyProfit: betProfit
        });
        return acc;
      }, []);

    // Add initial point if empty
    if (chartData.length === 0) {
      chartData.push({ date: 'Início', profit: 0, dailyProfit: 0 });
    }

    return { totalBets: bets.length, totalProfit, roi, winRate, chartData, totalStake };
  }, [bets]);

  // --- Handlers ---
  const handleOpenModal = (bet?: Bet) => {
    if (bet) {
      setEditingBet(bet);
      setFormData({
        event_name: bet.event_name,
        market: bet.market,
        selection: bet.selection,
        odds: bet.odds.toString(),
        stake: bet.stake.toString(),
        status: bet.status,
        return_value: bet.return_value?.toString() || ""
      });
    } else {
      setEditingBet(null);
      setFormData({
        event_name: "", market: "", selection: "", odds: "", stake: "", status: "pending", return_value: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      const payload = {
        user_id: user.id,
        event_name: formData.event_name,
        market: formData.market,
        selection: formData.selection,
        odds: parseFloat(formData.odds),
        stake: parseFloat(formData.stake),
        status: formData.status,
        return_value: (formData.status === 'won' || formData.status === 'cashout')
          ? parseFloat(formData.return_value || (parseFloat(formData.stake) * parseFloat(formData.odds)).toString()) 
          : 0,
        event_date: editingBet ? editingBet.event_date : new Date().toISOString()
      };

      if (editingBet) {
        const { error } = await supabase.from('bets').update(payload).eq('id', editingBet.id);
        if (error) throw error;
        toast("Aposta atualizada!", "success");
      } else {
        const { error } = await supabase.from('bets').insert(payload);
        if (error) throw error;
        toast("Aposta registrada!", "success");
      }
      
      fetchBets();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast("Erro ao salvar aposta.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta aposta?")) return;
    try {
      const { error } = await supabase.from('bets').delete().eq('id', id);
      if (error) throw error;
      toast("Aposta removida.", "success");
      fetchBets();
    } catch (err) {
      toast("Erro ao excluir.", "error");
    }
  };

  // --- Filtering ---
  const filteredBets = bets.filter(bet => {
    const matchesSearch = bet.event_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          bet.market.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' 
      ? true 
      : filterStatus === 'pending' ? bet.status === 'pending' : bet.status !== 'pending';
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="text-emerald-500" /> Gestão de Banca
          </h1>
          <p className="text-slate-400 text-sm">Acompanhe seu desempenho e histórico de apostas.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
        >
          <Plus size={18} /> Nova Aposta
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Lucro Líquido" 
          value={formatCurrency(metrics.totalProfit)} 
          icon={metrics.totalProfit >= 0 ? TrendingUp : TrendingDown} 
          color={metrics.totalProfit >= 0 ? "emerald" : "rose"}
          trend={formatPercent(metrics.roi)}
          trendUp={metrics.totalProfit >= 0}
        />
        <KpiCard 
          title="Volume Apostado" 
          value={formatCurrency(metrics.totalStake)} 
          icon={Activity} 
          color="indigo"
        />
        <KpiCard 
          title="Win Rate" 
          value={formatPercent(metrics.winRate)} 
          icon={Target} 
          color="blue"
          description={`${bets.filter(b => b.status === 'won').length} Greens / ${bets.length} Total`}
        />
        <KpiCard 
          title="Total de Apostas" 
          value={metrics.totalBets} 
          icon={PieChart} 
          color="amber"
        />
      </div>

      {/* Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-6">Evolução da Banca</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.chartData}>
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
              />
              <YAxis 
                stroke="#64748b" 
                tick={{fontSize: 12}} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$${value}`}
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

      {/* Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-950/30">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar evento..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-emerald-500 outline-none"
            />
          </div>
          
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterStatus === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
            >
              Todas
            </button>
            <button 
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterStatus === 'pending' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
            >
              Pendentes
            </button>
            <button 
              onClick={() => setFilterStatus('settled')}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterStatus === 'settled' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
            >
              Finalizadas
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Evento / Mercado</th>
                <th className="px-6 py-4 text-center">Odds</th>
                <th className="px-6 py-4 text-right">Stake</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Retorno</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" /></td></tr>
              ) : filteredBets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <div className="py-12">
                      <EmptyState 
                        icon={Wallet} 
                        title="Nenhuma aposta encontrada" 
                        description={searchTerm ? "Tente ajustar seus filtros de busca." : "Comece a registrar suas apostas para ver as métricas."}
                        actionLabel={!searchTerm ? "Registrar Primeira Aposta" : undefined}
                        onAction={!searchTerm ? () => handleOpenModal() : undefined}
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBets.map((bet) => {
                  let profit = 0;
                  if (bet.status === 'won') profit = Number(bet.return_value) - Number(bet.stake);
                  if (bet.status === 'lost') profit = -Number(bet.stake);
                  if (bet.status === 'cashout') profit = Number(bet.return_value) - Number(bet.stake);

                  return (
                    <tr key={bet.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        {format(new Date(bet.event_date), "dd/MM/yy HH:mm")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-200">{bet.event_name}</div>
                        <div className="text-xs text-slate-500">{bet.market} • <span className="text-emerald-400">{bet.selection}</span></div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-amber-400">
                        {Number(bet.odds).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-300">
                        {formatCurrency(bet.stake)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={bet.status} />
                      </td>
                      <td className={`px-6 py-4 text-right font-mono font-bold ${profit > 0 ? 'text-emerald-400' : profit < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                        {profit > 0 ? '+' : ''}{formatCurrency(profit)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleOpenModal(bet)} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(bet.id)} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {editingBet ? 'Editar Aposta' : 'Nova Aposta'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400">Evento</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Flamengo vs Vasco"
                  value={formData.event_name}
                  onChange={e => setFormData({...formData, event_name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400">Mercado</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Over 2.5"
                    value={formData.market}
                    onChange={e => setFormData({...formData, market: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400">Seleção</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Over"
                    value={formData.selection}
                    onChange={e => setFormData({...formData, selection: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400">Odds</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={formData.odds}
                    onChange={e => setFormData({...formData, odds: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400">Stake (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={formData.stake}
                    onChange={e => setFormData({...formData, stake: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400">Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="pending">Pendente</option>
                    <option value="won">Green (Ganhou)</option>
                    <option value="lost">Red (Perdeu)</option>
                    <option value="void">Anulada</option>
                    <option value="cashout">Cashout</option>
                  </select>
                </div>

                {(formData.status === 'won' || formData.status === 'cashout') && (
                  <div className="space-y-2 animate-in fade-in">
                    <label className="text-sm font-bold text-slate-400">Retorno Total (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.return_value}
                      onChange={e => setFormData({...formData, return_value: e.target.value})}
                      placeholder={(parseFloat(formData.stake || '0') * parseFloat(formData.odds || '0')).toFixed(2)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-emerald-400 font-bold focus:border-emerald-500 outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: "bg-slate-800 text-slate-400 border-slate-700",
    won: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    lost: "bg-red-500/10 text-red-400 border-red-500/20",
    void: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    cashout: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  
  const labels = {
    pending: "Pendente",
    won: "Green",
    lost: "Red",
    void: "Anulada",
    cashout: "Cashout"
  };

  return (
    <Badge className={`border ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </Badge>
  );
}
