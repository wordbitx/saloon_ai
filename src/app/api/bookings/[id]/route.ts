import { db } from "@/db";
import { bookings } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { adminGate, clean, getSessionSalon } from "@/lib/tenant";
import { chairConflict, activeChairs } from "@/lib/availability";

export const dynamic = "force-dynamic";

/** Booking edit — same chair + same time conflict phir bhi check hota hai */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await adminGate();
  if (gate.denied) return gate.denied;
  const salon = gate.salon;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const rows = await db.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.salonId, salon.id))).limit(1);
  const existing = rows[0];
  if (!existing) return Response.json({ error: "not_found" }, { status: 404 });

  const date = clean(body.date, 10) || existing.date;
  const time = clean(body.time, 10) || existing.time;
  const chairId = body.chairId === undefined ? existing.chairId : clean(body.chairId, 40) || null;

  if (chairId) {
    const list = await activeChairs(salon.id);
    const chair = list.find((c) => c.id === chairId);
    if (!chair) return Response.json({ error: "invalid_chair" }, { status: 400 });
    const clash = await chairConflict(salon.id, date, time, chairId, existing.id);
    if (clash) {
      return Response.json(
        {
          error: "conflict",
          chairName: chair.name,
          message: `Yeh chair (${chair.name}) us waqt already booked hai — ${clash.customerName} (${clash.serviceName}). Is slot ke liye WhatsApp par rabta karein, warna doosra chair/slot chunein.`,
        },
        { status: 409 },
      );
    }
  }

  const patch: Record<string, unknown> = { date, time, chairId };
  if (body.customerName !== undefined) patch.customerName = clean(body.customerName, 40) || existing.customerName;
  if (body.serviceName !== undefined) patch.serviceName = clean(body.serviceName, 60) || existing.serviceName;
  if (body.staffName !== undefined) patch.staffName = body.staffName ? clean(body.staffName, 40) : null;
  if (body.notes !== undefined) patch.notes = clean(body.notes, 200);
  if (body.status !== undefined && ["confirmed", "completed", "cancelled", "no-show"].includes(String(body.status))) patch.status = String(body.status);
  if (body.pricePkr !== undefined) patch.pricePkr = Math.max(0, Math.min(500000, Math.round(Number(body.pricePkr) || 0)));
  if (body.phoneMasked !== undefined) patch.phoneMasked = clean(body.phoneMasked, 30);
  if (body.source !== undefined && ["chat", "recovered", "missed-call", "waitlist", "walk-in", "admin"].includes(String(body.source))) {
    patch.source = String(body.source);
  }

  const [row] = await db.update(bookings).set(patch).where(and(eq(bookings.id, id), eq(bookings.salonId, salon.id))).returning();
  return Response.json({ booking: row });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await adminGate();
  if (gate.denied) return gate.denied;
  const salon = gate.salon;
  const { id } = await params;
  const [row] = await db.delete(bookings).where(and(eq(bookings.id, id), eq(bookings.salonId, salon.id))).returning();
  if (!row) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ deleted: id });
}

/** Status change owner ke liye bhi khula (cancel/complete) */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const salon = await getSessionSalon();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: string };
  const status = clean(body.status, 20);
  if (!["confirmed", "completed", "cancelled", "no-show"].includes(status)) {
    return Response.json({ error: "validation" }, { status: 400 });
  }
  const [row] = await db.update(bookings).set({ status }).where(and(eq(bookings.id, id), eq(bookings.salonId, salon.id))).returning();
  if (!row) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ booking: row });
}