import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSettings } from '../_lib/settings';
import { supabaseAdmin } from '../_lib/supabaseAdmin';
import { fetchOddsBlazeData, processOddsBlazeEvents } from '../_lib/oddsblaze';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { token } = req.query;
  const settings = await getSettings();
  
  if (!settings || token !== settings.cron_token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 1. Verifica se Odds Blaze está ativada para o Admin
  // (Em um sistema multi-tenant, iteraríamos por usuários, mas aqui focamos no admin/sistema)
  const { data: adminSettings } = await supabaseAdmin
    .from('user_settings')
    .select('oddsblaze_key, oddsblaze_enabled')
    .eq('role', 'admin') // Pega a config do admin
    .single();

  let newOppsCount = 0;

  if (adminSettings?.oddsblaze_enabled && adminSettings.oddsblaze_key) {
    console.log("Iniciando scan via Odds Blaze...");
    
    // 2. Busca dados brutos
    const rawData = await fetchOddsBlazeData(adminSettings.oddsblaze_key);
    
    // 3. Processa e calcula Surebets internamente
    const foundOpps = processOddsBlazeEvents(rawData);

    // 4. Salva no banco
    if (foundOpps.length > 0) {
      for (const opp of foundOpps) {
        // Upsert do evento
        const { data: eventData } = await supabaseAdmin.from('events').upsert({
          sport_key: opp.sport,
          home_name: opp.home_team,
          away_name: opp.away_team,
          start_time_utc: opp.start_time,
          status: 'scheduled' // ou live dependendo da api
        }, { onConflict: 'sport_key, home_name, away_name, start_time_utc' }).select().single();

        if (eventData) {
          // Insert da oportunidade
          await supabaseAdmin.from('opportunities').insert({
            event_id: eventData.id,
            sport_key: opp.sport,
            market_key: opp.market,
            roi: opp.roi,
            legs_json: opp.legs,
            bucket: 'LIVE', // Assumindo prioridade
            created_at: new Date().toISOString()
          });
          newOppsCount++;
        }
      }
    }
  }
  
  return res.json({ ok: true, msg: 'Tick executed', oddsBlazeOpps: newOppsCount });
}
