import { db } from "@/db";
import { retailProducts, activityEvents } from "@/db/schema";
import { ensureShelfForSalon } from "@/db/seed";
import { and, asc, eq } from "drizzle-orm";
import { adminGate, clean, getSessionSalon } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const CATEGORIES = ["Haircare", "Skin", "Nails", "Bridal", "Fragrance"];

/** Public catalog — sirf active products. Admin list `?all=1` se. */
export async function GET(req: Request) {
  const salon = await getSessionSalon();
  await ensureShelfForSalon(salon.id, salon.slug);
  const all = new URL(req.url).searchParams.get("all") === "1";
  const rows = await db
    .select()
    .from(retailProducts)
    .where(all ? eq(retailProducts.salonId, salon.id) : and(eq(retailProducts.salonId, salon.id), eq(retailProducts.active, true)))
    .orderBy(asc(retailProducts.sortOrder), asc(retailProducts.name));
  return Response.json({ salon: salon.name, products: rows });
}

export async function POST(req: Request) {
  const gate = await adminGate();
  if (gate.denied) return gate.denied;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = clean(b.name, 80);
  if (!name) return Response.json({ error: "name_required", message: "Product ka naam likhein." }, { status: 400 });
  const price = clamp(b.pricePkr, 0, 500000, 0);
  const [row] = await db
    .insert(retailProducts)
    .values({
      salonId: gate.salon.id,
      name,
      description: clean(b.description, 240),
      pricePkr: price,
      category: CATEGORIES.includes(String(b.category)) ? String(b.category) : "Haircare",
      stock: clamp(b.stock, 0, 999, 8),
      emoji: clean(b.emoji, 8) || "✨",
      imageUrl: safeImage(b.imageUrl),
      active: b.active !== false,
      sortOrder: clamp(b.sortOrder, 0, 99, 10),
    })
    .returning();
  await db.insert(activityEvents).values({
    salonId: gate.salon.id,
    kind: "booking",
    detail: `Shelf update — naya product: ${name} (PKR ${price.toLocaleString("en-PK")})`,
  });
  return Response.json({ product: row }, { status: 201 });
}

export async function PATCH(req: Request) {
  const gate = await adminGate();
  if (gate.denied) return gate.denied;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = clean(b.id, 40);
  if (!id) return Response.json({ error: "id_required" }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if (b.name !== undefined) patch.name = clean(b.name, 80);
  if (b.description !== undefined) patch.description = clean(b.description, 240);
  if (b.pricePkr !== undefined) patch.pricePkr = clamp(b.pricePkr, 0, 500000, 0);
  if (b.category !== undefined) patch.category = CATEGORIES.includes(String(b.category)) ? String(b.category) : "Haircare";
  if (b.stock !== undefined) patch.stock = clamp(b.stock, 0, 999, 0);
  if (b.emoji !== undefined) patch.emoji = clean(b.emoji, 8) || "✨";
  if (b.active !== undefined) patch.active = Boolean(b.active);
  if (b.imageUrl !== undefined) patch.imageUrl = safeImage(b.imageUrl);
  if (b.sortOrder !== undefined) patch.sortOrder = clamp(b.sortOrder, 0, 99, 0);
  const [row] = await db
    .update(retailProducts)
    .set(patch)
    .where(and(eq(retailProducts.id, id), eq(retailProducts.salonId, gate.salon.id)))
    .returning();
  if (!row) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ product: row });
}

export async function DELETE(req: Request) {
  const gate = await adminGate();
  if (gate.denied) return gate.denied;
  const id = clean(new URL(req.url).searchParams.get("id"), 40);
  if (!id) return Response.json({ error: "id_required" }, { status: 400 });
  const [row] = await db
    .delete(retailProducts)
    .where(and(eq(retailProducts.id, id), eq(retailProducts.salonId, gate.salon.id)))
    .returning();
  if (!row) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ deleted: id });
}

/** Local (/images/...) ya https image URL — warna null (emoji fallback) */
function safeImage(v: unknown): string | null {
  const url = clean(v, 500);
  return /^(https:\/\/[^\s]+|\/[a-zA-Z0-9._/-]+)$/i.test(url) ? url : null;
}

function clamp(v: unknown, min: number, max: number, dflt: number) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : dflt;
}
