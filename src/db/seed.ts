import { db, pool, SCHEMA_DDL_STATEMENTS, getDbStatus } from "@/db";
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
  retailProducts,
} from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { todayISO, maskTail, slotsFor } from "@/lib/utils";

/**
 * Fictional demo salons. Koi asli salon, number ya email nahi.
 * Salon A: Glow Salon (rich demo) · Salon B: Noor Lounge (khaali — isolation proof).
 */

export const STARTER_PRODUCTS = [
  {
    id: "00000000-0000-4000-8000-000000000301",
    imageUrl: "/images/products/keratin-serum.jpg",
    name: "Keratin Repair Serum",
    description: "Color ke baad frizz kam kare — 100ml.",
    pricePkr: 2800,
    category: "Haircare",
    stock: 14,
    emoji: "💧",
    sortOrder: 1,
  },
  {
    id: "00000000-0000-4000-8000-000000000302",
    imageUrl: "/images/products/silk-hair-mask.jpg",
    name: "Silk Hair Mask",
    description: "Weekly deep mask, dry ends ke liye.",
    pricePkr: 2200,
    category: "Haircare",
    stock: 9,
    emoji: "🎀",
    sortOrder: 2,
  },
  {
    id: "00000000-0000-4000-8000-000000000303",
    imageUrl: "/images/products/after-color-shampoo.jpg",
    name: "After-Color Shampoo",
    description: "Color lock shampoo, sulfate-free.",
    pricePkr: 1650,
    category: "Haircare",
    stock: 18,
    emoji: "🧴",
    sortOrder: 3,
  },
  {
    id: "00000000-0000-4000-8000-000000000304",
    imageUrl: "/images/products/hydra-glow-kit.jpg",
    name: "Hydra Glow Facial Kit",
    description: "Ghar par 3-step glow — salon facial ke baad.",
    pricePkr: 3400,
    category: "Skin",
    stock: 7,
    emoji: "✨",
    sortOrder: 4,
  },
  {
    id: "00000000-0000-4000-8000-000000000305",
    imageUrl: "/images/products/nail-strengthener.jpg",
    name: "Nail Strengthener",
    description: "Gel ke baad weak nails ke liye.",
    pricePkr: 890,
    category: "Nails",
    stock: 22,
    emoji: "💅",
    sortOrder: 5,
  },
  {
    id: "00000000-0000-4000-8000-000000000306",
    imageUrl: "/images/products/bridal-mehndi-set.jpg",
    name: "Bridal Mehndi Cone Set",
    description: "4 cones + aftercare oil. Shaadi season.",
    pricePkr: 1200,
    category: "Bridal",
    stock: 11,
    emoji: "🌿",
    sortOrder: 6,
  },
];

const globalSeed = globalThis as typeof globalThis & {
  __mbrSeedPromise?: Promise<void>;
  __mbrSeedMode?: string;
};

export function ensureSeeded(): Promise<void> {
  const currentMode = getDbStatus().mode;
  if (!globalSeed.__mbrSeedPromise || globalSeed.__mbrSeedMode !== currentMode) {
    globalSeed.__mbrSeedMode = currentMode;
    globalSeed.__mbrSeedPromise = seedIfEmpty()
      .then(() => {
        globalSeed.__mbrSeedMode = getDbStatus().mode;
      })
      .catch((e) => {
        globalSeed.__mbrSeedPromise = undefined;
        throw e;
      });
  }
  return globalSeed.__mbrSeedPromise;
}

async function ensureSchema() {
  const isMemory = getDbStatus().mode === "memory-fallback";
  for (const stmt of SCHEMA_DDL_STATEMENTS) {
    if (isMemory && !stmt.trim().toLowerCase().startsWith("create table")) continue;
    try {
      await pool.query(stmt);
    } catch {
      // Ignore individual DDL errors if already applied
    }
  }
  // Ensure existing salons have default admin_pin ('2468') and plan
  try {
    await pool.query(`update salons set admin_pin = '2468' where admin_pin is null or admin_pin = ''`);
    await pool.query(`update salons set plan = 'business' where slug = 'glow-demo' and (plan is null or plan = '')`);
    await pool.query(`update salons set plan = 'starter' where slug = 'noor-demo' and (plan is null or plan = '')`);
  } catch {
    // Ignore if table empty
  }
}

