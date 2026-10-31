"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  MessageCircle,
  Clock,
  Star,
  ListOrdered,
  BellRing,
  Sunrise,
  Activity,
  ArrowRight,
  Armchair,
  Wallet,
  Users,
  Plus,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import { Panel, Avatar, Tag, Empty, useToast, Btn } from "@/components/dash/bits";
import { useAdmin } from "@/components/dash/admin";
import {CountUp, Ticker, cn} from "@/components/ui";
import { prettyDate, timeAgo, pkr, todayISO } from "@/lib/utils";

interface Data {
  admin: boolean;
  salon: { slug: string; name: string; area: string; hoursLabel: string; closedDays: string[]; branches: string[]; plan: string };
  counters: {
    recovered: number; missed: number; pending: number; reviews: number; waitlist: number; reminders: number;
    todayBookings: number; emptyToday: number; revenueToday: number; revenueRecovered: number; clients: number; staff: number; chairs: number;
  };
  dailySummary: string;
  morningBrief: string;
  week: { date: string; bookings: number; recovered: number }[];
  bookings: { id: string; customerName: string; serviceName: string; time: string; date: string; status: string; source: string; chairName: string | null; staffName: string | null; pricePkr: number }[];
  todaySchedule: { id: string; customerName: string; serviceName: string; time: string; status: string; chairName: string | null; staffName: string | null; source: string }[];
  missed: { id: string; channel: string; customerLabel: string; snippet: string; status: string; createdAt: string }[];
  waitlist: { id: string; customerName: string; serviceName: string; preferredTime: string; status: string }[];
  reviews: { id: string; customerName: string; serviceName: string; createdAt: string }[];
  events: { id: string; kind: string; detail: string; createdAt: string }[];
}

