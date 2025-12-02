-- POS schema migration: roles, products, sales, accounts, debts, payments, cash registers

-- 1) Enum for application roles (used by user_roles)
create type public.app_role as enum ('admin', 'moderator', 'user');

-- 2) User roles table (one user can have multiple roles)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- 3) Helper function to check roles safely (security definer to avoid RLS recursion)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

-- Basic RLS for roles: users can see their own roles, admins can manage all
create policy "Users can view their own roles"
  on public.user_roles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can manage all roles"
  on public.user_roles
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 4) Generic updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

-- 5) Domain enums for POS
create type public.payment_method as enum ('efectivo', 'debito', 'credito');
create type public.debt_status as enum ('pendiente', 'parcial', 'pagado');
create type public.account_status as enum ('al-dia', 'deuda', 'condicional');

-- 6) Products table
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Authenticated full access products"
  on public.products
  for all
  to authenticated
  using (true)
  with check (true);

create trigger set_timestamp_products
before update on public.products
for each row
execute function public.update_updated_at_column();

-- 7) Customer accounts (clientes + cuentas corrientes)
create table public.customer_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.account_status not null default 'al-dia',
  total_debt numeric(12,2) not null default 0,
  total_paid numeric(12,2) not null default 0,
  total_remaining numeric(12,2) not null default 0,
  last_movement_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_accounts enable row level security;

create policy "Authenticated full access customer_accounts"
  on public.customer_accounts
  for all
  to authenticated
  using (true)
  with check (true);

create trigger set_timestamp_customer_accounts
before update on public.customer_accounts
for each row
execute function public.update_updated_at_column();

-- 8) Debts table
create table public.debts (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  date timestamptz not null default now(),
  amount numeric(12,2) not null check (amount >= 0),
  description text not null,
  paid_amount numeric(12,2) not null default 0,
  remaining_amount numeric(12,2) not null default 0,
  status public.debt_status not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index debts_customer_account_id_idx on public.debts(customer_account_id);

alter table public.debts enable row level security;

create policy "Authenticated full access debts"
  on public.debts
  for all
  to authenticated
  using (true)
  with check (true);

create trigger set_timestamp_debts
before update on public.debts
for each row
execute function public.update_updated_at_column();

-- 9) Debt items (productos asociados a cada deuda)
create table public.debt_items (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.debts(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create index debt_items_debt_id_idx on public.debt_items(debt_id);
create index debt_items_product_id_idx on public.debt_items(product_id);

alter table public.debt_items enable row level security;

create policy "Authenticated full access debt_items"
  on public.debt_items
  for all
  to authenticated
  using (true)
  with check (true);

-- 10) Payments table
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.debts(id) on delete cascade,
  date timestamptz not null default now(),
  amount numeric(12,2) not null check (amount > 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_debt_id_idx on public.payments(debt_id);

alter table public.payments enable row level security;

create policy "Authenticated full access payments"
  on public.payments
  for all
  to authenticated
  using (true)
  with check (true);

create trigger set_timestamp_payments
before update on public.payments
for each row
execute function public.update_updated_at_column();

-- 11) Sales table
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  date timestamptz not null default now(),
  total numeric(12,2) not null check (total >= 0),
  user_id uuid references auth.users(id) on delete set null,
  customer_account_id uuid references public.customer_accounts(id) on delete set null,
  payment_method public.payment_method not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sales_user_id_idx on public.sales(user_id);
create index sales_customer_account_id_idx on public.sales(customer_account_id);

alter table public.sales enable row level security;

create policy "Authenticated full access sales"
  on public.sales
  for all
  to authenticated
  using (true)
  with check (true);

create trigger set_timestamp_sales
before update on public.sales
for each row
execute function public.update_updated_at_column();

-- 12) Sale items table
create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create index sale_items_sale_id_idx on public.sale_items(sale_id);
create index sale_items_product_id_idx on public.sale_items(product_id);

alter table public.sale_items enable row level security;

create policy "Authenticated full access sale_items"
  on public.sale_items
  for all
  to authenticated
  using (true)
  with check (true);

-- 13) Cash registers table
create table public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  date timestamptz not null default now(),
  opening_balance numeric(12,2) not null default 0,
  closing_balance numeric(12,2) not null default 0,
  total_sales numeric(12,2) not null default 0,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cash_registers_user_id_idx on public.cash_registers(user_id);

alter table public.cash_registers enable row level security;

create policy "Authenticated full access cash_registers"
  on public.cash_registers
  for all
  to authenticated
  using (true)
  with check (true);

create trigger set_timestamp_cash_registers
before update on public.cash_registers
for each row
execute function public.update_updated_at_column();
