import scheduledGames from "@/data/daily-games.json";
import { supabase } from "@/app/lib/supabase";

type StoredGame = { id: string; game_date: string; status: "draft" | "published" | "expired" };

export async function ensureScheduledGames() {
  await supabase<unknown>("games?on_conflict=game_date", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify(scheduledGames.map((game) => ({
      game_date: game.date,
      host_name: game.host[0],
      host_number: game.host[1],
      host_caption: game.host[2],
      status: game.status,
      published_at: game.status === "published" ? new Date().toISOString() : null,
    }))),
  });

  const dates = scheduledGames.map((game) => game.date).join(",");
  const storedGames = await supabase<StoredGame[]>(
    `games?select=id,game_date,status&game_date=in.(${dates})`,
  );
  const ids = new Map(storedGames.map((game) => [game.game_date, game.id]));
  const draftDates = new Set(storedGames.filter((game) => game.status === "draft").map((game) => game.game_date));
  const questions = scheduledGames.filter((game) => draftDates.has(game.date)).flatMap((game) => {
    const gameId = ids.get(game.date);
    if (!gameId) throw new Error(`Seeded game ${game.date} could not be found.`);
    return game.questions.map((question, index) => ({
      game_id: gameId,
      position: index + 1,
      eyebrow: question.eyebrow,
      prompt: question.prompt,
      answer_type: question.type,
      choices: question.choices,
      canonical_answer: question.answer,
      points: question.points,
      explanation: question.explanation,
      source_url: question.source,
    }));
  });

  if (questions.length === 0) return;

  await supabase<unknown>("game_questions?on_conflict=game_id,position", {
    method: "POST",
    // Refresh prepared games when the generated schedule changes, but never
    // rewrite a published or expired game's historical question snapshots.
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(questions),
  });
}
