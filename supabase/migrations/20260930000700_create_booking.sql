-- The ONLY way to create a booking. Serializes bookings per slot with an advisory lock and
-- re-checks capacity inside the transaction so seats are never oversold.
-- Errors are raised with a stable code in the message (mapped to Spanish text by the API):
--   invalid_party, out_of_window, date_blocked, slot_not_found, slot_started, slot_full
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

-- Only server code (service role) may call it; never the public API roles.
revoke execute on function public.create_booking(date, time, integer, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.create_booking(date, time, integer, text, text, text, boolean) to service_role;

-- Functions created later are not callable by the public API roles unless granted explicitly.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
