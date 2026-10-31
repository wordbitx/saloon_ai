import type { salons, services, staffMembers, customers } from "@/db/schema";
import { openDayOptions, slotsFor, pkr, prettyDate, fmtTime12, dayName } from "@/lib/utils";

type Salon = typeof salons.$inferSelect;
type Service = typeof services.$inferSelect;
type Staff = typeof staffMembers.$inferSelect;
type Customer = typeof customers.$inferSelect;

export interface ChatState {
  step: "idle" | "service" | "date" | "time" | "name" | "confirm";
  serviceName?: string | null;
  staffName?: string | null;
  dateISO?: string | null;
  dateLabel?: string | null;
  time?: string | null;
  customerName?: string | null;
  repeatOffer?: string | null;
  source?: string;
}

export const idleState: ChatState = { step: "idle" };

export interface OutMsg {
  text: string;
  options?: string[];
}

export interface BrainResult {
  messages: OutMsg[];
  state: ChatState;
  action?: "book" | "voice";
  voiceSummary?: string;
}

export interface SlotAvailability {
  time: string;
  freeChairs: number;
  chairNames: string[];
}

export interface BrainCtx {
  salon: Salon;
  services: Service[];
  staff: Staff[];
  persona?: Customer | null;
  /** chair-aware: har date ke slots + khaali chairs */
  availability: (dateISO: string) => SlotAvailability[];
}

