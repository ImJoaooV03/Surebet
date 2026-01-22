import { supabaseAdmin } from './supabaseAdmin';
import crypto from 'crypto';

export interface AppSettings {
  apisports_key: string;
  cron_token: string;
  sports_enabled: { football: boolean; basketball: boolean };
  roi_min_pre: number;
  roi_min_live: number;
}

export async function getSettings(): Promise<AppSettings | null> {
  const { data } = await supabaseAdmin.from('app_settings').select('*').eq('id', 1).single();
  return data as AppSettings;
}

export async function ensureSettingsRow() {
  const { data } = await supabaseAdmin.from('app_settings').select('id').eq('id', 1).single();
  if (!data) {
    const token = crypto.randomBytes(16).toString('hex');
    await supabaseAdmin.from('app_settings').insert({ id: 1, cron_token: token });
  }
}

export async function updateSettings(updates: Partial<AppSettings>) {
  return await supabaseAdmin.from('app_settings').update(updates).eq('id', 1);
}
