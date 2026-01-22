import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureSettingsRow, updateSettings } from '../_lib/settings';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { apisportsKey } = req.body;
  if (!apisportsKey) return res.status(400).json({ error: 'Missing API Key' });

  await ensureSettingsRow();
  const cronToken = crypto.randomBytes(16).toString('hex');
  
  await updateSettings({ apisports_key: apisportsKey, cron_token: cronToken });
  return res.json({ ok: true, cronToken });
}
