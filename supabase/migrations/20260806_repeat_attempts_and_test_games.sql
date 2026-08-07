alter table public.attempts drop constraint if exists attempts_game_id_device_hash_key;

create index if not exists attempts_game_device_idx
  on public.attempts (game_id, device_hash);
