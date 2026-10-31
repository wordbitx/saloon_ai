// Shared helpers — dates, slots, formatting (demo-safe, koi real data nahi)

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function todayISO(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Aaj se N din ke ISO dates (admin calendar + chat availability ke liye) */
export function mapDateRange(days: number, startOffset = 0): string[] {
  return Array.from({ length: days }, (_, i) => todayISO(startOffset + i));
}

export function dayName(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return WEEKDAYS[d.getDay()];
}

export function prettyDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/** Next N open days, closed days skip hote hain. Label: "Aaj (Fri 20 Jun)" */
export function openDayOptions(openTime: string, closeTime: string, closedDays: string[], count = 3) {
  void openTime;
  void closeTime;
  const out: { label: string; iso: string }[] = [];
  for (let i = 0; out.length < count && i < 14; i++) {
    const iso = todayISO(i);
    if (closedDays.includes(dayName(iso))) continue;
    const rel = i === 0 ? "Aaj" : i === 1 ? "Kal" : "Parson";
    out.push({ label: `${rel} (${prettyDate(iso)})`, iso });
  }
  return out;
}

function to12h(hour: number, min: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(min).padStart(2, "0")} ${ampm}`;
}

/** Salon ke open/close time se demo slots */
export function slotsFor(openTime: string, closeTime: string): string[] {
  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  const start = (isNaN(oh) ? 11 : oh) * 60 + (isNaN(om) ? 0 : om);
  const end = (isNaN(ch) ? 20 : ch) * 60 + (isNaN(cm) ? 0 : cm);
  const out: string[] = [];
  for (let t = start + 60; t <= end - 60 && out.length < 5; t += 90) {
    out.push(to12h(Math.floor(t / 60), t % 60));
  }
  if (out.length === 0) out.push(to12h(Math.floor((start + end) / 120), Math.floor(((start + end) / 2) % 60)));
  return out;
}

export function fmtTime12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h)) return t;
  return to12h(h, isNaN(m) ? 0 : m);
}

export function pkr(n: number): string {
  return "Rs " + n.toLocaleString("en-PK");
}

/** Demo mein kabhi poora number store/show nahi hota */
export function maskTail(tail: string): string {
  return `+92 3•• ••••${tail}`;
}

export function timeAgo(d: Date | string): string {
  const t = typeof d === "string" ? new Date(d) : d;
  const s = Math.max(1, Math.floor((Date.now() - t.getTime()) / 1000));
  if (s < 60) return `${s}s pehle`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m pehle`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h pehle`;
  return `${Math.floor(h / 24)}d pehle`;
}