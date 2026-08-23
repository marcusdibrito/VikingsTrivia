# Norse Know-It-All

A lively, unofficial Minnesota football daily trivia game built for family competition. The current product includes a complete five-question play flow, a clean new run on every page load, escalating difficulty, a numeric closest-to-the-pin finale, answer review with source links, daily standings, all-time highlights, an archive, keyboard support, and responsive layouts.

## Daily-game rules

- One shared five-question set is published for each `America/New_York` date.
- Questions are presented in order and become immutable after the player advances.
- Questions 1–4 are worth 100, 200, 300, and 400 points.
- Question 5 is worth up to 500 points. Its score is `max(0, 500 - distance × 10)`.
- Daily standings sort by total score, correct answers, smallest Q5 distance, then fastest total answer time.
- Equal closest-to-the-pin distances share the distinction; multiple exact answers are all exact-pin winners.

## State model

`draft → published → locked → expired`

Each completed run creates a new attempt. Repeat attempts from the same device are currently allowed so the game can be replayed; this can be tightened later if the competition rules change. Every daily-game question is stored as a dated snapshot so later question-bank edits cannot rewrite history.

## Local setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local`.
3. Run `pnpm dev`.
4. Open `http://localhost:3000`.

Generate a schema migration after changes with `pnpm db:generate`. The initial
SQLite migration is preserved in `drizzle/`; a production database adapter has
not yet been connected.

## Data model

The D1 schema defines players, structured questions, daily games, immutable daily question snapshots, attempts, and locked answers. It includes unique constraints for one attempt per player/game and one answer per attempt/question position.

The deployed UI currently runs as a polished product prototype: identity and in-progress play are stored on the player’s device. The D1 schema is ready, but server-authoritative scoring, anonymous device-token exchange, admin publishing, scheduled generation, and live family sync still need route handlers before this should be treated as tamper-resistant production competition.

## Production hardening path

1. Issue a random anonymous device credential from an HTTP-only secure cookie and store only its hash.
2. Move question delivery, timers, answer locking, normalization, and scoring into D1-backed server routes.
3. Return explanations and canonical answers only after the attempt is atomically submitted.
4. Add admin allowlisting and future-game editing; lock snapshots after the first submission.
5. Add a scheduled daily publisher with a manual admin fallback.
6. Import and validate the full 150-question sourced bank.

## Verification

Run:

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm build`

## Deploying

Import the GitHub repository into Vercel. Vercel detects the Next.js framework,
installs dependencies with pnpm, and runs `pnpm build` without custom settings.

The production Supabase schema and initial daily game are defined in
`supabase/schema.sql`. Keep `SUPABASE_SECRET_KEY` server-only; it is configured
as a sensitive Vercel environment variable and must never be exposed to client
components.

## Automatic daily publishing

Prepare future rows in `games` with `status = 'draft'` and exactly five related
`game_questions`. Vercel calls `/api/cron/publish-daily` daily at 05:00 UTC; the
route uses the `America/New_York` calendar date, publishes today's prepared
game, and expires older published games. Repeated calls are safe. The daily
schedule is compatible with Vercel's Hobby-plan cron limits.

Set `CRON_SECRET` in Vercel in addition to the Supabase variables. Vercel sends
that value as the cron request's bearer token. If today's draft is missing or
does not contain exactly five questions, publishing fails safely with HTTP 409
instead of exposing an incomplete quiz.

The bundled schedule automatically preloads when today's game is first requested
or when the publishing job runs. It contains 30 dated games beginning August 6,
2026: the first is published immediately and the remaining 29 are drafts for the
daily job. Two additional sample games are isolated on far-future test dates so
they cannot enter the live rotation. `supabase/seed_daily_games.sql` is the manual
SQL-editor fallback for a fresh or existing Supabase project.

The game is unofficial and does not use NFL or Minnesota Vikings trademarks or logos.
