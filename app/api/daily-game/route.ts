import { NextResponse } from "next/server";
import { currentGame, supabase } from "@/app/lib/supabase";
import { publishDailyGame } from "@/app/lib/publish-daily";
import { paBonusQuestions } from "@/app/lib/pa-bonus";
import scheduledGames from "@/data/daily-games.json";

type GameQuestion = {
  id: string;
  position: number;
  eyebrow: string;
  prompt: string;
  answer_type: "choice" | "text" | "team" | "number";
  choices: string[] | null;
  canonical_answer: string;
  points: number;
  explanation: string;
  source_url: string;
};

const TODAY_REFRESH_DATE = "2026-08-23";

async function refreshTodayOnce(gameId: string, gameDate: string, rows: GameQuestion[]) {
  if (gameDate !== TODAY_REFRESH_DATE) return rows;
  const scheduled = scheduledGames.find((game) => game.date === gameDate);
  if (!scheduled) return rows;
  await supabase<unknown>(`games?id=eq.${gameId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      host_name: scheduled.host[0],
      host_number: scheduled.host[1],
      host_caption: scheduled.host[2],
    }),
  });
  if (scheduled.questions.every((question, index) => question.prompt === rows[index]?.prompt)) {
    return rows;
  }

  // Today's question set changed after players had already started. Clear only
  // this game's attempts, then replace its five snapshots. Once the prompts
  // match, later requests skip this block and new attempts remain intact.
  await supabase<unknown>(`attempts?game_id=eq.${gameId}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  await supabase<unknown>("game_questions?on_conflict=game_id,position", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(scheduled.questions.map((question, index) => ({
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
    }))),
  });
  return supabase<GameQuestion[]>(
    `game_questions?select=id,position,eyebrow,prompt,answer_type,choices,canonical_answer,points,explanation,source_url&game_id=eq.${gameId}&order=position.asc`,
  );
}

export async function GET() {
  try {
    let game;
    try {
      game = await currentGame();
    } catch {
      // Keep the game available if the scheduled request is delayed or missed.
      // Publishing is idempotent, so simultaneous first requests are safe.
      await publishDailyGame();
      game = await currentGame();
    }
    let rows = await supabase<GameQuestion[]>(
      `game_questions?select=id,position,eyebrow,prompt,answer_type,choices,canonical_answer,points,explanation,source_url&game_id=eq.${game.id}&order=position.asc`,
    );
    rows = await refreshTodayOnce(game.id, game.game_date, rows);
    game = await currentGame();
    if (rows.length !== 5) throw new Error("Today's published game is incomplete.");

    return NextResponse.json({
      gameDate: game.game_date,
      host: {
        name: game.host_name,
        number: game.host_number,
        caption: game.host_caption,
      },
      questions: rows.map((question) => ({
        id: question.id,
        eyebrow: question.eyebrow,
        prompt: question.prompt,
        type: question.answer_type,
        choices: question.choices ?? undefined,
        answer: question.answer_type === "number"
          ? Number(question.canonical_answer)
          : question.canonical_answer,
        points: question.points,
        explanation: question.explanation,
        source: question.source_url,
      })),
      paBonusQuestions,
    });
  } catch (error) {
    console.error("Daily game unavailable", error);
    return NextResponse.json(
      { error: "Today's game isn't ready yet. Please check back shortly." },
      { status: 503 },
    );
  }
}
