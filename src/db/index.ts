import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { newDb } from "pg-mem";
import { randomUUID } from "node:crypto";

export const SCHEMA_DDL_STATEMENTS: string[] = [
  `create table if not exists salons (
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
  )`,
  `alter table salons add column if not exists area text not null default 'Lahore'`,
  `alter table salons add column if not exists city text not null default 'Lahore'`,
  `alter table salons add column if not exists open_time text not null default '11:00'`,
  `alter table salons add column if not exists close_time text not null default '20:00'`,
  `alter table salons add column if not exists closed_days jsonb not null default '[]'`,
  `alter table salons add column if not exists repeat_enabled boolean not null default true`,
  `alter table salons add column if not exists review_url text`,
  `alter table salons add column if not exists branches jsonb not null default '[]'`,
  `alter table salons add column if not exists plan text not null default 'growth'`,
  `alter table salons add column if not exists admin_pin text not null default '2468'`,
  `alter table salons add column if not exists created_at timestamptz not null default now()`,

  `create table if not exists staff_members (
    id uuid primary key default gen_random_uuid(),
    salon_id uuid not null references salons(id) on delete cascade,
    name text not null,
    specialty text not null default 'Stylist',
    role text not null default 'Stylist',
    phone_masked text not null default '+92 3•• ••••—',
    active boolean not null default true,
    rating integer not null default 5,
    created_at timestamptz not null default now()
  )`,
  `alter table staff_members add column if not exists specialty text not null default 'Stylist'`,
  `alter table staff_members add column if not exists role text not null default 'Stylist'`,
  `alter table staff_members add column if not exists phone_masked text not null default '+92 3•• ••••—'`,
  `alter table staff_members add column if not exists active boolean not null default true`,
  `alter table staff_members add column if not exists rating integer not null default 5`,
  `alter table staff_members add column if not exists created_at timestamptz not null default now()`,

  `create table if not exists chairs (
    id uuid primary key default gen_random_uuid(),
    salon_id uuid not null references salons(id) on delete cascade,
    name text not null,
    kind text not null default 'chair',
    staff_id uuid,
    active boolean not null default true,
    sort_order integer not null default 0
  )`,
  `alter table chairs add column if not exists kind text not null default 'chair'`,
  `alter table chairs add column if not exists staff_id uuid`,
  `alter table chairs add column if not exists active boolean not null default true`,
  `alter table chairs add column if not exists sort_order integer not null default 0`,

  `create table if not exists retail_products (
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
  )`,
  `alter table retail_products add column if not exists description text not null default ''`,
  `alter table retail_products add column if not exists category text not null default 'Haircare'`,
  `alter table retail_products add column if not exists stock integer not null default 8`,
  `alter table retail_products add column if not exists emoji text not null default '✨'`,
  `alter table retail_products add column if not exists image_url text`,
  `alter table retail_products add column if not exists active boolean not null default true`,
  `alter table retail_products add column if not exists sort_order integer not null default 0`,
  `alter table retail_products add column if not exists created_at timestamptz not null default now()`,

  `create table if not exists product_orders (
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
  )`,

  `create table if not exists services (
    id uuid primary key default gen_random_uuid(),
    salon_id uuid not null references salons(id) on delete cascade,
    name text not null,
    price_pkr integer not null,
    duration_mins integer not null default 45,
    category text not null default 'regular',
    active boolean not null default true,
    sort_order integer not null default 0
  )`,
  `alter table services add column if not exists duration_mins integer not null default 45`,
  `alter table services add column if not exists category text not null default 'regular'`,
  `alter table services add column if not exists active boolean not null default true`,
  `alter table services add column if not exists sort_order integer not null default 0`,

  `create table if not exists customers (
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
  )`,
  `alter table customers add column if not exists last_service text not null default ''`,
  `alter table customers add column if not exists visits integer not null default 1`,
  `alter table customers add column if not exists tag text not null default 'regular'`,
  `alter table customers add column if not exists preferred_staff text`,
  `alter table customers add column if not exists notes text not null default ''`,
  `alter table customers add column if not exists total_spent_pkr integer not null default 0`,
  `alter table customers add column if not exists last_visit_iso text`,
  `alter table customers add column if not exists created_at timestamptz not null default now()`,

  `create table if not exists bookings (
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
  )`,
  `alter table bookings add column if not exists staff_name text`,
  `alter table bookings add column if not exists chair_id uuid`,
  `alter table bookings add column if not exists branch text`,
  `alter table bookings add column if not exists status text not null default 'confirmed'`,
  `alter table bookings add column if not exists source text not null default 'chat'`,
  `alter table bookings add column if not exists price_pkr integer not null default 0`,
  `alter table bookings add column if not exists notes text not null default ''`,
  `alter table bookings add column if not exists created_at timestamptz not null default now()`,

  `create table if not exists missed_messages (
    id uuid primary key default gen_random_uuid(),
    salon_id uuid not null references salons(id) on delete cascade,
    channel text not null default 'whatsapp',
    customer_label text not null,
    snippet text not null,
    status text not null default 'pending',
    created_at timestamptz not null default now()
  )`,

  `create table if not exists waitlist_entries (
    id uuid primary key default gen_random_uuid(),
    salon_id uuid not null references salons(id) on delete cascade,
    customer_name text not null,
    phone_masked text not null,
    service_name text not null,
    preferred_time text not null,
    status text not null default 'waiting',
    created_at timestamptz not null default now()
  )`,

  `create table if not exists review_requests (
    id uuid primary key default gen_random_uuid(),
    salon_id uuid not null references salons(id) on delete cascade,
    customer_name text not null,
    service_name text not null,
    status text not null default 'sent',
    created_at timestamptz not null default now()
  )`,

  `create table if not exists activity_events (
    id uuid primary key default gen_random_uuid(),
    salon_id uuid not null references salons(id) on delete cascade,
    kind text not null,
    detail text not null,
    created_at timestamptz not null default now()
  )`,
];

