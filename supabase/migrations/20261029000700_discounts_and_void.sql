-- Sprint 8: discounts (behind an admin code) and an auditable void. Additive; the only drop is the
-- unused create_sale overload written earlier in this same sprint (replaced by the one below).
alter table public.finance_settings add column discount_code_hash text; -- "scrypt$<salt>$<hash>"; null = discounts disabled

alter table public.sales
  add column subtotal_mxn numeric(12,2),
  add column discount_mxn numeric(12,2) not null default 0 check (discount_mxn >= 0),
  add column discount_reason text,
  add column voided_by text;

drop function public.create_sale(date, text, public.payment_method, text, uuid, text, jsonb);

create function public.create_sale(
  p_studio_date date,
  p_slot_label text,
  p_payment_method public.payment_method,
  p_reference text,
  p_booking_id uuid,
  p_created_by text,
  p_items jsonb,
  p_discount_mxn numeric default 0,
  p_discount_reason text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.finance_settings;
  v_sale_id uuid;
  v_subtotal numeric(12,2) := 0;
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
    v_subtotal := v_subtotal + v_product.price_mxn;
  end loop;

  if coalesce(p_discount_mxn, 0) < 0 or p_discount_mxn > v_subtotal
     or (p_discount_mxn > 0 and length(trim(coalesce(p_discount_reason, ''))) = 0) then
    raise exception 'bad_discount';
  end if;

  update public.sales
     set subtotal_mxn = v_subtotal,
         discount_mxn = coalesce(p_discount_mxn, 0),
         discount_reason = case when p_discount_mxn > 0 then trim(p_discount_reason) end,
         total_mxn = v_subtotal - coalesce(p_discount_mxn, 0)
   where id = v_sale_id;
  return v_sale_id;
end;
$$;

revoke all on function public.create_sale(date, text, public.payment_method, text, uuid, text, jsonb, numeric, text) from public, anon, authenticated;
grant execute on function public.create_sale(date, text, public.payment_method, text, uuid, text, jsonb, numeric, text) to service_role;

-- Void a sale (never delete). Rejected when its day is closed. Same lock as create_sale and day close.
create function public.void_sale(p_sale_id uuid, p_reason text, p_voided_by text) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date;
begin
  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'reason_required';
  end if;
  select studio_date into v_date from public.sales where id = p_sale_id;
  if not found then
    raise exception 'unknown_sale';
  end if;
  perform pg_advisory_xact_lock(hashtext('sale-day:' || v_date::text));
  if exists (select 1 from public.daily_closes where studio_date = v_date and reopened_at is null) then
    raise exception 'day_closed';
  end if;
  update public.sales
     set voided_at = now(), void_reason = trim(p_reason), voided_by = p_voided_by
   where id = p_sale_id and voided_at is null;
end;
$$;

revoke all on function public.void_sale(uuid, text, text) from public, anon, authenticated;
grant execute on function public.void_sale(uuid, text, text) to service_role;
