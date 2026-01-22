import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { eventService } from "../services/eventService";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Loader2, Trophy, RefreshCw, AlertCircle } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../contexts/ToastContext";

export function Games() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: games = [], isLoading, isError } = useQuery({
    queryKey: ['games', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => eventService.fetchEventsByDate(selectedDate),
    refetchInterval: 30000,
  });

  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const handleToday = () => setSelectedDate(new Date());

  const handleRefresh = async () => {
    toast("Atualizando lista de jogos...", "info");
    await queryClient.invalidateQueries({ queryKey: ['games'] });
    toast("Lista atualizada!", "success");
  };

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="space-y-6">
      {/* Header e Navegação de Data */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-emerald-500" />
            Agenda de Jogos
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Acompanhe a grade completa de eventos esportivos.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Botão de Atualizar */}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border-blue-600/20 hover:border-blue-500/30"
            title="Recarregar lista de jogos"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar Grade
          </button>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button 
              onClick={handlePrevDay}
              className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="px-4 flex flex-col items-center min-w-[140px]">
              <span className="text-sm font-bold text-slate-200 capitalize">
                {format(selectedDate, "EEEE", { locale: ptBR })}
              </span>
              <span className="text-xs text-slate-500">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>

            <button 
              onClick={handleNextDay}
              className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isToday && (
          <button 
            onClick={handleToday}
            className="text-xs font-bold text-emerald-500 hover:text-emerald-400 underline decoration-dashed underline-offset-4"
          >
            Voltar para Hoje
          </button>
        )}
      </div>

      {/* Lista de Jogos */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
            <p className="text-slate-500 text-sm">Carregando agenda...</p>
          </div>
        ) : isError ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            <p>Erro ao carregar jogos.</p>
            <button onClick={() => queryClient.invalidateQueries({ queryKey: ['games'] })} className="text-sm underline hover:text-red-300">Tentar novamente</button>
          </div>
        ) : games.length === 0 ? (
          <div className="py-20 text-center bg-slate-950/50 rounded-xl border border-slate-800 border-dashed">
            <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Nenhum jogo encontrado para esta data.</p>
            <p className="text-xs text-slate-600 mt-1 mb-4">
              Verifique se a API está ativa ou tente atualizar.
            </p>
            <button 
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-200 transition-colors border border-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </button>
          </div>
        ) : (
          games.map((game: any) => (
            <div 
              key={game.id} 
              className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4 hover:border-slate-700 transition-colors group"
            >
              {/* Hora e Status */}
              <div className="flex flex-col items-center md:items-start min-w-[100px] border-b md:border-b-0 md:border-r border-slate-800 pb-3 md:pb-0 md:pr-4">
                <div className="flex items-center gap-2 text-slate-200 font-mono font-bold text-lg">
                  <Clock className="w-4 h-4 text-slate-500" />
                  {format(new Date(game.start_time), "HH:mm")}
                </div>
                <div className="mt-1">
                  {game.status === 'live' && <Badge variant="danger" className="animate-pulse">AO VIVO</Badge>}
                  {game.status === 'scheduled' && <Badge variant="outline">Agendado</Badge>}
                  {game.status === 'finished' && <Badge variant="default">Finalizado</Badge>}
                </div>
              </div>

              {/* Times e Liga */}
              <div className="flex-1 text-center md:text-left w-full">
                <div className="text-xs text-emerald-500 font-bold uppercase tracking-wider mb-1 flex items-center justify-center md:justify-start gap-2">
                  {game.sport_key} • {game.league_id || 'Liga'}
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 text-lg font-medium text-slate-200">
                  <span className="flex-1 text-right md:flex-none">{game.home_name}</span>
                  <span className="text-slate-600 font-bold text-sm">VS</span>
                  <span className="flex-1 text-left md:flex-none">{game.away_name}</span>
                </div>
              </div>

              {/* Botão de Ação (Placeholder para futuro) */}
              <div className="hidden md:block">
                 <div className="w-2 h-2 rounded-full bg-slate-800 group-hover:bg-emerald-500 transition-colors"></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
