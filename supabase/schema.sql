
-- Phumi Kiri Fresh Fruit Shop: run this file in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.products (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name_km text not null default '',
 name_en text not null,
 description text not null default '',
 category text not null default 'Fruit',
 unit text not null check (unit in ('kg','box')),
 purchase_price numeric(14,2) not null default 0 check (purchase_price >= 0),
 selling_price numeric(14,2) not null default 0 check (selling_price >= 0),
 price_currency text not null default 'USD' check (price_currency in ('USD','KHR')),
 stock numeric(14,3) not null default 0 check (stock >= 0),
 low_stock_level numeric(14,3) not null default 5 check (low_stock_level >= 0),
 created_at timestamptz not null default now()
);
create table if not exists public.stock_movements (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete restrict,
 movement_type text not null check (movement_type in ('IN','OUT','ADJUSTMENT')),
 quantity numeric(14,3) not null check (quantity > 0),
 unit_cost numeric(14,2) not null default 0,
 note text not null default '',
 created_at timestamptz not null default now()
);
create table if not exists public.sales (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete restrict,
 quantity numeric(14,3) not null check (quantity > 0),
 unit_price numeric(14,2) not null check (unit_price >= 0),
 currency text not null default 'USD' check (currency in ('USD','KHR')),
 total numeric(14,2) not null check (total >= 0),
 customer text not null default '',
 note text not null default '',
 created_at timestamptz not null default now()
);
create table if not exists public.expenses (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null,
 category text not null default 'Other',
 amount numeric(14,2) not null check (amount > 0),
 currency text not null default 'USD' check (currency in ('USD','KHR')),
 note text not null default '',
 created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.sales enable row level security;
alter table public.expenses enable row level security;

do $$ declare t text; begin
 foreach t in array array['products','stock_movements','sales','expenses'] loop
  execute format('drop policy if exists "owner manages own %1$s" on public.%1$s',t);
  execute format('create policy "owner manages own %1$s" on public.%1$s for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',t);
 end loop;
end $$;

-- Atomic stock-in: movement and stock update happen together.
create or replace function public.stock_in(p_product_id uuid,p_quantity numeric,p_unit_cost numeric,p_note text default '')
returns void language plpgsql security invoker set search_path=public as $$
begin
 if p_quantity <= 0 then raise exception 'Quantity must be positive'; end if;
 update products set stock=stock+p_quantity, purchase_price=p_unit_cost
 where id=p_product_id and user_id=auth.uid();
 if not found then raise exception 'Product not found'; end if;
 insert into stock_movements(user_id,product_id,movement_type,quantity,unit_cost,note)
 values(auth.uid(),p_product_id,'IN',p_quantity,p_unit_cost,coalesce(p_note,''));
end $$;

create or replace function public.stock_out(p_product_id uuid,p_quantity numeric,p_note text default '')
returns void language plpgsql security invoker set search_path=public as $$
begin
 if p_quantity <= 0 then raise exception 'Quantity must be positive'; end if;
 update products set stock=stock-p_quantity
 where id=p_product_id and user_id=auth.uid() and stock>=p_quantity;
 if not found then raise exception 'Not enough stock or product not found'; end if;
 insert into stock_movements(user_id,product_id,movement_type,quantity,note)
 values(auth.uid(),p_product_id,'OUT',p_quantity,coalesce(p_note,''));
end $$;

create or replace function public.record_sale(p_product_id uuid,p_quantity numeric,p_unit_price numeric,p_currency text,p_customer text default '',p_note text default '')
returns uuid language plpgsql security invoker set search_path=public as $$
declare new_id uuid; v_total numeric;
begin
 if p_quantity <= 0 or p_unit_price < 0 then raise exception 'Invalid quantity or price'; end if;
 update products set stock=stock-p_quantity
 where id=p_product_id and user_id=auth.uid() and stock>=p_quantity;
 if not found then raise exception 'Not enough stock or product not found'; end if;
 v_total=round(p_quantity*p_unit_price,2);
 insert into sales(user_id,product_id,quantity,unit_price,currency,total,customer,note)
 values(auth.uid(),p_product_id,p_quantity,p_unit_price,p_currency,v_total,coalesce(p_customer,''),coalesce(p_note,'')) returning id into new_id;
 insert into stock_movements(user_id,product_id,movement_type,quantity,note)
 values(auth.uid(),p_product_id,'OUT',p_quantity,'Sale '||new_id::text);
 return new_id;
end $$;
