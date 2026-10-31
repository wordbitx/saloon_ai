import { db } from "@/db";
import { bookings } from "@/db/schema";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import { getSessionSalon, crossTenantRequested, forbidden, activeBranch } from "@/lib/tenant";
import { activeChairs, chairConflict } from "@/lib/availability";
import { clean } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const salon = await getSessionSalon();
  const url = new URL(req.url);
  const requested = url.searchParams.get("salonId");
  if (crossTenantRequested(requested, salon)) return forbidden();

  const [rows, chairRows, branch] = await Promise.all([
    db.select().from(bookings).where(eq(bookings.salonId, salon.id)).orderBy(desc(bookings.date), asc(bookings.time)),
    activeChairs(salon.id),
    activeBranch(salon),
  ]);
  const scoped = branch ? rows.filter((b) => b.branch === branch) : rows;
  return Response.json({ bookings: scoped, chairs: chairRows, salonId: salon.id, branch: branch ?? "all" });
}

interface CreateBody {
  customerName?: string;
  phoneMasked?: string;
  serviceName?: string;
  staffName?: string | null;
  chairId?: string | null;
  date?: string;
  time?: string;
  branch?: string;
  notes?: string;
  pricePkr?: number;
  source?: string;
  status?: string;
}

export async function POST(req: Request) {
  const salon = await getSessionSalon();
  const body = (await req.json().catch(() => ({}))) as CreateBody;

  const customerName = clean(body.customerName, 40);
  const serviceName = clean(body.serviceName, 60);
  const date = clean(body.date, 10);
  const time = clean(body.time, 10);
  if (!customerName || !serviceName || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !time) {
    return Response.json({ error: "validation", message: "Customer, service, date aur time zaroori hain." }, { status: 400 });
  }

  const list = await activeChairs(salon.id);
  if (list.length === 0) {
    return Response.json({ error: "no_chairs", message: "Pehle Chairs add karein — booking ke liye chair zaroori hai." }, { status: 400 });
  }

  // Chair choose: diya gaya chair, warna staff ka chair, warna pehli khaali chair
  let candidates = list;
  if (body.chairId) {
    const chosen = list.find((c) => c.id === body.chairId);
    if (!chosen) return Response.json({ error: "invalid_chair" }, { status: 400 });
    const conflict = await chairConflict(salon.id, date, time, chosen.id);
    if (conflict) {
      const altChairs = [];
      for (const c of list.filter((c) => c.id !== chosen.id)) {
        if (!(await chairConflict(salon.id, date, time, c.id))) altChairs.push({ id: c.id, name: c.name });
      }
      return Response.json(
        {
          error: "conflict",
          chairName: chosen.name,
          message: `Yeh slot already booked hai (${chosen.name}). Is slot ke liye humari team se WhatsApp par rabta karein — warna koi doosra chair ya slot book kar lein.`,
          whatsappCta: "Is slot ke liye WhatsApp par rabta karein",
          alternatives: { chairs: altChairs, times: [] },
        },
        { status: 409 },
      );
    }
    candidates = [chosen];
  }

  let chairId: string | null = null;
  for (const c of candidates) {
    if (!(await chairConflict(salon.id, date, time, c.id))) {
      chairId = c.id;
      break;
    }
  }
  if (!chairId) {
    return Response.json(
      {
        error: "conflict",
        chairName: "saari chairs",
        message: "Is waqt ki saari chairs already booked hain. Is slot ke liye WhatsApp par rabta karein — warna koi doosra slot book karein.",
        whatsappCta: "Is slot ke liye WhatsApp par rabta karein",
      },
      { status: 409 },
    );
  }

  const [row] = await db
    .insert(bookings)
    .values({
      salonId: salon.id,
      customerName,
      phoneMasked: clean(body.phoneMasked, 30) || "+92 3•• ••••—",
      serviceName,
      staffName: body.staffName ? clean(body.staffName, 40) : null,
      chairId,
      date,
      time,
      status: body.status === "completed" ? "completed" : "confirmed",
      source: body.source ? clean(body.source, 20) : "admin",
      branch: clean(body.branch, 40) || (salon.branches[0] ?? null),
      pricePkr: Math.max(0, Math.min(500000, Math.round(Number(body.pricePkr) || 0))),
      notes: clean(body.notes, 200),
    })
    .returning();

  return Response.json({ booking: row, chair: list.find((c) => c.id === chairId) ?? null }, { status: 201 });
}

/** PATCH body.status ya DELETE ke liye alag route hai — yahan sirf update status */
export async function PATCH(req: Request) {
  const salon = await getSessionSalon();
  const body = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  const id = clean(body.id, 40);
  const status = clean(body.status, 20);
  if (!id || !["confirmed", "completed", "cancelled", "no-show"].includes(status)) {
    return Response.json({ error: "validation" }, { status: 400 });
  }
  const [row] = await db
    .update(bookings)
    .set({ status })
    .where(and(eq(bookings.id, id), eq(bookings.salonId, salon.id)))
    .returning();
  if (!row) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ booking: row });
}