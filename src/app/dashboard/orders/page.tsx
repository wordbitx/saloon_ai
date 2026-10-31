"use client";

import { useCallback, useEffect, useState } from "react";
import { ShoppingBag, Check, Clock, Package, XCircle } from "lucide-react";
import { Panel, Btn, Tag, useToast, Empty } from "@/components/dash/bits";
import { useAdmin } from "@/components/dash/admin";
import { pkr, timeAgo } from "@/lib/utils";
import { cn } from "@/components/ui";

interface Order {
  id: string;
  orderCode: string;
  customerName: string;
  phoneMasked: string;
  productName: string;
  qty: number;
  totalPkr: number;
  note: string;
  status: string;
  createdAt: string;
}

const NEXT: Record<string, { label: string; status: string }[]> = {
  new: [{ label: "Confirm", status: "confirmed" }, { label: "Cancel", status: "cancelled" }],
  confirmed: [{ label: "Ready for pickup", status: "ready" }, { label: "Cancel", status: "cancelled" }],
  ready: [{ label: "Completed", status: "completed" }],
  completed: [],
  cancelled: [],
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { admin } = useAdmin();
  const { show, node } = useToast();

  const load = useCallback(async () => {
    const res = await fetch("/api/orders", { cache: "no-store" });
    if (res.ok) setOrders((await res.json()).orders ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const setStatus = async (o: Order, status: string) => {
    if (!admin) return show("View mode — changes salon ke staff console se hote hain.");
    const res = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: o.id, status }),
    });
    if (res.ok) { show(`${o.orderCode} → ${status}`); await load(); }
    else show("Update nahi hua.");
  };

  const open = orders.filter((o) => o.status === "new" || o.status === "confirmed" || o.status === "ready");

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold sm:text-2xl"><ShoppingBag size={20} className="text-accent" /> Product orders</h1>
          <p className="mt-1 text-[12px] text-mut">Home aur /products se jo order aata hai, yahin dikhta hai. Public site par order list nahi.</p>
        </div>
        <span className="rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-extrabold text-accent">{open.length} open</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Clock, label: "New", n: orders.filter((o) => o.status === "new").length },
          { icon: Package, label: "In progress", n: orders.filter((o) => o.status === "confirmed" || o.status === "ready").length },
          { icon: Check, label: "Completed", n: orders.filter((o) => o.status === "completed").length },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <s.icon size={15} className="text-accent" />
            <p className="mt-2 text-2xl font-extrabold">{s.n}</p>
            <p className="text-[11px] font-bold text-mut">{s.label}</p>
          </div>
        ))}
      </div>

      <Panel className="mt-4" title={`${orders.length} orders`} icon={<ShoppingBag size={14} className="text-accent" />}>
        <div className="grid gap-2">
          {loading && <div className="h-20 animate-pulse rounded-lg bg-raised" />}
          {orders.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-raised px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-extrabold">{o.orderCode} · {o.customerName}</p>
                <p className="text-[11px] text-mut">{o.productName} ×{o.qty} · {pkr(o.totalPkr)} · {o.phoneMasked}</p>
                {o.note && <p className="text-[10.5px] text-mut">“{o.note}”</p>}
                <p className="text-[9.5px] text-mut">{timeAgo(o.createdAt)}</p>
              </div>
              <Tag tone={o.status === "new" ? "brand" : o.status === "cancelled" ? "red" : "mut"}>{o.status}</Tag>
              <div className="flex flex-wrap gap-1">
                {(NEXT[o.status] ?? []).map((a) => (
                  <button
                    key={a.status}
                    type="button"
                    onClick={() => void setStatus(o, a.status)}
                    className={cn("rounded-md border px-2 py-1 text-[10px] font-extrabold", a.status === "cancelled" ? "border-red-500/40 text-red-400" : "border-brand/40 text-accent hover:bg-brand hover:text-white")}
                  >
                    {a.status === "cancelled" ? <XCircle size={10} className="mr-1 inline" /> : null}
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!loading && orders.length === 0 && <Empty>Abhi koi product order nahi. Home ya /products se order aate hi yahan dikhega.</Empty>}
        </div>
      </Panel>
      {node}
    </div>
  );
}