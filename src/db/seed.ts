import { db } from "@/db";
import {
  salons,
  staffMembers,
  services,
  chairs,
  customers,
  bookings,
  missedMessages,
  waitlistEntries,
  reviewRequests,
  activityEvents,
} from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { todayISO, maskTail, slotsFor } from "@/lib/utils";

/**
 * fictional demo salons. Koi asli salon, number ya email nahi.
 * Salon A: Glow Salon (rich demo) · Salon B: Noor Lounge (khaali — isolation proof).
 */

const globalSeed = globalThis as typeof globalThis & { __mbrSeedPromise?: Promise<void> };

export function ensureSeeded(): Promise<void> {
  if (!globalSeed.__mbrSeedPromise) {
    globalSeed.__mbrSeedPromise = seedIfEmpty().catch((e) => {
      globalSeed.__mbrSeedPromise = undefined;
      throw e;
    });
  }
  return globalSeed.__mbrSeedPromise;
}

async function seedIfEmpty() {
  const existing = await db.select({ id: salons.id }).from(salons).limit(1);
  if (existing.length > 0) return;

  const [a] = await db
    .insert(salons)
    .values({
      slug: "glow-demo",
      name: "Glow Salon",
      area: "DHA Phase 5, Lahore",
      greeting:
        "Assalam o Alaikum! Glow Salon mein khush aamdeed 💚 Booking ya rates ke liye batayein — main foran jawab deta hoon.",
      openTime: "11:00",
      closeTime: "20:00",
      closedDays: ["Monday"],
      repeatEnabled: true,
      reviewUrl: null,
      branches: ["DHA Phase 5", "Johar Town"],
      plan: "business",
      adminPin: "2468",
    })
    .returning();

  const [b] = await db
    .insert(salons)
    .values({
      slug: "noor-demo",
      name: "Noor Lounge (Demo B)",
      area: "Gulberg III, Lahore",
      greeting: "Assalam o Alaikum! Noor Lounge mein khush aamdeed. Booking ya rates batayein.",
      openTime: "12:00",
      closeTime: "21:00",
      closedDays: ["Sunday"],
      repeatEnabled: true,
      reviewUrl: null,
      branches: [],
      plan: "starter",
      adminPin: "2468",
    })
    .returning();

  const staffA = await db
    .insert(staffMembers)
    .values([
      { salonId: a.id, name: "Hina", specialty: "Hair Color & Balayage", role: "Senior Stylist", phoneMasked: maskTail("31"), rating: 5 },
      { salonId: a.id, name: "Sana", specialty: "Makeup & Bridal", role: "Makeup Artist", phoneMasked: maskTail("46"), rating: 5 },
      { salonId: a.id, name: "Rabia", specialty: "Nails & Skin", role: "Beauty Therapist", phoneMasked: maskTail("58"), rating: 4 },
      { salonId: a.id, name: "Zara", specialty: "Cuts & Styling", role: "Junior Stylist", phoneMasked: maskTail("72"), rating: 4, active: false },
      { salonId: b.id, name: "Alina", specialty: "Stylist", role: "Stylist", phoneMasked: maskTail("90") },
    ])
    .returning();

  await db.insert(chairs).values([
    { salonId: a.id, name: "Chair 1 — Hair", kind: "chair", staffId: staffA[0]?.id ?? null, sortOrder: 1 },
    { salonId: a.id, name: "Chair 2 — Hair", kind: "chair", staffId: staffA[3]?.id ?? null, sortOrder: 2 },
    { salonId: a.id, name: "Makeup Room", kind: "room", staffId: staffA[1]?.id ?? null, sortOrder: 3 },
    { salonId: a.id, name: "Nail Bar", kind: "chair", staffId: staffA[2]?.id ?? null, sortOrder: 4 },
    { salonId: b.id, name: "Chair 1", kind: "chair", sortOrder: 1 },
  ]);

  await db.insert(services).values([
    { salonId: a.id, name: "Haircut", pricePkr: 1200, durationMins: 40, sortOrder: 1 },
    { salonId: a.id, name: "Facial", pricePkr: 2500, durationMins: 60, sortOrder: 2 },
    { salonId: a.id, name: "Hair Color", pricePkr: 4500, durationMins: 90, sortOrder: 3 },
    { salonId: a.id, name: "Balayage", pricePkr: 8500, durationMins: 150, sortOrder: 4 },
    { salonId: a.id, name: "Manicure", pricePkr: 1500, durationMins: 45, sortOrder: 5 },
    { salonId: a.id, name: "Party Makeup", pricePkr: 6000, durationMins: 75, sortOrder: 6 },
    { salonId: a.id, name: "Bridal Makeup", pricePkr: 25000, durationMins: 180, category: "bridal", sortOrder: 7 },
    { salonId: a.id, name: "Mehndi Application", pricePkr: 3000, durationMins: 45, category: "addon", sortOrder: 8 },
    { salonId: a.id, name: "Bridal Trial", pricePkr: 5000, durationMins: 60, category: "addon", sortOrder: 9 },
    { salonId: b.id, name: "Haircut", pricePkr: 1000, durationMins: 40, sortOrder: 1 },
    { salonId: b.id, name: "Facial", pricePkr: 2000, durationMins: 60, sortOrder: 2 },
  ]);

  await db.insert(customers).values([
    { salonId: a.id, personaKey: "ayesha", name: "Ayesha", phoneMasked: maskTail("21"), lastService: "Balayage", visits: 4, tag: "vip", preferredStaff: "Hina", notes: "Hamesha Hina se booking. Sensitive scalp — ammonia-free color.", totalSpentPkr: 34500, lastVisitISO: todayISO(-12) },
    { salonId: a.id, personaKey: "mahnoor", name: "Mahnoor", phoneMasked: maskTail("87"), lastService: "Facial", visits: 2, tag: "regular", preferredStaff: "Rabia", notes: "Shaam ke slots pasand hain.", totalSpentPkr: 5000, lastVisitISO: todayISO(-30) },
    { salonId: a.id, personaKey: "fatima", name: "Fatima", phoneMasked: maskTail("09"), lastService: "Haircut", visits: 6, tag: "vip", preferredStaff: "Hina", notes: "Monthly trim, mostly Saturday.", totalSpentPkr: 21000, lastVisitISO: todayISO(-2) },
    { salonId: a.id, personaKey: "komal", name: "Komal", phoneMasked: maskTail("44"), lastService: "Manicure", visits: 1, tag: "new", notes: "Waitlist se pehli booking.", totalSpentPkr: 1500, lastVisitISO: todayISO(1) },
    { salonId: a.id, personaKey: "zoya", name: "Zoya", phoneMasked: maskTail("63"), lastService: "Party Makeup", visits: 3, tag: "regular", preferredStaff: "Sana", notes: "Shaadi season mein bridal inquiry.", totalSpentPkr: 18000, lastVisitISO: todayISO(-45) },
    { salonId: a.id, personaKey: "kiran", name: "Kiran", phoneMasked: maskTail("52"), lastService: "Facial", visits: 2, tag: "at-risk", preferredStaff: "Rabia", notes: "90 din se nahi aayi — win-back offer.", totalSpentPkr: 5000, lastVisitISO: todayISO(-92) },
  ]);

  await seedActivityFor(a.id, a.slug, a.openTime, a.closeTime, (a.branches ?? []) as string[]);
}

