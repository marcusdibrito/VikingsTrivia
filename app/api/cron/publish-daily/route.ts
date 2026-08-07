import { NextResponse } from "next/server";
import { easternDate, supabase } from "@/app/lib/supabase";
import { ensureScheduledGames } from "@/app/lib/seed-games";

type DraftGame = { id: string; game_date: string };
type CountRow = { game_id: string };

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await ensureScheduledGames();
    const today = easternDate();
    const games = await supabase<DraftGame[]>(
      `games?select=id,game_date&game_date=eq.${today}&status=in.(draft,published)&limit=1`,
    );
    const game = games[0];
    if (!game) {
      return NextResponse.json(
        { error: `No prepared game exists for ${today}.` },
        { status: 409 },
      );
    }

    const questions = await supabase<CountRow[]>(
      `game_questions?select=game_id&game_id=eq.${game.id}`,
    );
    if (questions.length !== 5) {
      return NextResponse.json(
        { error: `The prepared game for ${today} has ${questions.length} questions; expected 5.` },
        { status: 409 },
      );
    }

    await supabase<unknown>(
      `games?game_date=lt.${today}&status=eq.published`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "expired" }),
      },
    );
    await supabase<unknown>(
      `games?id=eq.${game.id}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "published", published_at: new Date().toISOString() }),
      },
    );

    return NextResponse.json({ published: true, gameDate: today, gameId: game.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Daily game could not be published." },
      { status: 500 },
    );
  }
}
