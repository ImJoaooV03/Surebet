import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSettings } from '../_lib/settings';
import { apiSportsGet } from '../_lib/apisports';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const settings = await getSettings();
  if (!settings?.apisports_key) return res.status(400).json({ error: 'No key' });

  try {
    const data = await apiSportsGet('football', '/timezone', {}, settings.apisports_key);
    return res.json({ ok: true, data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
