import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';
import { getSettings } from './_lib/settings.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const settings = await getSettings();
  const today = new Date().toISOString().split('T')[0];

  const { data: budget } = await supabaseAdmin.from('request_budget').select('*').eq('day', today);
  const { count: oppsCount } = await supabaseAdmin.from('opportunities').select('*', { count: 'exact', head: true });
  
  return res.json({
    budget,
    totalOpportunities: oppsCount,
    hasKey: !!settings?.apisports_key,
    cronToken: settings?.cron_token
  });
}
