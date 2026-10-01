-- Customer bookings. Create rows only through the create_booking() function (capacity lock).
create type public.booking_status as enum ('confirmed', 'cancelled', 'attended', 'no_show');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  -- Slot, copied from schedule_slots at booking time (studio local date/time).
  date date not null,
  start_time time not null,
  end_time time not null,
  -- Same moment as date + start_time in America/Tijuana, stored in UTC.
  starts_at timestamptz not null,
  party_size integer not null check (party_size between 1 and 30),
  name text not null check (char_length(name) between 1 and 120),
  phone text not null check (phone ~ '^\+(52|1)[0-9]{10}$'), -- E.164
  email text not null check (char_length(email) between 3 and 254),
  whatsapp_opt_in boolean not null default false,
  privacy_accepted_at timestamptz not null,
  status public.booking_status not null default 'confirmed',
  -- Random secret for the /r/[token] manage link.
  manage_token text not null unique
    default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  customer_confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_time_order check (end_time > start_time)
);

create index bookings_date_start_idx on public.bookings (date, start_time);
create index bookings_phone_confirmed_idx on public.bookings (phone) where status = 'confirmed';

alter table public.bookings enable row level security;
