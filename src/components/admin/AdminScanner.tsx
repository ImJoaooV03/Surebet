import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { transformArbData, formatPercent } from "../../lib/utils";
import { Surebet } from "../../types";
import { Loader2, ArrowUpDown, Search, RefreshCw, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "../ui/Badge";

export function AdminScanner() {
  const [arbs, setArbs] = useState<Surebet[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof Surebet>('roi');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchScannerData();
  }, []);

  const fetchScannerData = async () => {
    setRefreshing(true);
    try {
      // Fetch raw data from the correct 'opportunities' table (V2 Schema)
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          events (
            home_name,
            away_name,
            start_time_utc,
            league_id,
            status,
            sport_key
          )
        `)
        .order('roi', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      if (data) {
        // Transform the raw DB data into the UI Surebet model
        const transformedData = data.map(item => transformArbData(item));
        setArbs(transformedData);
      }
    } catch (err) {
      console.error("Scanner error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSort = (field: keyof Surebet) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedArbs = [...arbs]
    .filter(a => 
      a.homeTeam.toLowerCase().includes(filter.toLowerCase()) || 
      a.awayTeam.toLowerCase().includes(filter.toLowerCase()) ||
      a.league.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA === valB) return 0;
      const comparison = valA > valB ? 1 : -1;
      return sortDir === 'asc' ? comparison : -comparison;
    });

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-slate-400 w-full sm:w-auto">
          <Search className="w-4 h-4" />
          <input 
            type="text" 
            placeholder="Filtrar eventos..." 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm text-slate-200 placeholder:text-slate-600 w-full sm:w-64"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Badge variant="outline" className="font-mono">{arbs.length} Oportunidades</Badge>
          <button 
            onClick={fetchScannerData} 
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="text-xs text-slate-500 uppercase bg-slate-900/80 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3 cursor-pointer hover:text-emerald-400" onClick={() => handleSort('startTime')}>
                  <div className="flex items-center gap-1">Data/Hora <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-3">Evento / Liga</th>
                <th className="px-6 py-3">Mercado</th>
                <th className="px-6 py-3 text-center">Casa A</th>
                <th className="px-6 py-3 text-center">Casa B</th>
                <th className="px-6 py-3 text-right cursor-pointer hover:text-emerald-400" onClick={() => handleSort('roi')}>
                  <div className="flex items-center justify-end gap-1">Lucro % <ArrowUpDown className="w-3 h-3" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedArbs.length > 0 ? (
                sortedArbs.map((arb) => {
                  const leg1 = arb.legs[0];
                  const leg2 = arb.legs[1];
                  const isHighProfit = arb.roi > 0.02; // > 2%

                  return (
                    <tr key={arb.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-400 text-xs whitespace-nowrap">
                        {format(arb.startTime, "dd/MM HH:mm")}
                        {arb.isLive && <span className="ml-2 text-red-500 font-bold">LIVE</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-200 whitespace-nowrap">{arb.homeTeam} x {arb.awayTeam}</div>
                        <div className="text-xs text-slate-500 whitespace-nowrap">{arb.league} • {arb.sport}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        {arb.market}
                      </td>
                      
                      {/* Casa A */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {leg1?.odd.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1">{leg1?.bookmaker}</span>
                          <span className="text-[10px] text-slate-600">{leg1?.outcome}</span>
                        </div>
                      </td>

                      {/* Casa B */}
                      <td className="px-6 py-4 text-center">
                         <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {leg2?.odd.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1">{leg2?.bookmaker}</span>
                          <span className="text-[10px] text-slate-600">{leg2?.outcome}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className={`text-base font-bold font-mono px-2 py-1 rounded ${
                          isHighProfit 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "text-slate-300"
                        }`}>
                          {formatPercent(arb.roi)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="w-8 h-8 opacity-50" />
                      <p>Nenhuma oportunidade encontrada no scanner.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
