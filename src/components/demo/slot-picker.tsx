"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, X, Clock, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/components/ui";
import { prettyDate } from "@/lib/utils";

interface Slot { time: string; freeChairs: number; chairIdsFree: string[] }
interface Avail {
  date: string;
  slots: Slot[];
  services: { id: string; name: string; pricePkr: number }[];
  week: { date: string; count: number }[];
  closedDays: string[];
  openTime: string;
  closeTime: string;
}

const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Month grid — koi bhi tareekh chun sakte ho (past + band-din disabled) */
function MonthGrid({
  month,
  selected,
  closedDays,
  onPrev,
  onNext,
  onPick,
  canGoBack,
  busy,
}: {
  month: Date;
  selected: string;
  closedDays: string[];
  onPrev: () => void;
  onNext: () => void;
  onPick: (iso: string) => void;
  canGoBack: boolean;
  busy?: boolean;
}) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells: (string | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let d = 1; d <= days; d++) cells.push(String(d).padStart(2, "0"));

  const isoOf = (day: string) =>
    `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${day}`;
  const dayName = (iso: string) => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(iso + "T12:00:00").getDay()];

  return (
    <div className="rounded-xl border border-line bg-raised p-2.5">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={onPrev} disabled={!canGoBack} aria-label="Pichhla mahina" className="grid h-7 w-7 place-items-center rounded-md border border-line text-mut hover:text-ink disabled:opacity-40">‹</button>
        <p className="text-[11.5px] font-extrabold">{MONTHS_LONG[month.getMonth()]} {month.getFullYear()}</p>
        <button type="button" onClick={onNext} aria-label="Agla mahina" className="grid h-7 w-7 place-items-center rounded-md border border-line text-mut hover:text-ink">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[8.5px] font-extrabold uppercase tracking-wide text-mut">
        {DOW.map((d) => <span key={d}>{d.slice(0, 2)}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <span key={`e${i}`} />;
          const iso = isoOf(day);
          const isPast = new Date(iso + "T12:00:00") < today;
          const isClosed = closedDays.includes(dayName(iso));
          const disabled = isPast || isClosed;
          const isSelected = selected === iso;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled || busy}
              onClick={() => onPick(iso)}
              title={isClosed ? `${dayName(iso)} — band hai` : iso}
              aria-label={iso}
              className={cn(
                "aspect-square rounded-md text-[10.5px] font-bold transition-colors",
                isSelected ? "bg-brand text-white"
                  : disabled ? "cursor-not-allowed text-mut/40 line-through"
                    : "text-ink hover:bg-brand-soft hover:text-accent",
              )}
            >
              {Number(day)}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[8.5px] text-mut">Strike-through = band din · past dates disable</p>
    </div>
  );
}

type Step = "idle" | "service" | "date" | "time" | "name" | "confirm";

/**
 * Chat ke andar khud date/time chunne ka calendar.
 * Har pick asli customer message ban kar server brain se guzarta hai —
 * is liye availability, FULL slot aur conflict ka jawab wahi aata hai jo asli chat mein aata.
 */
