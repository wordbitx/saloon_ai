import { db } from "@/db";
import { bookings, services, staffMembers, chairs } from "@/db/schema";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { getSessionSalon } from "@/lib/tenant";
import { slotsFor, todayISO, mapDateRange } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** GET /api/availability?date=YYYY-MM-DD — slot + chair map, admin booking form ke liye */
export async function GET(req: Request) {
  const salon = await getSessionSalon();
  const url = new URL(req.url);
  const date = url.searchParams.get("date") || todayISO(0);

  const [chairRows, bookingRows, svcs, staff] = await Promise.all([
    db.select().from(chairs).where(and(eq(chairs.salonId, salon.id), eq(chairs.active, true))).orderBy(asc(chairs.sortOrder)),
    db.select().from(bookings).where(and(eq(bookings.salonId, salon.id), eq(bookings.date, date), ne(bookings.status, "cancelled"))).orderBy(asc(bookings.time)),
    db.select().from(services).where(and(eq(services.salonId, salon.id), eq(services.active, true))).orderBy(asc(services.sortOrder)),
    db.select().from(staffMembers).where(and(eq(staffMembers.salonId, salon.id), eq(staffMembers.active, true))),
  ]);

  const slots = slotsFor(salon.openTime, salon.closeTime).map((time) => {
    const taken = bookingRows.filter((b) => b.time === time);
    const takenChairIds = new Set(taken.map((b) => b.chairId));
    return {
      time,
      bookings: taken.length,
      freeChairs: chairRows.filter((c) => !takenChairIds.has(c.id)).length,
      chairIdsFree: chairRows.filter((c) => !takenChairIds.has(c.id)).map((c) => c.id),
    };
  });

  // admin calendar: next 7 days counts
  const weekDates = mapDateRange(7);
  const weekRows = await db
    .select({ date: bookings.date, status: bookings.status, chairId: bookings.chairId })
    .from(bookings)
    .where(and(eq(bookings.salonId, salon.id), inArray(bookings.date, weekDates)));

  return Response.json({
    date,
    slots,
    chairs: chairRows,
    services: svcs,
    staff,
    dayBookings: bookingRows,
    week: weekDates.map((d) => ({ date: d, count: weekRows.filter((r) => r.date === d && r.status !== "cancelled").length })),
    openTime: salon.openTime,
    closeTime: salon.closeTime,
    closedDays: salon.closedDays,
  });
}