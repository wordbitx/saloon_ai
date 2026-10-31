import { db } from "@/db";
import { waitlistEntries, bookings, activityEvents, chairs, services } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { adminGate, clean, getSessionSalon } from "@/lib/tenant";
import { chairConflict, activeChairs } from "@/lib/availability";

export const dynamic = "force-dynamic";

/** Waitlist = woh customers jo slot ke muntazir hain (slot bhara tha). */
export async function GET() {
  const salon = await getSessionSalon();
  const rows = await db
    .select()
    .from(waitlistEntries)
    .where(eq(waitlistEntries.salonId, salon.id))
    .orderBy(asc(waitlistEntries.createdAt));
  const svc = await db.select().from(services).where(eq(services.salonId, salon.id)).orderBy(asc(services.sortOrder));
  return Response.json({ rows, services: svc });
}

export async function POST(req: Request) {
  const gate = await adminGate();
  if (gate.denied) return gate.denied;
  const salon = gate.salon;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = clean(b.customerName, 40);
  if (!name) return Response.json({ error: "name_required", message: "Client ka naam zaroori hai." }, { status: 400 });
  const [row] = await db
    .insert(waitlistEntries)
    .values({
      salonId: salon.id,
      customerName: name,
      phoneMasked: clean(b.phoneMasked, 24) || "+92 3•• ••••—",
      serviceName: clean(b.serviceName, 60) || "Koi bhi service",
      preferredTime: clean(b.preferredTime, 60) || "Koi bhi waqt",
      status: "waiting",
    })
    .returning();
  await db.insert(activityEvents).values({ salonId: salon.id, kind: "waitlist", detail: `Waitlist par add hui — ${name}` });
  return Response.json({ row }, { status: 201 });
}

/**
 * Offer: waitlist wale client ko khaali slot dena.
 * Chair guard yahan bhi chalta hai — busy chair par 409.
 */
export async function PUT(req: Request) {
  const gate = await adminGate();
  if (gate.denied) return gate.denied;
  const salon = gate.salon;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = clean(b.id, 40);
  const date = clean(b.date, 10);
  const time = clean(b.time, 10);
  if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !time) {
    return Response.json({ error: "validation", message: "Waitlist entry, date aur time zaroori hain." }, { status: 400 });
  }
  const [entry] = await db
    .select()
    .from(waitlistEntries)
    .where(and(eq(waitlistEntries.id, id), eq(waitlistEntries.salonId, salon.id)))
    .limit(1);
  if (!entry) return Response.json({ error: "not_found" }, { status: 404 });

  const chairList = await activeChairs(salon.id);
  if (chairList.length === 0) return Response.json({ error: "no_chairs", message: "Pehle chair add karein." }, { status: 400 });

  let chairId: string | null = null;
  let chairName = "";
  const requested = clean(b.chairId, 40);
  const candidates = requested ? chairList.filter((c) => c.id === requested) : chairList;
  for (const c of candidates) {
    if (!(await chairConflict(salon.id, date, time, c.id))) {
      chairId = c.id;
      chairName = c.name;
      break;
    }
  }
  if (!chairId) {
    const clash = requested ? await chairConflict(salon.id, date, time, requested) : null;
    const chairRows = await db.select().from(chairs).where(eq(chairs.salonId, salon.id));
    const name = chairRows.find((c) => c.id === requested)?.name ?? "chair";
    return Response.json(
      {
        error: "conflict",
        chairName: clash ? name : "saari chairs",
        message: clash
          ? `Yeh slot already booked hai (${name}) — ${clash.customerName} (${clash.serviceName}). Koi doosra slot/chair chunein.`
          : `Is waqt (${time}) ki saari chairs booked hain. Koi doosra slot chunein.`,
      },
      { status: 409 },
    );
  }

  const [svc] = await db
    .select()
    .from(services)
    .where(and(eq(services.salonId, salon.id), eq(services.name, entry.serviceName)))
    .limit(1);

  const [row] = await db
    .insert(bookings)
    .values({
      salonId: salon.id,
      customerName: entry.customerName,
      phoneMasked: entry.phoneMasked,
      serviceName: entry.serviceName,
      chairId,
      date,
      time,
      status: "confirmed",
      source: "waitlist",
      pricePkr: svc?.pricePkr ?? 0,
    })
    .returning();
  await db.update(waitlistEntries).set({ status: "booked" }).where(eq(waitlistEntries.id, entry.id));
  await db.insert(activityEvents).values({
    salonId: salon.id,
    kind: "waitlist",
    detail: `Waitlist backfill ✓ ${entry.customerName} ko ${pretty(date)} ${time} mila (${chairName})`,
  });
  return Response.json({ booking: row, chairName }, { status: 201 });
}

export async function DELETE(req: Request) {
  const gate = await adminGate();
  if (gate.denied) return gate.denied;
  const salon = gate.salon;
  const id = clean(new URL(req.url).searchParams.get("id"), 40);
  if (!id) return Response.json({ error: "id_required" }, { status: 400 });
  const [row] = await db
    .delete(waitlistEntries)
    .where(and(eq(waitlistEntries.id, id), eq(waitlistEntries.salonId, salon.id)))
    .returning();
  if (!row) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ deleted: id });
}

function pretty(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
