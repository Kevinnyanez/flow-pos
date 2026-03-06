-- Product variants (gradual migration)
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text,
  size text,
  color text,
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_variants_product_id_idx on public.product_variants(product_id);
create index if not exists product_variants_sku_idx on public.product_variants(sku);

alter table public.product_variants enable row level security;

drop policy if exists "Authenticated full access product_variants" on public.product_variants;
create policy "Authenticated full access product_variants"
  on public.product_variants
  for all
  to authenticated
  using (true)
  with check (true);

drop trigger if exists set_timestamp_product_variants on public.product_variants;
create trigger set_timestamp_product_variants
before update on public.product_variants
for each row
execute function public.update_updated_at_column();

alter table public.sale_items
  add column if not exists product_variant_id uuid references public.product_variants(id) on delete set null;

alter table public.debt_items
  add column if not exists product_variant_id uuid references public.product_variants(id) on delete set null;

create index if not exists sale_items_product_variant_id_idx on public.sale_items(product_variant_id);
create index if not exists debt_items_product_variant_id_idx on public.debt_items(product_variant_id);

-- Backfill: one default variant per existing product
insert into public.product_variants (product_id, sku, size, color, price, stock, is_default)
select
  p.id as product_id,
  p.code as sku,
  p.size,
  p.color,
  p.price,
  p.stock,
  true as is_default
from public.products p
where not exists (
  select 1
  from public.product_variants pv
  where pv.product_id = p.id
    and pv.is_default = true
);

-- Backfill references from sale_items/debt_items
update public.sale_items si
set product_variant_id = pv.id
from public.product_variants pv
where si.product_id = pv.product_id
  and pv.is_default = true
  and si.product_variant_id is null;

update public.debt_items di
set product_variant_id = pv.id
from public.product_variants pv
where di.product_id = pv.product_id
  and pv.is_default = true
  and di.product_variant_id is null;
