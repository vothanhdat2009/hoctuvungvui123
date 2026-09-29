-- Chạy MỘT LẦN trong Supabase → SQL Editor (sau khi đã chạy supabase-setup.sql).
-- Không đụng tới bảng user_data và hệ thống đăng nhập hiện có.

create table if not exists public.flashcard_decks (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 60),
  cards        jsonb not null default '[]'::jsonb
               check (jsonb_typeof(cards) = 'array' and jsonb_array_length(cards) <= 500),
  share_code   text check (share_code is null or share_code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  favorite     boolean not null default false,
  origin_name  text,
  origin_owner text,
  origin_code  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists flashcard_decks_share_code_key
  on public.flashcard_decks (share_code) where share_code is not null;
create index if not exists flashcard_decks_owner_idx
  on public.flashcard_decks (owner_id, created_at desc);

alter table public.flashcard_decks enable row level security;

drop policy if exists "decks_select_own" on public.flashcard_decks;
drop policy if exists "decks_insert_own" on public.flashcard_decks;
drop policy if exists "decks_update_own" on public.flashcard_decks;
drop policy if exists "decks_delete_own" on public.flashcard_decks;

create policy "decks_select_own" on public.flashcard_decks for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "decks_insert_own" on public.flashcard_decks for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "decks_update_own" on public.flashcard_decks for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "decks_delete_own" on public.flashcard_decks for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- Xem bộ thẻ theo mã chia sẻ (cả khi chưa đăng nhập). Chỉ trả về đúng bộ có mã khớp,
-- không lộ id người dùng, email hay các bộ khác.
create or replace function public.get_shared_deck(p_code text)
returns table (name text, cards jsonb, owner_name text, updated_at timestamptz, is_owner boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select d.name,
         d.cards,
         coalesce(u.raw_user_meta_data ->> 'username', split_part(u.email, '@', 1)),
         d.updated_at,
         coalesce(d.owner_id = (select auth.uid()), false)
  from public.flashcard_decks d
  join auth.users u on u.id = d.owner_id
  where d.share_code = upper(p_code)
  limit 1;
$$;

revoke all on function public.get_shared_deck(text) from public;
grant execute on function public.get_shared_deck(text) to anon, authenticated;

notify pgrst, 'reload schema';
