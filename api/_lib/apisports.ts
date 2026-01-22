import { spend } from './budget';

const BASE_URLS: Record<string, string> = {
  football: 'https://v3.football.api-sports.io',
  basketball: 'https://v1.basketball.api-sports.io'
};

export async function apiSportsGet(
  sport_key: 'football' | 'basketball',
  endpoint: string,
  params: Record<string, string>,
  apiKey: string
) {
  const baseUrl = BASE_URLS[sport_key];
  if (!baseUrl) throw new Error(`Unknown sport: ${sport_key}`);

  const url = new URL(`${baseUrl}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

  await spend(sport_key, 1);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-apisports-key': apiKey,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) throw new Error(`API Sports Error: ${res.status}`);
  return await res.json();
}
