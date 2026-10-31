"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight, Minus, Plus, Check } from "lucide-react";
import { RippleButton, cn } from "@/components/ui";
import { pkr } from "@/lib/utils";

export interface ShelfProduct {
  id: string;
  name: string;
  description: string;
  pricePkr: number;
  category: string;
  stock: number;
  emoji: string;
  imageUrl?: string | null;
}

const FALLBACK_PRODUCTS: ShelfProduct[] = [
  { id: "00000000-0000-4000-8000-000000000301", imageUrl: "/images/products/keratin-serum.jpg", name: "Keratin Repair Serum", description: "Color ke baad frizz kam kare — 100ml.", pricePkr: 2800, category: "Haircare", stock: 14, emoji: "💧" },
  { id: "00000000-0000-4000-8000-000000000302", imageUrl: "/images/products/silk-hair-mask.jpg", name: "Silk Hair Mask", description: "Weekly deep mask, dry ends ke liye.", pricePkr: 2200, category: "Haircare", stock: 9, emoji: "🎀" },
  { id: "00000000-0000-4000-8000-000000000303", imageUrl: "/images/products/after-color-shampoo.jpg", name: "After-Color Shampoo", description: "Color lock shampoo, sulfate-free.", pricePkr: 1650, category: "Haircare", stock: 18, emoji: "🧴" },
  { id: "00000000-0000-4000-8000-000000000304", imageUrl: "/images/products/hydra-glow-kit.jpg", name: "Hydra Glow Facial Kit", description: "Ghar par 3-step glow — salon facial ke baad.", pricePkr: 3400, category: "Skin", stock: 7, emoji: "✨" },
  { id: "00000000-0000-4000-8000-000000000305", imageUrl: "/images/products/nail-strengthener.jpg", name: "Nail Strengthener", description: "Gel ke baad weak nails ke liye.", pricePkr: 890, category: "Nails", stock: 22, emoji: "💅" },
  { id: "00000000-0000-4000-8000-000000000306", imageUrl: "/images/products/bridal-mehndi-set.jpg", name: "Bridal Mehndi Cone Set", description: "4 cones + aftercare oil. Shaadi season.", pricePkr: 1200, category: "Bridal", stock: 11, emoji: "🌿" },
];

function ProductImage({ p, className }: { p: ShelfProduct; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (!p.imageUrl || broken) {
    return <div className={cn("grid place-items-center bg-brand-soft text-4xl", className)} aria-hidden>{p.emoji}</div>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.imageUrl} alt={p.name} loading="lazy" onError={() => setBroken(true)} className={cn("object-cover", className)} />
  );
}

