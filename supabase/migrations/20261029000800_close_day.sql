-- Sprint 8: close (or re-close) a day under the same lock as create_sale/void_sale, and refuse
-- if the sales changed since the screen was read (p_values->>'total_mxn' must match the live total).
create function public.close_day(p_studio_date date, p_values jsonb, p_closed_by text) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_live numeric(12,2);
  r public.daily_closes;
begin
  perform pg_advisory_xact_lock(hashtext('sale-day:' || p_studio_date::text));

  select coalesce(sum(total_mxn), 0) into v_live
    from public.sales where studio_date = p_studio_date and voided_at is null;
  if v_live <> (p_values->>'total_mxn')::numeric then
    raise exception 'sales_changed';
  end if;

  r := jsonb_populate_record(null::public.daily_closes, p_values);
  insert into public.daily_closes (
    studio_date, pieces, tickets, total_mxn, cash_mxn, card_mxn, transfer_mxn, cash_float_mxn,
    cash_counted_mxn, cash_diff_mxn, taxes_mxn, inventory_mxn, fixed_mxn, profit_mxn, card_fee_mxn,
    fixed_shortfall_mxn, check_counted, check_deposited, check_moved, notes, closed_by, closed_at, reopened_at
  ) values (
    p_studio_date, r.pieces, r.tickets, r.total_mxn, r.cash_mxn, r.card_mxn, r.transfer_mxn, r.cash_float_mxn,
    r.cash_counted_mxn, r.cash_diff_mxn, r.taxes_mxn, r.inventory_mxn, r.fixed_mxn, r.profit_mxn, r.card_fee_mxn,
    r.fixed_shortfall_mxn, coalesce(r.check_counted, false), coalesce(r.check_deposited, false),
    coalesce(r.check_moved, false), r.notes, p_closed_by, now(), null
  )
  on conflict (studio_date) do update set
    pieces = excluded.pieces, tickets = excluded.tickets, total_mxn = excluded.total_mxn,
    cash_mxn = excluded.cash_mxn, card_mxn = excluded.card_mxn, transfer_mxn = excluded.transfer_mxn,
    cash_float_mxn = excluded.cash_float_mxn, cash_counted_mxn = excluded.cash_counted_mxn,
    cash_diff_mxn = excluded.cash_diff_mxn, taxes_mxn = excluded.taxes_mxn,
    inventory_mxn = excluded.inventory_mxn, fixed_mxn = excluded.fixed_mxn, profit_mxn = excluded.profit_mxn,
    card_fee_mxn = excluded.card_fee_mxn, fixed_shortfall_mxn = excluded.fixed_shortfall_mxn,
    check_counted = excluded.check_counted, check_deposited = excluded.check_deposited,
    check_moved = excluded.check_moved, notes = excluded.notes, closed_by = excluded.closed_by,
    closed_at = excluded.closed_at, reopened_at = null;
end;
$$;

revoke all on function public.close_day(date, jsonb, text) from public, anon, authenticated;
grant execute on function public.close_day(date, jsonb, text) to service_role;
