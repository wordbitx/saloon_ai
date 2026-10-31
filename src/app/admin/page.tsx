"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, ShieldX, LogOut, Delete, CornerDownLeft, Building2, Download, RotateCcw, Crown, ShoppingBag, Package,
  CalendarCheck, Users, UserCog, Scissors, Armchair, Settings2, LayoutDashboard, Gauge, MessageCircle,
  KeyRound, ArrowUpRight, Lock, Sparkles, ListOrdered, Star, CalendarDays,
} from "lucide-react";
import { useAdmin } from "@/components/dash/admin";
import {Logo, ThemeToggle, CountUp, cn} from "@/components/ui";
import { Panel, Btn, Field, Tag, useToast, Empty } from "@/components/dash/bits";
import { BookingsManager } from "@/components/dash/bookings-manager";
import FloorPanel from "@/app/dashboard/floor/page";
import ClientsPanel from "@/app/dashboard/clients/page";
import TeamPanel from "@/app/dashboard/team/page";
import ServicesPanel from "@/app/dashboard/services/page";
import ChairsPanel from "@/app/dashboard/chairs/page";
import SettingsPanel from "@/app/dashboard/settings/page";
import WaitlistPanel from "@/app/dashboard/waitlist/page";
import ProductsPanel from "@/app/dashboard/products/page";
import OrdersPanel from "@/app/dashboard/orders/page";

type Tab = "console" | "bookings" | "floor" | "waitlist" | "orders" | "clients" | "staff" | "services" | "products" | "chairs" | "settings";

const TABS: { key: Tab; label: string; icon: typeof Gauge }[] = [
  { key: "console", label: "Control Room", icon: Gauge },
  { key: "bookings", label: "Bookings", icon: CalendarCheck },
  { key: "floor", label: "Chair Schedule", icon: CalendarDays },
  { key: "waitlist", label: "Waitlist", icon: ListOrdered },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "clients", label: "Clients", icon: Users },
  { key: "staff", label: "Staff", icon: UserCog },
  { key: "services", label: "Services", icon: Scissors },
  { key: "products", label: "Products", icon: Package },
  { key: "chairs", label: "Chairs", icon: Armchair },
  { key: "settings", label: "Salon Settings", icon: Settings2 },
];

const PLANS = [
  { key: "starter", name: "Starter", pkr: "5,000", usd: "29" },
  { key: "growth", name: "Growth", pkr: "10,000", usd: "59" },
  { key: "business", name: "Business", pkr: "15,000", usd: "99" },
];

function PinPad({ onPin }: { onPin: (pin: string) => Promise<string | null> }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  const press = (d: string) => {
    setError(null);
    setPin((p) => (p.length >= 8 ? p : p + d));
  };
  const submit = useCallback(async () => {
    if (!pin || busy) return;
    setBusy(true);
    const msg = await onPin(pin);
    setBusy(false);
    if (msg) {
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 420);
      setPin("");
    }
  }, [pin, busy, onPin]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") press(e.key);
      else if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
      else if (e.key === "Enter") void submit();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [submit]);

  return (
    <div className={cn("admin-pinpad", shake && "admin-shake")}>
      <div className="admin-pin-readout" role="status" aria-live="polite">
        <span className="admin-pin-eyebrow">ENTER ADMINISTRATOR PIN</span>
        <div className="mt-3 flex items-center justify-center gap-2" aria-label={`${pin.length} digits entered`}>
          {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
            <span key={i} className={cn("admin-pin-dot", i < pin.length && "is-on")} />
          ))}
        </div>
        <p className="mt-2.5 text-[10.5px] text-mut">Demo PIN <b className="text-accent">2468</b> · keyboard se bhi likh sakte hain</p>
      </div>
      <div className="admin-keypad" role="group" aria-label="PIN keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d, i) => (
          <button key={d} ref={i === 0 ? firstRef : undefined} type="button" className="admin-key" onClick={() => press(d)}>{d}</button>
        ))}
        <button type="button" className="admin-key admin-key-util" onClick={() => setPin("")} aria-label="Clear">C</button>
        <button type="button" className="admin-key" onClick={() => press("0")}>0</button>
        <button type="button" className="admin-key admin-key-util" onClick={() => setPin((p) => p.slice(0, -1))} aria-label="Backspace"><Delete size={16} /></button>
      </div>
      <button type="button" onClick={() => void submit()} disabled={busy || pin.length < 4} className="btn-brand admin-pin-submit">
        {busy ? "Verify ho raha hai…" : <>Unlock full control <CornerDownLeft size={14} /></>}
      </button>
      {error && <p className="admin-pin-error"><ShieldX size={13} /> {error}</p>}
    </div>
  );
}

