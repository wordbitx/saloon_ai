import { db } from "@/db";
import { salons, bookings, missedMessages, waitlistEntries, reviewRequests, activityEvents, chairs, staffMembers, customers, services } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { getSessionSalon, isAdmin, activeBranch, getRole } from "@/lib/tenant";
import { todayISO, slotsFor, fmtTime12, mapDateRange } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const salon = await getSessionSalon();
  const sid = salon.id;
  const branch = await activeBranch(salon); // null = poora salon

  const [bk, missed, waitlist, reviews, events, allSalons, chairRows, staffRows, clientRows, svcRows] = await Promise.all([
    db.select().from(bookings).where(eq(bookings.salonId, sid)).orderBy(desc(bookings.date), asc(bookings.time)),
    db.select().from(missedMessages).where(eq(missedMessages.salonId, sid)).orderBy(desc(missedMessages.createdAt)),
    db.select().from(waitlistEntries).where(eq(waitlistEntries.salonId, sid)).orderBy(desc(waitlistEntries.createdAt)),
    db.select().from(reviewRequests).where(eq(reviewRequests.salonId, sid)).orderBy(desc(reviewRequests.createdAt)),
    db.select().from(activityEvents).where(eq(activityEvents.salonId, sid)).orderBy(desc(activityEvents.createdAt)).limit(20),
    db.select({ slug: salons.slug, name: salons.name }).from(salons).orderBy(salons.createdAt),
    db.select().from(chairs).where(eq(chairs.salonId, sid)).orderBy(asc(chairs.sortOrder)),
    db.select().from(staffMembers).where(eq(staffMembers.salonId, sid)),
    db.select().from(customers).where(eq(customers.salonId, sid)),
    db.select().from(services).where(eq(services.salonId, sid)).orderBy(asc(services.sortOrder)),
  ]);

  const branchFilter = (rows: typeof bk) => (branch ? rows.filter((b) => b.branch === branch) : rows);
  const bkScoped = branchFilter(bk);
  const chairName = (id: string | null) => chairRows.find((c) => c.id === id)?.name ?? null;
  const today = todayISO(0);
  const active = bkScoped.filter((b) => b.status !== "cancelled");
  const todays = active.filter((b) => b.date === today);
  const recovered = active.filter((b) => ["recovered", "missed-call", "waitlist"].includes(b.source));
  const pending = missed.filter((m) => m.status === "pending");
  const waiting = waitlist.filter((w) => w.status === "waiting");
  const upcoming = active.filter((b) => b.date >= today && b.status === "confirmed");
  const slotsPerDay = slotsFor(salon.openTime, salon.closeTime).length * Math.max(1, chairRows.filter((c) => c.active).length);
  const emptyToday = Math.max(0, slotsPerDay - todays.length);
  const revenueToday = todays.filter((b) => b.status !== "cancelled").reduce((sum, b) => sum + b.pricePkr, 0);
  const revenueRecovered = recovered.reduce((sum, b) => sum + b.pricePkr, 0);

  const week = mapDateRange(7, -6).map((d) => ({
    date: d,
    bookings: active.filter((b) => b.date === d).length,
    recovered: active.filter((b) => b.date === d && ["recovered", "missed-call", "waitlist"].includes(b.source)).length,
  }));

  const branchNote = salon.branches.length > 0 ? ` Branches: ${salon.branches.join(" ✓ / ")} ✓.` : "";
  const morningBrief =
    bkScoped.length === 0
      ? `Subah bakhair, ${salon.name}! Abhi koi booking record nahi — demo chat se booking banayein, yeh brief khud update hogi.`
      : `Subah bakhair, ${salon.name}! ☀️ Aaj ${todays.length} bookings hain (${todays.slice(0, 2).map((b) => `${b.customerName} ${b.time}`).join(", ") || "—"}). Khaali slots: ${emptyToday}. Kal ke missed: ${missed.length} — ${missed.filter((m) => m.status === "recovered").length} recover huay. Reminders: ${upcoming.length} scheduled.${branchNote}`;

  const dailySummary =
    bkScoped.length === 0
      ? "Aaj abhi koi activity nahi. Demo chat chalayein — har recovered booking yahan gin-ti jayegi."
      : `Aaj ${recovered.length} bookings bachi (${todays.length} aaj ki). ${missed.length} missed messages mein se ${pending.length} abhi pending. Waitlist: ${waiting.length} customers. Reviews bheje: ${reviews.length}.`;

  const withChair = (rows: typeof bk) => rows.map((b) => ({ ...b, chairName: chairName(b.chairId) }));

  return Response.json({
    sample: true,
    admin: await isAdmin(salon),
    role: await getRole(),
    branch: branch ?? "all",
    salon: {
      slug: salon.slug,
      name: salon.name,
      area: salon.area,
      openTime: salon.openTime,
      closeTime: salon.closeTime,
      closedDays: salon.closedDays,
      branches: salon.branches,
      plan: salon.plan,
      hoursLabel: `${fmtTime12(salon.openTime)} – ${fmtTime12(salon.closeTime)}`,
    },
    salons: allSalons,
    counters: {
      recovered: recovered.length,
      missed: missed.length,
      pending: pending.length,
      reviews: reviews.length,
      waitlist: waiting.length,
      reminders: upcoming.length,
      todayBookings: todays.length,
      emptyToday,
      revenueToday,
      revenueRecovered,
      clients: clientRows.length,
      staff: staffRows.filter((s) => s.active).length,
      chairs: chairRows.filter((c) => c.active).length,
    },
    dailySummary,
    morningBrief,
    week,
    bookings: withChair(bkScoped),
    todaySchedule: withChair(todays),
    missed,
    waitlist,
    reviews,
    events,
    chairs: chairRows,
    staff: staffRows,
    clients: clientRows,
    services: svcRows,
  });
}