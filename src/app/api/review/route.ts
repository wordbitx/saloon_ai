import { db } from "@/db";
import { reviewRequests, activityEvents, bookings } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSessionSalon } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const salon = await getSessionSalon();
  const body = (await req.json().catch(() => ({}))) as { customerName?: string; serviceName?: string };

  // Default: aaj ki completed booking, warna latest confirmed
  let customerName = body.customerName?.slice(0, 40);
  let serviceName = body.serviceName?.slice(0, 60);
  if (!customerName || !serviceName) {
    const recent = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.salonId, salon.id)))
      .orderBy(desc(bookings.createdAt))
      .limit(5);
    const pick = recent.find((b) => b.status === "completed") ?? recent.find((b) => b.status === "confirmed") ?? recent[0];
    customerName = customerName ?? pick?.customerName ?? "Customer";
    serviceName = serviceName ?? pick?.serviceName ?? "Service";
  }

  await db.insert(reviewRequests).values({ salonId: salon.id, customerName, serviceName, status: "sent" });
  await db.insert(activityEvents).values({
    salonId: salon.id,
    kind: "review",
    detail: `Google review request gayi — ${customerName} (${serviceName})`,
  });

  const link = salon.reviewUrl?.trim() || null;
  const message = link
    ? `Shukriya ${customerName}! 💙 Aap ka ${serviceName} complete ho gaya — umeed hai experience acha raha. Agar pasand aaya to Google par 1 minute ka review zaroor karein:\n${link}`
    : `Shukriya ${customerName}! 💙 Aap ka ${serviceName} complete ho gaya — umeed hai experience acha raha. Agar pasand aaya to Google par review zaroor karein:\n[Google review link — TODO (owner decision): Settings → Review URL mein apna link add karein]`;

  const all = await db.select().from(reviewRequests).where(eq(reviewRequests.salonId, salon.id));
  return Response.json({ message, reviewUrlConfigured: Boolean(link), count: all.length });
}