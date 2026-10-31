"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, UserCog, Star, Armchair } from "lucide-react";
import { Panel, Btn, Modal, Field, Empty, Avatar, Tag, useToast } from "@/components/dash/bits";
import { useAdmin } from "@/components/dash/admin";
import { useCrud } from "@/components/dash/crud";
import {Switch, cn} from "@/components/ui";

interface Staff { id: string; name: string; specialty: string; role: string; phoneMasked: string; active: boolean; rating: number }
interface Chair { id: string; name: string; staffId: string | null }
interface Booking { staffName: string | null; date: string; status: string }

const empty = { id: "", name: "", specialty: "", role: "Stylist", phoneMasked: "+92 3•• ••••", active: true, rating: 5 };

export default function TeamPage() {
  const { rows, loading, busy, save, remove } = useCrud<Staff>("staff");
  const chairs = useCrud<Chair>("chairs");
  const [form, setForm] = useState({ ...empty });
  const [open, setOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { admin } = useAdmin();
  const { show, node } = useToast();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      if (res.ok) setBookings((await res.json()).bookings as Booking[]);
    })();
  }, [rows.length]);

  const loadCount = (name: string) => bookings.filter((b) => b.staffName === name && b.status !== "cancelled").length;
  const chairOf = useMemo(() => (name: string) => chairs.rows.find((c) => c.name.includes("") && c.staffId === rows.find((r) => r.name === name)?.id), [chairs.rows, rows]);

  const submit = async () => {
    const r = await save({ ...form }, form.id || undefined);
    if (r.ok) {
      show(form.id ? "Staff update ho gaya ✓" : "Naya staff add ho gaya ✓");
      setOpen(false);
      setForm({ ...empty });
      await chairs.load();
    } else show(r.message ?? "Save nahi hua");
  };

  const toggle = async (s: Staff, v: boolean) => {
    const r = await save({ active: v }, s.id);
    if (!r.ok) show(r.message ?? "View mode — changes salon ke staff console se hote hain.");
  };

  const del = async (s: Staff) => {
    if (!admin) return show("View mode — changes salon ke staff console se hote hain.");
    const r = await remove(s.id);
    if (r.ok) show("Staff delete ho gaya");
    else show(r.message ?? "Delete nahi hua");
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold sm:text-2xl">Staff</h1>
          <p className="mt-1 text-[12px] text-mut">Profiles, stylist-wise bookings, chairs — admin full CRUD.</p>
        </div>
        <Btn
          onClick={() => {
            if (!admin) return show("View mode — changes salon ke staff console se hote hain.");
            setForm({ ...empty });
            setOpen(true);
          }}
        >
          <Plus size={13} /> Naya staff
        </Btn>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-[168px] animate-pulse" />)}
        {rows.map((s) => {
          const chair = chairOf(s.name);
          return (
            <div key={s.id} className={cn("card p-4", !s.active && "opacity-70")}>
              <div className="flex items-start gap-3">
                <Avatar name={s.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-extrabold">{s.name}</p>
                  <p className="truncate text-[10.5px] text-mut">{s.role} · {s.specialty}</p>
                  <div className="mt-1 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={9} className={i < s.rating ? "fill-brand text-brand" : "text-line"} />)}
                  </div>
                </div>
                <Switch checked={s.active} onChange={(v) => void toggle(s, v)} label={`${s.name} active`} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10.5px]">
                <div className="rounded-md border border-line bg-raised px-2 py-1.5"><span className="block text-[9px] text-mut">Phone</span>{s.phoneMasked}</div>
                <div className="rounded-md border border-line bg-raised px-2 py-1.5"><span className="block text-[9px] text-mut">Bookings</span>{loadCount(s.name)}</div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-mut">
                <Armchair size={11} className="text-accent" /> {chair ? chair.name : "Chair assign nahi"}
                <Tag tone={s.active ? "brand" : "mut"}>{s.active ? "active" : "off"}</Tag>
              </div>
              <div className="mt-3 flex gap-2 border-t border-line pt-2.5">
                <Btn variant="ghost" onClick={() => { setForm({ ...s }); setOpen(true); }} className="flex-1"><Pencil size={12} /> Edit</Btn>
                <Btn variant="danger" onClick={() => void del(s)} className="flex-1"><Trash2 size={12} /> Delete</Btn>
              </div>
            </div>
          );
        })}
        {!loading && rows.length === 0 && <div className="sm:col-span-2 xl:col-span-3"><Empty>Koi staff nahi — abhi koi record nahi.</Empty></div>}
      </div>

      <Panel className="mt-4" title="Staff-wise load (aaj tak)" icon={<UserCog size={14} className="text-accent" />}>
        <ul className="grid gap-2">
          {rows.map((s) => (
            <li key={s.id}>
              <div className="flex items-center justify-between text-[11px] font-bold"><span>{s.name}</span><span className="text-mut">{loadCount(s.name)} bookings</span></div>
              <div className="mt-1 h-1.5 rounded-full bg-raised"><div className="h-1.5 rounded-full bg-brand" style={{ width: `${Math.min(100, loadCount(s.name) * 15)}%` }} /></div>
            </li>
          ))}
        </ul>
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "Staff edit" : "Naya staff"}>
        <div className="grid gap-3">
          <Field label="Naam"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Hina" /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Role">
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {["Senior Stylist", "Stylist", "Junior Stylist", "Makeup Artist", "Beauty Therapist", "Manager"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Rating">
              <select className="input" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star</option>)}
              </select>
            </Field>
          </div>
          <Field label="Specialty"><input className="input" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Hair Color & Balayage" /></Field>
          <Field label="Phone (masked)" hint="Poora number kabhi store nahi hota"><input className="input" value={form.phoneMasked} onChange={(e) => setForm({ ...form, phoneMasked: e.target.value })} /></Field>
          <label className="flex items-center justify-between rounded-lg border border-line bg-raised px-3 py-2 text-[12px] font-bold">
            Active
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