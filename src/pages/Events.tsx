import { useEffect, useState, useMemo } from 'react';
import { apiRequest } from '../lib/apiClient';
import { Loader2, Calendar as CalendarIcon, Clock, Flame, Filter } from 'lucide-react';
import { format, isSameDay, addDays, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FilterType = 'all' | 'live' | 'today' | 'week';

export default function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    apiRequest('/events')
      .then((data: any) => setEvents(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Lógica de Filtragem
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const today = new Date();
    const nextWeek = addDays(today, 7);

    return events.filter(evt => {
      const eventDate = new Date(evt.start_time_utc);

      if (filter === 'live') return evt.status === 'live';
      if (filter === 'today') return isSameDay(eventDate, today);
      if (filter === 'week') return isAfter(eventDate, today) && isBefore(eventDate, nextWeek);
      
      return true; // 'all'
    });
  }, [events, filter]);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-emerald-500" />
            Próximos Eventos
          </h1>
          <p className="text-slate-400 text-sm mt-1">Confira a agenda e planeje suas operações.</p>
        </div>

        {/* Barra de Filtros Destacada */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 shadow-lg overflow-x-auto max-w-full">
          <div className="px-2 text-slate-500 hidden sm:block">
            <Filter size={16} />
          </div>
          <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>
          
          {[
            { id: 'all', label: 'Todos' },
            { id: 'live', label: 'Ao Vivo', icon: Flame },
            { id: 'today', label: 'Hoje' },
            { id: 'week', label: '7 Dias' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id as FilterType)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                filter === opt.id 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {opt.icon && <opt.icon size={12} className={filter === opt.id ? 'text-white' : 'text-orange-500'} />}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map(evt => (
            <div key={evt.id} className="bg-slate-900/50 p-5 rounded-lg border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${
                    evt.sport_key.includes('soccer') 
                      ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/20' 
                      : 'bg-indigo-950/50 text-indigo-400 border-indigo-500/20'
                  }`}>
                    {evt.sport_key.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Clock size={12} />
                    {format(new Date(evt.start_time_utc), "dd/MM/yyyy, HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <h3 className="font-bold text-white text-lg group-hover:text-indigo-400 transition-colors">
                  {evt.home_name} <span className="text-slate-600 mx-1">vs</span> {evt.away_name}
                </h3>
              </div>
              
              <div className="flex items-center self-end md:self-center">
                <span className={`px-3 py-1.5 rounded text-xs font-bold tracking-wider border ${
                  evt.status === 'live' 
                    ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' 
                    : evt.status === 'finished'
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-slate-800/50 text-slate-300 border-slate-700'
                }`}>
                  {evt.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center bg-slate-900/30 rounded-xl border border-slate-800 border-dashed flex flex-col items-center gap-3">
            <CalendarIcon className="w-10 h-10 text-slate-700" />
            <p className="text-slate-500">Nenhum evento encontrado para este filtro.</p>
          </div>
        )}
      </div>
    </div>
  );
}
