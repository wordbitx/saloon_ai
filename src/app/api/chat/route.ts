import { db } from "@/db";
import { services, staffMembers, customers, bookings, missedMessages, activityEvents, chairs } from "@/db/schema";
import { eq, and, asc, desc, ne, inArray } from "drizzle-orm";
import { getSessionSalon } from "@/lib/tenant";
import { runBrain, confirmationText, conflictMessage, idleState, type ChatState, type OutMsg, type SlotAvailability } from "@/lib/chat-brain";
import { todayISO, mapDateRange, maskTail, slotsFor, pkr } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ChatBody {
  message?: string;
  state?: ChatState;
  personaKey?: string;
  scenario?: string;
  opening?: "missed-message" | "missed-call";
}

export async function POST(req: Request) {
  const salon = await getSessionSalon();
  const body = (await req.json().catch(() => ({}))) as ChatBody;
  const message = String(body.message ?? "").slice(0, 300);

  const [svcs, staff, chairsList] = await Promise.all([
    db.select().from(services).where(and(eq(services.salonId, salon.id), eq(services.active, true))).orderBy(asc(services.sortOrder)),
    db.select().from(staffMembers).where(and(eq(staffMembers.salonId, salon.id), eq(staffMembers.active, true))),
    db.select().from(chairs).where(and(eq(chairs.salonId, salon.id), eq(chairs.active, true))).orderBy(asc(chairs.sortOrder)),
  ]);

  // Aane wale 14 din ki chair-wise availability (ek hi query)
  const dates = mapDateRange(14);
  const allBookings = await db
    .select({ date: bookings.date, time: bookings.time, chairId: bookings.chairId, status: bookings.status })
    .from(bookings)
    .where(and(eq(bookings.salonId, salon.id), inArray(bookings.date, dates)));
  const activeSlots = slotsFor(salon.openTime, salon.closeTime);
  const availability = (dateISO: string): SlotAvailability[] => {
    const dayBookings = allBookings.filter((b) => b.date === dateISO && b.status !== "cancelled");
    return activeSlots.map((time) => {
      const takenChairs = new Set(dayBookings.filter((b) => b.time === time).map((b) => b.chairId));
      const free = chairsList.filter((c) => !takenChairs.has(c.id));
      return { time, freeChairs: free.length, chairNames: free.map((c) => c.name) };
    });
  };

  let persona = null;
  if (body.personaKey) {
    const rows = await db.select().from(customers).where(and(eq(customers.salonId, salon.id), eq(customers.personaKey, body.personaKey))).limit(1);
    persona = rows[0] ?? null;
  }

  const source = body.scenario === "missed-call" ? "missed-call" : body.scenario === "missed-message" ? "recovered" : "chat";
  let state: ChatState = { ...(body.state ?? idleState), source };
  const ctx = { salon, services: svcs, staff, persona, availability };

  let logged: string | undefined;
  let messages: OutMsg[];
  let voiceSummary: string | undefined;
  let action: "book" | "voice" | undefined;

  if (body.opening === "missed-call") {
    await db.insert(missedMessages).values({ salonId: salon.id, channel: "call", customerLabel: persona?.name ?? "Naya customer", snippet: "Missed call — abhi (demo)", status: "pending" });
    await db.insert(activityEvents).values({ salonId: salon.id, kind: "missed", detail: "Missed call detect hui — customer ko foran WhatsApp gaya" });
    logged = "missed-call";
    state = { ...state, step: "service" };
    messages = [
      {
        text: `Assalam o Alaikum! Aap ne ${salon.name} ko call ki thi — hum dusri booking par masroof thay, maaf kijiye. 📞→💬\nBooking chahiye? Main abhi kar deta hoon.`,
        options: ["Haan, booking karni hai", "Services & rates"],
      },
    ];
  } else {
    if (body.opening === "missed-message") {
      await db.insert(missedMessages).values({ salonId: salon.id, channel: "whatsapp", customerLabel: persona?.name ?? "Naya customer", snippet: message.slice(0, 90) || "Rates ka poocha", status: "pending" });
      await db.insert(activityEvents).values({ salonId: salon.id, kind: "missed", detail: `Missed WhatsApp (${persona?.name ?? "naya customer"}) — foran jawab gaya` });
      logged = "missed-message";
    }
    const result = runBrain(ctx, message, state);
    messages = result.messages;
    state = result.state;
    action = result.action;
    voiceSummary = result.voiceSummary;
  }

  if (action === "voice" && voiceSummary) {
    await db.insert(activityEvents).values({ salonId: salon.id, kind: "voice", detail: `🎤 Voice note summary (owner ko mili): ${voiceSummary}` });
  }

  let bookingRow = null;
  let conflict: { chairNames: string; alternatives: string[] } | null = null;

  if (action === "book") {
    const dateISO = state.dateISO ?? todayISO();
    const time = state.time ?? activeSlots[0] ?? "12:00 PM";
    const serviceName = state.serviceName ?? svcs[0]?.name ?? "Service";
    const customerName = state.customerName ?? "Guest";
    const phone = persona?.phoneMasked ?? maskTail(String(10 + Math.floor(Math.random() * 89)));
    const price = svcs.find((s) => s.name === serviceName)?.pricePkr ?? 0;

    // ── same chair + same time conflict guard ──────────────────────────────
    const dayBookings = await db
      .select({ chairId: bookings.chairId })
      .from(bookings)
      .where(and(eq(bookings.salonId, salon.id), eq(bookings.date, dateISO), eq(bookings.time, time), ne(bookings.status, "cancelled")));
    const taken = new Set(dayBookings.map((b) => b.chairId));
    let free = chairsList.filter((c) => !taken.has(c.id));
    if (state.staffName) {
      const preferred = free.filter((c) => staff.find((s) => s.id === c.staffId)?.name === state.staffName);
      if (preferred.length > 0) free = preferred;
    }
    const chair = free[0] ?? null;

    if (!chair) {
      const altTimes = availability(dateISO).filter((s) => s.freeChairs > 0).map((s) => s.time).slice(0, 5);
      conflict = { chairNames: "saari chairs", alternatives: altTimes };
      messages = [conflictMessage("saari chairs", altTimes)];
      state = { ...state, step: "time" };
      await db.insert(activityEvents).values({ salonId: salon.id, kind: "booking", detail: `Conflict: ${customerName} ne ${time} maanga — ${dateISO} par saari chairs booked hain` });
    } else {
      const [row] = await db
        .insert(bookings)
        .values({ salonId: salon.id, customerName, phoneMasked: phone, serviceName, staffName: state.staffName ?? null, chairId: chair.id, date: dateISO, time, status: "confirmed", source, pricePkr: price })
        .returning();
      bookingRow = row;

      const pending = await db
        .select()
        .from(missedMessages)
        .where(and(eq(missedMessages.salonId, salon.id), eq(missedMessages.status, "pending")))
        .orderBy(desc(missedMessages.createdAt))
        .limit(1);
      if (pending[0]) await db.update(missedMessages).set({ status: "recovered" }).where(eq(missedMessages.id, pending[0].id));

      await db.insert(activityEvents).values({
        salonId: salon.id,
        kind: source === "chat" ? "booking" : "recovered",
        detail: `${serviceName} — ${customerName}, ${dateISO} ${time} · ${chair.name}${source !== "chat" ? " (recovered ✓)" : ""}`,
      });
      await db.insert(activityEvents).values({ salonId: salon.id, kind: "reminder", detail: `Reminder scheduled — ${customerName} ko booking se 2 ghante pehle` });

      messages = [...messages, { text: confirmationText(ctx, { ...state, serviceName, customerName, time }, dateISO, chair.name) }];
      state = { ...idleState };
      void pkr;
    }
  }

  return Response.json({
    messages,
    state,
    booking: bookingRow,
    conflict,
    logged,
    voiceSummary,
    chairName: bookingRow?.chairId ? chairsList.find((c) => c.id === bookingRow.chairId)?.name ?? null : null,
  });
}