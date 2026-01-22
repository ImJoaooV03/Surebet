import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { formatCurrency, formatPercent } from "../lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Search, Filter, CheckCircle2, XCircle, Clock, 
  ArrowUpDown, Calendar, ChevronLeft, ChevronRight, Loader2, History as HistoryIcon
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Database } from "../types/supabase";

type Bet = Database['public']['Tables']['bets']['Row'];

export default function History() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'settled'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Bet; direction: 'asc' | 'desc' }>({ key: 'event_date', direction: 'desc' });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .order('event_date', { ascending: false });
    
    if (error) {
      toast("Erro ao carregar histórico", "error");
    } else if (data) {
      setBets(data);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (id: string, newStatus: 'won' | 'lost', stake: number, odds: number) => {
    try {
      const returnValue = newStatus === 'won' ? stake * odds : 0;
      
      const { error } = await supabase
        .from('bets')
        .update({ 
          status: newStatus, 
          return_value: returnValue 
        })
        .eq('id', id);

      if (error) throw error;

      // Optimistic update
      setBets(prev => prev.map(b => b.id === id ? { ...b, status: newStatus, return_value: returnValue } : b));
      toast(`Aposta marcada como ${newStatus === 'won' ? 'Green' : 'Red'}!`, newStatus === 'won' ? 'success' : 'info');
    } catch (err) {
      toast("Erro ao atualizar status", "error");
    }
  };

  const handleSort = (key: keyof Bet) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // --- Filtering & Sorting ---
  const filteredData = bets
    .filter(bet => {
      const matchesSearch = 
        bet.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bet.market.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bet.selection.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' 
        ? true 
        : statusFilter === 'pending' ? bet.status === 'pending' : bet.status !== 'pending';

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === bValue) return 0;
      // Handle nulls
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      const comparison = aValue > bValue ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <HistoryIcon className="text-emerald-500" /> Histórico de Apostas
          </h1>
          <p className="text-slate-400 text-sm">Registro completo de todas as suas operações.</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar evento, mercado..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'pending', label: 'Pendentes' },
              { id: 'settled', label: 'Finalizadas' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setStatusFilter(opt.id as any)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                  statusFilter === opt.id 
                    ? 'bg-slate-800 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-950/80 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-emerald-400 transition-colors" onClick={() => handleSort('event_date')}>
                  <div className="flex items-center gap-1">Data <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4">Evento / Mercado</th>
                <th className="px-6 py-4 text-center">Odds</th>
                <th className="px-6 py-4 text-right cursor-pointer hover:text-emerald-400" onClick={() => handleSort('stake')}>
                  <div className="flex items-center justify-end gap-1">Stake <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Lucro/Prejuízo</th>
                <th className="px-6 py-4 text-center">Ação Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={7} className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" /></td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-slate-500">Nenhuma aposta encontrada com estes filtros.</td></tr>
              ) : (
                paginatedData.map((bet) => {
                  let profit = 0;
                  if (bet.status === 'won') profit = Number(bet.return_value) - Number(bet.stake);
                  if (bet.status === 'lost') profit = -Number(bet.stake);
                  if (bet.status === 'cashout') profit = Number(bet.return_value) - Number(bet.stake);

                  return (
                    <tr key={bet.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(bet.event_date), "dd/MM HH:mm")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-200">{bet.event_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{bet.market} • <span className="text-emerald-400 font-medium">{bet.selection}</span></div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-amber-400 bg-amber-500/5 rounded mx-2">
                        {Number(bet.odds).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-300 font-medium">
                        {formatCurrency(bet.stake)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={bet.status} />
                      </td>
                      <td className={`px-6 py-4 text-right font-mono font-bold ${profit > 0 ? 'text-emerald-400' : profit < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                        {bet.status === 'pending' ? '-' : (profit > 0 ? '+' : '') + formatCurrency(profit)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {bet.status === 'pending' ? (
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleStatusUpdate(bet.id, 'won', bet.stake, bet.odds)}
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg transition-colors border border-emerald-500/20"
                              title="Marcar como Green"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(bet.id, 'lost', bet.stake, bet.odds)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20"
                              title="Marcar como Red"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 italic">Feita</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-800 flex justify-between items-center bg-slate-950/50">
            <span className="text-xs text-slate-500">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
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
