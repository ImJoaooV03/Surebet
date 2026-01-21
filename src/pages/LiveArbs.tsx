import { useState } from "react";
import { SurebetCard } from "../components/surebet/SurebetCard";
import { Filter, RefreshCw, Loader2, AlertTriangle, Clock } from "lucide-react";
import { useSurebetsQuery } from "../hooks/useSurebetsQuery";

export function LiveArbs() {
  const [filterSport, setFilterSport] = useState<string>('all');
  const [minRoi, setMinRoi] = useState<number>(0.5);
  // Adicionado '48h' ao tipo do estado
  const [timeRange, setTimeRange] = useState<'all' | '1h' | '12h' | '24h' | '48h'>('all');

  // Utilizando o novo Hook com React Query
  const { 
    data: arbs = [], 
    isLoading, 
    isError, 
    error, 
    refetch, 
    isRefetching 
  } = useSurebetsQuery({
    status: 'active',
    sport: filterSport,
    minRoi: minRoi,
    timeRange: timeRange
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Surebets Ao Vivo
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitorando {arbs.length} oportunidades ativas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors border border-slate-700 disabled:opacity-50"
            title="Atualizar Lista"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading || isRefetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Barra de Filtros Avançada */}
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center gap-6 shadow-sm">
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium border-r border-slate-800 pr-4">
          <Filter className="w-4 h-4" />
          Filtros
        </div>
        
        {/* Filtro Esporte */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Esporte</span>
          <select 
            value={filterSport}
            onChange={(e) => setFilterSport(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
          >
            <option value="all">Todos os Esportes</option>
            <option value="soccer">Futebol</option>
            <option value="basketball">Basquete</option>
          </select>
        </div>

        {/* Filtro ROI */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">ROI Mínimo (%)</span>
          <div className="relative">
            <input 
              type="number" 
              step="0.1"
              value={minRoi}
              onChange={(e) => setMinRoi(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg w-24 px-3 py-1.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
            />
            <span className="absolute right-3 top-1.5 text-slate-500 text-xs">%</span>
          </div>
        </div>

        {/* Filtro Tempo */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Início do Jogo</span>
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
            {[
              { label: 'Todos', val: 'all' },
              { label: '1h', val: '1h' },
              { label: '12h', val: '12h' },
              { label: '24h', val: '24h' },
              { label: '48h', val: '48h' }, // Novo botão
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => setTimeRange(opt.val as any)}
                className={`px-3 py-0.5 text-xs rounded-md transition-colors ${
                  timeRange === opt.val 
                    ? 'bg-emerald-500 text-slate-950 font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Estado de Erro */}
      {isError && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-medium">Erro ao carregar dados</p>
            <p className="text-sm opacity-80">{(error as Error)?.message || "Verifique sua conexão."}</p>
          </div>
        </div>
      )}

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            <p className="text-slate-500 text-sm animate-pulse">Buscando melhores odds...</p>
          </div>
        ) : arbs.length > 0 ? (
          arbs.map(arb => (
            <SurebetCard key={arb.id} surebet={arb} bankroll={2000} />
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-slate-950/50 rounded-xl border border-slate-800 border-dashed flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-2">
              <Clock className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">Nenhuma oportunidade encontrada.</p>
            <p className="text-xs text-slate-500 max-w-md">
              Tente ajustar os filtros de ROI ou Tempo. O sistema continua monitorando o mercado em tempo real.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
