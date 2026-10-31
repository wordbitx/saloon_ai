"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CalendarCheck,
  Check,
  Crown,
  LayoutDashboard,
  MessageCircle,
  Pause,
  PhoneMissed,
  Play,
  RotateCcw,
  ShieldCheck,
  Signal,
  Sparkles,
  Wifi,
  BatteryMedium,
} from "lucide-react";
import { Words, PhoneTilt, CountUp, Reveal, RippleButton, cn } from "@/components/ui";

const CHAT: { from: "customer" | "assistant"; text: string }[] = [
  { from: "customer", text: "Assalam o Alaikum, Hydra Glow Facial aur Bridal trial ka rate kya hai? (10:42 PM)" },
  { from: "assistant", text: "Walaikum Assalam! ✨ Hydra Glow Facial PKR 4,500 (60 min). Kal 5:00 PM Senior Artist Sana ke sath slot available hai — book kar dun?" },
  { from: "customer", text: "Jee haan, 5:00 PM confirm kar dein" },
  { from: "assistant", text: "Bohat shukriya! Aap ka शुभ naam bata dein taake chair reserve ho jaye?" },
  { from: "customer", text: "Mahnoor Malik" },
  { from: "assistant", text: "Confirm ho gaya ✓ Hydra Glow Facial — Kal 5:00 PM (Chair 2 · Sana). Appointment se 2 ghante pehle reminder isi WhatsApp par aayega. 💙" },
];

