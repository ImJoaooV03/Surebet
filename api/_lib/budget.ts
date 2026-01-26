import { supabaseAdmin } from './supabaseAdmin.js';

const DAILY_LIMIT_PER_SPORT = 7500;

function getDayUTC() {
  return new Date().toISOString().split('T')[0];
}

export async function canSpend(sport_key: string, amount: number = 1): Promise<boolean> {
  const day = getDayUTC();
  const { data } = await supabaseAdmin
    .from('request_budget')
    .select('used')
    .eq('day', day)
    .eq('sport_key', sport_key)
    .single();

  const used = data?.used || 0;
  return (used + amount) <= DAILY_LIMIT_PER_SPORT;
}

export async function spend(sport_key: string, amount: number = 1) {
  const day = getDayUTC();
  const { data } = await supabaseAdmin
    .from('request_budget')
    .select('used')
    .eq('day', day)
    .eq('sport_key', sport_key)
    .single();

  const current = data?.used || 0;
  const newAmount = current + amount;

  await supabaseAdmin.from('request_budget').upsert({
    day,
    sport_key,
    used: newAmount
  }, { onConflict: 'day, sport_key' });
}
