-- Sprint 8: counter sales. Sales are never deleted: they are voided (voided_at). Additive only.
create type public.payment_method as enum ('cash', 'card', 'transfer');

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  studio_date date not null,
  sold_at timestamptz not null default now(),
  slot_label text not null,
  payment_method public.payment_method not null,
  total_mxn numeric(12,2) not null check (total_mxn >= 0),
  reference text,
  booking_id uuid references public.bookings (id),
  created_by text not null,
  voided_at timestamptz,
  void_reason text
);
create index sales_studio_date_idx on public.sales (studio_date);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id),
  product_id uuid not null references public.products (id),
  unit_price_mxn numeric(12,2) not null check (unit_price_mxn >= 0),
  restock_cost_mxn numeric(12,2) not null check (restock_cost_mxn >= 0),
  piece_id uuid references public.pieces (id)
);
create index sale_items_sale_id_idx on public.sale_items (sale_id);
create index sale_items_product_id_idx on public.sale_items (product_id);

alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
