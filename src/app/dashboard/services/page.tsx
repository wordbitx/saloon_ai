"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Scissors, Crown, Sparkles } from "lucide-react";
import { Panel, Btn, Modal, Field, Empty, Tag, useToast, InfoNote } from "@/components/dash/bits";
import { useAdmin } from "@/components/dash/admin";
import { useCrud } from "@/components/dash/crud";
import {Switch, cn} from "@/components/ui";
import { pkr } from "@/lib/utils";

interface Service { id: string; name: string; pricePkr: number; durationMins: number; category: string; active: boolean; sortOrder: number }

const empty = { id: "", name: "", pricePkr: 1000, durationMins: 45, category: "regular", active: true, sortOrder: 10 };

export default function ServicesPage() {
  const { rows, loading, busy, save, remove } = useCrud<Service>("services");
  const [form, setForm] = useState({ ...empty });
  const [open, setOpen] = useState(false);
  const { admin } = useAdmin();
  const { show, node } = useToast();

  const submit = async () => {
    const r = await save({ ...form }, form.id || undefined);
    if (r.ok) {
      show(form.id ? "Service update ✓" : "Nayi service add ✓ — chat ab naya rate bolega");
      setOpen(false);
      setForm({ ...empty });
    } else show(r.message ?? "Save nahi hua");
  };

  const toggle = async (s: Service, v: boolean) => {
    const r = await save({ active: v }, s.id);
    if (!r.ok) show(r.message ?? "View mode — changes salon ke staff console se hote hain.");
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold sm:text-2xl">Services & Rates</h1>
          <p className="mt-1 text-[12px] text-mut">Yahan rate badlein — demo chat aur booking form usi waqt naya rate bolenge.</p>
        </div>
        <Btn onClick={() => { if (!admin) return show("View mode — changes salon ke staff console se hote hain."); setForm({ ...empty }); setOpen(true); }}>
          <Plus size={13} /> Nayi service
        </Btn>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading && Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-[130px] animate-pulse" />)}
        {rows.map((s) => (
          <div key={s.id} className={cn("card p-4", !s.active && "opacity-70")}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[13px] font-extrabold">{s.name}</p>
                <p className="text-[10px] text-mut">{s.durationMins} min · {s.category}</p>
              </div>
              <Switch checked={s.active} onChange={(v) => void toggle(s, v)} label={`${s.name} active`} />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-accent">{pkr(s.pricePkr)}</p>
            <div className="mt-2 flex items-center gap-1.5">
              {s.category === "bridal" ? <Tag tone="amber"><Crown size={9} /> bridal</Tag> : s.category === "addon" ? <Tag tone="brand"><Sparkles size={9} /> upsell</Tag> : <Tag>regular</Tag>}
            </div>
            <div className="mt-3 flex gap-2 border-t border-line pt-2.5">
              <Btn variant="ghost" onClick={() => { setForm({ ...s }); setOpen(true); }} className="flex-1"><Pencil size={12} /> Edit</Btn>
              <Btn variant="danger" onClick={async () => { if (!admin) return show("View mode — changes salon ke staff console se hote hain."); const r = await remove(s.id); show(r.ok ? "Service delete ✓" : (r.message ?? "Delete nahi hua")); }} className="flex-1"><Trash2 size={12} /> Delete</Btn>
            </div>
          </div>
        ))}
        {!loading && rows.length === 0 && <div className="sm:col-span-2 xl:col-span-3"><Empty>Koi service nahi — abhi koi record nahi.</Empty></div>}
      </div>

      <Panel className="mt-4" title="Rate card" icon={<Scissors size={14} className="text-accent" />}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[11.5px]">
            <thead><tr className="border-b border-line text-[9.5px] uppercase tracking-wider text-mut"><th className="py-2 font-extrabold">Service</th><th className="py-2 font-extrabold">Rate</th><th className="py-2 font-extrabold">Duration</th><th className="py-2 font-extrabold">Type</th><th className="py-2 font-extrabold">Status</th></tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-line/60 last:border-0">
                  <td className="py-2 font-bold">{s.name}</td><td className="py-2 text-accent">{pkr(s.pricePkr)}</td><td className="py-2 text-mut">{s.durationMins} min</td><td className="py-2 capitalize text-mut">{s.category}</td><td className="py-2"><Tag tone={s.active ? "brand" : "mut"}>{s.active ? "on" : "off"}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3"><InfoNote>Chat assistant har rate seedha isi table se parhta hai — koi hardcoded price nahi.</InfoNote></div>
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "Service edit" : "Nayi service"}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Service naam"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Facial" /></Field></div>
          <Field label="Rate (PKR)"><input type="number" min={0} className="input" value={form.pricePkr} onChange={(e) => setForm({ ...form, pricePkr: Number(e.target.value) })} /></Field>
          <Field label="Duration (min)"><input type="number" min={10} className="input" value={form.durationMins} onChange={(e) => setForm({ ...form, durationMins: Number(e.target.value) })} /></Field>
          <Field label="Category">
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="regular">Regular</option>
              <option value="bridal">Bridal</option>
              <option value="addon">Add-on / Upsell</option>
            </select>
          </Field>
          <Field label="Sort order"><input type="number" className="input" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></Field>
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