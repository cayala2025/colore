-- Sprint 8: create a sale (ticket + items) in one transaction. Prices and restock cost are
-- snapshotted here. Rejected when the studio date has a closed (not reopened) daily close.
-- p_items: jsonb array of {"product_id": "<uuid>", "piece_id": "<uuid>|null"}.
create or replace function public.create_sale(
  p_studio_date date,
  p_slot_label text,
  p_payment_method public.payment_method,
  p_reference text,
  p_booking_id uuid,
  p_created_by text,
  p_items jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.finance_settings;
  v_sale_id uuid;
  v_total numeric(12,2) := 0;
  v_item jsonb;
  v_product public.products;
  v_cost numeric(12,2);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_sale';
  end if;

  perform pg_advisory_xact_lock(hashtext('sale-day:' || p_studio_date::text));

  if exists (select 1 from public.daily_closes where studio_date = p_studio_date and reopened_at is null) then
    raise exception 'day_closed';
  end if;

  select * into v_settings from public.finance_settings where id = 1;

  insert into public.sales (studio_date, slot_label, payment_method, total_mxn, reference, booking_id, created_by)
  values (p_studio_date, p_slot_label, p_payment_method, 0, nullif(trim(p_reference), ''), p_booking_id, p_created_by)
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid and active;
    if not found then
      raise exception 'unknown_product';
    end if;
    v_cost := round(v_product.cost_usd * v_settings.fx_rate * (1 + v_settings.waste_rate) + v_settings.supplies_per_piece_mxn, 2);
    insert into public.sale_items (sale_id, product_id, unit_price_mxn, restock_cost_mxn, piece_id)
    values (v_sale_id, v_product.id, v_product.price_mxn, v_cost, nullif(v_item->>'piece_id', '')::uuid);
    v_total := v_total + v_product.price_mxn;
  end loop;

  update public.sales set total_mxn = v_total where id = v_sale_id;
  return v_sale_id;
end;
$$;

revoke all on function public.create_sale(date, text, public.payment_method, text, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_sale(date, text, public.payment_method, text, uuid, text, jsonb) to service_role;
