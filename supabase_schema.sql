create extension if not exists pgcrypto;

create type public.app_role as enum ('customer', 'driver', 'operator');
create type public.driver_status as enum ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED');
create type public.vehicle_class as enum ('STANDARD', 'EXECUTIVE', 'WHEELCHAIR_ACCESSIBLE', 'MPV');
create type public.document_type as enum ('PHV_LICENCE', 'INSURANCE', 'MOT', 'DBS_CHECK', 'VEHICLE_REGISTRATION', 'RIGHT_TO_WORK');
create type public.trip_status as enum ('REQUESTED', 'MATCHING', 'ACCEPTED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_DRIVER', 'NO_DRIVERS_AVAILABLE');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.drivers (
  id uuid primary key references public.profiles(id) on delete cascade,
  status public.driver_status not null default 'PENDING',
  licence_number text,
  licence_authority text,
  licence_expiry date,
  dbs_check_expiry date,
  insurance_expiry date,
  is_online boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  vehicle_class public.vehicle_class not null default 'STANDARD',
  registration text not null unique,
  make text,
  model text,
  colour text,
  created_at timestamptz not null default now()
);

create table public.driver_documents (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  document_type public.document_type not null,
  storage_path text not null,
  expiry_date date,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (driver_id, document_type)
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  driver_id uuid references public.drivers(id),
  vehicle_id uuid references public.vehicles(id),
  pickup_lat double precision not null check (pickup_lat between -90 and 90),
  pickup_lng double precision not null check (pickup_lng between -180 and 180),
  pickup_address text not null,
  dropoff_lat double precision not null check (dropoff_lat between -90 and 90),
  dropoff_lng double precision not null check (dropoff_lng between -180 and 180),
  dropoff_address text not null,
  vehicle_class public.vehicle_class not null,
  status public.trip_status not null default 'REQUESTED',
  fare_estimate numeric(10, 2),
  fare_final numeric(10, 2),
  distance_km numeric(10, 2),
  duration_min integer,
  requested_at timestamptz not null default now(),
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trip_events (
  id bigint generated always as identity primary key,
  trip_id uuid not null references public.trips(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  from_status public.trip_status,
  to_status public.trip_status not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.trip_ratings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references public.trips(id) on delete cascade,
  customer_id uuid not null references public.profiles(id),
  driver_id uuid not null references public.drivers(id),
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table public.driver_locations (
  driver_id uuid primary key references public.drivers(id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  vehicle_class public.vehicle_class not null,
  recorded_at timestamptz not null default now()
);

create index trips_customer_id_idx on public.trips(customer_id);
create index trips_driver_status_idx on public.trips(driver_id, status);
create index trips_status_requested_at_idx on public.trips(status, requested_at);
create index trip_events_trip_id_created_at_idx on public.trip_events(trip_id, created_at);
create index driver_locations_recorded_at_idx on public.driver_locations(recorded_at);

create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'operator');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'role' = 'driver' then 'driver'::public.app_role else 'customer'::public.app_role end,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.phone
  )
  on conflict (id) do update set phone = excluded.phone;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.drivers enable row level security;
alter table public.vehicles enable row level security;
alter table public.driver_documents enable row level security;
alter table public.trips enable row level security;
alter table public.trip_events enable row level security;
alter table public.trip_ratings enable row level security;
alter table public.driver_locations enable row level security;

create policy profiles_select_self_or_operator on public.profiles for select using (id = auth.uid() or public.is_operator());
create policy profiles_update_self on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy drivers_select_self_or_operator on public.drivers for select using (id = auth.uid() or public.is_operator());
create policy drivers_insert_self on public.drivers for insert with check (id = auth.uid());
create policy drivers_update_self_or_operator on public.drivers for update using (id = auth.uid() or public.is_operator()) with check (id = auth.uid() or public.is_operator());

create policy vehicles_select_owner_or_operator on public.vehicles for select using (driver_id = auth.uid() or public.is_operator());
create policy vehicles_manage_owner on public.vehicles for all using (driver_id = auth.uid()) with check (driver_id = auth.uid());

create policy documents_select_owner_or_operator on public.driver_documents for select using (driver_id = auth.uid() or public.is_operator());
create policy documents_manage_owner on public.driver_documents for all using (driver_id = auth.uid()) with check (driver_id = auth.uid());

create policy trips_select_participant_or_operator on public.trips for select using (customer_id = auth.uid() or driver_id = auth.uid() or public.is_operator());
create policy trips_insert_customer on public.trips for insert with check (customer_id = auth.uid());
create policy trips_update_participant_or_operator on public.trips for update using (customer_id = auth.uid() or driver_id = auth.uid() or public.is_operator()) with check (customer_id = auth.uid() or driver_id = auth.uid() or public.is_operator());

create policy events_select_participant_or_operator on public.trip_events for select using (exists (select 1 from public.trips where id = trip_id and (customer_id = auth.uid() or driver_id = auth.uid())) or public.is_operator());

create policy ratings_select_participant_or_operator on public.trip_ratings for select using (customer_id = auth.uid() or driver_id = auth.uid() or public.is_operator());
create policy ratings_insert_customer on public.trip_ratings for insert with check (customer_id = auth.uid());

create policy locations_select_authenticated on public.driver_locations for select to authenticated using (true);
create policy locations_manage_driver on public.driver_locations for all using (driver_id = auth.uid()) with check (driver_id = auth.uid());

alter publication supabase_realtime add table public.trips;
alter publication supabase_realtime add table public.driver_locations;
alter publication supabase_realtime add table public.trip_events;