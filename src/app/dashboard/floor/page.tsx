"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Armchair, DoorOpen, Plus, Lock, CalendarDays } from "lucide-react";
import { Panel, Btn, Empty, Tag, InfoNote } from "@/components/dash/bits";
import {cn} from "@/components/ui";
import { prettyDate, todayISO } from "@/lib/utils";

interface Chair { id: string; name: string; kind: string; staffId: string | null; active: boolean }
interface Staff { id: string; name: string; role: string }
interface Booking {
  id: string; customerName: string; serviceName: string; staffName: string | null; chairId: string | null;
  time: string; date: string; status: string; source: string; pricePkr: number;
}
interface Avail {
  date: string;
  slots: { time: string; freeChairs: number; chairIdsFree: string[]; bookings: number }[];
  chairs: Chair[];
  staff: Staff[];
  dayBookings: Booking[];
  week: { date: string; count: number }[];
  openTime: string;
  closeTime: string;
  closedDays: string[];
}

export default function FloorPage() {
  const [date, setDate] = useState(todayISO(0));
  const [data, setData] = useState<Avail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    const res = await fetch(`/api/availability?date=${d}`, { cache: "no-store" });
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(date);
  }, [date, load]);

  const chairMap = useMemo(() => new Map((data?.chairs ?? []).map((c) => [c.id, c])), [data]);
  const staffMap = useMemo(() => new Map((data?.staff ?? []).map((s) => [s.id, s])), [data]);

  const bookingsAt = (time: string, chairId: string) =>
    (data?.dayBookings ?? []).filter((b) => b.time === time && b.chairId === chairId && b.status !== "cancelled");

  const shift = (days: number) => {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + days);
    setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold sm:text-2xl">Chair-by-chair Schedule</h1>
          <p className="mt-1 text-[12px] text-mut">
            Aik chair par aik waqt mein sirf aik booking — conflict ho to system WhatsApp par rabta karwata hai.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-line bg-card p-1">
            <button type="button" onClick={() => shift(-1)} className="grid h-7 w-7 place-items-center rounded-md text-mut hover:bg-raised hover:text-ink" aria-label="Pichla din"><ChevronLeft size={14} /></button>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent px-1 text-[11.5px] font-bold text-ink outline-none" aria-label="Date" />
            <button type="button" onClick={() => shift(1)} className="grid h-7 w-7 place-items-center rounded-md text-mut hover:bg-raised hover:text-ink" aria-label="Agla din"><ChevronRight size={14} /></button>
          </div>
          <Btn onClick={() => setDate(todayISO(0))} variant="ghost">Aaj</Btn>
          <Link href="/dashboard/bookings" className="btn-brand !px-3 !py-2 text-xs"><Plus size={13} /> Nayi booking</Link>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(data?.week ?? []).map((w) => (
          <button
            key={w.date}
            type="button"
            onClick={() => setDate(w.date)}
            className={cn(
              "rounded-lg border px-2.5 py-1.5 text-[10.5px] font-bold transition-colors",
              w.date === date ? "border-brand bg-brand-soft text-accent" : "border-line bg-card text-mut hover:text-ink",
            )}
          >
            <span className="block">{prettyDate(w.date)}</span>
            <span className="text-[9px] opacity-80">{w.count} bookings</span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4">
        <Panel
          title={`${prettyDate(date)} — floor view`}
          subtitle={data ? `${data.chairs.filter((c) => c.active).length} chairs · ${data.openTime} – ${data.closeTime} · ${data.dayBookings.filter((b) => b.status !== "cancelled").length} bookings` : "Loading…"}
          icon={<CalendarDays size={14} className="text-accent" />}
          action={<div className="flex items-center gap-2 text-[10px]"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-brand" /> Booked</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm border border-line" /> Free</span></div>}
        >
          {loading && <div className="h-56 animate-pulse rounded-lg bg-raised" />}
          {!loading && data && data.chairs.filter((c) => c.active).length === 0 && (
            <Empty>Koi chair nahi — pehle <Link href="/dashboard/chairs" className="font-bold text-accent">Chairs add</Link> karein.</Empty>
          )}
          {!loading && data && data.chairs.filter((c) => c.active).length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-[11.5px]">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 w-[86px] border-b border-line bg-card px-2 pb-2 text-[9.5px] font-extrabold uppercase tracking-wider text-mut">Time</th>
                    {data.chairs.filter((c) => c.active).map((c) => {
                      const staff = c.staffId ? staffMap.get(c.staffId) : null;
                      return (
                        <th key={c.id} className="min-w-[150px] border-b border-line px-2 pb-2">
                          <span className="flex items-center gap-1.5 text-[11px] font-extrabold">
                            {c.kind === "room" ? <DoorOpen size={12} className="text-accent" /> : <Armchair size={12} className="text-accent" />}
                            {c.name}
                          </span>
                          <span className="mt-0.5 block text-[9.5px] font-semibold text-mut">{staff ? staff.name : "Koi stylist assign nahi"}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {data.slots.map((slot) => (
                    <tr key={slot.time}>
                      <td className="sticky left-0 z-10 border-b border-line/60 bg-card px-2 py-2 align-top">
                        <span className="text-[10.5px] font-extrabold">{slot.time}</span>
                        <span className={cn("mt-0.5 block text-[9px] font-bold", slot.freeChairs === 0 ? "text-amber-400" : "text-accent")}>
                          {slot.freeChairs === 0 ? "Full" : `${slot.freeChairs} free`}
                        </span>
                      </td>
                      {data.chairs.filter((c) => c.active).map((c) => {
                        const at = bookingsAt(slot.time, c.id);
                        const b = at[0];
                        return (
                          <td key={c.id} className="border-b border-line/60 px-1.5 py-1.5 align-top">
                            {b ? (
                              <div className={cn(
                                "rounded-lg border px-2 py-1.5",
                                b.status === "completed" ? "border-line bg-raised" : "border-brand/40 bg-brand-soft",
                              )}>
                                <p className="truncate text-[11px] font-extrabold">{b.customerName}</p>
                                <p className="truncate text-[9.5px] text-mut">{b.serviceName}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-1">
                                  <Tag tone={b.status === "completed" ? "mut" : "brand"}>{b.status}</Tag>
                                  {b.source !== "admin" && b.source !== "walk-in" && <Tag tone="brand">{b.source}</Tag>}
                                </div>
                              </div>
                            ) : (
                              <Link
                                href={`/dashboard/bookings?date=${date}&time=${encodeURIComponent(slot.time)}&chair=${c.id}`}
                                className="flex h-[52px] flex-col items-center justify-center rounded-lg border border-dashed border-line text-[9.5px] font-bold text-mut transition-colors hover:border-brand hover:text-accent"
                              >
                                <Plus size={12} /> Free slot
                              </Link>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Chair load — aaj" icon={<Armchair size={14} className="text-accent" />}>
            <ul className="grid gap-2">
              {data?.chairs.filter((c) => c.active).map((c) => {
                const count = data.dayBookings.filter((b) => b.chairId === c.id && b.status !== "cancelled").length;
                const pct = Math.min(100, count * 20);
                return (
                  <li key={c.id}>
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>{c.name}</span>
                      <span className="text-mut">{count} bookings</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-raised">
                      <div className="h-1.5 rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
          <Panel title="Double-booking guard" icon={<Lock size={14} className="text-accent" />}>
            <InfoNote>
              Same chair + same time par doosri booking block ho jati hai. Customer ko WhatsApp par rabta karne ka mashwara
              diya jata hai, warna wohi din ka doosra free slot offer hota hai.
            </InfoNote>
            <div className="mt-3 grid gap-2">
              {data?.slots.filter((s) => s.freeChairs === 0).slice(0, 4).map((s) => (
                <div key={s.time} className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px]">
                  <span className="font-bold text-amber-400">{s.time}</span>
                  <span className="text-mut">saari chairs booked</span>
                </div>
              ))}
              {data && data.slots.filter((s) => s.freeChairs === 0).length === 0 && <p className="text-[11px] text-mut">Aaj koi full slot nahi — sab kuch available hai.</p>}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}