import { db } from "@/db";
import { productOrders, retailProducts, activityEvents } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { adminGate, clean, getSessionSalon } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "confirmed", "ready", "completed", "cancelled"];

/** Admin / owner dashboard — is salon ke product orders. */
export async function GET() {
  const salon = await getSessionSalon();
  const rows = await db
    .select()
    .from(productOrders)
    .where(eq(productOrders.salonId, salon.id))
    .orderBy(desc(productOrders.createdAt));
  return Response.json({ orders: rows, salon: salon.name });
}

/** Public order — admin dashboard mein foran aa jata hai. Phone hamesha masked. */
export async function POST(req: Request) {
  const salon = await getSessionSalon();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = clean(b.customerName, 40);
  const productId = clean(b.productId, 40);
  const qty = Math.max(1, Math.min(12, Math.round(Number(b.qty) || 1)));
  if (!name) return Response.json({ error: "name_required", message: "Apna naam likhein." }, { status: 400 });
  if (!productId) return Response.json({ error: "product_required", message: "Product select karein." }, { status: 400 });

  const [product] = await db
    .select()
    .from(retailProducts)
    .where(and(eq(retailProducts.id, productId), eq(retailProducts.salonId, salon.id), eq(retailProducts.active, true)))
    .limit(1);
  if (!product) return Response.json({ error: "not_found", message: "Yeh product ab available nahi." }, { status: 404 });
  if (product.stock < qty) {
    return Response.json({ error: "stock", message: `Sirf ${product.stock} piece bache hain. Kam quantity try karein.` }, { status: 409 });
  }

  const code = `ORD-${String(1000 + Math.floor(Math.random() * 9000))}`;
  const total = product.pricePkr * qty;
  const [order] = await db
    .insert(productOrders)
    .values({
      salonId: salon.id,
      orderCode: code,
      customerName: name,
      phoneMasked: maskPhone(String(b.phone ?? "")),
      productId: product.id,
      productName: product.name,
      qty,
      pricePkr: product.pricePkr,
      totalPkr: total,
      note: clean(b.note, 180),
      status: "new",
    })
    .returning();

  await db
    .update(retailProducts)
    .set({ stock: sql`${retailProducts.stock} - ${qty}` })
    .where(eq(retailProducts.id, product.id));

  await db.insert(activityEvents).values({
    salonId: salon.id,
    kind: "booking",
    detail: `Naya product order ${code} — ${name}, ${product.name} ×${qty} (PKR ${total.toLocaleString("en-PK")})`,
  });

  return Response.json({
    order: { id: order.id, orderCode: code, totalPkr: total, productName: product.name, qty },
    message: `${code} admin dashboard mein chala gaya. Salon confirm karega.`,
  }, { status: 201 });
}

export async function PATCH(req: Request) {
  const gate = await adminGate();
  if (gate.denied) return gate.denied;
  const b = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  const id = clean(b.id, 40);
  const status = clean(b.status, 20);
  if (!id || !STATUSES.includes(status)) return Response.json({ error: "validation" }, { status: 400 });
  const [row] = await db
    .update(productOrders)
    .set({ status })
    .where(and(eq(productOrders.id, id), eq(productOrders.salonId, gate.salon.id)))
    .returning();
  if (!row) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ order: row });
}

function maskPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return "+92 3•• ••••—";
  return `+92 3•• ••••${digits.slice(-2)}`;
}