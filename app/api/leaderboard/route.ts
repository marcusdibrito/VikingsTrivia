import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { currentGame, supabase } from "@/app/lib/supabase";
import { getPaBonusQuestions, PA_QUESTIONS_PER_GAME } from "@/app/lib/pa-bonus";

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
  answers: unknown;
  correct_count: number;
  pin_distance: number | null;
  completed_at: string;
};

type StoredAnswers = {
  responses?: unknown;
  answerTimes?: unknown;
  paPoints?: unknown;
};

function formatDuration(milliseconds: number | null) {
  if (milliseconds === null) return "—";
  return `${(milliseconds / 1000).toFixed(1)}s`;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function answerMatches(value: string, expected: string, type: GameQuestion["answer_type"]) {
  if (normalize(value) === normalize(expected)) return true;
  if (type !== "text") return false;
  const lastName = expected.trim().split(/\s+/).at(-1) ?? "";
  return normalize(lastName).length >= 4 && normalize(value) === normalize(lastName);
}

function attemptExtras(answers: unknown) {
  if (!answers || Array.isArray(answers) || typeof answers !== "object") {
    return { paPoints: 0, totalTimeMs: null };
  }
  const stored = answers as StoredAnswers;
  const times = Array.isArray(stored.answerTimes)
    ? stored.answerTimes.filter((time): time is number => Number.isInteger(time) && Number(time) >= 0)
    : [];
  return {
    paPoints: Number.isInteger(stored.paPoints) ? Number(stored.paPoints) : 0,
    totalTimeMs: times.length ? times.reduce((total, time) => total + time, 0) : null,
  };
}

async function sendPlayNotification(details: {
  displayName: string;
  gameDate: string;
  score: number;
  correctCount: number;
  rank: number | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.PLAY_NOTIFICATION_EMAIL;
  if (!apiKey || !recipient) return;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.PLAY_NOTIFICATION_FROM ?? "Norse Know-It-All <onboarding@resend.dev>",
      to: [recipient],
      subject: `${details.displayName} played Vikings trivia`,
      text: [
        `${details.displayName} completed the ${details.gameDate} Vikings trivia game.`,
        `Score: ${details.score.toLocaleString()}`,
        `Correct answers: ${details.correctCount}/5`,
        `Daily rank: ${details.rank ? `#${details.rank}` : "—"}`,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    throw new Error(`Play notification failed with status ${response.status}.`);
  }
}

async function leaderboard(gameId: string) {
  const attempts = await supabase<Attempt[]>(
    `attempts?select=id,display_name,score,answers,correct_count,pin_distance,completed_at&game_id=eq.${gameId}&order=score.desc,correct_count.desc,pin_distance.asc.nullslast,completed_at.asc`,
  );
  attempts.sort((a, b) => b.score - a.score
    || b.correct_count - a.correct_count
    || (a.pin_distance ?? Number.MAX_SAFE_INTEGER) - (b.pin_distance ?? Number.MAX_SAFE_INTEGER)
    || (attemptExtras(a.answers).totalTimeMs ?? Number.MAX_SAFE_INTEGER) - (attemptExtras(b.answers).totalTimeMs ?? Number.MAX_SAFE_INTEGER)
    || a.completed_at.localeCompare(b.completed_at));
  const bestPin = attempts.reduce<number | null>(
    (best, row) => row.pin_distance === null ? best : best === null ? row.pin_distance : Math.min(best, row.pin_distance),
    null,
  );
  return attempts.map((row, index) => ({
    ...attemptExtras(row.answers),
    attemptId: row.id,
    rank: index + 1,
    name: row.display_name,
    score: row.score,
    correct: row.correct_count,
    pin: row.pin_distance,
    time: formatDuration(attemptExtras(row.answers).totalTimeMs),
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
      answerTimes?: number[];
    };
    const displayName = payload.displayName?.trim().slice(0, 24);
    const expectedAnswerCount = 5 + PA_QUESTIONS_PER_GAME;
    if (!displayName || !payload.deviceId || !Array.isArray(payload.answers) || payload.answers.length !== expectedAnswerCount
      || !Array.isArray(payload.answerTimes) || payload.answerTimes.length !== expectedAnswerCount
      || !payload.answerTimes.every((time) => Number.isInteger(time) && time >= 0 && time <= 30_000)) {
      return NextResponse.json({ error: "Invalid completed attempt." }, { status: 400 });
    }
    const answerTimes = payload.answerTimes;

    const game = await currentGame();
    const paBonusQuestions = getPaBonusQuestions(game.game_date);
    const questions = await supabase<GameQuestion[]>(
      `game_questions?select=position,answer_type,canonical_answer,points&game_id=eq.${game.id}&order=position.asc`,
    );
    if (questions.length !== 5) throw new Error("The published game is incomplete.");

    let score = 0;
    let correctCount = 0;
    let paPoints = 0;
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
      } else if (answerMatches(answer, question.canonical_answer, question.answer_type)) {
        score += question.points;
        correctCount += 1;
      }
    });
    paBonusQuestions.forEach((question, bonusIndex) => {
      const answer = String(payload.answers?.[questions.length + bonusIndex] ?? "");
      if (normalize(answer) === normalize(question.answer)) paPoints += question.points;
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
        answers: { responses: payload.answers, answerTimes, paPoints },
        score,
        correct_count: correctCount,
        pin_guess: pinGuess,
        pin_distance: pinDistance,
        completed_at: new Date().toISOString(),
      }),
    });

    const rows = await leaderboard(game.id);
    const rank = rows.find((row) => row.attemptId === inserted[0]?.id)?.rank ?? null;
    try {
      await sendPlayNotification({
        displayName,
        gameDate: game.game_date,
        score,
        correctCount,
        rank,
      });
    } catch (notificationError) {
      console.error(notificationError);
    }
    return NextResponse.json({ score, paPoints, correctCount, pinDistance, rank, leaderboard: rows });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Attempt could not be saved." },
      { status: 500 },
    );
  }
}
