"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  PhoneMissed,
  UserCheck,
  CalendarX,
  Star,
  Mic,
  Crown,
  Users,
  Send,
  CalendarDays,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  Settings2,
  Activity,
  Lock,
} from "lucide-react";
import {RippleButton, Switch, CountUp, cn} from "@/components/ui";
import { SlotPicker } from "@/components/demo/slot-picker";
import type { ChatState } from "@/lib/chat-brain";
import { timeAgo } from "@/lib/utils";

interface ChatMsg {
  id: number;
  from: "cust" | "bot" | "owner" | "system";
  text: string;
  options?: string[];
}

interface SummaryData {
  counters: { recovered: number; missed: number; pending: number; reviews: number; waitlist: number };
  events: { id: string; kind: string; detail: string; createdAt: string }[];
  bookings: { id: string; status: string; customerName: string; serviceName: string; date: string; time: string }[];
  salon: { name: string; area: string };
}

interface SettingsData {
  salon: { name: string; area: string; greeting: string };
}

interface ChatResponse {
  messages: { text: string; options?: string[] }[];
  state: ChatState;
  booking?: { id: string } | null;
  logged?: string;
  voiceSummary?: string;
}

type Step = { msg: string } | { pick: number };

const SCENARIOS: {
  key: string;
  icon: typeof MessageCircle;
  title: string;
  desc: string;
  persona?: string;
  opening?: "missed-message" | "missed-call";
  script?: Step[];
}[] = [
  {
    key: "missed-message",
    icon: MessageCircle,
    title: "Missed message → booking",
    desc: "Raat ka message, foran jawab, booking tak",
    opening: "missed-message",
    script: [{ msg: "Assalam o Alaikum, facial ka rate kya hai?" }, { pick: 0 }, { pick: 0 }, { pick: 1 }, { msg: "Mahnoor" }, { pick: 0 }],
  },
  {
    key: "missed-call",
    icon: PhoneMissed,
    title: "Missed call → WhatsApp",
    desc: "Aik click — poori kahani, booking ban jati hai",
    opening: "missed-call",
    script: [{ msg: "Haan, booking karni hai" }, { pick: 1 }, { pick: 0 }, { pick: 0 }, { msg: "Zainab" }, { pick: 0 }],
  },
  {
    key: "repeat",
    icon: UserCheck,
    title: "Repeat customer pehchan",
    desc: "Naam se pehchan + last service yaad",
    persona: "ayesha",
    script: [{ msg: "Assalam o Alaikum!" }, { msg: "Haan, wohi service" }, { pick: 1 }, { pick: 2 }, { pick: 0 }, { pick: 0 }],
  },
  {
    key: "conflict",
    icon: Lock,
    title: "Same chair double-booking",
    desc: "Conflict → WhatsApp par rabta karne ka mashwara",
  },
  {
    key: "cancel",
    icon: CalendarX,
    title: "Cancellation → waitlist",
    desc: "Khaali slot foran waitlist ko offer",
  },
  {
    key: "review",
    icon: Star,
    title: "Google review request",
    desc: "Service ke baad review link + counter",
  },
  {
    key: "voice",
    icon: Mic,
    title: "Voice-note summary",
    desc: "Owner ko text summary, customer ko jawab",
    script: [{ msg: "🎤 Voice note (0:12)" }, { pick: 0 }, { pick: 1 }, { msg: "Hira" }, { pick: 0 }],
  },
  {
    key: "bridal",
    icon: Crown,
    title: "Bridal / package upsell",
    desc: "Bridal booking + mehndi/trial mashwara",
    script: [{ msg: "Bridal makeup ka package chahiye" }, { pick: 0 }, { pick: 0 }, { msg: "Momina" }, { pick: 0 }],
  },
  {
    key: "staff",
    icon: Users,
    title: "Staff-wise booking",
    desc: "'Hina se hi booking chahiye'",
    script: [{ msg: "Hina se hi booking chahiye" }, { pick: 0 }, { pick: 2 }, { pick: 1 }, { msg: "Rida" }, { pick: 0 }],
  },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function DemoPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [ownerMode, setOwnerMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const idRef = useRef(1);
  const stateRef = useRef<ChatState>({ step: "idle" });
  const personaRef = useRef<string | undefined>(undefined);
  const scenarioRef = useRef<string | undefined>(undefined);
  const lastOptionsRef = useRef<string[] | undefined>(undefined);
  const ownerModeRef = useRef(false);
  const [chatStep, setChatStep] = useState<ChatState["step"]>("idle");
  const [pickerOpen, setPickerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((t: string) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const push = useCallback((m: Omit<ChatMsg, "id">) => {
    setMessages((prev) => [...prev, { ...m, id: idRef.current++ }]);
  }, []);

  const refreshSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/summary", { cache: "no-store" });
      if (res.ok) setSummary(await res.json());
    } catch {
      /* offline demo tolerance */
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (res.ok) {
        const data: SettingsData = await res.json();
        setSettings(data);
        return data;
      }
    } catch {
      /* ignore */
    }
    return null;
  }, []);

  useEffect(() => {
    (async () => {
      const data = await loadSettings();
      await refreshSummary();
      if (data) {
        push({ from: "bot", text: data.salon.greeting, options: ["Services & rates", "Booking karein", "Timing"] });
      } else {
        push({ from: "system", text: "Demo data load nahi hua — page refresh karein." });
      }
    })();
    const onFocus = () => {
      void loadSettings();
      void refreshSummary();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadSettings, refreshSummary, push]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const sendCustomer = useCallback(
    async (text: string, opts?: { opening?: "missed-message" | "missed-call"; hideCustomer?: boolean }) => {
      if (!opts?.hideCustomer && text) push({ from: "cust", text });
      setTyping(true);
      let data: ChatResponse | null = null;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            state: stateRef.current,
            personaKey: personaRef.current,
            scenario: scenarioRef.current,
            opening: opts?.opening,
          }),
        });
        if (res.ok) data = await res.json();
      } catch {
        /* ignore */
      }
      await delay(750);
      setTyping(false);
      if (!data) {
        push({ from: "system", text: "Response nahi aaya — dobara koshish karein." });
        return null;
      }
      for (const m of data.messages) {
        push({ from: "bot", text: m.text, options: m.options });
        lastOptionsRef.current = m.options;
        if (data.messages.length > 1) await delay(420);
      }
      stateRef.current = data.state;
      setChatStep(data.state.step);
      if (data.voiceSummary) {
        push({ from: "system", text: `🎤 Owner ko voice-note summary mili: "${data.voiceSummary}" — assistant khud voice mein baat nahi karta.` });
      }
      if (data.logged) {
        push({
          from: "system",
          text: data.logged === "missed-call" ? "📞 Missed call log hui → assistant ne khud WhatsApp kiya (simulated)." : "⚡ Missed message log hua → foran jawab gaya (simulated).",
        });
      }
      if (data.booking) {
        showToast("Booking dashboard mein add ho gayi ✓");
        setPickerOpen(false); // booking complete — calendar band, naya booking calendar icon se
      }
      if (data.booking || data.logged || data.voiceSummary) void refreshSummary();
      return data;
    },
    [push, refreshSummary, showToast],
  );

  const runScenario = useCallback(
    async (key: string) => {
      if (busy) return;
      const sc = SCENARIOS.find((s) => s.key === key);
      if (!sc) return;
      setBusy(true);
      setActiveScenario(key);
      if (ownerModeRef.current) {
        ownerModeRef.current = false;
        setOwnerMode(false);
        push({ from: "system", text: "Scenario ke liye owner override off — assistant wapas active." });
      }
      personaRef.current = sc.persona;
      scenarioRef.current = sc.key;
      stateRef.current = { step: "idle" };
      push({ from: "system", text: `— Scenario: ${sc.title} —` });
      await delay(450);

      try {
        if (key === "conflict") {
          const avRes = await fetch("/api/availability", { cache: "no-store" });
          const av = await avRes.json();
          const busy = (av.dayBookings ?? []).find((b: { status: string }) => b.status !== "cancelled");
          if (!busy) {
            push({ from: "system", text: "Conflict dikhane ke liye pehle koi booking banayein." });
          } else {
            push({ from: "cust", text: `${busy.time} par ${busy.serviceName} book karni hai` });
            setTyping(true);
            const res = await fetch("/api/bookings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customerName: "Sana",
                serviceName: av.services?.[0]?.name ?? "Facial",
                date: av.date,
                time: busy.time,
                chairId: busy.chairId,
              }),
            });
            const d = await res.json().catch(() => ({}));
            await delay(850);
            setTyping(false);
            if (res.status === 409) {
              push({ from: "bot", text: `${d.message}\n\nWarna yeh slots free hain — chun lein:` , options: (av.slots ?? []).filter((s: { freeChairs: number }) => s.freeChairs > 0).slice(0, 4).map((s: { time: string }) => s.time) });
              push({ from: "system", text: "🔒 Chair conflict guard ne doosri booking rok di — koi double-booking nahi hui." });
              showToast("Same chair double-booking block ✓");
            } else {
              push({ from: "system", text: "Us waqt chair free thi — booking ho gayi (dobara try karein)." });
            }
            void refreshSummary();
          }
        } else if (key === "cancel") {
          const res = await fetch("/api/summary", { cache: "no-store" });
          const data: SummaryData = await res.json();
          const target = data.bookings.find((b) => b.status === "confirmed");
          if (!target) {
            push({ from: "system", text: "Koi confirmed booking nahi mili — pehle 'Missed message → booking' scenario chalayein." });
          } else {
            push({ from: "cust", text: `Meri ${target.serviceName} wali booking cancel karni hai (${target.time})` });
            setTyping(true);
            const cr = await fetch(`/api/bookings/${target.id}/cancel`, { method: "POST" });
            const cd = await cr.json();
            await delay(850);
            setTyping(false);
            for (const m of cd.messages as string[]) {
              push({ from: "bot", text: m });
              await delay(500);
            }
            showToast("Cancellation + waitlist backfill — dashboard update ✓");
            void refreshSummary();
          }
        } else if (key === "review") {
          push({ from: "cust", text: "Service ho gayi, bohat shukriya! 💚" });
          setTyping(true);
          const rr = await fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
          const rd = await rr.json();
          await delay(850);
          setTyping(false);
          push({ from: "bot", text: rd.message });
          showToast(`Review request gayi — counter ${rd.count} ✓`);
          void refreshSummary();
        } else {
          if (sc.opening === "missed-call") {
            push({ from: "system", text: "📞 Customer ki call miss hui (peak hour) — assistant khud WhatsApp karta hai:" });
            await sendCustomer("", { opening: "missed-call", hideCustomer: true });
            await delay(600);
          }
          for (let i = 0; i < (sc.script?.length ?? 0); i++) {
            const step = sc.script![i];
            if ("msg" in step) {
              await sendCustomer(step.msg, i === 0 && sc.opening === "missed-message" ? { opening: "missed-message" } : undefined);
            } else {
              const options = lastOptionsRef.current;
              const pickText = options && options.length > 0 ? options[Math.min(step.pick, options.length - 1)] : "Ji";
              await sendCustomer(pickText);
            }
            await delay(600);
          }
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, push, refreshSummary, sendCustomer, showToast],
  );

  const submitInput = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    if (ownerModeRef.current) {
      push({ from: "owner", text });
      return;
    }
    setBusy(true);
    try {
      await sendCustomer(text);
    } finally {
      setBusy(false);
    }
  }, [input, busy, push, sendCustomer]);

  const clickOption = useCallback(
    async (opt: string) => {
      if (busy || ownerModeRef.current) return;
      setBusy(true);
      try {
        await sendCustomer(opt);
      } finally {
        setBusy(false);
      }
    },
    [busy, sendCustomer],
  );

  const toggleOwner = useCallback(
    (v: boolean) => {
      ownerModeRef.current = v;
      setOwnerMode(v);
      push({
        from: "system",
        text: v
          ? " Owner override ON — assistant peeche hat gaya. Ab owner ke replies jayenge (har reply owner ko nazar aata hai)."
          : "Assistant wapas active ✓",
      });
    },
    [push],
  );

  const resetDemo = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const resetRes = await fetch("/api/demo/reset", { method: "POST" });
      if (!resetRes.ok) {
        showToast("Demo reset admin-only hai — /admin par login karein (PIN 2468).");
        return;
      }
      stateRef.current = { step: "idle" };
      setChatStep("idle");
      setPickerOpen(false);
      personaRef.current = undefined;
      scenarioRef.current = undefined;
      lastOptionsRef.current = undefined;
      setActiveScenario(null);
      const data = await loadSettings();
      setMessages([]);
      if (data) push({ from: "bot", text: data.salon.greeting, options: ["Services & rates", "Booking karein", "Timing"] });
      await refreshSummary();
      showToast("Demo reset ho gaya ✓");
    } finally {
      setBusy(false);
    }
  }, [busy, loadSettings, push, refreshSummary, showToast]);

  // Suggestion chips sirf aakhri bot message se — warna booking confirm hone ke
  // baad bhi purane time/name/confirm chips nazar aate rehte the (bug).
  const lastMsg = messages[messages.length - 1];
  const lastBotWithOptions = lastMsg?.from === "bot" && lastMsg.options?.length ? lastMsg : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold sm:text-3xl">Demo Chat</h1>
          </div>
          <p className="mt-1 text-[13px] text-mut">
            {settings ? `${settings.salon.name} — ${settings.salon.area}` : "Salon load ho raha hai…"} · Simulated assistant, koi live WhatsApp nahi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings" className="btn-ghost !px-3 !py-2 text-xs">
            <Settings2 size={13} /> Settings badlein
          </Link>
          <RippleButton variant="ghost" className="!px-3 !py-2 text-xs" onClick={resetDemo} disabled={busy}>
            <RotateCcw size={13} /> Demo reset
          </RippleButton>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)_290px]">
        {/* ── Scenarios ─────────────────────────────────────────────────── */}
        <div className="card p-3 lg:self-start">
          <p className="px-1 pb-2 text-[10.5px] font-extrabold uppercase tracking-wider text-mut">Scenarios — aik click mein</p>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {SCENARIOS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  type="button"
                  disabled={busy}
                  onClick={() => runScenario(s.key)}
                  className={cn(
                    "flex min-w-[220px] items-start gap-2.5 rounded-lg border p-3 text-left transition-colors lg:min-w-0",
                    activeScenario === s.key ? "border-brand bg-brand-soft" : "border-line bg-raised hover:border-brand/60",
                    busy && "cursor-not-allowed opacity-60",
                  )}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-soft text-accent">
                    <Icon size={15} />
                  </span>
                  <span>
                    <span className="block text-[12.5px] font-bold leading-tight">{s.title}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-mut">{s.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 px-1 text-[10.5px] leading-relaxed text-mut">
            Har scenario asli booking flow chalata hai — dashboard par asar foran nazar aata hai.
          </p>
        </div>

        {/* ── Chat ──────────────────────────────────────────────────────── */}
        <div className="card mx-auto flex w-full max-w-xl flex-col overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-line bg-raised px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-extrabold text-white">
              {(settings?.salon.name ?? "G").charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-bold">{settings?.salon.name ?? "Salon"}</p>
              <p className="flex items-center gap-1.5 text-[10.5px] font-semibold text-accent">
                <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-brand" />
                {ownerMode ? "Owner jawab de raha hai — assistant paused" : typing ? "Typing…" : "Assistant active (demo)"}
              </p>
            </div>
          </div>

          <div ref={scrollRef} className="chat-scroll flex h-[430px] flex-col gap-2 overflow-y-auto px-3.5 py-4">
            {messages.map((m) =>
              m.from === "system" ? (
                <p key={m.id} className="msg-in mx-auto max-w-[90%] rounded-md border border-dashed border-line bg-card px-3 py-1.5 text-center text-[10.5px] font-semibold text-mut">
                  {m.text}
                </p>
              ) : (
                <div
                  key={m.id}
                  className={cn(
                    "msg-in max-w-[85%] whitespace-pre-line rounded-xl px-3.5 py-2.5 text-[12.5px] leading-relaxed",
                    m.from === "cust" && "self-end rounded-br-sm bg-raised text-ink",
                    m.from === "bot" && "self-start rounded-bl-sm bg-bubble text-bubble-ink",
                    m.from === "owner" && "self-start rounded-bl-sm bg-owner-bubble text-white",
                  )}
                >
                  {m.from === "owner" && <span className="mb-1 block text-[9px] font-extrabold uppercase tracking-wider text-mint">Owner</span>}
                  {m.text}
                </div>
              ),
            )}
            {typing && (
              <div className="msg-in flex items-center gap-1 self-start rounded-xl rounded-bl-sm bg-bubble px-3.5 py-3">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            )}
          </div>

          {lastBotWithOptions && !ownerMode && (
            <div className="flex flex-wrap gap-1.5 border-t border-line px-3.5 py-2.5">
              {lastBotWithOptions.options!.map((o) => (
                <button
                  key={o}
                  type="button"
                  disabled={busy}
                  onClick={() => clickOption(o)}
                  className="rounded-full border border-brand/50 bg-brand-soft px-3 py-1.5 text-[11.5px] font-bold text-accent transition-colors hover:bg-brand hover:text-white disabled:opacity-50"
                >
                  {o}
                </button>
              ))}
            </div>
          )}

          {pickerOpen && (
            <SlotPicker
              open={pickerOpen}
              onClose={() => setPickerOpen(false)}
              step={chatStep}
              busy={busy}
              onSend={(text) => void clickOption(text)}
            />
          )}

          <div className="border-t border-line bg-raised px-3 py-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                aria-expanded={pickerOpen}
                aria-label="Calendar se din aur slot khud chunein"
                title="Calendar se din aur slot khud chunein"
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors",
                  pickerOpen ? "border-brand bg-brand-soft text-accent" : "border-line bg-card text-mut hover:text-accent",
                )}
              >
                <CalendarDays size={17} />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitInput()}
                placeholder={ownerMode ? "Owner ke taur par jawab likhein…" : 'Roman Urdu mein likhein — e.g. "facial kitne ka hai?"'}
                className="input !rounded-full"
                aria-label="Message"
              />
              <button
                type="button"
                onClick={submitInput}
                disabled={busy || !input.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white transition-transform active:scale-90 disabled:opacity-50"
                aria-label="Bhejein"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Owner view ────────────────────────────────────────────────── */}
        <div className="grid content-start gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-[12.5px] font-extrabold">
                  <ShieldCheck size={14} className="text-accent" /> Owner override
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-mut">ON karein — assistant peeche, aap aage</p>
              </div>
              <Switch checked={ownerMode} onChange={toggleOwner} label="Owner override" />
            </div>
          </div>

          <div className="card p-4">
            <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-mut">Aaj — live counters</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { v: summary?.counters.recovered ?? 0, l: "Recovered" },
                { v: summary?.counters.pending ?? 0, l: "Pending" },
                { v: summary?.counters.reviews ?? 0, l: "Reviews" },
              ].map((s) => (
                <div key={s.l} className="rounded-lg border border-line bg-raised px-1 py-2.5">
                  <CountUp value={s.v} className="text-xl font-extrabold text-accent" />
                  <p className="text-[9.5px] font-bold text-mut">{s.l}</p>
                </div>
              ))}
            </div>
            <Link href="/dashboard" className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-bold text-accent hover:underline">
              Poora dashboard <ArrowRight size={12} />
            </Link>
          </div>

          <div className="card p-4">
            <p className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-mut">
              <Activity size={12} className="text-accent" /> Owner feed — har reply nazar
            </p>
            <ul className="mt-3 grid max-h-[300px] gap-2.5 overflow-y-auto chat-scroll">
              {(summary?.events ?? []).slice(0, 8).map((e) => (
                <li key={e.id} className="border-l-2 border-line pl-2.5 text-[11px] leading-snug">
                  <p className="text-ink/90">{e.detail}</p>
                  <p className="mt-0.5 text-[9.5px] font-semibold text-mut">{timeAgo(e.createdAt)}</p>
                </li>
              ))}
              {(!summary || summary.events.length === 0) && <li className="text-[11px] text-mut">Abhi koi activity nahi — scenario chalayein.</li>}
            </ul>
          </div>
        </div>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-[11px] text-mut">
        <ShieldCheck size={12} className="text-accent" />
        Simulated demo — koi live WhatsApp connection nahi. Phase 2: sirf Official Cloud API, Meta verification ke baad. Koi spam nahi.
      </p>

      {toast && (
        <div className="toast-in fixed bottom-5 left-1/2 z-[90] -translate-x-1/2 rounded-lg border border-brand bg-card px-4 py-2.5 text-[12.5px] font-bold text-ink">
        {toast}
        </div>
      )}
    </div>
  );
}
