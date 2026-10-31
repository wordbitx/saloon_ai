import { db } from "@/db";
import { bookings, waitlistEntries, activityEvents } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getSessionSalon } from "@/lib/tenant";
import { prettyDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const salon = await getSessionSalon();
  const { id } = await params;

  const rows = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.salonId, salon.id)))
    .limit(1);
  const booking = rows[0];
  if (!booking) return Response.json({ error: "not found" }, { status: 404 });
  if (booking.status === "cancelled") return Response.json({ error: "already cancelled" }, { status: 400 });

  await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, booking.id));
  await db.insert(activityEvents).values({
    salonId: salon.id,
    kind: "booking",
    detail: `Cancellation: ${booking.customerName} — ${booking.serviceName}, ${prettyDate(booking.date)} ${booking.time}`,
  });

  // Waitlist backfill: pehle same service wala, warna koi bhi waiting customer
  const waiting = await db
    .select()
    .from(waitlistEntries)
    .where(and(eq(waitlistEntries.salonId, salon.id), eq(waitlistEntries.status, "waiting")))
    .orderBy(asc(waitlistEntries.createdAt));
  const match = waiting.find((w) => w.serviceName === booking.serviceName) ?? waiting[0];

  const messages: string[] = [
    `${booking.customerName} ki booking cancel ho gayi — slot khaali: ${prettyDate(booking.date)} ${booking.time}.`,
  ];

  let newBooking = null;
  if (match) {
    await db.update(waitlistEntries).set({ status: "booked" }).where(eq(waitlistEntries.id, match.id));
    const [row] = await db
      .insert(bookings)
      .values({
        salonId: salon.id,
        customerName: match.customerName,
        phoneMasked: match.phoneMasked,
        serviceName: match.serviceName,
        staffName: booking.staffName,
        chairId: booking.chairId, // cancel hui booking ki chair ab free hai
        date: booking.date,
        time: booking.time,
        status: "confirmed",
        source: "waitlist",
        pricePkr: booking.pricePkr,
      })
      .returning();
    newBooking = row;
    await db.insert(activityEvents).values({
      salonId: salon.id,
      kind: "waitlist",
      detail: `Waitlist backfill ✓ ${match.customerName} ko ${booking.time} ka slot mila (${match.serviceName})`,
    });
    messages.push(
      `Waitlist ko foran offer gaya → ${match.customerName} (${match.serviceName}, pasand: ${match.preferredTime}): "Khushkhabri! ${booking.time} ka slot khaali hua hai — confirm karein?"`,
      `${match.customerName}: "Haan, confirm!" — Khaali slot waitlist se bhar gaya ✓ Dashboard update ho gaya.`,
    );
  } else {
    messages.push("Waitlist abhi khaali hai — slot ab nayi bookings ke liye available hai.");
  }

  return Response.json({ cancelledId: booking.id, backfill: newBooking, messages });
}