const norm = (s: string) => s.toLowerCase().trim();

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Chat/calendar se date nikaalna: "Sat 31 Oct", "31 oct", "31/10", "2026-10-31" */
export function parseDateFromMessage(msg: string, reference = new Date()): string | null {
  const m = norm(msg);
  const iso = m.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = m.match(/\b(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\b/);
  if (dmy) {
    const day = Number(dmy[1]);
    const mon = Number(dmy[2]);
    if (day >= 1 && day <= 31 && mon >= 1 && mon <= 12) return stamp(reference, day, mon - 1);
  }
  const dmon = m.match(/\b(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/);
  if (dmon) {
    const day = Number(dmon[1]);
    const mon = MONTHS.indexOf(dmon[2]);
    if (day >= 1 && day <= 31 && mon >= 0) return stamp(reference, day, mon);
  }
  const mond = m.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(\d{1,2})\b/);
  if (mond) {
    const mon = MONTHS.indexOf(mond[1]);
    const day = Number(mond[2]);
    if (day >= 1 && day <= 31 && mon >= 0) return stamp(reference, day, mon);
  }
  return null;
}

function stamp(reference: Date, day: number, monthIndex: number): string {
  const refDay = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  let candidate = new Date(reference.getFullYear(), monthIndex, day, 12);
  // Agar selected date aaj se pehle ho (year rollover) to agle saal le jao.
  if (candidate < refDay) candidate = new Date(reference.getFullYear() + 1, monthIndex, day, 12);
  const y = candidate.getFullYear();
  const m = String(candidate.getMonth() + 1).padStart(2, "0");
  const d = String(candidate.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function conflictMessage(chairName: string, options: string[]): OutMsg {
  return {
    text: `Yeh slot already booked hai (${chairName || "chair"}). 🔒\nIs slot ke liye humari team se WhatsApp par rabta karein — warna neeche se koi doosra slot book kar lein:`,
    options,
  };
}

function findService(msg: string, list: Service[]): Service | undefined {
  const m = norm(msg);
  return list.find((s) => m.includes(s.name.toLowerCase())) ??
    list.find((s) => s.name.toLowerCase().split(" ").some((w) => w.length > 3 && m.includes(w)));
}

function servicesText(list: Service[]): string {
  return list.slice(0, 6).map((s) => `• ${s.name} — ${pkr(s.pricePkr)}`).join("\n");
}

function dateOpts(ctx: BrainCtx) {
  return openDayOptions(ctx.salon.openTime, ctx.salon.closeTime, ctx.salon.closedDays);
}

function freeAt(ctx: BrainCtx, dateISO: string, time: string): SlotAvailability | undefined {
  return ctx.availability(dateISO).find((s) => norm(s.time) === norm(time));
}

function freeOptions(ctx: BrainCtx, dateISO: string): string[] {
  return ctx.availability(dateISO).filter((s) => s.freeChairs > 0).map((s) => s.time).slice(0, 5);
}

function askDate(ctx: BrainCtx, state: ChatState, lead: string): BrainResult {
  const opts = dateOpts(ctx);
  return { messages: [{ text: lead, options: opts.map((o) => o.label) }], state: { ...state, step: "date" } };
}

function askTime(ctx: BrainCtx, state: ChatState, lead?: string): BrainResult {
  const dateISO = state.dateISO ?? dateOpts(ctx)[0]?.iso ?? "";
  const free = ctx.availability(dateISO).filter((s) => s.freeChairs > 0);
  if (free.length === 0) {
    return {
      messages: [{
        text: `${state.dateLabel ?? "Us din"} ke saare slots booked hain. 🔒\nIs din ke liye WhatsApp par rabta karein, ya koi doosra din chun lein:`,
        options: dateOpts(ctx).map((o) => o.label),
      }],
      state: { ...state, step: "date" },
    };
  }
  const who = state.staffName ? ` ${state.staffName} ke paas yeh slots khaali hain:` : " Yeh slots available hain (chair-wise check ho chuka):";
  return {
    messages: [{ text: `${lead ?? `${state.dateLabel ?? "Us din"} ke liye`}${who}`, options: free.map((s) => s.time) }],
    state: { ...state, step: "time" },
  };
}

function confirmSummary(ctx: BrainCtx, state: ChatState): BrainResult {
  const lines = [
    "Confirm kar dun? 🙂",
    `• ${state.serviceName}`,
    `• ${state.dateLabel} — ${state.time}`,
    state.staffName ? `• Stylist: ${state.staffName}` : "",
    `• Naam: ${state.customerName}`,
    `📍 ${ctx.salon.name}, ${ctx.salon.area}`,
    "Reminder booking se 2 ghante pehle isi chat par aa jayega.",
  ].filter(Boolean);
  return { messages: [{ text: lines.join("\n"), options: ["Confirm ✓", "Rehne dein"] }], state: { ...state, step: "confirm" } };
}

const HOME_OPTIONS = ["Services & rates", "Booking karein", "Timing"];

export function runBrain(ctx: BrainCtx, rawMsg: string, prev: ChatState): BrainResult {
  const msg = norm(rawMsg);
  const state: ChatState = { ...prev };
  const { salon, services: list, staff, persona } = ctx;

  if (["cancel", "rehne", "reset", "stop", "nahi chahiye"].some((w) => msg.includes(w)) && state.step !== "name") {
    return { messages: [{ text: "Koi baat nahi! Jab chahein book kar lein — main yahin hoon. 🙂", options: HOME_OPTIONS }], state: { ...idleState, source: state.source } };
  }

  // ── booking state machine ───────────────────────────────────────────────
  if (state.step === "service") {
    if ((msg.includes("haan") || msg.includes("wohi") || msg.includes("yes")) && state.repeatOffer) {
      const svc = list.find((s) => s.name === state.repeatOffer) ?? list[0];
      if (svc) return askDate(ctx, { ...state, serviceName: svc.name, repeatOffer: null }, `${svc.name} (${pkr(svc.pricePkr)}) — behtareen! Kis din aana chahengi?`);
    }
    if (msg.includes("list") || msg.includes("aur") || msg.includes("services") || msg.includes("menu") || msg.includes("book")) {
      return { messages: [{ text: `Yeh rahi hamari services:\n${servicesText(list)}\nKonsi service chahiye?`, options: list.slice(0, 4).map((s) => s.name) }], state };
    }
    const svc = findService(msg, list);
    if (svc) {
      const chosen = { ...state, serviceName: svc.name, repeatOffer: null };
      // Calendar se date pehle le aai ho to seedha slot tak jao
      if (chosen.dateISO && chosen.dateLabel) return askTime(ctx, chosen);
      return askDate(ctx, chosen, `${svc.name} (${pkr(svc.pricePkr)}, takreeban ${svc.durationMins} min) — kis din aana chahengi?`);
    }
    // Calendar se pehle tareekh aai ho to yaad rakh kar service maango
    const pickedDate = parseDateFromMessage(msg);
    if (pickedDate) {
      if (salon.closedDays.includes(dayName(pickedDate))) {
        return {
          messages: [{ text: `${prettyDate(pickedDate)} ko hum band rehte hain 🙏 Koi doosra din, aur service bata dein:`, options: list.slice(0, 4).map((s) => s.name) }],
          state,
        };
      }
      return {
        messages: [{ text: `Tareekh note kar li: ${prettyDate(pickedDate)} ✓ Ab service bata dein:`, options: list.slice(0, 4).map((s) => s.name) }],
        state: { ...state, dateISO: pickedDate, dateLabel: prettyDate(pickedDate) },
      };
    }
    return { messages: [{ text: "Service list mein se chun lein 🙂", options: list.slice(0, 4).map((s) => s.name) }], state };
  }

  if (state.step === "date") {
    const opts = dateOpts(ctx);
    const pick = opts.find((o) => msg === norm(o.label) || msg.startsWith(norm(o.label).slice(0, 3)));
    if (pick) return askTime(ctx, { ...state, dateISO: pick.iso, dateLabel: pick.label });
    const dayWords: Record<string, number> = { aaj: 0, today: 0, kal: 1, tomorrow: 1, parson: 2 };
    const word = Object.keys(dayWords).find((w) => msg.includes(w));
    if (word) {
      const opt = opts.find((o) => o.label.toLowerCase().startsWith(word));
      if (opt) return askTime(ctx, { ...state, dateISO: opt.iso, dateLabel: opt.label });
    }
    // Calendar se koi bhi date: "Sat 31 Oct", "31/10", "2026-10-31", "31 oct"
    const parsed = parseDateFromMessage(msg);
    if (parsed) {
      if (salon.closedDays.includes(dayName(parsed))) {
        return {
          messages: [{
            text: `${dayName(parsed)} ko hum band rehte hain. 🙏 Doosra din chun lein:`,
            options: opts.map((o) => o.label),
          }],
          state,
        };
      }
      const iso = parsed;
      const rel = iso === opts[0]?.iso ? "Aaj" : iso === opts[1]?.iso ? "Kal" : prettyDate(iso);
      return askTime(ctx, { ...state, dateISO: iso, dateLabel: rel });
    }
    return { messages: [{ text: "In mein se din chun lein:", options: opts.map((o) => o.label) }], state };
  }

  if (state.step === "time") {
    const baseISO = state.dateISO ?? dateOpts(ctx)[0]?.iso ?? "";
    const baseAvail = ctx.availability(baseISO);
    const exactPick = baseAvail.find((s) => norm(s.time) === msg);
    // Calendar se din badalna (slot step par bhi) — date, fuzzy time match se pehle
    const dateChange = exactPick ? null : parseDateFromMessage(msg);
    if (dateChange && dateChange !== baseISO) {
      if (salon.closedDays.includes(dayName(dateChange))) {
        return {
          messages: [{ text: `${prettyDate(dateChange)} ko hum band rehte hain 🙏 Doosra din chun lein:`, options: baseAvail.filter((s) => s.freeChairs > 0).map((s) => s.time) }],
          state,
        };
      }
      return askTime(ctx, { ...state, dateISO: dateChange, dateLabel: prettyDate(dateChange), time: null }, `Naya din note kar liya — ${prettyDate(dateChange)} ke free slots:`);
    }
    const pick = exactPick ??
      (/\d/.test(msg) ? baseAvail.find((s) => msg.includes(s.time.split(":")[0])) : undefined);
    if (pick) {
      if (pick.freeChairs === 0) {
        return { messages: [conflictMessage(pick.chairNames.slice(0, 2).join(", "), freeOptions(ctx, baseISO))], state };
      }
      const suggest = persona ? [persona.name] : undefined;
      return { messages: [{ text: `${pick.time} khaali hai ✓ Aap ka naam bata dein?`, options: suggest }], state: { ...state, time: pick.time, step: "name" } };
    }
    return askTime(ctx, state, "Available slots:");
  }

  if (state.step === "name") {
    const clean = rawMsg.trim().replace(/[^a-zA-Z\u00C0-\u024F ]/g, "").slice(0, 30);
    if (clean.length >= 2) {
      const name = clean.charAt(0).toUpperCase() + clean.slice(1);
      return confirmSummary(ctx, { ...state, customerName: name });
    }
    return { messages: [{ text: "Apna naam likh dein (e.g. Ayesha) 🙂" }], state };
  }

  if (state.step === "confirm") {
    if (msg.includes("confirm") || msg.includes("haan") || msg.includes("yes")) {
      return { messages: [], state, action: "book" };
    }
    return { messages: [{ text: "Theek hai, booking hold kar di. Jab chahein dobara shuru karein.", options: HOME_OPTIONS }], state: { ...idleState, source: state.source } };
  }

  // ── idle intents ─────────────────────────────────────────────────────────
  if (msg.includes("🎤") || msg.includes("[voice")) {
    const bridal = list.find((s) => s.category === "bridal");
    const summary = "Customer ne bridal makeup ke package, rate aur timing ke baare mein poocha hai.";
    if (bridal) {
      return {
        messages: [{ text: `Ji, aap ka voice note sun liya gaya 🎧 Baat samajh aa gayi: aap bridal makeup ke baare mein pooch rahi hain.\n${bridal.name} — ${pkr(bridal.pricePkr)}. Kis din booking karun?`, options: dateOpts(ctx).map((o) => o.label) }],
        state: { ...state, step: "date", serviceName: bridal.name },
        action: "voice",
        voiceSummary: summary,
      };
    }
    return { messages: [{ text: "Ji, aap ka voice note samajh liya gaya 🎧 Rates ya booking — kya chahiye?", options: HOME_OPTIONS }], state, action: "voice", voiceSummary: summary };
  }

  const isGreeting = ["salam", "assalam", "hello", "hey", "hi"].some((w) => msg.includes(w));
  if (persona && salon.repeatEnabled && (isGreeting || msg.includes("booking") || msg.includes("phir"))) {
    return {
      messages: [{ text: `Walaikum Assalam ${persona.name}! 😊 Khush aamdeed — last time aap ne ${persona.lastService} karwaya tha. Is baar bhi wohi?`, options: ["Haan, wohi service", "Kuch aur dekhna hai"] }],
      state: { ...state, step: "service", repeatOffer: persona.lastService },
    };
  }

  if (msg.includes("bridal") || msg.includes("dulhan") || msg.includes("shadi")) {
    const bridal = list.find((s) => s.category === "bridal");
    const addons = list.filter((s) => s.category === "addon");
    if (bridal) {
      const upsell = addons.length > 0 ? `\nMashwara: ${addons.map((a) => `${a.name} (${pkr(a.pricePkr)})`).join(" ya ")} bhi add kar sakti hain — shaadi se pehle trial behtar rehta hai.` : "";
      return askDate(ctx, { ...state, serviceName: bridal.name }, `Mubarak ho! 💍 ${bridal.name} — ${pkr(bridal.pricePkr)}.${upsell}\nKis din ka slot dekhun?`);
    }
    return { messages: [{ text: `Filhal bridal package list mein nahi hai — yeh services dekhein:\n${servicesText(list)}`, options: list.slice(0, 4).map((s) => s.name) }], state: { ...state, step: "service" } };
  }

  const staffHit = staff.find((s) => msg.includes(s.name.toLowerCase()));
  if (staffHit) {
    return {
      messages: [{ text: `Ji bilkul! ${staffHit.name} (${staffHit.specialty}) ke sath booking karte hain — unki regular customers ko yehi pasand hai. 🙂 Konsi service chahiye?`, options: list.slice(0, 4).map((s) => s.name) }],
      state: { ...state, step: "service", staffName: staffHit.name },
    };
  }

  // Idle par bhi calendar se date aa sakti hai — yaad rakh kar service maango
  // (Rate/price wale sawal date se hijack NAHI honay chahiye)
  const looksLikePriceQuery = ["rate", "price", "kitn", "paisa", "cost"].some((w) => msg.includes(w));
  if (state.step === "idle" && !looksLikePriceQuery && !msg.includes("?")) {
    const idleDate = parseDateFromMessage(msg);
    if (idleDate) {
      if (salon.closedDays.includes(dayName(idleDate))) {
        return {
          messages: [{ text: `${prettyDate(idleDate)} ko hum band rehte hain 🙏 Koi doosra din batayein:`, options: dateOpts(ctx).map((o) => o.label) }],
          state,
        };
      }
      return {
        messages: [{ text: `Tareekh note kar li: ${prettyDate(idleDate)} ✓ Ab service bata dein:`, options: list.slice(0, 4).map((s) => s.name) }],
        state: { ...state, step: "service", dateISO: idleDate, dateLabel: prettyDate(idleDate) },
      };
    }
  }

  const svcHit = findService(msg, list);
  if (svcHit && (msg.includes("rate") || msg.includes("price") || msg.includes("kitn") || msg.includes("kitne") || msg.includes("paisa") || msg.includes("cost") || msg.includes("?") || msg === norm(svcHit.name))) {
    return {
      messages: [{ text: `${svcHit.name} — ${pkr(svcHit.pricePkr)} (takreeban ${svcHit.durationMins} min). Book kar dun?`, options: [`Haan, ${svcHit.name} book karein`, "Services list"] }],
      state: { ...state, step: "service", repeatOffer: svcHit.name },
    };
  }

  if (msg.includes("service") || msg.includes("rate") || msg.includes("menu") || msg.includes("list") || msg.includes("price")) {
    return { messages: [{ text: `Yeh rahi hamari services (aaj ke rates):\n${servicesText(list)}\nKonsi book karun?`, options: list.slice(0, 4).map((s) => s.name) }], state: { ...state, step: "service" } };
  }

  if (msg.includes("time") || msg.includes("timing") || msg.includes("khul") || msg.includes("band") || msg.includes("open") || msg.includes("close") || msg.includes("hours")) {
    const closed = salon.closedDays.length > 0 ? ` ${salon.closedDays.join(", ")} band rehta hai.` : " Hafte ke saaton din khule hain.";
    return {
      messages: [{ text: `${salon.name} roz ${fmtTime12(salon.openTime)} se ${fmtTime12(salon.closeTime)} tak khula hai.${closed} Booking kar dun?`, options: ["Booking karein", "Services & rates"] }],
      state,
    };
  }

  if (msg.includes("book") || msg.includes("appointment") || (msg.startsWith("haan") && state.repeatOffer)) {
    if (state.repeatOffer && msg.startsWith("haan")) {
      const svc = list.find((s) => s.name === state.repeatOffer) ?? list[0];
      if (svc) return askDate(ctx, { ...state, serviceName: svc.name, repeatOffer: null }, `${svc.name} — kis din?`);
    }
    return { messages: [{ text: "Zaroor! Konsi service chahiye?", options: list.slice(0, 4).map((s) => s.name) }], state: { ...state, step: "service" } };
  }

  if (isGreeting) {
    return { messages: [{ text: salon.greeting, options: HOME_OPTIONS }], state };
  }

  return {
    messages: [{ text: `Ji, main ${salon.name} ka booking assistant hoon (demo). Rates, timing ya booking — kya chahiye?`, options: HOME_OPTIONS }],
    state,
  };
}

export function confirmationText(ctx: BrainCtx, state: ChatState, dateISO: string, chairName?: string | null): string {
  const first = (state.customerName ?? "Guest").split(" ")[0];
  return `Ho gaya ✓ ${state.serviceName} — ${prettyDate(dateISO)} (${dayName(dateISO)}) ${state.time}${state.staffName ? `, ${state.staffName} ke sath` : ""}${chairName ? ` · ${chairName}` : ""}.\n📍 ${ctx.salon.name}, ${ctx.salon.area}\nShukriya ${first}! Confirmation aur reminder isi chat par aayega. 💙`;
}