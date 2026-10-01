-- Painted pieces left at the studio for firing, tracked until pickup (or donation at day 45).
create type public.piece_status as enum ('received', 'firing', 'ready', 'picked_up', 'donated');

create sequence public.piece_code_seq start 1;

-- C-0001, C-0002, … (keeps growing past C-9999 instead of truncating).
create or replace function public.next_piece_code()
returns text
language sql
volatile
set search_path = public
as $$
  select 'C-' || lpad(n::text, greatest(4, length(n::text)), '0')
  from (select nextval('public.piece_code_seq') as n) s;
$$;

revoke execute on function public.next_piece_code() from public, anon, authenticated;

create table public.pieces (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default public.next_piece_code(),
  booking_id uuid references public.bookings (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  phone text not null check (phone ~ '^\+(52|1)[0-9]{10}$'), -- E.164
  email text not null check (char_length(email) between 3 and 254),
  whatsapp_opt_in boolean not null default false,
  policy_accepted_at timestamptz not null,
  photo_path text, -- object path in the private "pieces" storage bucket
  status public.piece_status not null default 'received',
  -- Staff flag: firing is late; hold the "ready" message until staff marks it ready.
  delayed boolean not null default false,
  checked_in_at timestamptz not null default now(),
  ready_at timestamptz,
  picked_up_at timestamptz,
  donated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pieces_status_idx on public.pieces (status);
create index pieces_phone_idx on public.pieces (phone);
create index pieces_checked_in_at_idx on public.pieces (checked_in_at);

alter table public.pieces enable row level security;