export default function DashboardOverview() {
  const [d, setD] = useState<Data | null>(null);
  const { admin } = useAdmin();
  const { show, node } = useToast();

  const load = useCallback(async () => {
    const res = await fetch("/api/summary", { cache: "no-store" });
    if (res.ok) setD(await res.json());
  }, []);

  useEffect(() => {
    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const sendReview = async () => {
    const res = await fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (res.ok) {
      const j = await res.json();
      show(`Review request gayi ✓ (total ${j.count})`);
      void load();
    }
  };

  const kpis = d
    ? [
        { icon: CalendarCheck, label: "Recovered bookings", value: d.counters.recovered, hint: "missed se bachi hui", tone: "navy" as const },
        { icon: MessageCircle, label: "Missed messages", value: d.counters.missed, hint: `${d.counters.pending} pending`, tone: "gold" as const },
        { icon: CalendarDays, label: "Aaj ki bookings", value: d.counters.todayBookings, hint: `${d.counters.emptyToday} slots khali`, tone: "navy" as const },
        { icon: Wallet, label: "Recovered revenue", value: d.counters.revenueRecovered, hint: "PKR · bachaya gaya", tone: "navy-luxe" as const, money: true },
        { icon: ListOrdered, label: "Waitlist", value: d.counters.waitlist, hint: "slot ke muntazir", tone: "navy" as const },
        { icon: BellRing, label: "Reminders", value: d.counters.reminders, hint: "scheduled", tone: "gold" as const },
      ]
    : [];

  const maxBar = Math.max(1, ...(d?.week ?? []).map((w) => w.bookings));

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-line bg-raised/60 px-4 py-3.5">
        <div>
          <span className="badge-luxe mb-1.5">
            Executive Salon Suite · by WordbitX
          </span>
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-extrabold sm:text-2xl">
            Assalam o Alaikum, Owner 👋
          </h1>
          <p className="mt-1 text-[12px] text-mut">
            {d ? `${d.salon.name} · ${d.salon.area} · ${d.salon.hoursLabel}` : "Salon load ho raha hai…"} · Aaj {prettyDate(todayISO(0))}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard/bookings" className="btn-ghost !px-3 !py-2 text-xs"><Plus size={13} /> Booking</Link>
          <Link href="/demo" className="btn-luxe !px-3.5 !py-2 text-xs"><MessageCircle size={13} /> Demo chat</Link>
        </div>
      </div>

      {/* KPIs — Mixed Deep Navy & Champagne Gold Luxury Cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => {
          const isNavyLuxe = k.tone === "navy-luxe";
          const isGold = k.tone === "gold";
          return (
            <div
              key={k.label}
              className={cn(
                "dash-kpi-card",
                isGold && "is-gold",
                isNavyLuxe && "is-navy-luxe",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-lg border",
                    isNavyLuxe
                      ? "border-[#e5c158]/45 bg-[#e5c158]/20 text-[#f3d474]"
                      : isGold
                        ? "border-luxe/40 bg-luxe-soft text-mint"
                        : "border-brand/15 bg-brand-soft text-accent",
                  )}
                >
                  <k.icon size={14} />
                </span>
                <span
                  className={cn(
                    "text-[8.5px] font-extrabold uppercase tracking-wider",
                    isNavyLuxe ? "text-[#f3d474]" : isGold ? "text-mint" : "text-mut",
                  )}
                >
                  {isNavyLuxe ? "revenue" : isGold ? "priority" : "live"}
                </span>
              </div>
              <p className={cn("mt-2.5 text-2xl font-extrabold leading-none", isNavyLuxe && "text-white")}>
                {k.money ? <span className={cn("text-base font-bold", isNavyLuxe ? "text-[#f3d474]" : "text-mint")}>PKR </span> : null}
                <CountUp key={`${d?.salon.slug}-${k.label}`} value={k.value} />
              </p>
              <p className={cn("mt-1.5 text-[11px] font-bold leading-tight", isNavyLuxe ? "text-slate-100" : "text-ink")}>
                {k.label}
              </p>
              <p className={cn("text-[9.5px]", isNavyLuxe ? "text-slate-300" : "text-mut")}>{k.hint}</p>
            </div>
          );
        })}
        {!d && Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-[112px] animate-pulse" />)}
      </div>

      <div className="mt-3">
        <Ticker
          items={(d?.todaySchedule ?? []).slice(0, 6).map((b) => (
            <span key={b.id}>
              <b className="text-mint">{b.serviceName}</b> — {b.customerName} · {b.time}{" "}
              <span className="text-mut">· {b.chairName ?? "chair"}</span>
            </span>
          ))}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-4">
          {/* chart */}
          <Panel title="Pichlay 7 din — bookings vs recovered" icon={<Activity size={13} />}>
            <div className="flex h-[150px] items-end justify-between gap-2">
              {(d?.week ?? []).map((w) => (
                <div key={w.date} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-[110px] w-full items-end justify-center gap-1.5">
                    <div
                      className="w-1/2 rounded-t bg-brand"
                      style={{ height: `${Math.max(6, (w.bookings / maxBar) * 100)}%` }}
                      title={`${w.bookings} total bookings`}
                    />
                    <div
                      className="w-1/2 rounded-t"
                      style={{
                        height: `${Math.max(4, (w.recovered / maxBar) * 100)}%`,
                        background: "linear-gradient(180deg, #e5c158 0%, #b68919 100%)",
                      }}
                      title={`${w.recovered} recovered bookings`}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-mut">{prettyDate(w.date).split(",")[0]}</span>
                </div>
              ))}
            </div>
            <div className="mt-2.5 flex items-center gap-4 text-[10px] font-semibold text-mut">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-brand" /> Total Bookings (Navy)</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-[#c59b27]" /> Recovered (Champagne Gold)</span>
            </div>
          </Panel>

          {/* today's schedule */}
          <Panel
            title="Aaj ka schedule — chair-wise"
            icon={<Armchair size={14} className="text-accent" />}
            action={<Link href="/dashboard/floor" className="inline-flex items-center gap-1 text-[11px] font-bold text-accent">Floor view <ArrowRight size={11} /></Link>}
          >
            <div className="grid gap-2">
              {(d?.todaySchedule ?? []).slice(0, 6).map((b) => (
                <div key={b.id} className="flex items-center gap-2.5 rounded-lg border border-line bg-raised px-2.5 py-2">
                  <span className="w-[62px] shrink-0 text-[10.5px] font-extrabold">{b.time}</span>
                  <Avatar name={b.customerName} size={26} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-bold">{b.customerName} — {b.serviceName}</p>
                    <p className="truncate text-[9.5px] text-mut">{b.chairName ?? "Chair"} {b.staffName ? `· ${b.staffName}` : ""}</p>
                  </div>
                  <Tag tone={b.status === "completed" ? "mut" : b.source === "chat" ? "gold" : "brand"}>{b.status}</Tag>
                </div>
              ))}
              {d && d.todaySchedule.length === 0 && <Empty>Aaj koi booking nahi — demo chat se pehli recovered booking banayein.</Empty>}
            </div>
          </Panel>

          {/* waitlist + reviews */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Panel title="Waitlist — backfill queue" icon={<ListOrdered size={13} />} action={<Link href="/dashboard/waitlist" className="text-[10.5px] font-bold text-mint">Kholen <ArrowRight size={10} /></Link>}>
              <ul className="grid gap-2.5">
                {(d?.waitlist ?? []).map((w) => (
                  <li key={w.id} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11.5px] font-bold">{w.customerName}</p>
                      <p className="text-[10px] text-mut">{w.serviceName} · {w.preferredTime}</p>
                    </div>
                    <Tag tone={w.status === "booked" ? "gold" : "brand"}>{w.status}</Tag>
                  </li>
                ))}
                {d && d.waitlist.length === 0 && <li className="text-[11px] text-mut">Waitlist khali hai.</li>}
              </ul>
            </Panel>
            <Panel title="Google reviews" icon={<Star size={13} />} action={<Btn variant="soft" onClick={sendReview}>Request</Btn>}>
              <p className="text-2xl font-extrabold text-mint"><CountUp key={`rev-${d?.salon.slug}`} value={d?.counters.reviews ?? 0} /></p>
              <p className="text-[10px] text-mut">reviews bheje gaye · link Settings mein</p>
              <ul className="mt-2 grid gap-1.5">
                {(d?.reviews ?? []).slice(0, 3).map((r) => (
                  <li key={r.id} className="text-[11px]"><b>{r.customerName}</b> — {r.serviceName} <span className="text-mut">· {timeAgo(r.createdAt)}</span></li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>

        {/* right column */}
        <div className="grid content-start gap-4">
          <Panel title="Aaj ki summary" subtitle='"Aaj kitni booking bachi"' icon={<Sunrise size={13} />}>
            <p className="text-[12.5px] leading-relaxed">{d?.dailySummary ?? "…"}</p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[10.5px] font-bold">
              <span className="rounded-md border border-luxe/35 bg-luxe-soft px-2 py-1 text-mint">{pkr(d?.counters.revenueToday ?? 0)} aaj</span>
              <span className="rounded-md bg-brand-soft px-2 py-1 text-accent">{d?.counters.staff ?? 0} active staff</span>
              <span className="rounded-md border border-line bg-raised px-2 py-1">{d?.counters.chairs ?? 0} chairs</span>
            </div>
            <p className="mt-3 border-t border-line pt-2.5 text-[11.5px] leading-relaxed text-mut">{d?.morningBrief ?? "…"}</p>
          </Panel>

          <Panel title="Pending replies" icon={<Clock size={13} />} action={<Link href="/dashboard/bookings" className="text-[10.5px] font-bold text-mint">Bookings <ArrowRight size={10} /></Link>}>
            <ul className="grid gap-2.5">
              {(d?.missed ?? []).filter((m) => m.status === "pending").slice(0, 4).map((m) => (
                <li key={m.id} className="rounded-lg border border-luxe/40 bg-luxe-soft px-2.5 py-2">
                  <p className="text-[11px] font-semibold">{m.snippet}</p>
                  <p className="text-[9.5px] text-mut">{m.channel} · {m.customerLabel} · {timeAgo(m.createdAt)}</p>
                </li>
              ))}
              {(d?.missed ?? []).filter((m) => m.status === "pending").length === 0 && <li className="text-[11px] text-mut">Sab clear ✓</li>}
            </ul>
          </Panel>

          <Panel title="Clients & team" icon={<Users size={13} />} action={<Link href="/dashboard/clients" className="text-[10.5px] font-bold text-mint">Manage <ArrowRight size={10} /></Link>}>
            <div className="grid grid-cols-3 divide-x divide-line rounded-lg border border-line bg-raised py-2 text-center">
              <div><p className="text-lg font-extrabold text-accent">{d?.counters.clients ?? 0}</p><p className="text-[9px] font-bold text-mut">Clients</p></div>
              <div><p className="text-lg font-extrabold text-mint">{d?.counters.staff ?? 0}</p><p className="text-[9px] font-bold text-mut">Staff</p></div>
              <div><p className="text-lg font-extrabold text-accent">{d?.counters.chairs ?? 0}</p><p className="text-[9px] font-bold text-mut">Chairs</p></div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {d?.salon.branches.map((b, idx) => <Tag key={b} tone={idx % 2 === 0 ? "gold" : "brand"}>{b}</Tag>)}
            </div>
          </Panel>

          <Panel title="Activity — har reply owner ko nazar" icon={<Activity size={13} />}>
            <ul className="chat-scroll grid max-h-[220px] gap-2.5 overflow-y-auto pr-1">
              {(d?.events ?? []).slice(0, 10).map((e) => (
                <li key={e.id} className={cn("border-l-2 pl-2.5", e.kind === "recovered" ? "border-luxe" : "border-brand")}>
                  <p className="text-[11px] leading-snug">{e.detail}</p>
                  <p className="text-[9.5px] font-semibold text-mut">{timeAgo(e.createdAt)}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
      {node}
    </div>
  );
}