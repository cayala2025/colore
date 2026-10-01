-- Every notification is written here BEFORE it is sent. The unique indexes guarantee the
-- same template is never sent twice to the same booking/piece (cron jobs are idempotent).
create type public.notification_status as enum ('pending', 'sent', 'failed');

create table public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings (id) on delete cascade,
  piece_id uuid references public.pieces (id) on delete cascade,
  template text not null,
  channel text not null default 'email' check (channel in ('email', 'whatsapp')),
  recipient text not null,
  status public.notification_status not null default 'pending',
  provider_message_id text,
  error text,
  attempts integer not null default 1,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint notifications_log_one_target check (num_nonnulls(booking_id, piece_id) = 1)
);

-- Unique (target, template).
create unique index notifications_log_booking_template_key
  on public.notifications_log (booking_id, template) where booking_id is not null;
create unique index notifications_log_piece_template_key
  on public.notifications_log (piece_id, template) where piece_id is not null;

alter table public.notifications_log enable row level security;
