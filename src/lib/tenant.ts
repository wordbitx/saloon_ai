import { cookies } from "next/headers";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { salons, bookings } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";

export const SESSION_COOKIE = "mbr_salon";
export const BRANCH_COOKIE = "mbr_branch";
export const ROLE_COOKIE = "mbr_role";
export const ADMIN_COOKIE = "mbr_admin";
export const DEFAULT_SALON = "glow-demo";

export type Salon = typeof salons.$inferSelect;

export async function getSessionSalon(): Promise<Salon> {
  await ensureSeeded();
  const jar = await cookies();
  const slug = jar.get(SESSION_COOKIE)?.value || DEFAULT_SALON;
  const rows = await db.select().from(salons).where(eq(salons.slug, slug)).limit(1);
  if (rows.length > 0) return rows[0];
  const fallback = await db.select().from(salons).where(eq(salons.slug, DEFAULT_SALON)).limit(1);
  if (fallback.length > 0) return fallback[0];
  const any = await db.select().from(salons).limit(1);
  return any[0];
}

/** Admin = active salon ke liye login (demo PIN). Har mutation isi se guzarti hai. */
export async function isAdmin(salon: Salon): Promise<boolean> {
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value === salon.id;
}

export async function adminGate() {
  const salon = await getSessionSalon();
  if (!(await isAdmin(salon))) {
    return {
      salon,
      denied: Response.json(
        { error: "admin_required", note: "Admin login zaroori hai — Dashboard → Admin (demo PIN)." },
        { status: 401 },
      ),
    } as const;
  }
  return { salon, denied: null } as const;
}

/** Active branch — "all" ka matlab poora salon. Bookings/summary isi se filter hote hain. */
export async function activeBranch(salon: Salon): Promise<string | null> {
  const jar = await cookies();
  const branch = jar.get(BRANCH_COOKIE)?.value ?? "all";
  if (branch === "all" || !(salon.branches ?? []).includes(branch)) return null;
  return branch;
}

export type Role = "admin" | "manager" | "reception";

/** Kaun se entry route se login hua (demo PIN same hai, role entry par set hota hai). */
export async function getRole(): Promise<Role> {
  const jar = await cookies();
  const r = jar.get(ROLE_COOKIE)?.value;
  return r === "admin" || r === "manager" || r === "reception" ? r : "admin";
}

/** Neeche wali cheezein sirf admin ko: PIN change, demo reset, salon delete */
export async function isFullAdmin(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value !== undefined && (await getRole()) === "admin";
}

export function crossTenantRequested(requested: string | null, salon: Salon): boolean {
  if (!requested) return false;
  return requested !== salon.id && requested !== salon.slug;
}

export function forbidden() {
  return Response.json(
    { error: "forbidden", note: "Tenant isolation: yeh data aap ke salon ka nahi hai." },
    { status: 403 },
  );
}

export async function fetchBookingsFor(actor: Salon, targetSalonId: string) {
  if (targetSalonId !== actor.id) {
    return { forbidden: true as const, rows: [] };
  }
  const rows = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.salonId, actor.id)))
    .orderBy(desc(bookings.createdAt));
  return { forbidden: false as const, rows };
}

export function containsLeak(payload: string): boolean {
  const fullPhone = /(?:\+?92[\s-]?|0)?3\d{2}[\s-]?\d{7}\b/;
  const email = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  return fullPhone.test(payload) || email.test(payload);
}

/** Har CRUD route ke liye chhota sanitizer */
export function clean(v: unknown, max = 120): string {
  return String(v ?? "").trim().slice(0, max);
}