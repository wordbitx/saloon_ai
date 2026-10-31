import { db } from "@/db";
import { salons, services, staffMembers } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { adminGate, getSessionSalon } from "@/lib/tenant";

export const dynamic = "force-dynamic";

async function loadSettings(salonId: string) {
  const [salon] = await db.select().from(salons).where(eq(salons.id, salonId)).limit(1);
  const svcs = await db.select().from(services).where(eq(services.salonId, salonId)).orderBy(asc(services.sortOrder));
  const staff = await db.select().from(staffMembers).where(eq(staffMembers.salonId, salonId));
  return { salon, services: svcs, staff };
}

export async function GET() {
  const salon = await getSessionSalon();
  return Response.json(await loadSettings(salon.id));
}

interface SettingsBody {
  name?: string;
  area?: string;
  greeting?: string;
  openTime?: string;
  closeTime?: string;
  closedDays?: string[];
  repeatEnabled?: boolean;
  reviewUrl?: string | null;
  branches?: string[];
  plan?: string;
  services?: { name: string; pricePkr: number; durationMins: number; category?: string }[];
  staff?: { name: string; specialty: string }[];
}

export async function PUT(req: Request) {
  const gate = await adminGate();
  if (gate.denied) return gate.denied;
  const salon = gate.salon;
  const body = (await req.json().catch(() => null)) as SettingsBody | null;
  if (!body) return Response.json({ error: "invalid body" }, { status: 400 });

  const clean = (s: unknown, max: number) => String(s ?? "").trim().slice(0, max);
  const timeOk = (t: string) => /^\d{2}:\d{2}$/.test(t);

  await db
    .update(salons)
    .set({
      name: clean(body.name, 60) || salon.name,
      area: clean(body.area, 80) || salon.area,
      greeting: clean(body.greeting, 300) || salon.greeting,
      openTime: body.openTime && timeOk(body.openTime) ? body.openTime : salon.openTime,
      closeTime: body.closeTime && timeOk(body.closeTime) ? body.closeTime : salon.closeTime,
      closedDays: Array.isArray(body.closedDays) ? body.closedDays.slice(0, 7).map((d) => clean(d, 12)) : salon.closedDays,
      repeatEnabled: typeof body.repeatEnabled === "boolean" ? body.repeatEnabled : salon.repeatEnabled,
      reviewUrl: body.reviewUrl === undefined ? salon.reviewUrl : clean(body.reviewUrl, 200) || null,
      branches: Array.isArray(body.branches) ? body.branches.slice(0, 5).map((b) => clean(b, 40)).filter(Boolean) : salon.branches,
      plan: body.plan && ["starter", "growth", "business"].includes(body.plan) ? body.plan : salon.plan,
    })
    .where(eq(salons.id, salon.id));

  if (Array.isArray(body.services)) {
    await db.delete(services).where(eq(services.salonId, salon.id));
    const rows = body.services
      .filter((s) => clean(s.name, 50))
      .slice(0, 20)
      .map((s, i) => ({
        salonId: salon.id,
        name: clean(s.name, 50),
        pricePkr: Math.max(0, Math.min(1000000, Math.round(Number(s.pricePkr) || 0))),
        durationMins: Math.max(10, Math.min(480, Math.round(Number(s.durationMins) || 45))),
        category: ["regular", "bridal", "addon"].includes(s.category ?? "") ? (s.category as string) : "regular",
        sortOrder: i + 1,
      }));
    if (rows.length > 0) await db.insert(services).values(rows);
  }

  if (Array.isArray(body.staff)) {
    await db.delete(staffMembers).where(eq(staffMembers.salonId, salon.id));
    const rows = body.staff
      .filter((s) => clean(s.name, 30))
      .slice(0, 12)
      .map((s) => ({ salonId: salon.id, name: clean(s.name, 30), specialty: clean(s.specialty, 40) || "Stylist" }));
    if (rows.length > 0) await db.insert(staffMembers).values(rows);
  }

  return Response.json({ ok: true, ...(await loadSettings(salon.id)) });
}