export async function ensureShelfForSalon(salonId: string, slug: string) {
  if (slug !== "glow-demo") return;
  const existing = await db.select().from(retailProducts).where(eq(retailProducts.salonId, salonId));
  if (existing.length === 0) {
    await db.insert(retailProducts).values(
      STARTER_PRODUCTS.map((p) => ({
        ...p,
        salonId,
      })),
    );
    return;
  }
  // Self-heal any old Pexels or missing imageUrls on starter products
  for (const row of existing) {
    const match = STARTER_PRODUCTS.find((p) => p.name.toLowerCase() === row.name.toLowerCase());
    if (
      match &&
      (!row.imageUrl ||
        row.imageUrl.includes("images.pexels.com") ||
        row.imageUrl.includes("unsplash.com"))
    ) {
      await db
        .update(retailProducts)
        .set({ imageUrl: match.imageUrl })
        .where(eq(retailProducts.id, row.id));
    }
  }
}

async function seedIfEmpty() {
  await ensureSchema();

  let [a] = await db.select().from(salons).where(eq(salons.slug, "glow-demo")).limit(1);
  if (!a) {
    [a] = await db
      .insert(salons)
      .values({
        id: "00000000-0000-4000-8000-000000000001",
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
  } else if (!a.adminPin) {
    [a] = await db
      .update(salons)
      .set({ adminPin: "2468" })
      .where(eq(salons.id, a.id))
      .returning();
  }

  let [b] = await db.select().from(salons).where(eq(salons.slug, "noor-demo")).limit(1);
  if (!b) {
    [b] = await db
      .insert(salons)
      .values({
        id: "00000000-0000-4000-8000-000000000002",
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
  } else if (!b.adminPin) {
    [b] = await db
      .update(salons)
      .set({ adminPin: "2468" })
      .where(eq(salons.id, b.id))
      .returning();
  }

  let staffA = await db.select().from(staffMembers).where(eq(staffMembers.salonId, a.id));
  if (staffA.length === 0) {
    staffA = await db
      .insert(staffMembers)
      .values([
        { id: "00000000-0000-4000-8000-000000000101", salonId: a.id, name: "Hina", specialty: "Hair Color & Balayage", role: "Senior Stylist", phoneMasked: maskTail("31"), active: true, rating: 5 },
        { id: "00000000-0000-4000-8000-000000000102", salonId: a.id, name: "Sana", specialty: "Makeup & Bridal", role: "Makeup Artist", phoneMasked: maskTail("46"), active: true, rating: 5 },
        { id: "00000000-0000-4000-8000-000000000103", salonId: a.id, name: "Rabia", specialty: "Nails & Skin", role: "Beauty Therapist", phoneMasked: maskTail("58"), active: true, rating: 4 },
        { id: "00000000-0000-4000-8000-000000000104", salonId: a.id, name: "Zara", specialty: "Cuts & Styling", role: "Junior Stylist", phoneMasked: maskTail("72"), active: false, rating: 4 },
      ])
      .returning();
  }

  const staffB = await db.select().from(staffMembers).where(eq(staffMembers.salonId, b.id));
  if (staffB.length === 0) {
    await db
      .insert(staffMembers)
      .values([
        { id: "00000000-0000-4000-8000-000000000105", salonId: b.id, name: "Alina", specialty: "Stylist", role: "Stylist", phoneMasked: maskTail("90"), active: true, rating: 5 },
      ]);
  }

  const chairsA = await db.select().from(chairs).where(eq(chairs.salonId, a.id));
  if (chairsA.length === 0) {
    const findStaff = (name: string) => staffA.find((s) => s.name === name)?.id ?? null;
    await db.insert(chairs).values([
      { id: "00000000-0000-4000-8000-000000000201", salonId: a.id, name: "Chair 1 — Hair", kind: "chair", staffId: findStaff("Hina"), active: true, sortOrder: 1 },
      { id: "00000000-0000-4000-8000-000000000202", salonId: a.id, name: "Chair 2 — Hair", kind: "chair", staffId: findStaff("Zara"), active: true, sortOrder: 2 },
      { id: "00000000-0000-4000-8000-000000000203", salonId: a.id, name: "Makeup Room", kind: "room", staffId: findStaff("Sana"), active: true, sortOrder: 3 },
      { id: "00000000-0000-4000-8000-000000000204", salonId: a.id, name: "Nail Bar", kind: "chair", staffId: findStaff("Rabia"), active: true, sortOrder: 4 },
    ]);
  }

  const chairsB = await db.select().from(chairs).where(eq(chairs.salonId, b.id));
  if (chairsB.length === 0) {
    await db.insert(chairs).values([
      { id: "00000000-0000-4000-8000-000000000205", salonId: b.id, name: "Chair 1", kind: "chair", staffId: null, active: true, sortOrder: 1 },
    ]);
  }

  const svcsA = await db.select().from(services).where(eq(services.salonId, a.id));
  if (svcsA.length === 0) {
    await db.insert(services).values([
      { salonId: a.id, name: "Haircut", pricePkr: 1200, durationMins: 40, category: "regular", active: true, sortOrder: 1 },
      { salonId: a.id, name: "Facial", pricePkr: 2500, durationMins: 60, category: "regular", active: true, sortOrder: 2 },
      { salonId: a.id, name: "Hair Color", pricePkr: 4500, durationMins: 90, category: "regular", active: true, sortOrder: 3 },
      { salonId: a.id, name: "Balayage", pricePkr: 8500, durationMins: 150, category: "regular", active: true, sortOrder: 4 },
      { salonId: a.id, name: "Manicure", pricePkr: 1500, durationMins: 45, category: "regular", active: true, sortOrder: 5 },
      { salonId: a.id, name: "Party Makeup", pricePkr: 6000, durationMins: 75, category: "regular", active: true, sortOrder: 6 },
      { salonId: a.id, name: "Bridal Makeup", pricePkr: 25000, durationMins: 180, category: "bridal", active: true, sortOrder: 7 },
      { salonId: a.id, name: "Mehndi Application", pricePkr: 3000, durationMins: 45, category: "addon", active: true, sortOrder: 8 },
      { salonId: a.id, name: "Bridal Trial", pricePkr: 5000, durationMins: 60, category: "addon", active: true, sortOrder: 9 },
    ]);
  }

  const svcsB = await db.select().from(services).where(eq(services.salonId, b.id));
  if (svcsB.length === 0) {
    await db.insert(services).values([
      { salonId: b.id, name: "Haircut", pricePkr: 1000, durationMins: 40, category: "regular", active: true, sortOrder: 1 },
      { salonId: b.id, name: "Facial", pricePkr: 2000, durationMins: 60, category: "regular", active: true, sortOrder: 2 },
    ]);
  }

  const custA = await db.select().from(customers).where(eq(customers.salonId, a.id));
  if (custA.length === 0) {
    await db.insert(customers).values([
      { salonId: a.id, personaKey: "ayesha", name: "Ayesha", phoneMasked: maskTail("21"), lastService: "Balayage", visits: 4, tag: "vip", preferredStaff: "Hina", notes: "Hamesha Hina se booking. Sensitive scalp — ammonia-free color.", totalSpentPkr: 34500, lastVisitISO: todayISO(-12) },
      { salonId: a.id, personaKey: "mahnoor", name: "Mahnoor", phoneMasked: maskTail("87"), lastService: "Facial", visits: 2, tag: "regular", preferredStaff: "Rabia", notes: "Shaam ke slots pasand hain.", totalSpentPkr: 5000, lastVisitISO: todayISO(-30) },
      { salonId: a.id, personaKey: "fatima", name: "Fatima", phoneMasked: maskTail("09"), lastService: "Haircut", visits: 6, tag: "vip", preferredStaff: "Hina", notes: "Monthly trim, mostly Saturday.", totalSpentPkr: 21000, lastVisitISO: todayISO(-2) },
      { salonId: a.id, personaKey: "komal", name: "Komal", phoneMasked: maskTail("44"), lastService: "Manicure", visits: 1, tag: "new", preferredStaff: null, notes: "Waitlist se pehli booking.", totalSpentPkr: 1500, lastVisitISO: todayISO(1) },
      { salonId: a.id, personaKey: "zoya", name: "Zoya", phoneMasked: maskTail("63"), lastService: "Party Makeup", visits: 3, tag: "regular", preferredStaff: "Sana", notes: "Shaadi season mein bridal inquiry.", totalSpentPkr: 18000, lastVisitISO: todayISO(-45) },
      { salonId: a.id, personaKey: "kiran", name: "Kiran", phoneMasked: maskTail("52"), lastService: "Facial", visits: 2, tag: "at-risk", preferredStaff: "Rabia", notes: "90 din se nahi aayi — win-back offer.", totalSpentPkr: 5000, lastVisitISO: todayISO(-92) },
    ]);
  }

  await ensureShelfForSalon(a.id, a.slug);

  const existingBookings = await db.select().from(bookings).where(eq(bookings.salonId, a.id));
  const today = todayISO(0);
  const hasCurrentOrUpcoming = existingBookings.some((bk) => bk.date >= today);
  if (existingBookings.length === 0 || !hasCurrentOrUpcoming) {
    await seedActivityFor(a.id, a.slug, a.openTime, a.closeTime, (a.branches ?? []) as string[]);
  }
}

/** Demo activity reset — chairs/staff/services/settings ko chhoota nahi */
export async function seedActivityFor(
  salonId: string,
  slug: string,
  openTime: string,
  closeTime: string,
  salonBranches: string[] = ["DHA Phase 5"],
) {
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
    { id: "00000000-0000-4000-8000-000000000401", salonId, customerName: "Fatima", phoneMasked: maskTail("09"), serviceName: "Haircut", staffName: "Hina", chairId: chairIds[0], date: today, time: s(0), status: "completed", source: "walk-in", pricePkr: 1200 },
    { id: "00000000-0000-4000-8000-000000000402", salonId, customerName: "Mahnoor", phoneMasked: maskTail("87"), serviceName: "Facial", staffName: "Rabia", chairId: chairIds[3], date: today, time: s(1), status: "confirmed", source: "recovered", pricePkr: 2500 },
    { id: "00000000-0000-4000-8000-000000000403", salonId, customerName: "Ayesha", phoneMasked: maskTail("21"), serviceName: "Balayage", staffName: "Hina", chairId: chairIds[0], date: today, time: s(2), status: "confirmed", source: "missed-call", pricePkr: 8500 },
    { id: "00000000-0000-4000-8000-000000000404", salonId, customerName: "Zoya", phoneMasked: maskTail("63"), serviceName: "Party Makeup", staffName: "Sana", chairId: chairIds[2], date: today, time: s(2), status: "confirmed", source: "chat", pricePkr: 6000 },
    { id: "00000000-0000-4000-8000-000000000405", salonId, customerName: "Komal", phoneMasked: maskTail("44"), serviceName: "Manicure", staffName: "Rabia", chairId: chairIds[3], date: tomorrow, time: s(1), status: "confirmed", source: "waitlist", pricePkr: 1500 },
    { id: "00000000-0000-4000-8000-000000000406", salonId, customerName: "Kiran", phoneMasked: maskTail("52"), serviceName: "Facial", staffName: "Rabia", chairId: chairIds[3], date: tomorrow, time: s(3), status: "confirmed", source: "recovered", pricePkr: 2500 },
    { id: "00000000-0000-4000-8000-000000000407", salonId, customerName: "Ayesha", phoneMasked: maskTail("21"), serviceName: "Hair Color", staffName: "Hina", chairId: chairIds[0], date: d2, time: s(2), status: "confirmed", source: "chat", pricePkr: 4500 },
    { id: "00000000-0000-4000-8000-000000000408", salonId, customerName: "Sadia", phoneMasked: maskTail("35"), serviceName: "Bridal Makeup", staffName: "Sana", chairId: chairIds[2], date: d2, time: s(1), status: "confirmed", source: "recovered", pricePkr: 25000 },
    { id: "00000000-0000-4000-8000-000000000409", salonId, customerName: "Nida", phoneMasked: maskTail("18"), serviceName: "Manicure", staffName: "Rabia", chairId: chairIds[3], date: yd, time: s(1), status: "completed", source: "recovered", pricePkr: 1500 },
    { id: "00000000-0000-4000-8000-000000000410", salonId, customerName: "Hira", phoneMasked: maskTail("66"), serviceName: "Haircut", staffName: "Hina", chairId: chairIds[1], date: yd, time: s(2), status: "completed", source: "missed-call", pricePkr: 1200 },
    { id: "00000000-0000-4000-8000-000000000411", salonId, customerName: "Beenish", phoneMasked: maskTail("74"), serviceName: "Facial", staffName: "Rabia", chairId: chairIds[3], date: dm2, time: s(0), status: "completed", source: "recovered", pricePkr: 2500 },
    { id: "00000000-0000-4000-8000-000000000412", salonId, customerName: "Mariam", phoneMasked: maskTail("82"), serviceName: "Hair Color", staffName: "Hina", chairId: chairIds[0], date: dm2, time: s(1), status: "cancelled", source: "chat", pricePkr: 4500 },
  ]);

  // Har demo booking apni branch par (workspace filter ke liye)
  await db
    .update(bookings)
    .set({ branch: salonBranches[0] ?? "DHA Phase 5" })
    .where(and(eq(bookings.salonId, salonId), isNull(bookings.branch)));

  await db.insert(missedMessages).values([
    { salonId, channel: "whatsapp", customerLabel: "Mahnoor", snippet: "Facial ka rate kya hai? Aaj shaam slot milega?", status: "recovered" },
    { salonId, channel: "call", customerLabel: "Ayesha", snippet: "Missed call — raat 10:40 PM", status: "recovered" },
    { salonId, channel: "whatsapp", customerLabel: "Naya customer", snippet: "Komal ne manicure ka poocha, slot full tha", status: "recovered" },
    { salonId, channel: "call", customerLabel: "Naya customer", snippet: "Missed call — peak hour 6:15 PM", status: "recovered" },
    { salonId, channel: "whatsapp", customerLabel: "Naya customer", snippet: "Bridal package ka rate?", status: "pending" },
    { salonId, channel: "whatsapp", customerLabel: "Naya customer", snippet: "Kal evening mein slot available hai?", status: "pending" },
  ]);

  await db.insert(waitlistEntries).values([
    { id: "00000000-0000-4000-8000-000000000501", salonId, customerName: "Kiran", phoneMasked: maskTail("52"), serviceName: "Facial", preferredTime: "Shaam 6 baje ke baad", status: "waiting" },
    { id: "00000000-0000-4000-8000-000000000502", salonId, customerName: "Eman", phoneMasked: maskTail("78"), serviceName: "Haircut", preferredTime: "Weekend", status: "waiting" },
    { id: "00000000-0000-4000-8000-000000000503", salonId, customerName: "Nimra", phoneMasked: maskTail("27"), serviceName: "Party Makeup", preferredTime: "Koi bhi evening", status: "waiting" },
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
