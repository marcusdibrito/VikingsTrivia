export type Game = {
  id: string;
  game_date: string;
  host_name: string;
  host_number: string | null;
  host_caption: string;
};

export function easternDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.GAME_TIMEZONE ?? "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");
  return { url, key };
}

export async function supabase<T>(path: string, init?: RequestInit): Promise<T> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await response.text());
  const body = await response.text();
  if (!body) return undefined as T;
  return JSON.parse(body) as T;
}

export async function currentGame() {
  const today = easternDate();
  const games = await supabase<Game[]>(
    `games?select=id,game_date,host_name,host_number,host_caption&game_date=eq.${today}&status=eq.published&limit=1`,
  );
  if (!games[0]) throw new Error(`No published game is available for ${today}.`);
  return games[0];
}
