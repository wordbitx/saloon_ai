import { db } from "@/db";
import { bookings, missedMessages, waitlistEntries, reviewRequests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSessionSalon } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const esc = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const row = (...cells: (string | number | null)[]) => cells.map(esc).join(",");

export async function GET() {
  const salon = await getSessionSalon();
  const sid = salon.id;
  const [bk, missed, waitlist, reviews] = await Promise.all([
    db.select().from(bookings).where(eq(bookings.salonId, sid)).orderBy(desc(bookings.createdAt)),
    db.select().from(missedMessages).where(eq(missedMessages.salonId, sid)).orderBy(desc(missedMessages.createdAt)),
    db.select().from(waitlistEntries).where(eq(waitlistEntries.salonId, sid)).orderBy(desc(waitlistEntries.createdAt)),
    db.select().from(reviewRequests).where(eq(reviewRequests.salonId, sid)).orderBy(desc(reviewRequests.createdAt)),
  ]);

  const lines: string[] = [
    row(`${salon.name} — Elan Beauty Missed Booking Recovery export`),
    "",
    row("BOOKINGS"),
    row("Customer", "Phone (masked)", "Service", "Staff", "Date", "Time", "Status", "Source"),
    ...bk.map((b) => row(b.customerName, b.phoneMasked, b.serviceName, b.staffName, b.date, b.time, b.status, b.source)),
    "",
    row("MISSED MESSAGES"),
    row("Channel", "Customer", "Snippet", "Status"),
    ...missed.map((m) => row(m.channel, m.customerLabel, m.snippet, m.status)),
    "",
    row("WAITLIST"),
    row("Customer", "Phone (masked)", "Service", "Preferred", "Status"),
    ...waitlist.map((w) => row(w.customerName, w.phoneMasked, w.serviceName, w.preferredTime, w.status)),
    "",
    row("REVIEW REQUESTS"),
    row("Customer", "Service", "Status"),
    ...reviews.map((r) => row(r.customerName, r.serviceName, r.status)),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="elan-beauty-${salon.slug}-demo.csv"`,
    },
  });
}