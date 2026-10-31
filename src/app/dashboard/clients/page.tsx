"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Users, CalendarCheck, Wallet, StickyNote } from "lucide-react";
import { Panel, Btn, Modal, Field, Empty, Avatar, Tag, useToast } from "@/components/dash/bits";
import { useAdmin } from "@/components/dash/admin";
import { useCrud } from "@/components/dash/crud";
import {cn} from "@/components/ui";
import { prettyDate } from "@/lib/utils";

interface Client {
  id: string; name: string; phoneMasked: string; lastService: string; visits: number; tag: string;
  preferredStaff: string | null; notes: string; totalSpentPkr: number; lastVisitISO: string | null;
}
interface Booking { customerName: string; serviceName: string; date: string; time: string; status: string; pricePkr: number }

const empty = { id: "", name: "", phoneMasked: "+92 3•• ••••", lastService: "", visits: 0, tag: "new", preferredStaff: "", notes: "", totalSpentPkr: 0, lastVisitISO: "" };
const TAGS: Record<string, "brand" | "mut" | "amber" | "red"> = { vip: "amber", regular: "brand", new: "mut", "at-risk": "red" };

export default function ClientsPage() {
  const { rows, loading, busy, save, remove } = useCrud<Client>("clients");
  const [form, setForm] = useState({ ...empty });
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Client | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const { admin } = useAdmin();
  const { show, node } = useToast();

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      if (res.ok) setBookings((await res.json()).bookings as Booking[]);
    })();
  }, [rows.length]);

  const shown = useMemo(() => {
    let list = rows;
    if (tagFilter !== "all") list = list.filter((c) => c.tag === tagFilter);
    if (query.trim()) list = list.filter((c) => `${c.name} ${c.phoneMasked} ${c.lastService}`.toLowerCase().includes(query.toLowerCase()));
    return list;
  }, [rows, tagFilter, query]);

  const profileBookings = selected ? bookings.filter((b) => b.customerName === selected.name) : [];

  const submit = async () => {
    const r = await save({ ...form, preferredStaff: form.preferredStaff || null, lastVisitISO: form.lastVisitISO || null }, form.id || undefined);
    if (r.ok) {
      show(form.id ? "Client profile update ✓" : "Naya client add ✓");
      setOpen(false);
      setForm({ ...empty });
      setSelected(null);
    } else show(r.message ?? "Save nahi hua");
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold sm:text-2xl">Clients</h1>
          <p className="mt-1 text-[12px] text-mut">Har client ki profile, visits, spend aur preferred stylist.</p>
        </div>
        <Btn onClick={() => { if (!admin) return show("View mode — changes salon ke staff console se hote hain."); setForm({ ...empty }); setOpen(true); }}>
          <Plus size={13} /> Naya client
        </Btn>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5">
          <Search size={13} className="text-mut" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Naam, number, service search karein…" aria-label="Clients search" className="w-full bg-transparent text-[12px] outline-none" />
        </div>
        <div className="flex rounded-lg border border-line bg-card p-0.5">
          {["all", "vip", "regular", "new", "at-risk"].map((t) => (
            <button key={t} type="button" onClick={() => setTagFilter(t)} className={cn("rounded-md px-2.5 py-1.5 text-[10.5px] font-extrabold capitalize", tagFilter === t ? "bg-brand text-white" : "text-mut hover:text-ink")}>{t}</button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Panel title={`${shown.length} clients`} icon={<Users size={14} className="text-accent" />}>
          <div className="grid gap-2">
            {loading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-raised" />)}
            {shown.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  selected?.id === c.id ? "border-brand bg-brand-soft" : "border-line bg-raised hover:border-brand/50",
                )}
              >
                <Avatar name={c.name} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold">{c.name} <Tag tone={TAGS[c.tag] ?? "mut"}>{c.tag}</Tag></p>
                  <p className="truncate text-[10px] text-mut">{c.phoneMasked} · last: {c.lastService || "—"} {c.preferredStaff ? `· ${c.preferredStaff}` : ""}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11.5px] font-extrabold">{c.visits} visits</p>
                  <p className="text-[9.5px] text-mut">PKR {c.totalSpentPkr.toLocaleString("en-PK")}</p>
                </div>
              </button>
            ))}
            {!loading && shown.length === 0 && <Empty>Koi client match nahi hua.</Empty>}
          </div>
        </Panel>

        <div className="grid content-start gap-4">
          {selected ? (
            <Panel
              title={selected.name}
              subtitle={`${selected.phoneMasked} · ${selected.visits} visits`}
              icon={<Avatar name={selected.name} size={22} />}
              action={
                <div className="flex gap-1.5">
                  <Btn variant="ghost" onClick={() => { setForm({ ...selected, preferredStaff: selected.preferredStaff ?? "", lastVisitISO: selected.lastVisitISO ?? "" }); setOpen(true); }}><Pencil size={12} /> Edit</Btn>
                  <Btn variant="danger" onClick={async () => { if (!admin) return show("View mode — changes salon ke staff console se hote hain."); const r = await remove(selected.id); if (r.ok) { show("Client delete ✓"); setSelected(null); } else show(r.message ?? "Delete nahi hua"); }}><Trash2 size={12} /></Btn>
                </div>
              }
            >
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-line bg-raised py-2"><Wallet size={12} className="mx-auto text-accent" /><p className="mt-1 text-[11px] font-extrabold">PKR {selected.totalSpentPkr.toLocaleString("en-PK")}</p><p className="text-[9px] text-mut">total spend</p></div>
                <div className="rounded-lg border border-line bg-raised py-2"><CalendarCheck size={12} className="mx-auto text-accent" /><p className="mt-1 text-[11px] font-extrabold">{profileBookings.length}</p><p className="text-[9px] text-mut">bookings</p></div>
                <div className="rounded-lg border border-line bg-raised py-2"><Tag tone={TAGS[selected.tag] ?? "mut"}>{selected.tag}</Tag><p className="mt-1 text-[9px] text-mut">segment</p></div>
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-raised px-3 py-2 text-[11px] leading-relaxed">
                <StickyNote size={12} className="mt-0.5 shrink-0 text-accent" /> {selected.notes || "Koi note nahi."}
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-mut">Booking history</p>
                <ul className="mt-1.5 grid gap-1.5">
                  {profileBookings.slice(0, 6).map((b, i) => (
                    <li key={i} className="flex items-center justify-between rounded-md border border-line px-2.5 py-1.5 text-[10.5px]">
                      <span><b>{b.serviceName}</b> · {prettyDate(b.date)} {b.time}</span>
                      <Tag tone={b.status === "cancelled" ? "red" : "brand"}>{b.status}</Tag>
                    </li>
                  ))}
                  {profileBookings.length === 0 && <li className="text-[10.5px] text-mut">Koi booking record nahi.</li>}
                </ul>
              </div>
            </Panel>
          ) : (
            <Panel title="Client profile" icon={<Users size={14} className="text-accent" />}>
              <Empty>Left se koi client chunein — profile, notes aur booking history yahan aayegi.</Empty>
            </Panel>
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "Client edit" : "Naya client"}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Naam"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ayesha" /></Field>
          <Field label="Phone (masked)"><input className="input" value={form.phoneMasked} onChange={(e) => setForm({ ...form, phoneMasked: e.target.value })} /></Field>
          <Field label="Last service"><input className="input" value={form.lastService} onChange={(e) => setForm({ ...form, lastService: e.target.value })} placeholder="Balayage" /></Field>
          <Field label="Preferred staff"><input className="input" value={form.preferredStaff} onChange={(e) => setForm({ ...form, preferredStaff: e.target.value })} placeholder="Hina" /></Field>
          <Field label="Segment">
            <select className="input" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })}>
              {["new", "regular", "vip", "at-risk"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Visits"><input type="number" min={0} className="input" value={form.visits} onChange={(e) => setForm({ ...form, visits: Number(e.target.value) })} /></Field>
          <Field label="Total spend (PKR)"><input type="number" min={0} className="input" value={form.totalSpentPkr} onChange={(e) => setForm({ ...form, totalSpentPkr: Number(e.target.value) })} /></Field>
          <Field label="Last visit (date)"><input type="date" className="input" value={form.lastVisitISO} onChange={(e) => setForm({ ...form, lastVisitISO: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Notes"><textarea className="input min-h-[70px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Allergies, preferences…" /></Field></div>
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