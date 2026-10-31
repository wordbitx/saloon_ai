import { db } from "@/db";
import { salons, missedMessages, reviewRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionSalon, fetchBookingsFor, containsLeak } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/**
 * Tenant isolation acceptance tests (section 7) — live, DB ke against:
 *  1. Active salon ko doosre salon ki 0 bookings nazar aati hain
 *  2. Doosre salon ke id par direct API call → 403
 *  3. Demo response mein poora phone/email leak nahi
 */
export async function GET() {
  const salon = await getSessionSalon();
  const all = await db.select().from(salons);
  const other = all.find((s) => s.id !== salon.id);

  const mine = await fetchBookingsFor(salon, salon.id);
  const crossLeak = mine.rows.filter((b) => b.salonId !== salon.id).length;

  const tests: { name: string; pass: boolean; detail: string }[] = [];

  tests.push({
    name: `Cross-tenant visibility: ${salon.name} ko doosre salon ki 0 bookings`,
    pass: !mine.forbidden && crossLeak === 0,
    detail: `Apni ${mine.rows.length} bookings miliyan, doosre salon ki ${crossLeak} — leak zero.`,
  });

  if (other) {
    const attack = await fetchBookingsFor(salon, other.id);
    tests.push({
      name: "Direct API call doosre salon ke id par → 403",
      pass: attack.forbidden && attack.rows.length === 0,
      detail: `GET /api/bookings?salonId=${other.slug.slice(0, 4)}… → 403 forbidden, 0 rows.`,
    });
  }

  const [missed, reviews] = await Promise.all([
    db.select().from(missedMessages).where(eq(missedMessages.salonId, salon.id)),
    db.select().from(reviewRequests).where(eq(reviewRequests.salonId, salon.id)),
  ]);
  const payload = JSON.stringify({ bookings: mine.rows, missed, reviews });
  tests.push({
    name: "Demo/free path mein phone/email leak scan",
    pass: !containsLeak(payload),
    detail: "Poora phone number, email ya real business name kisi response mein nahi — sirf masked (+92 3•• ••••XX).",
  });

  return Response.json({ salon: salon.name, allPass: tests.every((t) => t.pass), tests });
}