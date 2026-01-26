import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { bucket, limit } = req.query;
  let query = supabaseAdmin.from('opportunities').select('*, events(home_name, away_name)').order('roi', { ascending: false });
  
  if (bucket) query = query.eq('bucket', bucket as string);
  
  const { data } = await query.limit(Number(limit) || 100);
  return res.json(data);
}