function PhonePreview() {
  const [count, setCount] = useState(3);
  const [typing, setTyping] = useState(false);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(3);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onReduce = () => {
      if (mq.matches) {
        setCount(CHAT.length);
        setPaused(true);
        setTyping(false);
      }
    };
    onReduce();
    mq.addEventListener("change", onReduce);
    return () => mq.removeEventListener("change", onReduce);
  }, []);

  useEffect(() => {
    if (paused) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const advance = () => {
      if (!active) return;
      if (stepRef.current >= CHAT.length) {
        setTyping(false);
        setPaused(true);
        return;
      }
      const isAssistant = CHAT[stepRef.current].from === "assistant";
      if (isAssistant) setTyping(true);
      timer = setTimeout(() => {
        if (!active) return;
        stepRef.current += 1;
        setCount(stepRef.current);
        setTyping(false);
        timer = setTimeout(advance, 1400);
      }, isAssistant ? 1000 : 600);
    };
    timer = setTimeout(advance, 1100);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [paused, cycle]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
  }, [count, typing]);

  const replay = () => {
    stepRef.current = 0;
    setCount(0);
    setTyping(false);
    setPaused(false);
    setCycle((v) => v + 1);
  };

  const toggle = () => {
    if (count === CHAT.length) {
      replay();
      return;
    }
    setPaused((v) => !v);
    setTyping(false);
  };

  return (
    <div className="hero-device-stage">
      <div className="hero-device-frame" aria-hidden />
      <div className="hero-device-meta" aria-hidden>
        <span>WHATSAPP CONCIERGE → BOOKING</span>
        <span className="hero-meta-rule" />
        <span>LIVE INTERACTIVE PREVIEW</span>
      </div>
      <PhoneTilt className="hero-phone-tilt">
        <div className="hero-phone" aria-label="Simulated booking conversation, sample data">
          <div className="hero-phone-status" aria-hidden="true">
            <span>9:41</span>
            <span className="hero-phone-island" />
            <span className="flex items-center gap-1">
              <Signal size={11} />
              <Wifi size={11} />
              <BatteryMedium size={14} />
            </span>
          </div>
          <div className="hero-phone-screen">
            <div className="hero-phone-header">
              <span className="hero-salon-avatar">
                E<span />
              </span>
              <div className="min-w-0 flex-1">
                <p>Elan Beauty · Gulberg &amp; DHA</p>
                <span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e5c158]" /> Luxury Concierge · Active 24/7
                </span>
              </div>
              <span className="rounded-full border border-[#e5c158]/40 bg-[#e5c158]/15 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-[#f3d474]">
                AI Concierge
              </span>
            </div>
            <div className="hero-phone-chat chat-scroll" ref={scrollRef}>
              <div className="hero-chat-day">
                <span /> TONIGHT · 10:42 PM <span />
              </div>
              {CHAT.slice(0, count).map((m, i) => (
                <div
                  key={`${cycle}-${i}`}
                  className={cn(
                    "hero-chat-message msg-in",
                    m.from === "customer" ? "hero-customer-message" : "hero-assistant-message",
                  )}
                >
                  {m.from === "assistant" && (
                    <span className="hero-assistant-mark">
                      <Sparkles size={10} /> Elan Beauty Concierge
                    </span>
                  )}
                  <p>{m.text}</p>
                  <span className="hero-chat-time">
                    {m.from === "customer" ? "10:42 PM" : "10:42 PM · Instant"} <Check size={10} />
                  </span>
                </div>
              ))}
              {typing && (
                <div className="hero-typing" aria-label="Assistant typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              )}
              {count === CHAT.length && (
                <div className="hero-booked-chip">
                  <CalendarCheck size={12} /> Chair #2 Reserved · PKR 4,500 Saved
                </div>
              )}
            </div>
            <div className="hero-phone-composer">
              <span>24/7 Automated Salon Reception</span>
              <button
                type="button"
                onClick={toggle}
                aria-label={
                  count === CHAT.length
                    ? "Preview dobara chalayein"
                    : paused
                      ? "Preview resume karein"
                      : "Preview pause karein"
                }
                title={count === CHAT.length ? "Replay" : paused ? "Resume" : "Pause"}
              >
                {count === CHAT.length ? <RotateCcw size={14} /> : paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            </div>
            <div className="hero-phone-bottom-bar" aria-hidden>
              <span />
            </div>
          </div>
        </div>
      </PhoneTilt>

      <div className="hero-float hero-float-missed" aria-label="Sample missed-call recovery">
        <span className="hero-float-icon">
          <PhoneMissed size={16} />
        </span>
        <div>
          <span className="hero-float-eyebrow">MISSED CALL AT 10:42 PM</span>
          <p>
            Instant WhatsApp Recovery <ArrowUpRight size={13} />
          </p>
        </div>
      </div>
      <div className="hero-float hero-float-booked" aria-label="Sample confirmed booking">
        <span className="hero-float-check">
          <Check size={17} />
        </span>
        <div>
          <span className="hero-float-eyebrow">RECOVERED BOOKING</span>
          <p>
            Hydra Facial <span>PKR 4,500</span>
          </p>
        </div>
        <span className="hero-float-mini-line" />
      </div>
      <div className="hero-preview-caption">
        <span /> Powered by WordbitX · Interactive Salon Concierge
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="home-hero-wrap">
      <div className="home-hero site-container">
        <div className="home-hero-copy">
          <div className="home-hero-eyebrow">
            <span className="badge-luxe">
              <Crown size={11} /> Elan Beauty Suite · Engineered by WordbitX
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-line bg-white/80 px-3 py-1 text-[10px] font-bold tracking-wider text-accent shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> LAHORE · GULBERG · DHA
            </span>
          </div>

          <h1 className="home-hero-title">
            <Words text="Har Missed Call Aur Message Ko" />
            <br />
            <span className="home-hero-title-luxe">
              <Words text="Luxury Salon Booking Banayein." baseDelay={240} />
            </span>
          </h1>

          <p className="home-hero-description">
            Peak hours mein jab reception busy ho ya raat ko salon band ho — <strong>Elan Beauty AI Concierge</strong>{" "}
            3 second mein Roman Urdu aur English mein jawab deta hai,{" "}
            <strong>stylist &amp; chair book karta hai</strong>, aur owner ko rozana mukammal revenue hisaab bhejta hai.
          </p>

          <div className="home-hero-actions">
            <RippleButton href="/demo" className="home-primary-action">
              <Play size={15} fill="currentColor" /> Live Demo Chalayein <ArrowRight size={16} />
            </RippleButton>
            <RippleButton href="/dashboard" variant="luxe" className="home-secondary-action">
              <LayoutDashboard size={16} /> Executive Dashboard
            </RippleButton>
            <RippleButton
              href="https://wa.me/923251888841?text=Assalam%20o%20Alaikum!%20Mujhe%20Elan%20Beauty%20by%20WordbitX%20ka%20demo%20aur%20details%20chahiye."
              variant="ghost"
              className="home-secondary-action"
            >
              <MessageCircle size={15} className="text-mint" /> WhatsApp +92 325 1888841
            </RippleButton>
          </div>

          <p className="home-hero-helper">
            <ShieldCheck size={13} /> 24-Hour White-Glove Setup by{" "}
            <a href="http://wordbitx.pk" target="_blank" className="font-extrabold text-mint underline">
              WordbitX (wordbitx.pk)
            </a>{" "}
            · Full Owner Control · Chair Double-Booking Guard
          </p>

          <Reveal className="home-hero-snapshot" delay={180}>
            <div className="home-snapshot-heading">
              <span>LIVE SALON TELEMETRY · ELAN BEAUTY</span>
              <span className="text-[#e5c158]">PKR 24,500 Recovered Today</span>
            </div>
            <div className="home-hero-stats">
              {[
                { n: 6, suffix: "", label: "Bookings Recovered Today", icon: CalendarCheck },
                { n: 3, suffix: "s", label: "Instant WhatsApp Response", icon: MessageCircle },
                { n: 100, suffix: "%", label: "Chair Conflict Protection", icon: BellRing },
              ].map((s) => (
                <div key={s.label}>
                  <div className="home-hero-stat-value">
                    <CountUp value={s.n} suffix={s.suffix} />
                    <s.icon size={15} />
                  </div>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <PhonePreview />
      </div>
    </section>
  );
}
