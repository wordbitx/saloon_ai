"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Check, XCircle, Trash2, Pencil, CalendarCheck, Armchair, ShieldCheck, Clock, MessageCircle, AlertTriangle, RotateCcw } from "lucide-react";
import { Panel, Btn, Modal, Field, Empty, Tag, useToast, InfoNote } from "@/components/dash/bits";
import { useAdmin } from "@/components/dash/admin";
import {cn} from "@/components/ui";
import { prettyDate, todayISO } from "@/lib/utils";

interface Chair { id: string; name: string }
interface Service { id: string; name: string; pricePkr: number; durationMins: number }
interface Staff { id: string; name: string }
interface Slot { time: string; freeChairs: number; chairIdsFree: string[]; bookings: number }
interface Booking {
  id: string; customerName: string; phoneMasked: string; serviceName: string; staffName: string | null;
  chairId: string | null; date: string; time: string; status: string; source: string; pricePkr: number; notes: string;
}
interface Avail {
  date: string; slots: Slot[]; chairs: Chair[]; services: Service[]; staff: Staff[]; dayBookings: Booking[];
  openTime: string; closeTime: string;
}

const STATUS: Record<string, { label: string; tone: "brand" | "mut" | "amber" | "red" }> = {
  confirmed: { label: "Confirmed", tone: "brand" },
  completed: { label: "Completed", tone: "mut" },
  cancelled: { label: "Cancelled", tone: "red" },
  "no-show": { label: "No-show", tone: "amber" },
};

type Filter = "today" | "upcoming" | "all" | "cancelled";

/** Agla din (ISO) — sab slots booked hon par quick escape */
function nextDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const emptyForm = (date: string) => ({
  id: "", customerName: "", phoneMasked: "+92 3•• ••••", serviceName: "", staffName: "", chairId: "",
  date, time: "", notes: "", status: "confirmed", pricePkr: 0, source: "admin",
});

/** Source = yeh booking aayi kahan se. (Yeh sirf record hai, hisaab nahi.) */
const SOURCE_MEANING: Record<string, string> = {
  chat: "Customer ne khud WhatsApp chat mein booking ki",
  recovered: "Missed WhatsApp message ka foran jawab dya — booking wahan se bani",
  "missed-call": "Call miss hui, assistant ne khud WhatsApp kiya — usi se booking",
  waitlist: "Slot pehle full tha; khaali hote hi waitlist wale client ko mila",
  "walk-in": "Salon par khud aa kar book karwaya (receptionist)",
  admin: "Owner/admin ne dashboard se manually banayi",
};

const SOURCE_LABELS: Record<string, string> = {
  chat: "Chat", recovered: "Recovered", "missed-call": "Missed call",
  waitlist: "Waitlist", "walk-in": "Walk-in", admin: "Admin",
};

