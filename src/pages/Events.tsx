import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/apiClient';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/events')
      .then((data: any) => setEvents(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Próximos Eventos</h1>
      <div className="grid gap-4">
        {events.map(evt => (
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
                <span className="text-xs text-slate-500 font-medium">
                  {format(new Date(evt.start_time_utc), "dd/MM/yyyy, HH:mm")}
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
        ))}
      </div>
    </div>
  );
}
