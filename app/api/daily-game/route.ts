import { NextResponse } from "next/server";
import { currentGame, supabase } from "@/app/lib/supabase";
import { ensureScheduledGames } from "@/app/lib/seed-games";

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

export async function GET() {
  try {
    let game;
    try {
      game = await currentGame();
    } catch {
      await ensureScheduledGames();
      game = await currentGame();
    }
    const rows = await supabase<GameQuestion[]>(
      `game_questions?select=id,position,eyebrow,prompt,answer_type,choices,canonical_answer,points,explanation,source_url&game_id=eq.${game.id}&order=position.asc`,
    );
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
    });
  } catch (error) {
    console.error("Daily game unavailable", error);
    return NextResponse.json(
      { error: "Today's game isn't ready yet. Please check back shortly." },
      { status: 503 },
    );
  }
}
