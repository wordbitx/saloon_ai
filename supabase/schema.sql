-- ─────────────────────────────────────────────────────────────────────────────
-- WordbitX — Missed Booking Recovery
-- Supabase (Postgres) complete schema + Row Level Security
--
-- OWNER STEPS:
--  1. Supabase project banayein → SQL Editor mein yeh file chalayein
--     (ya sirf DATABASE_URL lagayein — app pehli request par khud tables aur
--     demo data seed kar deti hai).
--  2. Phase 2 mein Supabase Auth use karein; har user ke JWT app_metadata mein
--     `salon_id` (uuid) set karein.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

create table if not exists salons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  area text not null default 'Lahore',
  city text not null default 'Lahore',
  greeting text not null,
  open_time text not null default '11:00',
  close_time text not null default '20:00',
  closed_days jsonb not null default '[]',
  repeat_enabled boolean not null default true,
  review_url text,
  branches jsonb not null default '[]',
  plan text not null default 'growth',
  admin_pin text not null default '2468',
  created_at timestamptz not null default now()
);

alter table salons add column if not exists plan text not null default 'growth';
alter table salons add column if not exists admin_pin text not null default '2468';

create table if not exists staff_members (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  name text not null,
  specialty text not null default 'Stylist',
  role text not null default 'Stylist',
  phone_masked text not null default '+92 3•• ••••—',
  active boolean not null default true,
  rating integer not null default 5,
  created_at timestamptz not null default now()
);

alter table staff_members add column if not exists role text not null default 'Stylist';
alter table staff_members add column if not exists phone_masked text not null default '+92 3•• ••••—';
alter table staff_members add column if not exists active boolean not null default true;
alter table staff_members add column if not exists rating integer not null default 5;
alter table staff_members add column if not exists created_at timestamptz not null default now();

create table if not exists chairs (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  name text not null,
  kind text not null default 'chair',
  staff_id uuid,
  active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists retail_products (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  name text not null,
  description text not null default '',
  price_pkr integer not null,
  category text not null default 'Haircare',
  stock integer not null default 8,
  emoji text not null default '✨',
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists product_orders (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  order_code text not null,
  customer_name text not null,
  phone_masked text not null,
  product_id uuid,
  product_name text not null,
  qty integer not null default 1,
  price_pkr integer not null,
  total_pkr integer not null,
  note text not null default '',
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  name text not null,
  price_pkr integer not null,
  duration_mins integer not null default 45,
  category text not null default 'regular',
  active boolean not null default true,
  sort_order integer not null default 0
);

alter table services add column if not exists active boolean not null default true;

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  persona_key text not null,
  name text not null,
  phone_masked text not null,
  last_service text not null default '',
  visits integer not null default 1,
  tag text not null default 'regular',
  preferred_staff text,
  notes text not null default '',
  total_spent_pkr integer not null default 0,
  last_visit_iso text,
  created_at timestamptz not null default now()
);

alter table customers add column if not exists tag text not null default 'regular';
alter table customers add column if not exists preferred_staff text;
alter table customers add column if not exists notes text not null default '';
alter table customers add column if not exists total_spent_pkr integer not null default 0;
alter table customers add column if not exists last_visit_iso text;
alter table customers add column if not exists created_at timestamptz not null default now();

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  customer_name text not null,
  phone_masked text not null,
  service_name text not null,
  staff_name text,
  chair_id uuid,
  date text not null,
  time text not null,
  branch text,
  status text not null default 'confirmed',
  source text not null default 'chat',
  price_pkr integer not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table bookings add column if not exists chair_id uuid;
alter table bookings add column if not exists branch text;
alter table bookings add column if not exists price_pkr integer not null default 0;
alter table bookings add column if not exists notes text not null default '';

create table if not exists missed_messages (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  channel text not null default 'whatsapp',
  customer_label text not null,
  snippet text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  customer_name text not null,
  phone_masked text not null,
  service_name text not null,
  preferred_time text not null,
  status text not null default 'waiting',
  created_at timestamptz not null default now()
);

create table if not exists review_requests (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  customer_name text not null,
  service_name text not null,
  status text not null default 'sent',
  created_at timestamptz not null default now()
);

create table if not exists activity_events (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  kind text not null,
  detail text not null,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_bookings_salon on bookings(salon_id, created_at desc);
create index if not exists idx_missed_salon on missed_messages(salon_id, created_at desc);
create index if not exists idx_services_salon on services(salon_id, sort_order);
create index if not exists idx_products_salon on retail_products(salon_id, sort_order);
create index if not exists idx_chairs_salon on chairs(salon_id, sort_order);
