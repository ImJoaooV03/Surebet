import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { data } = await supabaseAdmin.from('events').select('*').order('start_time_utc', { ascending: true }).limit(50);
  return res.json(data);
}
