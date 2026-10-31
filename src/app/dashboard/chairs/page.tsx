"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Armchair, DoorOpen, Lock } from "lucide-react";
import { Panel, Btn, Modal, Field, Empty, Tag, useToast, InfoNote } from "@/components/dash/bits";
import { useAdmin } from "@/components/dash/admin";
import { useCrud } from "@/components/dash/crud";
import {Switch, cn} from "@/components/ui";

interface Chair { id: string; name: string; kind: string; staffId: string | null; active: boolean; sortOrder: number }
interface Staff { id: string; name: string }
interface Booking { chairId: string | null; date: string; time: string; status: string; customerName: string }

const empty = { id: "", name: "", kind: "chair", staffId: "", active: true, sortOrder: 10 };

export default function ChairsPage() {
  const { rows, loading, busy, save, remove } = useCrud<Chair>("chairs");
  const staff = useCrud<Staff>("staff");
  const [form, setForm] = useState({ ...empty });
  const [open, setOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { admin } = useAdmin();
  const { show, node } = useToast();

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      if (res.ok) setBookings((await res.json()).bookings as Booking[]);
    })();
  }, [rows.length]);

  const today = new Date().toISOString().slice(0, 10);
  const staffName = (id: string | null) => staff.rows.find((s) => s.id === id)?.name ?? "Koi nahi";

  const submit = async () => {
    const r = await save({ ...form, staffId: form.staffId || null }, form.id || undefined);
    if (r.ok) {
      show(form.id ? "Chair update ho gayi ✓" : "Nayi chair add ho gayi ✓");
      setOpen(false);
      setForm({ ...empty });
    } else show(r.message ?? "Save nahi hua");
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold sm:text-2xl">Chairs & Rooms</h1>
          <p className="mt-1 text-[12px] text-mut">Har chair aik waqt mein aik booking — double-booking guard isi par chalta hai.</p>
        </div>
        <Btn onClick={() => { if (!admin) return show("View mode — changes salon ke staff console se hote hain."); setForm({ ...empty }); setOpen(true); }}>
          <Plus size={13} /> Nayi chair
        </Btn>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-[140px] animate-pulse" />)}
        {rows.map((c) => {
          const todays = bookings.filter((b) => b.chairId === c.id && b.date === today && b.status !== "cancelled");
          const busyNow = todays.length;
          return (
            <div key={c.id} className={cn("card p-4", !c.active && "opacity-70")}>
              <div className="flex items-start gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-accent">
                  {c.kind === "room" ? <DoorOpen size={16} /> : <Armchair size={16} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-extrabold">{c.name}</p>
                  <p className="text-[10px] text-mut">{c.kind === "room" ? "Room" : "Chair"} · Default stylist: {staffName(c.staffId)}</p>
                </div>
                <Tag tone={c.active ? "brand" : "mut"}>{c.active ? "active" : "off"}</Tag>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10.5px]">
                <div className="rounded-md border border-line bg-raised px-2 py-1.5"><span className="block text-[9px] text-mut">Aaj bookings</span>{busyNow}</div>
                <div className="rounded-md border border-line bg-raised px-2 py-1.5"><span className="block text-[9px] text-mut">Slot guard</span>{c.active ? "On" : "Off"}</div>
              </div>
              <div className="mt-3 flex gap-2 border-t border-line pt-2.5">
                <Btn variant="ghost" onClick={() => { setForm({ ...c, staffId: c.staffId ?? "" }); setOpen(true); }} className="flex-1"><Pencil size={12} /> Edit</Btn>
                <Btn variant="danger" onClick={async () => { if (!admin) return show("View mode — changes salon ke staff console se hote hain."); const r = await remove(c.id); show(r.ok ? "Chair delete ho gayi" : (r.message ?? "Delete nahi hua")); }} className="flex-1"><Trash2 size={12} /> Delete</Btn>
              </div>
            </div>
          );
        })}
        {!loading && rows.length === 0 && <div className="sm:col-span-2 xl:col-span-3"><Empty>Koi chair nahi — abhi koi record nahi.</Empty></div>}
      </div>

      <Panel className="mt-4" title="Aaj chair-wise bookings" icon={<Lock size={14} className="text-accent" />}>
        <div className="grid gap-2">
          {rows.map((c) => {
            const todays = bookings.filter((b) => b.chairId === c.id && b.date === today && b.status !== "cancelled");
            return (
              <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-raised px-3 py-2">
                <span className="text-[11px] font-bold">{c.name}</span>
                <div className="flex flex-wrap gap-1">
                  {todays.length === 0 && <Tag>free</Tag>}
                  {todays.map((b, i) => <Tag key={i} tone="brand">{b.time} · {b.customerName}</Tag>)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3"><InfoNote>Same chair + same time par booking ki koshish par system &ldquo;already booked&rdquo; batata hai aur WhatsApp par rabta karne ka mashwara deta hai.</InfoNote></div>
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "Chair edit" : "Nayi chair"}>
        <div className="grid gap-3">
          <Field label="Chair / Room ka naam"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Chair 3 — Nail Bar" /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type">
              <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                <option value="chair">Chair</option>
                <option value="room">Room</option>
              </select>
            </Field>
            <Field label="Default stylist">
              <select className="input" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}>
                <option value="">Koi nahi</option>
                {staff.rows.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Sort order"><input type="number" className="input" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></Field>
          <label className="flex items-center justify-between rounded-lg border border-line bg-raised px-3 py-2 text-[12px] font-bold">
            Active (inactive chair booking ke liye available nahi hogi)
            <Switch checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2 border-t border-line pt-3">
          <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
          <Btn onClick={submit} busy={busy}>Save karein</Btn>
        </div>
      </Modal>
      {node}
    </div>
  );
}

