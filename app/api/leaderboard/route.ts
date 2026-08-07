import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { currentGame, supabase } from "@/app/lib/supabase";

type GameQuestion = {
  position: number;
  answer_type: "choice" | "text" | "team" | "number";
  canonical_answer: string;
  points: number;
};
type Attempt = {
  id: string;
  display_name: string;
  score: number;
  correct_count: number;
  pin_distance: number | null;
  completed_at: string;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function leaderboard(gameId: string) {
  const attempts = await supabase<Attempt[]>(
    `attempts?select=id,display_name,score,correct_count,pin_distance,completed_at&game_id=eq.${gameId}&order=score.desc,correct_count.desc,pin_distance.asc.nullslast,completed_at.asc`,
  );
  const bestPin = attempts.reduce<number | null>(
    (best, row) => row.pin_distance === null ? best : best === null ? row.pin_distance : Math.min(best, row.pin_distance),
    null,
  );
  return attempts.map((row, index) => ({
    attemptId: row.id,
    rank: index + 1,
    name: row.display_name,
    score: row.score,
    correct: row.correct_count,
    pin: row.pin_distance,
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    }).format(new Date(row.completed_at)),
    winner: index === 0,
    pinWinner: row.pin_distance !== null && row.pin_distance === bestPin,
  }));
}

export async function GET() {
  try {
    const game = await currentGame();
    return NextResponse.json({
      gameDate: game.game_date,
      leaderboard: await leaderboard(game.id),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Leaderboard unavailable." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as {
      displayName?: string;
      deviceId?: string;
      answers?: string[];
    };
    const displayName = payload.displayName?.trim().slice(0, 24);
    if (!displayName || !payload.deviceId || !Array.isArray(payload.answers) || payload.answers.length !== 5) {
      return NextResponse.json({ error: "Invalid completed attempt." }, { status: 400 });
    }

    const game = await currentGame();
    const questions = await supabase<GameQuestion[]>(
      `game_questions?select=position,answer_type,canonical_answer,points&game_id=eq.${game.id}&order=position.asc`,
    );
    if (questions.length !== 5) throw new Error("The published game is incomplete.");

    let score = 0;
    let correctCount = 0;
    let pinGuess: number | null = null;
    let pinDistance: number | null = null;
    questions.forEach((question, index) => {
      const answer = String(payload.answers?.[index] ?? "");
      if (question.answer_type === "number") {
        const guess = Number(answer);
        const target = Number(question.canonical_answer);
        if (Number.isFinite(guess)) {
          pinGuess = guess;
          pinDistance = Math.abs(guess - target);
          score += Math.max(0, question.points - pinDistance * 10);
          if (pinDistance === 0) correctCount += 1;
        }
      } else if (normalize(answer) === normalize(question.canonical_answer)) {
        score += question.points;
        correctCount += 1;
      }
    });

    const attemptNonce = crypto.randomUUID();
    const deviceHash = createHash("sha256").update(`${payload.deviceId}:${attemptNonce}`).digest("hex");
    const inserted = await supabase<Attempt[]>("attempts", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        game_id: game.id,
        device_hash: deviceHash,
        display_name: displayName,
        answers: payload.answers,
        score,
        correct_count: correctCount,
        pin_guess: pinGuess,
        pin_distance: pinDistance,
        completed_at: new Date().toISOString(),
      }),
    });

    const rows = await leaderboard(game.id);
    const rank = rows.find((row) => row.attemptId === inserted[0]?.id)?.rank ?? null;
    return NextResponse.json({ score, correctCount, pinDistance, rank, leaderboard: rows });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Attempt could not be saved." },
      { status: 500 },
    );
  }
}
