create extension if not exists pgcrypto;

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  game_date date not null unique,
  timezone text not null default 'America/New_York',
  host_name text not null,
  host_number text,
  host_caption text,
  status text not null check (status in ('draft', 'published', 'expired')),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.game_questions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  position integer not null check (position between 1 and 5),
  eyebrow text not null,
  prompt text not null,
  answer_type text not null check (answer_type in ('choice', 'text', 'team', 'number')),
  choices jsonb,
  canonical_answer text not null,
  points integer not null,
  explanation text not null,
  source_url text not null,
  unique (game_id, position)
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  device_hash text not null,
  display_name text not null check (char_length(display_name) between 1 and 24),
  answers jsonb not null,
  score integer not null,
  correct_count integer not null,
  pin_guess integer,
  pin_distance integer,
  completed_at timestamptz not null default now(),
  unique (game_id, device_hash)
);

create index if not exists attempts_leaderboard_idx
  on public.attempts (game_id, score desc, correct_count desc, pin_distance asc, completed_at asc);

alter table public.games enable row level security;
alter table public.game_questions enable row level security;
alter table public.attempts enable row level security;

revoke all on public.games from anon, authenticated;
revoke all on public.game_questions from anon, authenticated;
revoke all on public.attempts from anon, authenticated;
grant all on public.games to service_role;
grant all on public.game_questions to service_role;
grant all on public.attempts to service_role;

insert into public.games (
  game_date, host_name, host_number, host_caption, status, published_at
) values (
  '2026-07-26', 'Jim Kleinsasser', '40', 'Fan favorite · 1999–2011', 'published', now()
)
on conflict (game_date) do update set
  host_name = excluded.host_name,
  host_number = excluded.host_number,
  host_caption = excluded.host_caption,
  status = excluded.status,
  published_at = excluded.published_at;

with game as (
  select id from public.games where game_date = '2026-07-26'
)
insert into public.game_questions (
  game_id, position, eyebrow, prompt, answer_type, choices,
  canonical_answer, points, explanation, source_url
)
select game.id, seed.position, seed.eyebrow, seed.prompt, seed.answer_type,
  seed.choices::jsonb, seed.canonical_answer, seed.points, seed.explanation, seed.source_url
from game
cross join (
  values
    (1, '2010s · Warm-up', 'Who was the Vikings’ primary punter during the 2010 season?', 'choice',
      '["Chris Kluwe","Mitch Berger","Matt Wile","Britton Colquitt"]',
      'Chris Kluwe', 100, 'Chris Kluwe handled all 73 Minnesota punts in 2010.',
      'https://www.pro-football-reference.com/teams/min/2010.htm'),
    (2, '2020s · Getting warmer', 'What record did the Vikings finish with in the 2022 regular season?', 'choice',
      '["11–6","12–5","13–4","14–3"]',
      '13–4', 200, 'Minnesota went 13–4 and won the NFC North in Kevin O’Connell’s first season.',
      'https://www.pro-football-reference.com/teams/min/2022.htm'),
    (3, '2000s · Deep cut', 'Which team did the Vikings face in Spurgeon Wynn’s only start for Minnesota?', 'team',
      null, 'Baltimore Ravens', 300, 'Wynn started the 2001 finale, a 19–3 road loss to Baltimore.',
      'https://www.pro-football-reference.com/boxscores/200201070rav.htm'),
    (4, '2020s · Expert', 'How many receiving yards did Justin Jefferson record as a rookie in 2020?', 'choice',
      '["1,200","1,300","1,400","1,500"]',
      '1,400', 400, 'Jefferson’s 1,400 receiving yards set the Super Bowl-era rookie record at the time.',
      'https://www.pro-football-reference.com/players/J/JeffJu00.htm'),
    (5, 'Closest to the pin · 500 pts', 'Adrian Peterson set the NFL single-game rushing record in 2007. Exactly how many yards did he rush for?', 'number',
      null, '296', 500, 'Peterson rushed for 296 yards against the Chargers on November 4, 2007.',
      'https://www.pro-football-reference.com/boxscores/200711040min.htm')
) as seed(position, eyebrow, prompt, answer_type, choices, canonical_answer, points, explanation, source_url)
on conflict (game_id, position) do update set
  eyebrow = excluded.eyebrow,
  prompt = excluded.prompt,
  answer_type = excluded.answer_type,
  choices = excluded.choices,
  canonical_answer = excluded.canonical_answer,
  points = excluded.points,
  explanation = excluded.explanation,
  source_url = excluded.source_url;
