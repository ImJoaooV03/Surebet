import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabaseAdmin';
import { getSettings } from '../_lib/settings';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const settings = await getSettings();
  const today = new Date().toISOString().split('T')[0];

  // Budget
  const { data: budget } = await supabaseAdmin
    .from('request_budget')
    .select('*')
    .eq('day', today);

  // Queue Stats
  const { data: queue } = await supabaseAdmin
    .from('event_queue')
    .select('bucket')
    .then(r => r);
  
  const queueStats = queue?.reduce((acc: any, curr) => {
    acc[curr.bucket] = (acc[curr.bucket] || 0) + 1;
    return acc;
  }, {}) || {};

  // Opportunities
  const { count: oppsCount } = await supabaseAdmin
    .from('opportunities')
    .select('*', { count: 'exact', head: true });

  return res.json({
    budget,
    queueStats,
    totalOpportunities: oppsCount,
    hasKey: !!settings?.apisports_key,
    cronToken: settings?.cron_token
  });
}
