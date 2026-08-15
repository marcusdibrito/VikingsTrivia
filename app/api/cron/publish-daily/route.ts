import { NextResponse } from "next/server";
import { publishDailyGame } from "@/app/lib/publish-daily";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await publishDailyGame();
    return NextResponse.json({ published: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Daily game could not be published." },
      { status: 500 },
    );
  }
}
