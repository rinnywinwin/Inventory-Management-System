begin;

alter table public.products add column if not exists image_url text;
alter table public.products add constraint products_nonnegative_quantity check (quantity >= 0);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  movement_type text not null check (movement_type in ('in', 'out')),
  quantity integer not null check (quantity > 0),
  balance_after integer not null check (balance_after >= 0),
  notes text,
  created_at timestamptz not null default now()
);
create index stock_movements_product_date on public.stock_movements(product_id, created_at desc);
alter table public.stock_movements enable row level security;
create policy "Read stock history" on public.stock_movements for select to anon, authenticated using (true);
grant select on public.stock_movements to anon, authenticated;
revoke insert, update, delete on public.stock_movements from anon, authenticated;

create function public.audit_product_stock() returns trigger
language plpgsql security definer set search_path = '' as $$
declare delta integer;
begin
  if TG_OP = 'INSERT' then delta := NEW.quantity;
  else delta := NEW.quantity - OLD.quantity;
  end if;
  if delta <> 0 then
    insert into public.stock_movements(product_id, product_name, movement_type, quantity, balance_after, notes)
    values (NEW.id, NEW.name, case when delta > 0 then 'in' else 'out' end,
      abs(delta), NEW.quantity, coalesce(nullif(current_setting('app.stock_notes', true), ''),
      case when TG_OP = 'INSERT' then 'Opening stock' else 'Quantity adjustment' end));
  end if;
  return NEW;
end;
$$;
create trigger audit_product_stock after insert or update of quantity on public.products
for each row execute function public.audit_product_stock();

create function public.record_stock_movement(p_product_id uuid, p_movement_type text, p_quantity integer, p_notes text default null)
returns public.products language plpgsql security invoker set search_path = '' as $$
declare item public.products;
begin
  if p_movement_type is null or p_movement_type not in ('in', 'out') or p_quantity is null or p_quantity <= 0 then
    raise exception 'Choose stock in/out and a positive whole quantity';
  end if;
  select * into item from public.products where id = p_product_id for update;
  if not found then raise exception 'Product not found'; end if;
  if p_movement_type = 'out' and item.quantity < p_quantity then
    raise exception 'Insufficient stock';
  end if;
  perform set_config('app.stock_notes', left(coalesce(p_notes, ''), 1000), true);
  update public.products set quantity = quantity + case when p_movement_type = 'in' then p_quantity else -p_quantity end
    where id = p_product_id returning * into item;
  return item;
end;
$$;
revoke all on function public.record_stock_movement(uuid, text, integer, text) from public;
grant execute on function public.record_stock_movement(uuid, text, integer, text) to anon, authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy "Upload product images" on storage.objects for insert to anon, authenticated
with check (bucket_id = 'product-images');

commit;
