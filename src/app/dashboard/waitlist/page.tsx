"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Clock, Users, Plus, Trash2, Sparkles, MessageCircle, AlertTriangle, Check } from "lucide-react";
import { Panel, Btn, Modal, Field, Empty, Tag, useToast, InfoNote } from "@/components/dash/bits";
import { useAdmin } from "@/components/dash/admin";
import {cn} from "@/components/ui";
import { prettyDate, todayISO } from "@/lib/utils";

interface Entry {
  id: string;
  customerName: string;
  phoneMasked: string;
  serviceName: string;
  preferredTime: string;
  status: string;
}
interface Slot { time: string; freeChairs: number; chairIdsFree: string[] }
interface Avail { date: string; slots: Slot[]; chairs: { id: string; name: string }[]; services: { id: string; name: string; pricePkr: number }[]; week: { date: string; count: number }[] }

/** Waitlist kya hai: jin customers ko slot nahi mila — unki queue. Slot khaali ho to yahin se dobara offer karte hain. */
export default function WaitlistPage() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; pricePkr: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ customerName: "", phoneMasked: "+92 3•• ••••", serviceName: "", preferredTime: "" });
  const [offer, setOffer] = useState<Entry | null>(null);
  const [avail, setAvail] = useState<Avail | null>(null);
  const [date, setDate] = useState(todayISO(1));
  const [time, setTime] = useState("");
  const [conflict, setConflict] = useState<string | null>(null);
  const { admin } = useAdmin();
  const { show, node } = useToast();

  const load = useCallback(async () => {
    const res = await fetch("/api/waitlist", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setRows(d.rows as Entry[]);
      setServices(d.services ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!offer) return;
    void (async () => {
      const res = await fetch(`/api/availability?date=${date}`, { cache: "no-store" });
      if (res.ok) {
        const d: Avail = await res.json();
        setAvail(d);
        setTime((t) => (d.slots.some((s) => s.time === t && s.freeChairs > 0) ? t : d.slots.find((s) => s.freeChairs > 0)?.time ?? ""));
      }
    })();
  }, [offer, date]);

  const add = async () => {
    if (!form.customerName.trim()) return show("Client ka naam likhein.");
    setBusy(true);
    const res = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setBusy(false);
    if (res.ok) {
      show("Waitlist par add ho gaya ✓");
      setOpen(false);
      setForm({ customerName: "", phoneMasked: "+92 3•• ••••", serviceName: "", preferredTime: "" });
      await load();
    } else show("Add nahi hua.");
  };

  const giveSlot = async () => {
    if (!offer || !time) return;
    setBusy(true);
    setConflict(null);
    const res = await fetch("/api/waitlist", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: offer.id, date, time }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.status === 409) return setConflict(d.message ?? "Slot already booked hai.");
    if (!res.ok) return show(d.message ?? "Slot offer nahi ho saka.");
    show(`${offer.customerName} ko ${time} ka slot mil gaya ✓ (waitlist backfill)`);
    setOffer(null);
    setConflict(null);
    await load();
  };

  const remove = async (e: Entry) => {
    if (!admin) return show("View mode — changes salon ke staff console se hote hain.");
    const res = await fetch(`/api/waitlist?id=${e.id}`, { method: "DELETE" });
    if (res.ok) { show("Waitlist se hata diya"); await load(); }
  };

  const waiting = rows.filter((r) => r.status === "waiting");
  const booked = rows.filter((r) => r.status === "booked");

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold sm:text-2xl">Waitlist</h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-mut">
            <b className="text-ink">Waitlist kya hai:</b> jin clients ko us waqt slot <b>nahi mila</b> (slot full tha), unki queue yahan banti hai.
            Jab koi booking cancel hoti hai ya koi slot khaali hota hai, to yehi log pehle offer paate hain — isi ko <b className="text-accent">waitlist backfill</b> kehte hain.
            Yeh khud-ba-khud chat se bhi bharta hai (Booking cancel karein → dekhein), aur yahan se manually bhi slot de sakte hain.
          </p>
        </div>
        <Btn onClick={() => { if (!admin) return show("View mode — changes salon ke staff console se hote hain."); setOpen(true); }}><Plus size={13} /> Waitlist par add</Btn>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Users, label: "Waiting", value: waiting.length, hint: "slot ke muntazir" },
          { icon: Check, label: "Slot mil gaya", value: booked.length, hint: "backfill ho chuke" },
          { icon: Sparkles, label: "Backfill source", value: rows.filter((r) => r.status === "booked").length, hint: "cancellation se bhare" },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <s.icon size={15} className="text-accent" />
            <p className="mt-2 text-2xl font-extrabold">{s.value}</p>
            <p className="text-[11px] font-bold">{s.label}</p>
            <p className="text-[9.5px] text-mut">{s.hint}</p>
          </div>
        ))}
      </div>

      <Panel className="mt-4" title={`Queue — ${waiting.length} waiting`} icon={<Clock size={14} className="text-accent" />}>
        <div className="grid gap-2">
          {loading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-raised" />)}
          {waiting.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-raised px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-bold">{e.customerName} <Tag tone="brand">{e.status}</Tag></p>
                <p className="text-[10px] text-mut">{e.phoneMasked} · {e.serviceName} · pasand: {e.preferredTime}</p>
              </div>
              <Btn variant="soft" onClick={() => { setOffer(e); setConflict(null); setDate(todayISO(1)); setTime(""); }}><CalendarDays size={12} /> Slot dein</Btn>
              <button type="button" onClick={() => void remove(e)} title="Hata dein" className="grid h-8 w-8 place-items-center rounded-md border border-line text-mut hover:border-red-500 hover:text-red-400"><Trash2 size={13} /></button>
            </div>
          ))}
          {!loading && waiting.length === 0 && <Empty>Waitlist khaali hai. Jab koi slot full ho jaye ya demo chat mein &ldquo;Cancellation → waitlist&rdquo; scenario chalayein, yahan entries aayengi.</Empty>}
        </div>
        <div className="mt-3"><InfoNote>Chat se bhi bharta hai: customer ko slot na mile to woh waitlist par jata hai, aur cancellation par khaali slot foran offer hota hai.</InfoNote></div>
      </Panel>

      {booked.length > 0 && (
        <Panel className="mt-4" title="Backfill history" icon={<Check size={14} className="text-accent" />}>
          <ul className="grid gap-2">
            {booked.map((e) => (
              <li key={e.id} className="flex items-center justify-between rounded-lg border border-line bg-raised px-3 py-2 text-[11.5px]">
                <span><b>{e.customerName}</b> · {e.serviceName} · {e.preferredTime}</span>
                <Tag tone="brand">booked</Tag>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Modal open={!!offer} onClose={() => { setOffer(null); setConflict(null); }} title={offer ? `${offer.customerName} ko slot dein` : "Slot offer"} wide>
        <p className="text-[11.5px] leading-relaxed text-mut">
          Date aur slot chunein. Sirf woh slots jin par koi chair free hai wohi &ldquo;free&rdquo; dikhenge — chair guard yahan bhi chalta hai.
        </p>
        <p className="label mt-3">Din</p>
        <div className="flex flex-wrap gap-1.5">
          {(avail?.week?.length ? avail.week : Array.from({ length: 7 }, (_, i) => ({ date: todayISO(i + 1), count: 0 }))).map((w) => (
            <button key={w.date} type="button" onClick={() => { setDate(w.date); setTime(""); setConflict(null); }} className={cn("rounded-lg border px-2.5 py-1.5 text-[10.5px] font-bold", date === w.date ? "border-brand bg-brand-soft text-accent" : "border-line bg-raised text-mut hover:text-ink")}>
              {prettyDate(w.date)}
            </button>
          ))}
        </div>
        <p className="label mt-4">Slot</p>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
          {(avail?.slots ?? []).map((s) => {
            const full = s.freeChairs === 0;
            return (
              <button key={s.time} type="button" disabled={full} onClick={() => { setTime(s.time); setConflict(null); }} className={cn("rounded-lg border px-2 py-2 text-center", time === s.time && !full && "border-brand bg-brand text-white", time !== s.time && !full && "border-line bg-raised hover:border-brand", full && "border-line bg-raised text-mut opacity-60")}>
                <span className="block text-[11px] font-extrabold">{s.time}</span>
                <span className="block text-[8.5px] font-bold opacity-80">{full ? "FULL" : `${s.freeChairs} free`}</span>
              </button>
            );
          })}
          {!avail && Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[46px] animate-pulse rounded-lg bg-raised" />)}
        </div>
        {conflict && (
          <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <p className="flex items-center gap-2 text-[12px] font-extrabold text-amber-400"><AlertTriangle size={14} /> Slot already booked</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed">{conflict}</p>
          </div>
        )}
        <div className="mt-4 flex justify-end gap-2 border-t border-line pt-3">
          <Btn variant="ghost" onClick={() => { setOffer(null); setConflict(null); }}>Cancel</Btn>
          <Btn onClick={giveSlot} busy={busy} disabled={!time}>Offer bhejein</Btn>
        </div>
      </Modal>

      <Modal open={open} onClose={() => setOpen(false)} title="Waitlist par add karein">
        <div className="grid gap-3">
          <Field label="Client ka naam"><input className="input" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Nimra" /></Field>
          <Field label="Phone (masked)"><input className="input" value={form.phoneMasked} onChange={(e) => setForm({ ...form, phoneMasked: e.target.value })} /></Field>
          <Field label="Service">
            <select className="input" value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })}>
              <option value="">Koi bhi</option>
              {services.map((s) => <option key={s.id} value={s.name}>{s.name} — Rs {s.pricePkr.toLocaleString("en-PK")}</option>)}
            </select>
          </Field>
          <Field label="Pasand ka waqt"><input className="input" value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} placeholder="Shaam 6 baje ke baad" /></Field>
        </div>
        <div className="mt-4 flex justify-end gap-2 border-t border-line pt-3">
          <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
          <Btn onClick={add} busy={busy}>Add karein</Btn>
        </div>
      </Modal>
      {node}
    </div>
  );
}