/** Home strip + /products dono isi catalog se chalte hain. Admin jo add kare, yahan foran. */
export function ProductCatalog({
  limit,
  heading = true,
}: {
  limit?: number;
  heading?: boolean;
}) {
  const [products, setProducts] = useState<ShelfProduct[]>(FALLBACK_PRODUCTS);
  const [salon, setSalon] = useState("Elan Beauty");
  const [loading, setLoading] = useState(false);
  const [pick, setPick] = useState<ShelfProduct | null>(null);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");

  const load = async () => {
    const res = await fetch("/api/products", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setProducts(d.products ?? []);
      setSalon(d.salon ?? "");
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const cats = ["All", ...Array.from(new Set(products.map((p) => p.category)))];
  const shown = (filter === "All" ? products : products.filter((p) => p.category === filter)).slice(0, limit ?? 99);

  const order = async () => {
    if (!pick) return;
    if (!name.trim()) { setErr("Apna naam likhein."); return; }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: pick.id, customerName: name.trim(), phone, qty, note }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.message ?? "Order nahi gaya."); return; }
      setDone(d.order?.orderCode ?? "ORD");
      setPick(null);
      setName("");
      setPhone("");
      setNote("");
      setQty(1);
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={limit ? "site-container home-section pt-2" : "mx-auto max-w-6xl px-4 py-10"}>
      {heading && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-accent">Salon shelf</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Products — jo admin add kare</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-mut">
              {salon || "Salon"} ki retail shelf. Order yahin se jata hai — seedha admin dashboard mein, WhatsApp spam nahi.
            </p>
          </div>
          {limit ? (
            <RippleButton href="/products" variant="ghost" className="!py-2 text-xs">
              Poori shelf <ArrowRight size={13} />
            </RippleButton>
          ) : (
            <Link href="/" className="text-xs font-bold text-accent hover:underline">← Home</Link>
          )}
        </div>
      )}

      {!limit && cats.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <button key={c} type="button" onClick={() => setFilter(c)} className={cn("rounded-full border px-3 py-1.5 text-[11px] font-extrabold", filter === c ? "border-brand bg-brand text-white" : "border-line bg-card text-mut hover:text-ink")}>
              {c}
            </button>
          ))}
        </div>
      )}

      {done && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-brand/40 bg-brand-soft px-4 py-3 text-sm">
          <Check size={16} className="mt-0.5 text-accent" />
          <p><b>{done}</b> admin dashboard mein chala gaya. Salon confirm karega — aap ko yahin se pickup mil jayegi.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {loading && Array.from({ length: limit ?? 6 }).map((_, i) => <div key={i} className="card h-64 animate-pulse" />)}
        {shown.map((p) => (
          <article key={p.id} className="card group flex flex-col overflow-hidden transition-colors hover:border-brand/50">
            <div className="relative aspect-[4/3] overflow-hidden border-b border-line">
              <ProductImage p={p} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.05]" />
              <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-white backdrop-blur">{p.category}</span>
              {p.stock > 0 && p.stock <= 5 && (
                <span className="absolute right-2 top-2 rounded bg-amber-500/90 px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-black">Sirf {p.stock} bache</span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-3">
              <h3 className="truncate text-[13px] font-extrabold">{p.name}</h3>
              <p className="mt-1 line-clamp-2 flex-1 text-[11px] leading-relaxed text-mut">{p.description}</p>
              <div className="mt-3 flex items-baseline justify-between gap-2">
                <p className="text-base font-extrabold text-accent">{pkr(p.pricePkr)}</p>
                <p className="text-[9px] font-semibold text-mut">{p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</p>
              </div>
              <button
                type="button"
                disabled={p.stock < 1}
                onClick={() => { setPick(p); setQty(1); setErr(null); setDone(null); }}
                className="btn-brand mt-2.5 w-full !py-2 text-[11px] disabled:opacity-40"
              >
                <ShoppingBag size={12} /> Place Order
              </button>
            </div>
          </article>
        ))}
        {!loading && shown.length === 0 && (
          <p className="card col-span-full px-4 py-8 text-center text-sm text-mut">Abhi shelf khali hai. Admin product add kare to yahan aa jayega.</p>
        )}
      </div>

      {pick && (
        <div
          className="fixed inset-0 z-[95] flex items-end justify-center overflow-y-auto bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label={`Place Order — ${pick.name}`}
        >
          <button type="button" className="absolute inset-0 cursor-default" onClick={() => setPick(null)} aria-label="Order dialog band karein" />
          <div className="relative my-auto w-full max-w-2xl overflow-hidden rounded-t-2xl border border-line bg-card shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-2xl">
            <div className="grid max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-h-[calc(100dvh-3rem)] md:grid-cols-[0.88fr_1.12fr]">
              <div className="relative min-h-52 overflow-hidden border-b border-line md:min-h-full md:border-b-0 md:border-r">
                <ProductImage p={pick} className="absolute inset-0 h-full w-full" />
                <div className="absolute inset-x-0 bottom-0 bg-black/65 px-5 py-4 text-white backdrop-blur-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-mint">{pick.category}</p>
                  <p className="mt-1 text-lg font-extrabold">{pick.name}</p>
                  <p className="mt-0.5 text-sm text-white/75">{pkr(pick.pricePkr)} · {pick.stock} in stock</p>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-accent">Salon product request</p>
                    <h3 className="mt-1 text-xl font-extrabold">Place your order</h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-mut">Salon aap ka order review karke pickup ya delivery ka confirm message bhejega.</p>
                  </div>
                  <button type="button" onClick={() => setPick(null)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-mut transition-colors hover:border-brand hover:text-ink" aria-label="Band karein">✕</button>
                </div>

                <div className="mt-5 grid gap-3">
                  <label className="block"><span className="label">Naam</span><input autoFocus className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ayesha" /></label>
                  <label className="block"><span className="label">Phone</span><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx — dashboard par masked jayega" /></label>
                  <div className="flex items-center justify-between rounded-xl border border-line bg-raised px-3.5 py-3">
                    <span className="text-[12px] font-extrabold">Quantity</span>
                    <span className="flex items-center gap-2.5">
                      <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink transition-colors hover:border-brand" aria-label="Kam"><Minus size={15} /></button>
                      <span className="w-7 text-center text-base font-extrabold">{qty}</span>
                      <button type="button" onClick={() => setQty((q) => Math.min(pick.stock, q + 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink transition-colors hover:border-brand" aria-label="Zyada"><Plus size={15} /></button>
                    </span>
                  </div>
                  <label className="block"><span className="label">Note (optional)</span><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Pickup shaam ko" /></label>
                  <div className="flex items-center justify-between border-t border-line pt-4">
                    <span className="text-sm font-bold text-mut">Total</span>
                    <p className="text-xl font-extrabold">{pkr(pick.pricePkr * qty)}</p>
                  </div>
                  {err && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] font-bold text-red-400">{err}</p>}
                  <button type="button" disabled={busy} onClick={() => void order()} className="btn-brand w-full !rounded-xl !py-3 text-sm">
                    <ShoppingBag size={15} /> {busy ? "Placing order…" : "Place Order"}
                  </button>
                  <p className="text-center text-[10.5px] leading-relaxed text-mut">Poora number store nahi hota. Order sirf is salon ke admin dashboard mein jata hai.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}