-- Sprint 8: purchasing, physical counts, adjustments and real expenses. Additive only.
create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  ordered_on date not null,
  status text not null default 'ordered' check (status in ('ordered', 'received', 'cancelled')),
  total_usd numeric(12,2) not null default 0,
  total_mxn numeric(12,2) not null default 0,
  fx_rate numeric(10,4) not null,
  received_on date,
  notes text,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders (id),
  product_id uuid not null references public.products (id),
  cases integer not null check (cases > 0),
  pieces integer not null check (pieces > 0),
  cost_usd numeric(12,2) not null check (cost_usd >= 0)
);
create index purchase_order_items_order_idx on public.purchase_order_items (purchase_order_id);
create index purchase_order_items_product_idx on public.purchase_order_items (product_id);

create table public.inventory_counts (
  id uuid primary key default gen_random_uuid(),
  counted_on date not null,
  note text,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table public.inventory_count_items (
  id uuid primary key default gen_random_uuid(),
  count_id uuid not null references public.inventory_counts (id),
  product_id uuid not null references public.products (id),
  quantity integer not null check (quantity >= 0),
  unique (count_id, product_id)
);
create index inventory_count_items_product_idx on public.inventory_count_items (product_id);

-- quantity is a signed change to stock (breakage = negative).
create table public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id),
  quantity integer not null check (quantity <> 0),
  reason text not null check (reason in ('broken', 'lost', 'other')),
  adjusted_at timestamptz not null default now(),
  created_by text not null
);
create index inventory_adjustments_product_idx on public.inventory_adjustments (product_id);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null,
  category text not null check (category in ('rent', 'electricity', 'water', 'payroll', 'marketing', 'accounting', 'other')),
  amount_mxn numeric(12,2) not null check (amount_mxn >= 0),
  note text,
  created_by text not null,
  created_at timestamptz not null default now()
);
create index expenses_spent_on_idx on public.expenses (spent_on);

alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.inventory_counts enable row level security;
alter table public.inventory_count_items enable row level security;
alter table public.inventory_adjustments enable row level security;
alter table public.expenses enable row level security;

-- Initial physical count (Bisque Imports receipt #461634).
with c as (
  insert into public.inventory_counts (counted_on, note, created_by)
  values ('2026-10-28', 'Pestaña Inventario + recibo Bisque Imports #461634', 'seed')
  returning id
)
insert into public.inventory_count_items (count_id, product_id, quantity)
select c.id, p.id, v.qty
from c
join (values
  ('taza', 198), ('joyero', 68), ('matcha', 60), ('plato', 48), ('ovalado', 48),
  ('tina', 40), ('azulejo', 48), ('pumpkin', 36), ('calabaza', 28)
) as v(sku, qty) on true
join public.products p on p.sku = v.sku;
