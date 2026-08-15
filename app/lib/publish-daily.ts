import { easternDate, supabase } from "@/app/lib/supabase";
import { ensureScheduledGames } from "@/app/lib/seed-games";

type ScheduledGame = { id: string; game_date: string };
type CountRow = { game_id: string };

export async function publishDailyGame() {
  await ensureScheduledGames();

  const today = easternDate();
  const games = await supabase<ScheduledGame[]>(
    `games?select=id,game_date&game_date=eq.${today}&status=in.(draft,published)&limit=1`,
  );
  const game = games[0];
  if (!game) throw new Error(`No prepared game exists for ${today}.`);

  const questions = await supabase<CountRow[]>(
    `game_questions?select=game_id&game_id=eq.${game.id}`,
  );
  if (questions.length !== 5) {
    throw new Error(
      `The prepared game for ${today} has ${questions.length} questions; expected 5.`,
    );
  }

  await supabase<unknown>(`games?game_date=lt.${today}&status=eq.published`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status: "expired" }),
  });
  await supabase<unknown>(`games?id=eq.${game.id}&status=eq.draft`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      status: "published",
      published_at: new Date().toISOString(),
    }),
  });

  return { gameDate: today, gameId: game.id };
}