function safeDecode(val: string): string {
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

function resolveRawDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.DIRECT_URL ||
    ""
  ).trim();
}

export function normalizeDatabaseUrl(raw: string): {
  connectionString: string;
  isLocal: boolean;
} | null {
  let clean = raw.trim().replace(/^["']+|["']+$/g, "").trim();
  if (!clean) return null;
  if (
    clean.includes("[YOUR-PASSWORD]") ||
    clean.includes("<password>") ||
    clean.includes("YOUR_PASSWORD")
  ) {
    return null;
  }

  // Encode special characters (@, #, ?) inside user:password before parsing URL
  const protoMatch = clean.match(/^(postgres(?:ql)?:\/\/)(.+)$/i);
  if (protoMatch) {
    const proto = protoMatch[1];
    const rest = protoMatch[2];
    const slashIdx = rest.indexOf("/");
    const hostAndAuth = slashIdx >= 0 ? rest.slice(0, slashIdx) : rest;
    const pathAndQuery = slashIdx >= 0 ? rest.slice(slashIdx) : "";
    const lastAt = hostAndAuth.lastIndexOf("@");
    if (lastAt > 0) {
      const userPass = hostAndAuth.slice(0, lastAt);
      const hostPort = hostAndAuth.slice(lastAt + 1);
      const colonIdx = userPass.indexOf(":");
      if (colonIdx > 0) {
        const rawUser = userPass.slice(0, colonIdx);
        const rawPass = userPass.slice(colonIdx + 1);
        const decUser = safeDecode(rawUser);
        const decPass = safeDecode(rawPass);
        clean = `${proto}${encodeURIComponent(decUser)}:${encodeURIComponent(decPass)}@${hostPort}${pathAndQuery}`;
      }
    }
  }

  try {
    const parsed = new URL(clean);
    const host = parsed.hostname.toLowerCase();
    const isLocal =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith(".local");

    // Strip sslmode / pooler flags so pg-connection-string does not enforce strict verify-full on Supabase
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("pgbouncer");
    parsed.searchParams.delete("connection_limit");
    parsed.searchParams.delete("supa");

    return {
      connectionString: parsed.toString(),
      isLocal,
    };
  } catch {
    return null;
  }
}

type QueryLikePool = {
  query: (queryTextOrConfig: unknown, values?: unknown[]) => Promise<{ rows: unknown[]; rowCount?: number }>;
  connect?: () => Promise<unknown>;
};

interface DbRuntimeState {
  pgPool?: Pool;
  memPool?: QueryLikePool;
  memInitPromise?: Promise<void>;
  useMemoryFallback: boolean;
  lastError?: string;
}

const globalForDb = globalThis as typeof globalThis & {
  __wbxDbState?: DbRuntimeState;
};

function getState(): DbRuntimeState {
  if (!globalForDb.__wbxDbState) {
    const normalized = normalizeDatabaseUrl(resolveRawDatabaseUrl());
    let pgPool: Pool | undefined;
    if (normalized) {
      pgPool = new Pool({
        connectionString: normalized.connectionString,
        ssl: normalized.isLocal ? false : { rejectUnauthorized: false },
        max: 5,
        connectionTimeoutMillis: 6000,
        idleTimeoutMillis: 20000,
      });
      pgPool.on("error", () => {
        // Prevent unhandled idle client error crashes
      });
    }
    globalForDb.__wbxDbState = {
      pgPool,
      useMemoryFallback: !pgPool,
    };
  }
  return globalForDb.__wbxDbState;
}

async function getReadyMemPool(state: DbRuntimeState): Promise<QueryLikePool> {
  if (!state.memPool) {
    const mem = newDb();
    mem.public.registerFunction({
      name: "gen_random_uuid",
      returns: "uuid" as never,
      implementation: () => randomUUID(),
      impure: true,
    });
    const { Pool: MemPool } = mem.adapters.createPg();
    const rawPool = new MemPool();

    const wrapped: QueryLikePool = {
      async query(queryTextOrConfig: unknown, values?: unknown[]) {
        if (typeof queryTextOrConfig === "object" && queryTextOrConfig !== null) {
          const cfg = queryTextOrConfig as {
            text: string;
            values?: unknown[];
            rowMode?: string;
          };
          const params = values ?? cfg.values ?? [];
          const res = await rawPool.query(cfg.text, params);
          if (cfg.rowMode === "array") {
            return {
              ...res,
              rows: (res.rows ?? []).map((r: Record<string, unknown>) => Object.values(r)),
            };
          }
          return res;
        }
        return rawPool.query(queryTextOrConfig as string, values);
      },
      async connect() {
        return {
          query: wrapped.query,
          release: () => {},
        };
      },
    };
    state.memPool = wrapped;
    state.memInitPromise = (async () => {
      for (const stmt of SCHEMA_DDL_STATEMENTS) {
        if (stmt.trim().toLowerCase().startsWith("create table")) {
          await rawPool.query(stmt);
        }
      }
    })();
  }
  if (state.memInitPromise) {
    await state.memInitPromise;
  }
  return state.memPool;
}

export function getDbStatus(): { mode: "postgres" | "memory-fallback"; lastError: string | null } {
  const s = getState();
  return {
    mode: s.useMemoryFallback ? "memory-fallback" : "postgres",
    lastError: s.lastError ?? null,
  };
}

export const pool = {
  async query(queryTextOrConfig: unknown, values?: unknown[]) {
    const state = getState();
    if (!state.useMemoryFallback && state.pgPool) {
      try {
        return await (state.pgPool.query as (q: unknown, v?: unknown[]) => Promise<unknown>)(
          queryTextOrConfig,
          values,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const code = (err as { code?: string })?.code ?? "";
        const isConnectionOrAuthError =
          /ECONNREFUSED|ENOTFOUND|ENETUNREACH|EHOSTUNREACH|ETIMEDOUT|EAI_AGAIN|SELF_SIGNED_CERT|certificate|Connection terminated|timeout|password authentication failed|Tenant or user not found|no pg_hba\.conf|database .* does not exist/i.test(
            msg,
          ) ||
          ["ECONNREFUSED", "ENOTFOUND", "ENETUNREACH", "ETIMEDOUT", "28P01", "28000", "3D000", "XX000", "08001", "08006"].includes(
            code,
          );
        if (isConnectionOrAuthError) {
          state.lastError = msg;
          state.useMemoryFallback = true;
          const memPool = await getReadyMemPool(state);
          return memPool.query(queryTextOrConfig, values);
        }
        throw err;
      }
    }
    const memPool = await getReadyMemPool(state);
    return memPool.query(queryTextOrConfig, values);
  },
  async connect() {
    const state = getState();
    if (!state.useMemoryFallback && state.pgPool) {
      try {
        return await state.pgPool.connect();
      } catch (err) {
        state.lastError = err instanceof Error ? err.message : String(err);
        state.useMemoryFallback = true;
      }
    }
    const memPool = await getReadyMemPool(state);
    return memPool.connect!();
  },
} as unknown as Pool;

export const db = drizzle(pool);
