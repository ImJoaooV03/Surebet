import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { transformArbData, formatCurrency, formatPercent } from "../lib/utils";
import { Surebet } from "../types";
import { Loader2, Download, Calendar, Search } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "../components/ui/Badge";

export function History() {
  const [arbs, setArbs] = useState<Surebet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('arbs')
        .select(`
          *,
          arb_legs (
            *,
            books (name)
          ),
          markets (
            market_type,
            rule_set,
            line_value,
            events (
              start_time,
              status,
              leagues (name),
              sports (name),
              teams_home: home_team_id (name),
              teams_away: away_team_id (name)
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data) {
        setArbs(data.map(transformArbData));
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (arbs.length === 0) return;

    const headers = ["ID", "Data", "Esporte", "Liga", "Evento", "Mercado", "ROI (%)", "Lucro Est. (R$ 1k)"];
    const rows = arbs.map(arb => [
      arb.id,
      format(arb.createdAt, "dd/MM/yyyy HH:mm"),
      arb.sport,
      arb.league,
      `${arb.homeTeam} vs ${arb.awayTeam}`,
      arb.market,
      (arb.roi * 100).toFixed(2),
      (1000 * arb.roi).toFixed(2)
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `surebets_history_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredArbs = arbs.filter(arb => 
    arb.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    arb.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    arb.league.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Histórico de Oportunidades</h1>
          <p className="text-slate-400 text-sm mt-1">Registro completo de todas as surebets detectadas.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input 
          type="text" 
          placeholder="Buscar no histórico..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 text-slate-300 placeholder:text-slate-600"
        />
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Evento</th>
                <th className="px-6 py-3">Mercado</th>
                <th className="px-6 py-3">ROI</th>
                <th className="px-6 py-3 text-right">Lucro (Base 1k)</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredArbs.length > 0 ? (
                filteredArbs.map((arb) => (
                  <tr key={arb.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {format(arb.createdAt, "dd/MM HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">{arb.homeTeam} vs {arb.awayTeam}</div>
                      <div className="text-xs text-slate-500">{arb.league}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {arb.market}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-400 font-bold">{formatPercent(arb.roi)}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-300">
                      {formatCurrency(1000 * arb.roi)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={arb.isLive ? "danger" : "default"}>
                        {arb.isLive ? "LIVE" : "PRE"}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhum registro encontrado.
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