function Console({ goto }: { goto: (t: Tab) => void }) {
  const { logout } = useAdmin();
  const [summary, setSummary] = useState<{
    salon: { name: string; slug: string; area: string; plan: string; hoursLabel: string; branches: string[] };
    salons: { slug: string; name: string }[];
    counters: { recovered: number; missed: number; pending: number; reviews: number; waitlist: number; todayBookings: number; clients: number; staff: number; chairs: number; revenueRecovered: number; reminders: number };
    events: { id: string; kind: string; detail: string; createdAt: string }[];
  } | null>(null);
  const [iso, setIso] = useState<{ allPass: boolean; tests: { name: string; pass: boolean; detail: string }[] } | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const { show, node } = useToast();

  const load = useCallback(async () => {
    const [s, i] = await Promise.all([fetch("/api/summary", { cache: "no-store" }), fetch("/api/isolation-check", { cache: "no-store" })]);
    if (s.ok) setSummary(await s.json());
    if (i.ok) setIso(await i.json());
  }, []);

  useEffect(() => { void load(); }, [load]);

  const act = async (label: string, run: () => Promise<Response>) => {
    setBusy(true);
    const res = await run();
    setBusy(false);
    show(res.ok ? `${label} ✓` : `${label} nahi hua — dobara koshish karein`);
    await load();
  };

  const stats = [
    { icon: CalendarCheck, label: "Bookings (total)", value: summary?.counters.todayBookings ?? 0, sub: "aaj ki" },
    { icon: Sparkles, label: "Recovered", value: summary?.counters.recovered ?? 0, sub: "missed se bachi" },
    { icon: ListOrdered, label: "Waitlist", value: summary?.counters.waitlist ?? 0, sub: "backfill queue" },
    { icon: Star, label: "Reviews sent", value: summary?.counters.reviews ?? 0, sub: "post-service" },
    { icon: Users, label: "Clients", value: summary?.counters.clients ?? 0, sub: "profiles" },
    { icon: UserCog, label: "Staff", value: summary?.counters.staff ?? 0, sub: "active" },
    { icon: Armchair, label: "Chairs", value: summary?.counters.chairs ?? 0, sub: "bookable" },
    { icon: MessageCircle, label: "Pending replies", value: summary?.counters.pending ?? 0, sub: "abhi khule" },
  ];

  return (
    <div className="grid gap-3">
      <div className="admin-stat-strip">
        {stats.map((s) => (
          <div key={s.label} className="admin-stat">
            <s.icon size={14} className="text-accent" />
            <p className="admin-stat-value"><CountUp key={`${summary?.salon.slug}-${s.label}`} value={s.value} /></p>
            <p className="admin-stat-label">{s.label}</p>
            <p className="admin-stat-sub">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Full control — har entity yahan" subtitle="Add / edit / delete — sab isi console se" icon={<Lock size={14} className="text-accent" />}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {([
              ["staff", "Staff", <UserCog key="i" size={15} />],
              ["services", "Services & rates", <Scissors key="i" size={15} />],
              ["chairs", "Chairs / rooms", <Armchair key="i" size={15} />],
              ["clients", "Clients", <Users key="i" size={15} />],
              ["bookings", "Bookings", <CalendarCheck key="i" size={15} />],
              ["settings", "Salon settings", <Settings2 key="i" size={15} />],
            ] as const).map(([key, label, icon]) => (
              <button key={key} type="button" onClick={() => goto(key as Tab)} className="admin-jump">
                <span className="admin-jump-icon">{icon}</span>
                <span className="text-[11.5px] font-extrabold">{label}</span>
                <ArrowUpRight size={12} className="ml-auto text-mut" />
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="admin-inline-card">
              <p className="admin-inline-eyebrow">RECOVERED REVENUE</p>
              <p className="text-xl font-extrabold text-accent">PKR {(summary?.counters.revenueRecovered ?? 0).toLocaleString("en-PK")}</p>
              <p className="text-[10px] text-mut">sample bookings se bachaya gaya</p>
            </div>
            <div className="admin-inline-card">
              <p className="admin-inline-eyebrow">FLOOR STATUS</p>
              <p className="text-xl font-extrabold">{summary?.counters.chairs ?? 0} chairs · {summary?.counters.staff ?? 0} staff</p>
              <p className="text-[10px] text-mut">{summary?.salon.hoursLabel ?? "11:00 AM – 8:00 PM"} · double-booking guard on</p>
            </div>
          </div>
        </Panel>

        <div className="grid content-start gap-3">
          <Panel title="Tenant isolation — live" icon={<ShieldCheck size={14} className="text-accent" />}>
            <ul className="grid gap-2">
              {(iso?.tests ?? []).map((t) => (
                <li key={t.name} className="flex items-start gap-2 rounded-lg border border-line bg-raised p-2.5">
                  {t.pass ? <ShieldCheck size={13} className="mt-0.5 shrink-0 text-accent" /> : <ShieldX size={13} className="mt-0.5 shrink-0 text-red-400" />}
                  <div>
                    <p className="text-[11px] font-bold">{t.name.split(":")[0]} — <span className={t.pass ? "text-accent" : "text-red-400"}>{t.pass ? "PASS" : "FAIL"}</span></p>
                    <p className="text-[10px] leading-snug text-mut">{t.detail}</p>
                  </div>
                </li>
              ))}
              {!iso && <li className="text-[11px] text-mut">Tests chal rahe hain…</li>}
            </ul>
          </Panel>

          <Panel title="Subscription plan" icon={<Crown size={14} className="text-accent" />} subtitle="Phase 1 — enquiry par sale, koi checkout nahi">
            <div className="grid gap-2 sm:grid-cols-3">
              {PLANS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  disabled={busy}
                  onClick={() => void act(`Plan ${p.name} set`, () => fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: p.key }) }))}
                  className={cn("admin-plan", summary?.salon.plan === p.key && "is-current")}
                >
                  <span className="block text-[11.5px] font-extrabold">{p.name}</span>
                  <span className="block text-[10px] text-mut">PKR {p.pkr} · ${p.usd}</span>
                  {summary?.salon.plan === p.key && <Tag tone="brand">current</Tag>}
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Salon PIN" icon={<KeyRound size={14} className="text-accent" />}>
          <div className="flex items-end gap-2">
            <div className="flex-1"><Field label="Naya admin PIN"><input className="input" value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" placeholder="••••" /></Field></div>
            <Btn busy={busy} disabled={pin.length < 4} onClick={() => void act("PIN update", () => { setPin(""); return fetch("/api/admin/session", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) }); })}>Save</Btn>
          </div>
          <p className="mt-2 text-[10px] text-mut">Production mein Supabase Auth role claim use hoga; yeh demo PIN per-salon hai.</p>
        </Panel>

        <Panel title="Tenant switch" icon={<Building2 size={14} className="text-accent" />} subtitle="Isolation khud test karein">
          <div className="grid gap-2">
            {(summary?.salons ?? []).map((s) => (
              <button
                key={s.slug}
                type="button"
                onClick={() => void act(`${s.name} active`, () => fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: s.slug }) }))}
                className={cn("flex items-center justify-between rounded-lg border px-3 py-2 text-[11.5px] font-bold", summary?.salon.slug === s.slug ? "border-brand bg-brand-soft text-accent" : "border-line bg-raised hover:border-brand/60")}
              >
                {s.name}
                {summary?.salon.slug === s.slug ? <Tag tone="brand">active</Tag> : <ArrowUpRight size={12} className="text-mut" />}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Data tools" icon={<Download size={14} className="text-accent" />}>
          <div className="flex flex-wrap gap-2">
            <a href="/api/export" download className="btn-ghost !px-3 !py-2 text-xs"><Download size={12} /> CSV export</a>
            <Btn variant="ghost" busy={busy} onClick={() => void act("Demo reset", () => fetch("/api/demo/reset", { method: "POST" }))}><RotateCcw size={12} /> Reset demo</Btn>
            <Btn variant="danger" onClick={() => void logout()}><LogOut size={12} /> Logout</Btn>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-mut">Reset sirf demo activity ko sample state par le jata hai — staff, services, chairs aur settings nahi chhoot te.</p>
        </Panel>
      </div>

      <Panel title="Admin activity — har change yahan" icon={<Gauge size={14} className="text-accent" />}>
        {(summary?.events ?? []).length === 0 ? <Empty>Koi activity nahi — booking ya CRUD se foran update hota hai.</Empty> : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {(summary?.events ?? []).slice(0, 9).map((e) => (
              <div key={e.id} className={cn("admin-event", e.kind === "recovered" && "is-brand")}>
                <p className="text-[11px] leading-snug">{e.detail}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
      {node}
    </div>
  );
}

export default function AdminPage() {
  const { admin, loading, login, logout } = useAdmin();
  const [tab, setTab] = useState<Tab>("console");
  const goto = useCallback((t: Tab) => {
    setTab(t);
    window.history.replaceState(null, "", t === "console" ? "/admin" : `/admin?tab=${t}`);
  }, []);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab") as Tab | null;
    if (t && TABS.some((x) => x.key === t)) setTab(t);
  }, []);

  const onPin = useCallback(async (pin: string) => {
    const r = await login(pin, "admin");
    return r.ok ? null : (r.message ?? "PIN ghalat hai");
  }, [login]);

  const [salonName, setSalonName] = useState("Glow Salon (Demo A)");
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/session", { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        if (d.salonName) setSalonName(`${d.salonName} · ${d.active}`);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="admin-boot"><span className="pulse-dot inline-block h-2 w-2 rounded-full bg-brand" /> Admin session check…</div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="admin-shell admin-login-grid">
        <aside className="admin-login-brand">
          <Logo sub />
          <p className="admin-login-eyebrow">ADMINISTRATOR ACCESS</p>
          <h1>Full control.<br />Har salon ka apna.</h1>
          <p className="admin-login-lede">
            Staff, services, chairs, clients, bookings aur settings — sab yahin se. Tenant isolation aktif hai: aap ko sirf apna salon nazar aayega.
          </p>
          <ul className="admin-login-list">
            {[
              "Multiple staff, services aur chairs — add / edit / delete",
              "Booking create, reschedule, cancel, delete (chair guard ke sath)",
              "Client profiles, notes aur booking history",
              "Salon settings — chat aur dashboard foran update",
              "Plan, PIN, tenant switch, CSV export, demo reset",
            ].map((t) => <li key={t}><span className="h-1 w-1 rounded-full bg-accent" /> {t}</li>)}
          </ul>
          <div className="admin-login-foot"> <span>Lahore · setup in 24h</span>
          </div>
        </aside>
        <main className="admin-login-panel">
          <div className="admin-login-panel-head">
            <div>
              <p className="text-[13px] font-extrabold">WordbitX Admin</p>
              <p className="text-[10.5px] text-mut">Glow Salon, Lahore — Demo A</p>
            </div>
            <ThemeToggle compact />
          </div>
          <PinPad onPin={onPin} />
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-mut">
            <ShieldCheck size={12} className="text-accent" /> Sirf Official Cloud API (Phase 2) · koi spam nahi
          </p>
          <Link href="/" className="admin-login-back">← Product page par wapas</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <Link href="/admin" className="flex items-center gap-2.5" aria-label="Admin console">
            <span className="admin-mark"><ShieldCheck size={16} /></span>
            <span className="min-w-0">
              <span className="admin-mark-title">Admin Console</span>
              <span className="admin-mark-sub">{salonName} · full access</span>
            </span>
          </Link>
          <Tag tone="brand">ADMIN MODE</Tag>
        </div>
        <div className="admin-topbar-right">
          <ThemeToggle compact />
          <Link href="/dashboard" className="btn-ghost !px-3 !py-2 text-xs"><LayoutDashboard size={13} /> Owner view</Link>
          <Link href="/demo" className="btn-ghost !px-3 !py-2 text-xs"><MessageCircle size={13} /> Demo chat</Link>
          <Btn variant="danger" onClick={() => void logout()}><LogOut size={12} /> Logout</Btn>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Admin sections">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} type="button" onClick={() => goto(t.key)} aria-current={tab === t.key ? "page" : undefined} className={cn("admin-tab", tab === t.key && "is-active")}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </nav>

      <div className="admin-body">
        {tab === "console" && <Console goto={goto} />}
        {tab === "bookings" && <BookingsManager basePath="/admin?tab=bookings" schedulePath="/admin?tab=floor" />}
        {tab === "floor" && <FloorPanel />}
        {tab === "waitlist" && <WaitlistPanel />}
        {tab === "orders" && <OrdersPanel />}
        {tab === "clients" && <ClientsPanel />}
        {tab === "staff" && <TeamPanel />}
        {tab === "services" && <ServicesPanel />}
        {tab === "products" && <ProductsPanel />}
        {tab === "chairs" && <ChairsPanel />}
        {tab === "settings" && <SettingsPanel />}
      </div>

      <footer className="admin-foot">
        <span>WordbitX Admin Console · {salonName}</span>
        <span>Guardrails: koi spam nahi · koi unofficial automation nahi · data sirf apna salon</span>
      </footer>
    </div>
  );
}