export function SlotPicker({
  open,
  onClose,
  step,
  busy,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  step: Step;
  busy: boolean;
  onSend: (text: string) => void;
}) {
  const [date, setDate] = useState("");
  const [month, setMonth] = useState(() => new Date());
  const [avail, setAvail] = useState<Avail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      setLoading(true);
      const res = await fetch(`/api/availability${date ? `?date=${date}` : ""}`, { cache: "no-store" });
      if (res.ok) {
        const d: Avail = await res.json();
        setAvail(d);
        if (!date) {
          setDate(d.date);
          setMonth(new Date(d.date + "T12:00:00"));
        }
      }
      setLoading(false);
    })();
  }, [open, date]);

  const pickDate = useCallback((iso: string) => {
    setDate(iso);
    onSend(prettyDate(iso));
  }, [onSend]);

  if (!open) return null;

  const heading =
    step === "service"
      ? "Pehle service chunein"
      : step === "date"
        ? "Din chunein"
        : step === "time"
          ? "Slot chunein"
          : step === "name"
            ? "Ab naam chat mein likh dein"
            : "Booking confirm karein";

  return (
    <div className="border-t border-line bg-card px-3.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-mut">
          <CalendarDays size={12} className="text-accent" /> Khud chunein — {heading}
        </p>
        <button type="button" onClick={onClose} aria-label="Calendar band karein" className="grid h-7 w-7 place-items-center rounded-md border border-line text-mut hover:text-ink">
          <X size={13} />
        </button>
      </div>

      {loading && !avail && <div className="mt-2 h-16 animate-pulse rounded-lg bg-raised" />}

      {avail && (
        <div className="mt-2.5 grid gap-3">
          {(step === "idle" || step === "service") && (
            <div>
              <p className="label !mb-1.5">Service</p>
              <div className="flex flex-wrap gap-1.5">
                {avail.services.slice(0, 8).map((s) => (
                  <button key={s.id} type="button" disabled={busy} onClick={() => onSend(s.name)} className="rounded-full border border-line bg-raised px-2.5 py-1.5 text-[10.5px] font-bold transition-colors hover:border-brand hover:text-accent disabled:opacity-50">
                    {s.name} · {s.pricePkr.toLocaleString("en-PK")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(step === "idle" || step === "service" || step === "date" || step === "time") && (
            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
                <p className="label !mb-0">Din — poora calendar</p>
                <div className="flex flex-wrap gap-1">
                  {(avail.week ?? []).slice(0, 3).map((w) => (
                    <button key={w.date} type="button" disabled={busy} onClick={() => pickDate(w.date)} className={cn("rounded-md border px-2 py-1 text-[9.5px] font-bold transition-colors", date === w.date ? "border-brand bg-brand-soft text-accent" : "border-line bg-raised text-mut hover:text-ink")}>
                      {prettyDate(w.date)}
                    </button>
                  ))}
                </div>
              </div>
              <MonthGrid
                month={month}
                selected={date}
                closedDays={avail.closedDays ?? []}
                canGoBack
                busy={busy}
                onPrev={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                onNext={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                onPick={pickDate}
              />
            </div>
          )}

          {(step === "date" || step === "time" || step === "idle") && (
            <div>
              <p className="label !mb-1.5">{prettyDate(avail.date)} ke slots</p>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                {avail.slots.map((s) => {
                  const full = s.freeChairs === 0;
                  return (
                    <button
                      key={s.time}
                      type="button"
                      disabled={busy}
                      onClick={() => onSend(s.time)}
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-center transition-colors",
                        full ? "border-line bg-raised text-mut" : "border-line bg-raised hover:border-brand hover:text-accent",
                      )}
                    >
                      <span className="block text-[10.5px] font-extrabold">{s.time}</span>
                      <span className={cn("block text-[8px] font-bold", full ? "text-amber-400" : "text-accent")}>{full ? "FULL" : `${s.freeChairs} free`}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-[9.5px] text-mut">
                {fullSomewhere(avail) ? (
                  <><AlertTriangle size={10} className="text-amber-400" /> FULL slot par tap karein — assistant doosra slot suggest karega.</>
                ) : (
                  <><Check size={10} className="text-accent" /> Sab slots par chairs available hain.</>
                )}
              </p>
            </div>
          )}

          {step === "name" && (
            <p className="flex items-center gap-1.5 rounded-lg border border-line bg-raised px-2.5 py-2 text-[10.5px] text-mut">
              <Clock size={11} className="text-accent" /> Slot lock ho gaya — neeche type kar ke apna naam bhejein.
            </p>
          )}
          {step === "confirm" && (
            <p className="text-[10.5px] text-mut">Confirm karna ho to chat mein <b className="text-accent">Confirm ✓</b> dabayein.</p>
          )}
        </div>
      )}
    </div>
  );
}

function fullSomewhere(a: Avail) {
  return a.slots.some((s) => s.freeChairs === 0);
}