/** Demo activity reset — chairs/staff/services/settings ko chhoota nahi */
export async function seedActivityFor(salonId: string, slug: string, openTime: string, closeTime: string, salonBranches: string[] = ["DHA Phase 5"]) {
  await db.delete(bookings).where(eq(bookings.salonId, salonId));
  await db.delete(missedMessages).where(eq(missedMessages.salonId, salonId));
  await db.delete(waitlistEntries).where(eq(waitlistEntries.salonId, salonId));
  await db.delete(reviewRequests).where(eq(reviewRequests.salonId, salonId));
  await db.delete(activityEvents).where(eq(activityEvents.salonId, salonId));

  if (slug !== "glow-demo") return; // Salon B khaali rehta hai — isolation proof

  const chairRows = await db.select().from(chairs).where(eq(chairs.salonId, salonId));
  const chairIds = chairRows.map((c) => c.id);
  const chairName = (i: number) => chairRows[i]?.name ?? null;
  const slots = slotsFor(openTime, closeTime);
  const s = (i: number) => slots[i] ?? "12:00 PM";
  const today = todayISO(0);
  const tomorrow = todayISO(1);
  const yd = todayISO(-1);
  const d2 = todayISO(2);
  const dm2 = todayISO(-2);

  await db.insert(bookings).values([
    { salonId, customerName: "Fatima", phoneMasked: maskTail("09"), serviceName: "Haircut", staffName: "Hina", chairId: chairIds[0], date: today, time: s(0), status: "completed", source: "walk-in", pricePkr: 1200 },
    { salonId, customerName: "Mahnoor", phoneMasked: maskTail("87"), serviceName: "Facial", staffName: "Rabia", chairId: chairIds[3], date: today, time: s(1), status: "confirmed", source: "recovered", pricePkr: 2500 },
    { salonId, customerName: "Ayesha", phoneMasked: maskTail("21"), serviceName: "Balayage", staffName: "Hina", chairId: chairIds[0], date: today, time: s(2), status: "confirmed", source: "missed-call", pricePkr: 8500 },
    { salonId, customerName: "Zoya", phoneMasked: maskTail("63"), serviceName: "Party Makeup", staffName: "Sana", chairId: chairIds[2], date: today, time: s(2), status: "confirmed", source: "chat", pricePkr: 6000 },
    { salonId, customerName: "Komal", phoneMasked: maskTail("44"), serviceName: "Manicure", staffName: "Rabia", chairId: chairIds[3], date: tomorrow, time: s(1), status: "confirmed", source: "waitlist", pricePkr: 1500 },
    { salonId, customerName: "Kiran", phoneMasked: maskTail("52"), serviceName: "Facial", staffName: "Rabia", chairId: chairIds[3], date: tomorrow, time: s(3), status: "confirmed", source: "recovered", pricePkr: 2500 },
    { salonId, customerName: "Ayesha", phoneMasked: maskTail("21"), serviceName: "Hair Color", staffName: "Hina", chairId: chairIds[0], date: d2, time: s(2), status: "confirmed", source: "chat", pricePkr: 4500 },
    { salonId, customerName: "Sadia", phoneMasked: maskTail("35"), serviceName: "Bridal Makeup", staffName: "Sana", chairId: chairIds[2], date: d2, time: s(1), status: "confirmed", source: "recovered", pricePkr: 25000 },
    { salonId, customerName: "Nida", phoneMasked: maskTail("18"), serviceName: "Manicure", staffName: "Rabia", chairId: chairIds[3], date: yd, time: s(1), status: "completed", source: "recovered", pricePkr: 1500 },
    { salonId, customerName: "Hira", phoneMasked: maskTail("66"), serviceName: "Haircut", staffName: "Hina", chairId: chairIds[1], date: yd, time: s(2), status: "completed", source: "missed-call", pricePkr: 1200 },
    { salonId, customerName: "Beenish", phoneMasked: maskTail("74"), serviceName: "Facial", staffName: "Rabia", chairId: chairIds[3], date: dm2, time: s(0), status: "completed", source: "recovered", pricePkr: 2500 },
    { salonId, customerName: "Mariam", phoneMasked: maskTail("82"), serviceName: "Hair Color", staffName: "Hina", chairId: chairIds[0], date: dm2, time: s(1), status: "cancelled", source: "chat", pricePkr: 4500 },
  ]);

  // Har demo booking apni branch par (workspace filter ke liye)
  await db.update(bookings).set({ branch: (salonBranches[0] ?? "DHA Phase 5") }).where(and(eq(bookings.salonId, salonId), isNull(bookings.branch)));

  await db.insert(missedMessages).values([
    { salonId, channel: "whatsapp", customerLabel: "Mahnoor", snippet: "Facial ka rate kya hai? Aaj shaam slot milega?", status: "recovered" },
    { salonId, channel: "call", customerLabel: "Ayesha", snippet: "Missed call — raat 10:40 PM", status: "recovered" },
    { salonId, channel: "whatsapp", customerLabel: "Naya customer", snippet: "Komal ne manicure ka poocha, slot full tha", status: "recovered" },
    { salonId, channel: "call", customerLabel: "Naya customer", snippet: "Missed call — peak hour 6:15 PM", status: "recovered" },
    { salonId, channel: "whatsapp", customerLabel: "Naya customer", snippet: "Bridal package ka rate?", status: "pending" },
    { salonId, channel: "whatsapp", customerLabel: "Naya customer", snippet: "Kal evening mein slot available hai?", status: "pending" },
  ]);

  await db.insert(waitlistEntries).values([
    { salonId, customerName: "Kiran", phoneMasked: maskTail("52"), serviceName: "Facial", preferredTime: "Shaam 6 baje ke baad", status: "waiting" },
    { salonId, customerName: "Eman", phoneMasked: maskTail("78"), serviceName: "Haircut", preferredTime: "Weekend", status: "waiting" },
    { salonId, customerName: "Nimra", phoneMasked: maskTail("27"), serviceName: "Party Makeup", preferredTime: "Koi bhi evening", status: "waiting" },
  ]);

  await db.insert(reviewRequests).values([
    { salonId, customerName: "Fatima", serviceName: "Haircut", status: "sent" },
    { salonId, customerName: "Hira", serviceName: "Haircut", status: "sent" },
  ]);

  await db.insert(activityEvents).values([
    { salonId, kind: "missed", detail: "Missed WhatsApp (Mahnoor) — foran jawab gaya" },
    { salonId, kind: "recovered", detail: `Facial booking recover hui — Mahnoor, aaj ${s(1)}` },
    { salonId, kind: "missed", detail: "Missed call (Ayesha) — WhatsApp follow-up gaya" },
    { salonId, kind: "recovered", detail: `Balayage booking recover hui — Ayesha, aaj ${s(2)} (${chairName(0) ?? "Chair 1"})` },
    { salonId, kind: "waitlist", detail: `Khaali slot waitlist se bhara — Komal, kal ${s(1)}` },
    { salonId, kind: "reminder", detail: "Kal ki 2 bookings ke reminders scheduled hain" },
    { salonId, kind: "review", detail: "Google review request gayi — Fatima (Haircut)" },
  ]);
}