-- Marrions Pharmacy: product unit conversion and fractional selling
alter table public.products
  add column if not exists base_unit text not null default 'unit',
  add column if not exists purchase_unit text not null default 'unit',
  add column if not exists units_per_purchase numeric not null default 1,
  add column if not exists purchase_cost numeric,
  add column if not exists sale_unit text not null default 'unit',
  add column if not exists sale_step numeric not null default 1;

update public.products
set base_unit = coalesce(nullif(base_unit, ''), 'unit'),
    purchase_unit = coalesce(nullif(purchase_unit, ''), coalesce(nullif(base_unit, ''), 'unit')),
    units_per_purchase = case when units_per_purchase is null or units_per_purchase <= 0 then 1 else units_per_purchase end,
    sale_unit = coalesce(nullif(sale_unit, ''), coalesce(nullif(base_unit, ''), 'unit')),
    sale_step = case when sale_step is null or sale_step <= 0 then 1 else sale_step end;

alter table public.products
  add constraint products_units_per_purchase_positive check (units_per_purchase > 0),
  add constraint products_sale_step_positive check (sale_step > 0);
