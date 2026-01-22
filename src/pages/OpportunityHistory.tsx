import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { formatPercent } from "../lib/utils";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Search, Filter, Calendar, ArrowUpDown, 
  Database, Loader2, RefreshCw, Eye, Archive
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { SurebetOpportunity } from "../types";

export default function OpportunityHistory() {
  const [opportunities, setOpportunities] = useState<SurebetOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [sortConfig, setSortConfig] = useState<{ key: keyof SurebetOpportunity; direction: 'asc' | 'desc' }>({ key: 'detectedAt', direction: 'desc' });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchOpportunities();
  }, [dateRange, currentPage, sortConfig]);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      // Calcular data de corte baseada no filtro
      const now = new Date();
      let fromDate = subDays(now, 1); // Default 24h
      if (dateRange === '7d') fromDate = subDays(now, 7);
      if (dateRange === '30d') fromDate = subDays(now, 30);

      // Query Base
      let query = supabase
        .from('opportunities')
        .select(`
          id,
          created_at,
          sport_key,
          market_key,
          roi,
          legs_json,
          events (
            home_name,
            away_name
          )
        `, { count: 'exact' })
        .gte('created_at', fromDate.toISOString());

      // Ordenação
      if (sortConfig.key === 'detectedAt') {
        query = query.order('created_at', { ascending: sortConfig.direction === 'asc' });
      } else if (sortConfig.key === 'roi') {
        query = query.order('roi', { ascending: sortConfig.direction === 'asc' });
      }

      // Paginação
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      if (data) {
        // Transformação de dados para a interface SurebetOpportunity
        const transformed: SurebetOpportunity[] = data.map((item: any) => {
          const legs = item.legs_json || [];
          return {
            id: item.id,
            detectedAt: item.created_at,
            sport: item.sport_key,
            event: item.events ? `${item.events.home_name} x ${item.events.away_name}` : 'Evento Desconhecido',
            market: item.market_key,
            roi: item.roi,
            bookmakers: legs.map((l: any) => l.bookmaker),
            odds: legs.map((l: any) => l.odd.toFixed(2)),
            status: 'expired' // Histórico assume expirado por padrão
          };
        });
        setOpportunities(transformed);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof SurebetOpportunity) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filtragem local apenas para busca de texto (já que paginação é server-side)
  const displayData = opportunities.filter(op => 
    op.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.bookmakers.some(b => b.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Archive className="text-blue-500" /> Arquivo do Scanner
          </h1>
          <p className="text-slate-400 text-sm">Registro completo de todas as oportunidades detectadas pelo sistema.</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 text-blue-400 text-xs font-bold">
          <Database size={14} />
          {totalCount} Registros Encontrados
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar time, casa de aposta..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            {[
              { id: '24h', label: '24h' },
              { id: '7d', label: '7 Dias' },
              { id: '30d', label: '30 Dias' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setDateRange(opt.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                  dateRange === opt.id 
                    ? 'bg-slate-800 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          
          <button 
            onClick={fetchOpportunities} 
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            title="Atualizar Lista"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-950/80 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleSort('detectedAt')}>
                  <div className="flex items-center gap-1">Detectado em <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4">Evento / Esporte</th>
                <th className="px-6 py-4">Mercado</th>
                <th className="px-6 py-4">Casas Envolvidas</th>
                <th className="px-6 py-4 text-center">Odds Capturadas</th>
                <th className="px-6 py-4 text-right cursor-pointer hover:text-blue-400" onClick={() => handleSort('roi')}>
                  <div className="flex items-center justify-end gap-1">Lucro Est. <ArrowUpDown className="w-3 h-3" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></td></tr>
              ) : displayData.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500">Nenhum registro encontrado neste período.</td></tr>
              ) : (
                displayData.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 opacity-50" />
                        {format(new Date(op.detectedAt), "dd/MM/yy HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{op.event}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">{op.sport}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {op.market}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {op.bookmakers.map((bookie, idx) => (
                          <Badge key={idx} variant="outline" className="bg-slate-950 border-slate-700 text-slate-400 text-[10px]">
                            {bookie}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-mono text-xs text-amber-500/80 bg-amber-500/5 px-2 py-1 rounded inline-block border border-amber-500/10">
                        {op.odds.join(' | ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-mono font-bold ${
                        op.roi > 0.02 ? 'text-emerald-400' : 'text-blue-400'
                      }`}>
                        {formatPercent(op.roi)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-between items-center bg-slate-950/50">
          <span className="text-xs text-slate-500">
            Mostrando {displayData.length} de {totalCount} registros
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <span className="px-3 py-1.5 text-xs font-mono text-slate-500">
              {currentPage} / {totalPages || 1}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
