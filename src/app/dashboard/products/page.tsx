"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ShoppingBag } from "lucide-react";
import { Btn, Modal, Field, Empty, useToast } from "@/components/dash/bits";
import { useAdmin } from "@/components/dash/admin";
import { Switch, cn } from "@/components/ui";
import { pkr } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string;
  pricePkr: number;
  category: string;
  stock: number;
  emoji: string;
  imageUrl?: string | null;
  active: boolean;
  sortOrder: number;
}

const CATS = ["Haircare", "Skin", "Nails", "Bridal", "Fragrance"];
const empty = { id: "", name: "", description: "", pricePkr: 1500, category: "Haircare", stock: 10, emoji: "✨", imageUrl: "", active: true, sortOrder: 10 };

function ProductThumb({ imageUrl, name, emoji }: { imageUrl?: string | null; name: string; emoji: string }) {
  const [broken, setBroken] = useState(false);
  if (!imageUrl || broken) {
    return <div className="grid h-40 place-items-center border-b border-line bg-brand-soft text-4xl">{emoji}</div>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={name}
      loading="lazy"
      onError={() => setBroken(true)}
      className="h-40 w-full border-b border-line object-cover"
    />
  );
}

export default function ProductsAdminPage() {
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...empty });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { admin } = useAdmin();
  const { show, node } = useToast();

  const load = useCallback(async () => {
    const res = await fetch("/api/products?all=1", { cache: "no-store" });
    if (res.ok) setRows((await res.json()).products ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!admin) return show("View mode — changes salon ke staff console se hote hain.");
    setBusy(true);
    const res = await fetch("/api/products", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, imageUrl: form.imageUrl || null }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return show(d.message ?? d.note ?? "Save nahi hua.");
    show(form.id ? "Product update ✓ — home par foran" : "Product add ✓ — home aur /products par dikhega");
    setOpen(false);
    setForm({ ...empty });
    await load();
  };

  const toggle = async (p: Product, active: boolean) => {
    if (!admin) return show("View mode — changes salon ke staff console se hote hain.");
    await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, active }) });
    await load();
  };

  const remove = async (p: Product) => {
    if (!admin) return show("View mode — changes salon ke staff console se hote hain.");
    const res = await fetch(`/api/products?id=${p.id}`, { method: "DELETE" });
    if (res.ok) { show("Product hata diya"); await load(); }
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold sm:text-2xl">Products — shelf</h1>
          <p className="mt-1 text-[12px] text-mut">Jo yahan add hoga, home (hero ke neeche) aur /products par foran dikhega. Order admin orders tab mein aata hai.</p>
        </div>
        <Btn onClick={() => { if (!admin) return show("View mode — changes salon ke staff console se hote hain."); setForm({ ...empty }); setOpen(true); }}><Plus size={13} /> Naya product</Btn>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-72 animate-pulse" />)}
        {rows.map((p) => (
          <div key={p.id} className={cn("card overflow-hidden", !p.active && "opacity-60")}>
            <ProductThumb key={p.imageUrl ?? "no-img"} imageUrl={p.imageUrl} name={p.name} emoji={p.emoji} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-extrabold">{p.emoji} {p.name}</p>
                <Switch checked={p.active} onChange={(v) => void toggle(p, v)} label={`${p.name} active`} />
              </div>
              <p className="mt-1 text-[11px] text-mut">{p.category} · stock {p.stock}</p>
              <p className="mt-2 text-xl font-extrabold text-accent">{pkr(p.pricePkr)}</p>
              <p className="mt-1 line-clamp-2 text-[12px] text-mut">{p.description}</p>
              <div className="mt-4 flex gap-2 border-t border-line pt-3">
                <Btn variant="ghost" className="flex-1" onClick={() => { setForm({ ...p, imageUrl: p.imageUrl ?? "" }); setOpen(true); }}><Pencil size={12} /> Edit</Btn>
                <Btn variant="danger" className="flex-1" onClick={() => void remove(p)}><Trash2 size={12} /> Delete</Btn>
              </div>
            </div>
          </div>
        ))}
        {!loading && rows.length === 0 && <div className="sm:col-span-2 xl:col-span-3"><Empty>Shelf khali — naya product add karein.</Empty></div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "Product edit" : "Naya product"}>
        <div className="grid gap-3">
          <Field label="Naam"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Keratin Serum" /></Field>
          <Field label="Description"><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (PKR)"><input type="number" className="input" value={form.pricePkr} onChange={(e) => setForm({ ...form, pricePkr: Number(e.target.value) })} /></Field>
            <Field label="Stock"><input type="number" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Emoji (photo na ho to)"><input className="input" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} /></Field>
          </div>
          <Field label="Product photo URL (https ya /images/...)" hint="Apni website ki image link ya /images/products/... path. Khali chhorein to emoji dikhega.">
            <input className="input" value={form.imageUrl ?? ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="/images/products/keratin-serum.jpg" />
          </Field>
          {form.imageUrl && /^(https:\/\/|\/)/.test(form.imageUrl) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.imageUrl} alt="Preview" className="h-32 w-full rounded-lg border border-line object-cover" />
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2 border-t border-line pt-3">
          <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
          <Btn onClick={() => void save()} busy={busy}><ShoppingBag size={12} /> Save</Btn>
        </div>
      </Modal>
      {node}
    </div>
  );
}
