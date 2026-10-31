import { db } from "@/db";
import { chairs, staffMembers, services, customers } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { adminGate, clean, getSessionSalon } from "@/lib/tenant";

export const dynamic = "force-dynamic";

type Entity = "chairs" | "staff" | "services" | "clients";

const TABLES = { chairs, staff: staffMembers, services, clients: customers } as const;

export function isEntity(v: string): v is Entity {
  return v === "chairs" || v === "staff" || v === "services" || v === "clients";
}

export async function GET(_req: Request, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  if (!isEntity(entity)) return Response.json({ error: "unknown_entity" }, { status: 404 });
  const salon = await getSessionSalon();
  const table = TABLES[entity];
  const rows = await db.select().from(table).where(eq(table.salonId, salon.id));
  const sorted = [...(rows as { name?: string }[])].sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")));
  return Response.json({ rows: sorted });
}

export async function POST(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  if (!isEntity(entity)) return Response.json({ error: "unknown_entity" }, { status: 404 });
  const gate = await adminGate();
  if (gate.denied) return gate.denied;
  const salon = gate.salon;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const num = (v: unknown, min: number, max: number, dflt: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : dflt;
  };

  if (entity === "chairs") {
    const name = clean(b.name, 40);
    if (!name) return Response.json({ error: "name_required" }, { status: 400 });
    const [row] = await db.insert(chairs).values({
      salonId: salon.id,
      name,
      kind: b.kind === "room" ? "room" : "chair",
      staffId: b.staffId ? clean(b.staffId, 40) : null,
      active: b.active !== false,
      sortOrder: num(b.sortOrder, 0, 99, 10),
    }).returning();
    return Response.json({ row }, { status: 201 });
  }

  if (entity === "staff") {
    const name = clean(b.name, 40);
    if (!name) return Response.json({ error: "name_required" }, { status: 400 });
    const [row] = await db.insert(staffMembers).values({
      salonId: salon.id,
      name,
      specialty: clean(b.specialty, 60) || "Stylist",
      role: clean(b.role, 40) || "Stylist",
      phoneMasked: clean(b.phoneMasked, 24) || "+92 3•• ••••—",
      active: b.active !== false,
      rating: num(b.rating, 1, 5, 5),
    }).returning();
    return Response.json({ row }, { status: 201 });
  }

  if (entity === "services") {
    const name = clean(b.name, 60);
    if (!name) return Response.json({ error: "name_required" }, { status: 400 });
    const [row] = await db.insert(services).values({
      salonId: salon.id,
      name,
      pricePkr: num(b.pricePkr, 0, 1000000, 0),
      durationMins: num(b.durationMins, 10, 480, 45),
      category: ["regular", "bridal", "addon"].includes(String(b.category)) ? String(b.category) : "regular",
      active: b.active !== false,
      sortOrder: num(b.sortOrder, 0, 99, 10),
    }).returning();
    return Response.json({ row }, { status: 201 });
  }

  const name = clean(b.name, 40);
  if (!name) return Response.json({ error: "name_required" }, { status: 400 });
  const [row] = await db.insert(customers).values({
    salonId: salon.id,
    personaKey: clean(b.personaKey, 30) || `client-${Date.now()}`,
    name,
    phoneMasked: clean(b.phoneMasked, 24) || "+92 3•• ••••—",
    lastService: clean(b.lastService, 60),
    visits: num(b.visits, 0, 999, 0),
    tag: ["new", "regular", "vip", "at-risk"].includes(String(b.tag)) ? String(b.tag) : "new",
    preferredStaff: b.preferredStaff ? clean(b.preferredStaff, 40) : null,
    notes: clean(b.notes, 300),
    totalSpentPkr: num(b.totalSpentPkr, 0, 10000000, 0),
    lastVisitISO: b.lastVisitISO ? clean(b.lastVisitISO, 10) : null,
  }).returning();
  return Response.json({ row }, { status: 201 });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  if (!isEntity(entity)) return Response.json({ error: "unknown_entity" }, { status: 404 });
  const gate = await adminGate();
  if (gate.denied) return gate.denied;
  const salon = gate.salon;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = clean(b.id, 40);
  if (!id) return Response.json({ error: "id_required" }, { status: 400 });
  const table = TABLES[entity];
  const patch: Record<string, unknown> = {};

  if (b.name !== undefined) patch.name = clean(b.name, 60);
  if (entity === "chairs") {
    if (b.kind !== undefined) patch.kind = b.kind === "room" ? "room" : "chair";
    if (b.staffId !== undefined) patch.staffId = b.staffId ? clean(b.staffId, 40) : null;
    if (b.active !== undefined) patch.active = Boolean(b.active);
    if (b.sortOrder !== undefined) patch.sortOrder = Math.max(0, Math.round(Number(b.sortOrder) || 0));
  } else if (entity === "staff") {
    if (b.specialty !== undefined) patch.specialty = clean(b.specialty, 60);
    if (b.role !== undefined) patch.role = clean(b.role, 40);
    if (b.phoneMasked !== undefined) patch.phoneMasked = clean(b.phoneMasked, 24);
    if (b.active !== undefined) patch.active = Boolean(b.active);
    if (b.rating !== undefined) patch.rating = Math.max(1, Math.min(5, Math.round(Number(b.rating) || 5)));
  } else if (entity === "services") {
    if (b.pricePkr !== undefined) patch.pricePkr = Math.max(0, Math.min(1000000, Math.round(Number(b.pricePkr) || 0)));
    if (b.durationMins !== undefined) patch.durationMins = Math.max(10, Math.min(480, Math.round(Number(b.durationMins) || 45)));
    if (b.category !== undefined) patch.category = ["regular", "bridal", "addon"].includes(String(b.category)) ? String(b.category) : "regular";
    if (b.active !== undefined) patch.active = Boolean(b.active);
  } else {
    if (b.phoneMasked !== undefined) patch.phoneMasked = clean(b.phoneMasked, 24);
    if (b.lastService !== undefined) patch.lastService = clean(b.lastService, 60);
    if (b.tag !== undefined) patch.tag = ["new", "regular", "vip", "at-risk"].includes(String(b.tag)) ? String(b.tag) : "regular";
    if (b.preferredStaff !== undefined) patch.preferredStaff = b.preferredStaff ? clean(b.preferredStaff, 40) : null;
    if (b.notes !== undefined) patch.notes = clean(b.notes, 300);
    if (b.visits !== undefined) patch.visits = Math.max(0, Math.round(Number(b.visits) || 0));
    if (b.totalSpentPkr !== undefined) patch.totalSpentPkr = Math.max(0, Math.round(Number(b.totalSpentPkr) || 0));
  }

  if (Object.keys(patch).length === 0) return Response.json({ error: "nothing_to_update" }, { status: 400 });
  const [row] = await db.update(table).set(patch).where(and(eq(table.id, id), eq(table.salonId, salon.id))).returning();
  if (!row) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ row });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  if (!isEntity(entity)) return Response.json({ error: "unknown_entity" }, { status: 404 });
  const gate = await adminGate();
  if (gate.denied) return gate.denied;
  const salon = gate.salon;
  const url = new URL(req.url);
  const id = clean(url.searchParams.get("id"), 40);
  if (!id) return Response.json({ error: "id_required" }, { status: 400 });
  const table = TABLES[entity];
  const [row] = await db.delete(table).where(and(eq(table.id, id), eq(table.salonId, salon.id))).returning();
  if (!row) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ deleted: id });
}