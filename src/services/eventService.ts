import { supabase } from "../lib/supabase";
import { startOfDay, endOfDay } from "date-fns";

export interface GameEvent {
  id: string;
  start_time: string;
  status: 'scheduled' | 'live' | 'finished';
  league: string;
  sport: string;
  home_team: string;
  away_team: string;
}

export const eventService = {
  async fetchEventsByDate(date: Date): Promise<GameEvent[]> {
    const start = startOfDay(date).toISOString();
    const end = endOfDay(date).toISOString();

    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        start_time,
        status,
        leagues (name),
        sports (name),
        teams_home: home_team_id (name),
        teams_away: away_team_id (name)
      `)
      .gte('start_time', start)
      .lte('start_time', end)
      .order('start_time', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((event: any) => ({
      id: event.id,
      start_time: event.start_time,
      status: event.status,
      league: event.leagues?.name || 'Liga Desconhecida',
      sport: event.sports?.name || 'Esporte',
      home_team: event.teams_home?.name || 'Time Casa',
      away_team: event.teams_away?.name || 'Time Fora'
    }));
  }
};
