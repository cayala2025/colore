-- create_booking(): also enforce ONE upcoming confirmed booking per phone number.
-- Adds error codes: invalid_phone, phone_has_booking.
create or replace function public.create_booking(
  p_date date,
  p_start_time time,
  p_party_size integer,
  p_name text,
  p_phone text,
  p_email text,
  p_whatsapp_opt_in boolean
)
returns table (id uuid, manage_token text, date date, start_time time, end_time time, party_size integer)
language plpgsql
set search_path = public
as $$
declare
  v_tz constant text := 'America/Tijuana';
  v_today date := (now() at time zone v_tz)::date;
  v_slot public.schedule_slots%rowtype;
  v_starts_at timestamptz;
  v_taken integer;
begin
  if p_party_size is null or p_party_size < 1 or p_party_size > 8 then
    raise exception 'invalid_party';
  end if;

  if p_date < v_today or p_date > v_today + 60 then
    raise exception 'out_of_window';
  end if;

  if p_phone is null or p_phone !~ '^\+(52|1)[0-9]{10}$' then
    raise exception 'invalid_phone';
  end if;

  -- One upcoming confirmed booking per phone. Lock the phone first (always before the
  -- slot lock, so two transactions can never wait on each other in opposite order).
  perform pg_advisory_xact_lock(hashtextextended('phone:' || p_phone, 0));
  if exists (
    select 1 from public.bookings b
    where b.phone = p_phone and b.status = 'confirmed' and b.starts_at > now()
  ) then
    raise exception 'phone_has_booking';
  end if;

  -- One lock per slot: concurrent bookings for the same slot run one after another.
  perform pg_advisory_xact_lock(hashtextextended('slot:' || p_date::text || ' ' || p_start_time::text, 0));

  if exists (select 1 from public.blocked_dates b where b.date = p_date) then
    raise exception 'date_blocked';
  end if;

  select * into v_slot
  from public.schedule_slots s
  where s.weekday = extract(isodow from p_date)
    and s.start_time = p_start_time
    and s.active;
  if not found then
    raise exception 'slot_not_found';
  end if;

  v_starts_at := (p_date + v_slot.start_time) at time zone v_tz;
  if v_starts_at <= now() then
    raise exception 'slot_started';
  end if;

  select coalesce(sum(b.party_size), 0) into v_taken
  from public.bookings b
  where b.date = p_date
    and b.start_time = p_start_time
    and b.status in ('confirmed', 'attended');

  if v_slot.capacity - v_taken < p_party_size then
    raise exception 'slot_full';
  end if;

  return query
  insert into public.bookings as nb (
    date, start_time, end_time, starts_at, party_size,
    name, phone, email, whatsapp_opt_in, privacy_accepted_at
  ) values (
    p_date, v_slot.start_time, v_slot.end_time, v_starts_at, p_party_size,
    trim(p_name), p_phone, lower(trim(p_email)), coalesce(p_whatsapp_opt_in, false), now()
  )
  returning nb.id, nb.manage_token, nb.date, nb.start_time, nb.end_time, nb.party_size;
end;
$$;

