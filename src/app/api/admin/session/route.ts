import { cookies } from "next/headers";
import { db } from "@/db";
import { salons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionSalon, isAdmin, ADMIN_COOKIE, ROLE_COOKIE, clean, adminGate, getRole, type Role } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET() {
  const salon = await getSessionSalon();
  return Response.json({ admin: await isAdmin(salon), role: await getRole(), salon: { name: salon.name, slug: salon.slug, plan: salon.plan } });
}

/** Demo admin login — PIN per salon (seed: 2468). Production: Supabase Auth + role claim. */
export async function POST(req: Request) {
  const salon = await getSessionSalon();
  const body = (await req.json().catch(() => ({}))) as { pin?: string; role?: string };
  const pin = clean(body.pin, 12);
  if (!pin) return Response.json({ error: "pin_required", message: "Admin PIN likhein." }, { status: 400 });
  const expectedPin = (salon.adminPin || process.env.ADMIN_PIN || "2468").trim();
  if (pin !== expectedPin) {
    return Response.json({ error: "invalid_pin", message: "PIN ghalat hai. Demo PIN: 2468 (Admin page par likha hai)." }, { status: 401 });
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, salon.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  const role: Role = body.role === "manager" || body.role === "reception" || body.role === "admin" ? body.role : "admin";
  jar.set(ROLE_COOKIE, role, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  return Response.json({ ok: true, admin: true, role, salon: salon.name });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  jar.delete(ROLE_COOKIE);
  return Response.json({ ok: true, admin: false });
}

/** Admin PIN change — sirf logged-in admin */
export async function PATCH(req: Request) {
  const gate = await adminGate();
  if (gate.denied) return gate.denied;
  const body = (await req.json().catch(() => ({}))) as { pin?: string; role?: string };
  const pin = clean(body.pin, 12);
  if (pin.length < 4) return Response.json({ error: "pin_short", message: "Kam az kam 4 digits ka PIN." }, { status: 400 });
  await db.update(salons).set({ adminPin: pin }).where(eq(salons.id, gate.salon.id));
  return Response.json({ ok: true });
}