# Norse Know-It-All

A lively, unofficial Minnesota football daily trivia game built for family competition. The current product includes a complete five-question play flow, refresh-safe local progress, escalating difficulty, a numeric closest-to-the-pin finale, answer review with source links, daily standings, all-time highlights, an archive, keyboard support, and responsive layouts.

## Daily-game rules

- One shared five-question set is published for each `America/New_York` date.
- Questions are presented in order and become immutable after the player advances.
- Questions 1–4 are worth 100, 200, 300, and 400 points.
- Question 5 is worth up to 500 points. Its score is `max(0, 500 - distance × 10)`.
- Daily standings sort by total score, correct answers, smallest Q5 distance, then earliest server completion time.
- Equal closest-to-the-pin distances share the distinction; multiple exact answers are all exact-pin winners.

## State model

`draft → published → locked → expired`

An attempt moves from `in_progress → submitted` (or `abandoned`). A unique database index prevents more than one attempt for the same player and game. Every daily-game question stores an immutable JSON snapshot so later question edits cannot rewrite history.

## Local setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local`.
3. Run `pnpm exec vinext dev`.
4. Open the printed local address.

Generate a D1 migration after schema changes with `pnpm exec drizzle-kit generate`. The initial migration is already in `drizzle/`.

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
- `pnpm exec eslint . --ignore-pattern dist --ignore-pattern .next`
- `pnpm exec vinext build`

The game is unofficial and does not use NFL or Minnesota Vikings trademarks or logos.