export function BookingsManager({
  prefillFromUrl = false,
  basePath = "/dashboard/bookings",
  schedulePath = "/dashboard/floor",
}: {
  prefillFromUrl?: boolean;
  basePath?: string;
  schedulePath?: string;
}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [avail, setAvail] = useState<Avail | null>(null);
  const [form, setForm] = useState(emptyForm(todayISO(0)));
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState<{ message: string; chairName?: string | null } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("today");
  const [query, setQuery] = useState("");
  const { admin } = useAdmin();
  const { show, node } = useToast();

  const loadAvail = useCallback(async (date: string) => {
    const res = await fetch(`/api/availability?date=${date}`, { cache: "no-store" });
    if (res.ok) setAvail(await res.json());
  }, []);

  const loadBookings = useCallback(async () => {
    const res = await fetch("/api/bookings", { cache: "no-store" });
    if (res.ok) setBookings((await res.json()).bookings as Booking[]);
  }, []);

  useEffect(() => {
    void loadBookings();
    if (!prefillFromUrl) return;
    const p = new URLSearchParams(window.location.search);
    const date = p.get("date");
    const time = p.get("time");
    const chair = p.get("chair");
    if (date || time || chair) {
      setForm((f) => ({ ...f, date: date ?? f.date, time: time ?? f.time, chairId: chair ?? f.chairId }));
      setOpen(true);
      window.history.replaceState(null, "", basePath);
      void loadBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadAvail(form.date);
  }, [form.date, loadAvail]);

  const chairById = useMemo(() => new Map((avail?.chairs ?? []).map((c) => [c.id, c])), [avail]);
  const slotFor = (time: string) => avail?.slots.find((s) => s.time === time);
  const slotFull = !!slotFor(form.time) && (slotFor(form.time)?.freeChairs ?? 0) === 0 && !form.id;
  /** us time par kaun si chair busy hai aur kis client ke sath */
  const chairState = useMemo(() => {
    const map = new Map<string, { free: boolean; with?: string }>();
    for (const c of avail?.chairs ?? []) map.set(c.id, { free: true });
    for (const b of avail?.dayBookings ?? []) {
      if (b.time !== form.time || b.status === "cancelled") continue;
      if (b.chairId && map.has(b.chairId)) map.set(b.chairId, { free: false, with: `${b.customerName} · ${b.serviceName}` });
    }
    // edit mode: current booking ki chair us time par busy nahi mani jayegi
    if (form.id && form.chairId) {
      const mine = (avail?.dayBookings ?? []).find((b) => b.id === form.id);
      if (mine) map.set(mine.chairId ?? form.chairId, { free: true });
    }
    return map;
  }, [avail, form.time, form.id, form.chairId]);

  const shown = useMemo(() => {
    const today = todayISO(0);
    let list = bookings;
    if (filter === "today") list = list.filter((b) => b.date === today && b.status !== "cancelled");
    if (filter === "upcoming") list = list.filter((b) => b.date > today && b.status === "confirmed");
    if (filter === "cancelled") list = list.filter((b) => b.status === "cancelled");
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((b) => `${b.customerName} ${b.serviceName} ${b.staffName ?? ""} ${chairById.get(b.chairId ?? "")?.name ?? ""} ${b.date}`.toLowerCase().includes(q));
    return [...list].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }, [bookings, filter, query, chairById]);

  const openNew = () => {
    setForm(emptyForm(form.date));
    setConflict(null);
    setNotice(null);
    setOpen(true);
  };

  const pickTime = (slot: Slot) => {
    setConflict(null);
    const chair = slot.freeChairs > 0 ? (avail?.chairs.find((c) => slot.chairIdsFree.includes(c.id))?.id ?? "") : "";
    setForm((f) => ({ ...f, time: slot.time, chairId: f.chairId && chairState.get(f.chairId)?.free ? f.chairId : chair }));
    if (slot.freeChairs === 0) {
      setNotice(`${slot.time} par saari chairs booked hain — koi doosra slot chunein, ya customer ko WhatsApp par rabta karne ka mashwara dein.`);
    } else {
      setNotice(null);
    }
  };

  const pickChair = (chair: Chair) => {
    const state = chairState.get(chair.id);
    setForm((f) => ({ ...f, chairId: chair.id }));
    if (state && !state.free) {
      setConflict({
        message: `${chair.name} ${form.time} par already booked hai (${state.with}). Is slot ke liye WhatsApp par rabta karein, warna doosri chair ya slot chunein.`,
        chairName: chair.name,
      });
      setNotice(null);
    } else {
      setConflict(null);
    }
  };

  const autoAssign = () => {
    const slot = slotFor(form.time);
    const free = (avail?.chairs ?? []).find((c) => chairState.get(c.id)?.free && (slot ? slot.chairIdsFree.includes(c.id) : true));
    if (free) {
      setForm((f) => ({ ...f, chairId: free.id }));
      setConflict(null);
      setNotice(null);
      show(`${free.name} auto-assign ho gayi ✓`);
    } else {
      setNotice(`${form.time || "Us"} waqt koi chair free nahi — niche se doosra slot chunein, ya customer ko WhatsApp par rabta karne ka mashwara dein.`);
    }
  };

  /** Sab se pehla free slot (isi date par, warna agla open din) */
  const nextFreeSlot = () => {
    const next = (avail?.slots ?? []).find((s) => s.freeChairs > 0 && s.time !== form.time);
    if (next) {
      const chair = (avail?.chairs ?? []).find((c) => next.chairIdsFree.includes(c.id));
      setForm((f) => ({ ...f, time: next.time, chairId: chair?.id ?? "" }));
      setConflict(null);
      setNotice(null);
      show(`${next.time} select ho gaya — ${chair?.name ?? "free chair"}`);
      return;
    }
    const nxt = nextDay(form.date);
    setNotice(`${form.date} ke saare slots booked hain — agla din ${prettyDate(nxt)} kholen.`);
    setForm((f) => ({ ...f, date: nxt, time: "", chairId: "" }));
    setConflict(null);
  };

  const submit = async () => {
    if (!form.customerName.trim() || !form.serviceName || !form.time || !form.date) {
      setNotice("Client ka naam, service, date aur time — sab chunna zaroori hai.");
      return;
    }
    setBusy(true);
    setConflict(null);
    setNotice(null);
    try {
      const payload = {
        customerName: form.customerName.trim(),
        phoneMasked: form.phoneMasked,
        serviceName: form.serviceName,
        staffName: form.staffName || null,
        chairId: form.chairId || null,
        date: form.date,
        time: form.time,
        notes: form.notes,
        pricePkr: form.pricePkr,
        status: form.status,
        source: form.source,
      };
      const res = await fetch(form.id ? `/api/bookings/${form.id}` : "/api/bookings", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setNotice("View mode — changes salon ke staff console se hote hain.");
        return;
      }
      if (res.status === 409) {
        setConflict({ message: d.message ?? "Slot already booked hai.", chairName: d.chairName });
        await loadAvail(form.date);
        return;
      }
      if (!res.ok) {
        setNotice(d.message ?? "Booking save nahi hui — fields dobara check karein.");
        return;
      }
      const chairName = d.chair?.name ?? chairById.get(d.booking?.chairId)?.name ?? "chair";
      show(`${form.id ? "Booking update" : "Booking confirm"} ✓ ${chairName} · ${form.date} ${d.booking?.time ?? form.time}`);
      setOpen(false);
      // naye/any date ki booking foran nazar aaye — "today" filter chhupa deta tha
      setFilter(d.booking?.date && d.booking.date !== todayISO(0) ? "all" : "today");
      setQuery("");
      setForm(emptyForm(form.date));
      await Promise.all([loadBookings(), loadAvail(form.date)]);
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (b: Booking, status: string) => {
    const res = await fetch(`/api/bookings/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (res.ok) {
      show(`${b.customerName} — ${status} ✓`);
      await Promise.all([loadBookings(), loadAvail(form.date)]);
    } else show("Status update nahi hua.");
  };

  const remove = async (b: Booking) => {
    if (!admin) return show("View mode — changes salon ke staff console se hote hain.");
    const res = await fetch(`/api/bookings/${b.id}`, { method: "DELETE" });
    if (res.ok) {
      show("Booking delete ho gayi");
      await Promise.all([loadBookings(), loadAvail(form.date)]);
    }
  };

  const edit = (b: Booking) => {
    setForm({
      id: b.id, customerName: b.customerName, phoneMasked: b.phoneMasked, serviceName: b.serviceName,
      staffName: b.staffName ?? "", chairId: b.chairId ?? "", date: b.date, time: b.time, notes: b.notes ?? "",
      status: b.status, pricePkr: b.pricePkr, source: SOURCE_LABELS[b.source] ? b.source : "admin",
    });
    setConflict(null);
    setNotice(null);
    void loadAvail(b.date);
    setOpen(true);
  };

  const refresh = async () => {
    await Promise.all([loadBookings(), loadAvail(form.date)]);
    show("Bookings refresh ho gayin ✓");
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold sm:text-2xl">Bookings</h1>
          <p className="mt-1 text-[12px] text-mut">
            Chair-wise slots: har slot par free chairs dikhti hain. Same chair + same time block — conflict par WhatsApp CTA.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Btn variant="ghost" onClick={() => void refresh()} title="Dobara load karein"><RotateCcw size={13} /> Refresh</Btn>
          <a href={schedulePath} className="btn-ghost !px-3 !py-2 text-xs"><Armchair size={13} /> Schedule</a>
          <Btn onClick={openNew}><Plus size={13} /> Nayi booking</Btn>
        </div>
      </div>

      {notice && (
        <div className="mt-3 flex flex-wrap items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-[11.5px] font-semibold leading-relaxed text-ink/90">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-400" />
          <span className="min-w-[220px] flex-1">{notice}</span>
          <button type="button" onClick={() => { setNotice(null); setOpen(true); }} className="rounded-md border border-amber-500/40 px-2 py-1 text-[10px] font-extrabold text-amber-400">Booking form kholen</button>
        </div>
      )}

      <Panel
        className="mt-3"
        title={`${shown.length} bookings`}
        subtitle={avail ? `${form.date} · ${avail.slots.reduce((n, s) => n + s.freeChairs, 0)} chair-slots free · ${avail.chairs.length} chairs` : "Slots load ho rahe hain…"}
        icon={<CalendarCheck size={14} className="text-accent" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-line bg-raised px-2">
              <Search size={12} className="text-mut" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Naam / service / date…" aria-label="Search bookings" className="w-[120px] bg-transparent py-1.5 text-[11px] outline-none" />
            </div>
            <div className="flex rounded-lg border border-line bg-raised p-0.5">
              {(["today", "upcoming", "all", "cancelled"] as const).map((f) => (
                <button key={f} type="button" onClick={() => setFilter(f)} className={cn("rounded-md px-2 py-1 text-[10px] font-extrabold capitalize", filter === f ? "bg-brand text-white" : "text-mut hover:text-ink")}>{f}</button>
              ))}
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[11.5px]">
            <thead>
              <tr className="border-b border-line text-[9.5px] uppercase tracking-wider text-mut">
                <th className="px-2 py-2 font-extrabold">Client</th>
                <th className="px-2 py-2 font-extrabold">Service</th>
                <th className="px-2 py-2 font-extrabold">Chair / Staff</th>
                <th className="px-2 py-2 font-extrabold">Date · Time</th>
                <th className="px-2 py-2 font-extrabold">Source</th>
                <th className="px-2 py-2 font-extrabold">Status</th>
                <th className="px-2 py-2 text-right font-extrabold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.id} className="border-b border-line/60 last:border-0 hover:bg-raised/40">
                  <td className="px-2 py-2.5"><p className="font-bold">{b.customerName}</p><p className="text-[9.5px] text-mut">{b.phoneMasked}</p></td>
                  <td className="px-2 py-2.5"><p className="font-semibold">{b.serviceName}</p><p className="text-[9.5px] text-mut">PKR {b.pricePkr.toLocaleString("en-PK")}</p></td>
                  <td className="px-2 py-2.5"><p className="font-semibold">{chairById.get(b.chairId ?? "")?.name ?? "—"}</p><p className="text-[9.5px] text-mut">{b.staffName ?? "Koi stylist nahi"}</p></td>
                  <td className="px-2 py-2.5">{prettyDate(b.date)}<span className="block text-[9.5px] text-mut">{b.time}</span></td>
                  <td className="px-2 py-2.5" title={SOURCE_MEANING[b.source] ?? b.source}>
                    <Tag tone={["recovered", "missed-call", "waitlist"].includes(b.source) ? "brand" : "mut"}>{SOURCE_LABELS[b.source] ?? b.source}</Tag>
                  </td>
                  <td className="px-2 py-2.5"><Tag tone={STATUS[b.status]?.tone ?? "mut"}>{STATUS[b.status]?.label ?? b.status}</Tag></td>
                  <td className="px-2 py-2.5">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {b.status === "confirmed" && <button type="button" onClick={() => void changeStatus(b, "completed")} title="Complete" className="grid h-7 w-7 place-items-center rounded-md border border-line text-mut hover:border-brand hover:text-accent"><Check size={12} /></button>}
                      {b.status !== "cancelled" && <button type="button" onClick={() => void changeStatus(b, "cancelled")} title="Cancel" className="grid h-7 w-7 place-items-center rounded-md border border-line text-mut hover:border-amber-500 hover:text-amber-400"><XCircle size={12} /></button>}
                      <button type="button" onClick={() => edit(b)} title="Edit / reschedule" className="grid h-7 w-7 place-items-center rounded-md border border-line text-mut hover:border-brand hover:text-accent"><Pencil size={12} /></button>
                      <button type="button" onClick={() => void remove(b)} title={admin ? "Delete" : "View mode — changes salon ke staff console se hote hain."} className="grid h-7 w-7 place-items-center rounded-md border border-line text-mut hover:border-red-500 hover:text-red-400"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length === 0 && (
            <Empty>
              {query ? "Search se koi match nahi mila." : filter === "today" ? "Aaj koi booking nahi — “All” dekhein, ya nayi booking banayein." : "Is filter mein koi booking nahi."}
            </Empty>
          )}
        </div>
        <div className="mt-3 grid gap-2">
          <div className="rounded-lg border border-line bg-raised p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-mut">Source ka matlab — booking aayi kahan se?</p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {Object.entries(SOURCE_MEANING).map(([k, v]) => (
                <p key={k} className="flex items-start gap-1.5 text-[10.5px] leading-snug text-mut">
                  <Tag tone={["recovered", "missed-call", "waitlist"].includes(k) ? "brand" : "mut"}>{SOURCE_LABELS[k]}</Tag>
                  <span className="flex-1">{v}</span>
                </p>
              ))}
            </div>
          </div>
          <InfoNote>
            Har booking aik chair lock karti hai — same chair + same time par doosri booking nahi.
            Counter &ldquo;Recovered&rdquo; inhi sources se banta hai: <b>Recovered</b> + <b>Missed call</b> + <b>Waitlist</b>.
          </InfoNote>
        </div>
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "Booking edit / reschedule" : "Nayi booking"} wide>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Client ka naam"><input className="input" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Ayesha" /></Field>
          <Field label="Phone (masked)" hint="Guardrail: poora number store/display nahi hota"><input className="input" value={form.phoneMasked} onChange={(e) => setForm({ ...form, phoneMasked: e.target.value })} /></Field>
          <Field label="Service" hint="Rates Services tab se aate hain — foran update">
            <select className="input" value={form.serviceName} onChange={(e) => { const s = avail?.services.find((x) => x.name === e.target.value); setForm({ ...form, serviceName: e.target.value, pricePkr: s?.pricePkr ?? form.pricePkr }); }}>
              <option value="">Service chunein</option>
              {(avail?.services ?? []).map((s) => <option key={s.id} value={s.name}>{s.name} — Rs {s.pricePkr.toLocaleString("en-PK")}</option>)}
            </select>
          </Field>
          <Field label="Stylist">
            <select className="input" value={form.staffName} onChange={(e) => setForm({ ...form, staffName: e.target.value })}>
              <option value="">Koi bhi</option>
              {(avail?.staff ?? []).map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value, time: "", chairId: "" })} />
          </Field>
          <Field label="Price (PKR)"><input type="number" min={0} className="input" value={form.pricePkr} onChange={(e) => setForm({ ...form, pricePkr: Number(e.target.value) })} /></Field>
        </div>

        {/* Slots — sab dikhte hain; booked wale FULL label ke sath */}
        <div className="mt-4">
          <p className="label">Time slot — {avail ? `${avail.slots.length} slots · ${prettyDate(form.date)}` : "loading…"}</p>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {(avail?.slots ?? []).map((s) => {
              const selected = s.time === form.time;
              const full = s.freeChairs === 0 && !(form.id && selected);
              return (
                <button
                  key={s.time}
                  type="button"
                  onClick={() => pickTime(s)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-center transition-colors",
                    selected && !full && "border-brand bg-brand text-white",
                    selected && full && "border-amber-500 bg-amber-500/15 text-amber-400",
                    !selected && full && "border-line bg-raised text-mut",
                    !selected && !full && "border-line bg-raised hover:border-brand hover:text-accent",
                  )}
                >
                  <span className="block text-[11px] font-extrabold">{s.time}</span>
                  <span className={cn("mt-0.5 block text-[8.5px] font-bold", full ? "text-amber-400" : "opacity-80")}>
                    {full ? "FULL" : `${s.freeChairs} free`}
                  </span>
                </button>
              );
            })}
            {!avail && Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[46px] animate-pulse rounded-lg bg-raised" />)}
          </div>
        </div>

        {/* Chairs — selected time par status */}
        <div className="mt-4">
          <p className="label">Chair {form.time ? `— ${form.time}` : "(pehle slot chunein)"}</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {(avail?.chairs ?? []).map((c) => {
              const st = chairState.get(c.id);
              const selected = form.chairId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickChair(c)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
                    selected && st?.free && "border-brand bg-brand-soft",
                    selected && !st?.free && "border-amber-500 bg-amber-500/10",
                    !selected && "border-line bg-raised hover:border-brand/60",
                  )}
                >
                  <Armchair size={14} className={st?.free ? "text-accent" : "text-amber-400"} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11.5px] font-bold">{c.name}</span>
                    <span className={cn("block truncate text-[9.5px]", st?.free ? "text-mut" : "text-amber-400 font-bold")}>
                      {!form.time ? "slot chunein" : st?.free ? "free — assign ho jayegi" : `booked · ${st?.with}`}
                    </span>
                  </span>
                  <Tag tone={st?.free ? "brand" : "amber"}>{!form.time ? "—" : st?.free ? "free" : "busy"}</Tag>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-mut"><Clock size={10} /> Chair khali chhorein to system pehli free chair auto-assign karta hai.</p>
        </div>

        {slotFull && !conflict && (
          <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <p className="flex items-center gap-2 text-[12px] font-extrabold text-amber-400"><AlertTriangle size={14} /> {form.time} par saari chairs booked hain</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed">
              Yeh slot already booked hai. Is slot ke liye humari team se WhatsApp par rabta karein — warna koi doosra slot book kar lein.
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <a href="https://wa.me/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-2.5 py-1.5 text-[11px] font-extrabold text-white"><MessageCircle size={12} /> WhatsApp par rabta</a>
              <Btn variant="soft" onClick={nextFreeSlot}><Clock size={12} /> Pehla free slot chunein</Btn>
            </div>
          </div>
        )}

        {conflict && (
          <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <p className="flex items-center gap-2 text-[12px] font-extrabold text-amber-400"><AlertTriangle size={14} /> Slot already booked{conflict.chairName ? ` — ${conflict.chairName}` : ""}</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed">{conflict.message}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <a href="https://wa.me/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-2.5 py-1.5 text-[11px] font-extrabold text-white"><MessageCircle size={12} /> Is slot ke liye WhatsApp par rabta</a>
              <Btn variant="soft" onClick={autoAssign}>Doosri free chair assign karein</Btn>
              <Btn variant="ghost" onClick={nextFreeSlot}><Clock size={12} /> Doosra free slot chunein</Btn>
            </div>
          </div>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Status">
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Notes"><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Sensitive scalp, ammonia-free…" /></Field>
          <div className="sm:col-span-2">
            <Field label="Source — booking aayi kahan se?" hint={SOURCE_MEANING[form.source] ?? "Yeh sirf record ke liye hai; reports isi se 'recovered' ginti hain."}>
              <select className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                {Object.keys(SOURCE_LABELS).map((k) => <option key={k} value={k}>{SOURCE_LABELS[k]} — {SOURCE_MEANING[k]}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <p className="flex items-center gap-1.5 text-[10px] text-mut"><ShieldCheck size={11} className="text-accent" /> Double-booking guard active</p>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn onClick={submit} busy={busy}>{form.id ? "Update karein" : "Booking confirm"}</Btn>
          </div>
        </div>
      </Modal>
      {node}
    </div>
  );
}


