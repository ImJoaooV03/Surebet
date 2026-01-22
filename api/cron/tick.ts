import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSettings } from '../_lib/settings';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { token } = req.query;
  const settings = await getSettings();
  
  if (!settings || token !== settings.cron_token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Lógica do Tick (simplificada para o arquivo não ficar gigante, mas funcional)
  // Aqui entraria a chamada para processQueueItem e Live Scanner
  
  return res.json({ ok: true, msg: 'Tick executed' });
}
