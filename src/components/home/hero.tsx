"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, BellRing, CalendarCheck, Check, LayoutDashboard, MessageCircle, Pause, PhoneMissed, Play, RotateCcw, ShieldCheck, Signal, Wifi, BatteryMedium } from "lucide-react";
import {Words, PhoneTilt, CountUp, Reveal, RippleButton, cn} from "@/components/ui";

const CHAT: { from: "customer" | "assistant"; text: string }[] = [
  { from: "customer", text: "Assalam o Alaikum, facial ka rate kya hai? (10:42 PM)" },
  { from: "assistant", text: "Walaikum Assalam! Facial Rs 2,500 (60 min). Kal 5:00 PM ka slot khali hai — book kar dun?" },
  { from: "customer", text: "Haan please" },
  { from: "assistant", text: "Zaroor! Aap ka naam bata dein?" },
  { from: "customer", text: "Mahnoor" },
  { from: "assistant", text: "Ho gaya ✓ Facial — kal 5:00 PM. Reminder 2 ghante pehle isi chat par aayega. 💚" },
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
        <span>CHAT → BOOKING</span><span className="hero-meta-rule" /><span>01 / PRODUCT PREVIEW</span>
      </div>
      <PhoneTilt className="hero-phone-tilt">
        <div className="hero-phone" aria-label="Simulated booking conversation, sample data">
          <div className="hero-phone-status" aria-hidden="true">
            <span>9:41</span>
            <span className="hero-phone-island" />
            <span className="flex items-center gap-1"><Signal size={11} /><Wifi size={11} /><BatteryMedium size={14} /></span>
          </div>
          <div className="hero-phone-screen">
            <div className="hero-phone-header">
              <span className="hero-salon-avatar">G<span /></span>
              <div className="min-w-0 flex-1">
                <p>Glow Salon, Lahore</p>
                <span><span className="h-1 w-1 rounded-full bg-accent" /> Booking assistant · demo</span>
              </div>
            </div>
            <div className="hero-phone-chat chat-scroll" ref={scrollRef}>
              <div className="hero-chat-day"><span /> CHAT PREVIEW <span /></div>
              {CHAT.slice(0, count).map((m, i) => (
                <div key={`${cycle}-${i}`} className={cn("hero-chat-message msg-in", m.from === "customer" ? "hero-customer-message" : "hero-assistant-message")}>
                  {m.from === "assistant" && <span className="hero-assistant-mark"><MessageCircle size={10} /> Recovery assistant</span>}
                  <p>{m.text}</p>
                  <span className="hero-chat-time">{m.from === "customer" ? "10:42" : "10:43"} <Check size={10} /></span>
                </div>
              ))}
              {typing && <div className="hero-typing" aria-label="Assistant typing"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>}
              {count === CHAT.length && <div className="hero-booked-chip"><CalendarCheck size={11} /> Booking confirmed · sample</div>}
            </div>
            <div className="hero-phone-composer">
              <span>Simulated chat. Real flow.</span>
              <button type="button" onClick={toggle} aria-label={count === CHAT.length ? "Preview dobara chalayein" : paused ? "Preview resume karein" : "Preview pause karein"} title={count === CHAT.length ? "Replay" : paused ? "Resume" : "Pause"}>
                {count === CHAT.length ? <RotateCcw size={14} /> : paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            </div>
            <div className="hero-phone-bottom-bar" aria-hidden><span /></div>
          </div>
        </div>
      </PhoneTilt>

      <div className="hero-float hero-float-missed" aria-label="Sample missed-call recovery">
        <span className="hero-float-icon"><PhoneMissed size={16} /></span>
        <div><span className="hero-float-eyebrow">A MISSED CALL. NOT A LOST BOOKING.</span><p>Foran WhatsApp reply <ArrowUpRight size={13} /></p></div>
      </div>
      <div className="hero-float hero-float-booked" aria-label="Sample confirmed booking">
        <span className="hero-float-check"><Check size={18} /></span>
        <div><span className="hero-float-eyebrow">BOOKING CONFIRMED</span><p>Facial <span>5:00 PM</span></p></div>
        <span className="hero-float-mini-line" />
      </div>
      <div className="hero-preview-caption"><span /> Simulated preview — no live WhatsApp</div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="home-hero site-container">
      <div className="home-hero-copy">
        <div className="home-hero-eyebrow">
          <span className="hero-eyebrow-line" />
          <span>BUILT FOR SALONS IN LAHORE</span>
        </div>
        <h1 className="home-hero-title"><Words text="Missed message ab" /><br /><span><Words text="booking banega." baseDelay={250} /></span></h1>
        <p className="home-hero-description">
          Foran jawab. Seedhi booking. Har reminder ka hisaab.<br className="hidden sm:block" />
          Apne salon ka missed WhatsApp aur call <strong>recovery mein badlein</strong> — owner ka control hamesha apne paas.
        </p>
        <div className="home-hero-actions">
          <RippleButton href="/demo" className="home-primary-action"><Play size={15} fill="currentColor" /> Try the demo <ArrowRight size={16} /></RippleButton>
          <RippleButton href="/dashboard" variant="ghost" className="home-secondary-action"><LayoutDashboard size={16} /> Owner dashboard</RippleButton>
        </div>
        <p className="home-hero-helper"><ShieldCheck size={12} /> Interactive demo · No sign-up · No live WhatsApp</p>

        <Reveal className="home-hero-snapshot" delay={180}>
          <div className="home-snapshot-heading"><span>TODAY · GLOW SALON</span><span>Aaj ki recovery</span></div>
          <div className="home-hero-stats">
            {[
              { n: 3, label: "Bookings bachi", icon: CalendarCheck },
              { n: 6, label: "Missed messages pakre", icon: MessageCircle },
              { n: 2, label: "Waitlist par", icon: BellRing },
            ].map((s) => <div key={s.label}><div className="home-hero-stat-value"><CountUp value={s.n} /><s.icon size={14} /></div><span>{s.label}</span></div>)}
          </div>
        </Reveal>
      </div>
      <PhonePreview />
    </section>
  );
}
