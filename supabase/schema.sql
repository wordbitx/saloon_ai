-- ─────────────────────────────────────────────────────────────────────────────
-- WordbitX — Missed Booking Recovery
-- Supabase (Postgres) schema + Row Level Security
--
-- OWNER STEPS:
--  1. Supabase project banayein → SQL Editor mein yeh file chalayein.
--  2. Supabase Auth use karein; har user ke JWT app_metadata mein `salon_id`
--     (uuid) set karein (dashboard ya admin API se).
--  3. RLS isi claim se har row filter karti hai — Salon B kabhi Salon A ka
--     data nahi dekh sakta, chahe direct API call ho.
--
-- NOTE: Sandbox/preview Drizzle (src/db/schema.ts) se isi structure ko local
-- Postgres par chalata hai. Production Supabase par yeh SQL canonical hai.
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
  created_at timestamptz not null default now()
);

create table if not exists staff_members (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  name text not null,
  specialty text not null default 'Stylist'
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  name text not null,
  price_pkr integer not null,
  duration_mins integer not null default 45,
  category text not null default 'regular',
  sort_order integer not null default 0
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  persona_key text not null,
  name text not null,
  phone_masked text not null,
  last_service text not null,
  visits integer not null default 1
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  customer_name text not null,
  phone_masked text not null,
  service_name text not null,
  staff_name text,
  date text not null,
  time text not null,
  status text not null default 'confirmed',
  source text not null default 'chat',
  created_at timestamptz not null default now()
);

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

-- ── ROW LEVEL SECURITY — tenant isolation (NON-NEGOTIABLE) ──────────────────
-- JWT claim: auth.jwt() -> app_metadata ->> 'salon_id'

alter table salons enable row level security;
alter table staff_members enable row level security;
alter table services enable row level security;
alter table customers enable row level security;
alter table bookings enable row level security;
alter table missed_messages enable row level security;
alter table waitlist_entries enable row level security;
alter table review_requests enable row level security;
alter table activity_events enable row level security;

create policy salon_self on salons
  for all using (id = ((auth.jwt() -> 'app_metadata' ->> 'salon_id')::uuid));

create policy tenant_isolation_staff on staff_members
  for all using (salon_id = ((auth.jwt() -> 'app_metadata' ->> 'salon_id')::uuid));

create policy tenant_isolation_services on services
  for all using (salon_id = ((auth.jwt() -> 'app_metadata' ->> 'salon_id')::uuid));

create policy tenant_isolation_customers on customers
  for all using (salon_id = ((auth.jwt() -> 'app_metadata' ->> 'salon_id')::uuid));

create policy tenant_isolation_bookings on bookings
  for all using (salon_id = ((auth.jwt() -> 'app_metadata' ->> 'salon_id')::uuid));

create policy tenant_isolation_missed on missed_messages
  for all using (salon_id = ((auth.jwt() -> 'app_metadata' ->> 'salon_id')::uuid));

create policy tenant_isolation_waitlist on waitlist_entries
  for all using (salon_id = ((auth.jwt() -> 'app_metadata' ->> 'salon_id')::uuid));

create policy tenant_isolation_reviews on review_requests
  for all using (salon_id = ((auth.jwt() -> 'app_metadata' ->> 'salon_id')::uuid));

create policy tenant_isolation_events on activity_events
  for all using (salon_id = ((auth.jwt() -> 'app_metadata' ->> 'salon_id')::uuid));

-- Helpful indexes
create index if not exists idx_bookings_salon on bookings(salon_id, created_at desc);
create index if not exists idx_missed_salon on missed_messages(salon_id, created_at desc);
create index if not exists idx_services_salon on services(salon_id, sort_order);