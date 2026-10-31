import { db } from "@/db";
import { bookings, chairs } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";

export interface ChairRow {
  id: string;
  name: string;
  kind: string;
  staffId: string | null;
  active: boolean;
  sortOrder: number;
}

/** Active chairs of a salon */
export async function activeChairs(salonId: string): Promise<ChairRow[]> {
  const rows = await db
    .select()
    .from(chairs)
    .where(and(eq(chairs.salonId, salonId), eq(chairs.active, true)));
  return rows
    .map((c) => ({ id: c.id, name: c.name, kind: c.kind, staffId: c.staffId, active: c.active, sortOrder: c.sortOrder }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Same chair + same date + same time par sirf AIK active booking.
 * Returns conflict info agar busy hai.
 */
export async function chairConflict(
  salonId: string,
  date: string,
  time: string,
  chairId: string,
  excludeBookingId?: string,
) {
  const cond = [
    eq(bookings.salonId, salonId),
    eq(bookings.date, date),
    eq(bookings.time, time),
    eq(bookings.chairId, chairId),
    ne(bookings.status, "cancelled"),
  ];
  if (excludeBookingId) cond.push(ne(bookings.id, excludeBookingId));
  const rows = await db
    .select({ id: bookings.id, customerName: bookings.customerName, serviceName: bookings.serviceName, status: bookings.status })
    .from(bookings)
    .where(and(...cond))
    .limit(1);
  return rows[0] ?? null;
}

/** Kitni chairs us waqt khaali hain */
export async function freeChairs(salonId: string, date: string, time: string, excludeBookingId?: string) {
  const list = await activeChairs(salonId);
  const out: ChairRow[] = [];
  for (const c of list) {
    const conflict = await chairConflict(salonId, date, time, c.id, excludeBookingId);
    if (!conflict) out.push(c);
  }
  return { all: list, free: out };
}

/** Poori din ki chair-wise availability — chat + admin ke liye */
export async function dayAvailability(salonId: string, date: string) {
  const list = await activeChairs(salonId);
  const dayBookings = await db
    .select({ time: bookings.time, chairId: bookings.chairId, status: bookings.status })
    .from(bookings)
    .where(and(eq(bookings.salonId, salonId), eq(bookings.date, date)));
  const active = dayBookings.filter((b) => b.status !== "cancelled");
  return list.map((chair) => ({
    chair,
    bookedTimes: active.filter((b) => b.chairId === chair.id).map((b) => b.time),
  }));
}

export const CONFLICT_TEXT = (chairName: string) =>
  `Yeh slot already booked hai (${chairName}). Is slot ke liye humari team se WhatsApp par rabta karein — warna neeche se koi doosra slot book kar lein.`;