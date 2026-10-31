"use client";

import { useState } from "react";
import {
  PhoneMissed,
  MessageCircle,
  CalendarCheck,
  BellRing,
  Users,
  Star,
  Mic,
  Crown,
  GitBranch,
  Settings2,
  Download,
  ShieldCheck,
  Clock,
  ArrowRight,
  Check,
  Play,
  UserCheck,
  ListChecks,
  TrendingUp,
  Ban,
  Camera,
  ClipboardList,
  FileText,
  Rocket,
  Phone,
  Plus,
  LayoutDashboard,
  Armchair,
  Sparkles,
} from "lucide-react";
import { RippleButton, Reveal, CountUp, Ticker, cn } from "@/components/ui";
import { LandingHero } from "@/components/home/hero";
import { ProductCatalog } from "@/components/shop/catalog";

/* ── Core & Signature Luxury Features ────────────────────────────────────── */
const CORE = [
  "Missed call & WhatsApp par 3-second instant response — Roman Urdu + English",
  "Salon ke apne official menu se accurate rate & service guidance",
  "Complete booking concierge: Service → Date → Time → Stylist → Chair confirmation",
  "Appointment se 2 ghante pehle automated WhatsApp reminder",
  "Cancellation par smart waitlist backfill — khaali slot foran next client ko offer",
  "Executive owner dashboard: recovered revenue, daily brief, chair floor view & CSV export",
  "Instant owner override — owner chat mein aaye to AI concierge khamoshi se peeche hat jaye",
];

const NEW_FEATURES = [
  { icon: PhoneMissed, title: "Missed Call → Instant WhatsApp", desc: "Call miss hote hi client ko 3 second mein luxury concierge message: 'Aap ne call ki thi — konsa slot reserve karein?'" },
  { icon: UserCheck, title: "VIP & Repeat Client Recognition", desc: "'Walaikum Assalam Ayesha! Pichli dafa Hina ke sath Balayage hua tha — is baar bhi wohi slot book karein?'" },
  { icon: Star, title: "Automated Google Review Concierge", desc: "Appointment complete hote hi client ko polite thank-you note aur direct Google review link." },
  { icon: Users, title: "Stylist & Specialist-Wise Booking", desc: "'Mujhe sirf Senior Artist Sana se booking chahiye' — stylist availability aur chair khud match hoti hai." },
  { icon: Crown, title: "Bridal & High-Ticket Package Upsell", desc: "Bridal inquiry par trial, mehndi aur hydra-facial pre-care packages ka smart recommendation." },
  { icon: Mic, title: "Voice-Note Executive Summary", desc: "Client ke lambe voice note ko instant text summary bana kar owner dashboard par dikhata hai." },
  { icon: GitBranch, title: "Multi-Branch + Morning Executive Brief", desc: "Roz subah owner ko mukammal brief: aaj ki bookings, khaali chairs, aur kal ki recovered revenue." },
  { icon: Settings2, title: "Real-Time Salon Menu & Timing Control", desc: "Services, prices, timing ya greeting badlein — AI concierge aur dashboard usi pal update ho jate hain." },
];

const PLANS = [
  {
    name: "Starter",
    tier: "Essential Suite",
    pkr: "5,000",
    usd: "29",
    tagline: "Single Studio — Automated Booking & Recovery Foundation",
    base: null as string | null,
    features: [
      "Instant reply + automated booking flow",
      "Daily executive booking summary",
      "Missed-call → instant WhatsApp recovery",
      "Full owner override control",
    ],
    popular: false,
  },
  {
    name: "Growth",
    tier: "Signature Luxury · Most Popular",
    pkr: "10,000",
    usd: "59",
    tagline: "Complete Client Retention, Loyalty & Revenue Recovery",
    base: "Everything in Starter",
    features: [
      "Automated follow-ups & smart appointment reminders",
      "VIP & repeat client recognition",
      "Automated Google review requests",
      "Stylist & specialist-wise booking",
      "Full booking & revenue CSV export",
    ],
    popular: true,
  },
  {
    name: "Business",
    tier: "Executive Multi-Branch",
    pkr: "15,000",
    usd: "99",
    tagline: "Flagship Multi-Branch Suite & Bridal Concierge",
    base: "Everything in Growth",
    features: [
      "Smart waitlist & cancellation backfill",
      "High-ticket bridal & package upsell flows",
      "AI voice-note text summaries for owner",
      "Multi-branch control + morning executive brief",
      "Dedicated WordbitX priority support",
    ],
    popular: false,
  },
];

const NOT_DOING = [
  "Koi fake testimonial, client count ya jhoota dawa nahi",
  "Koi bulk ya cold spam messaging nahi — kabhi nahi",
  "Koi unofficial ya personal-number WhatsApp automation nahi",
  "Meta partnership ka koi ghalat dawa nahi",
  "'Guaranteed sales' jaisi false guarantee nahi — live demo khud proof deta hai",
  "100% tenant isolation — har salon ka data mukammal mehfooz",
];

const FAQS = [
  {
    q: "Kya ye receptionist ko replace karta hai?",
    a: "Nahi. Receptionist salon floor aur walk-in guests ke liye zaroori hai — Elan Beauty Suite us ka overflow pakarta hai: peak hours mein jab line busy ho, raat ko jab salon band ho, ya chhutti wale din.",
  },
  {
    q: "WhatsApp Business free app se farq kya hai?",
    a: "Free app sirf एक static greeting bhejta hai — har jawab phir bhi insan ko likhna parta hai. Service rates batana, chair availability check karna, booking confirm karna, reminder bhejna aur dashboard report banana yeh system khud karta hai.",
  },
  {
    q: "Setup kitni dair mein hota hai?",
    a: "Sirf 24 ghante mein — WordbitX (wordbitx.pk) ki dedicated engineering team onboarding karti hai. Optional white-glove setup service (PKR 5,000 / $29) mein aap ke salon ki tamam services, prices aur FAQs hum khud configure karte hain.",
  },
  {
    q: "Mere salon ka data kaun dekh sakta hai?",
    a: "Sirf aap. Har record par strict salon_id aur Row Level Security lagi hai taake aik salon doosre salon ka data kabhi na dekh sake. Dashboard par live isolation test mojood hai.",
  },
  {
    q: "Hamare Instagram/WhatsApp par bohat messages aate hain — kya yeh sambhal lega?",
    a: "Jitne zyada messages, utna bara revenue leak. High-volume salons mein hi sab se zyada calls aur messages miss hotay hain — yeh system har inquiry ko 3 second mein jawab de kar booking mein convert karta hai.",
  },
];

export default function LandingPage() {
  const [currency, setCurrency] = useState<"PKR" | "USD">("PKR");

  return (
    <div className="home-page">
      <LandingHero />

      {/* ── Deep Royal Navy Live Recovery Ribbon ────────────────────────── */}
      <section className="home-activity py-4">
        <div className="site-container">
          <div className="mb-2.5 flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#f3d474]">
            <Sparkles size={13} className="text-[#e5c158]" /> Live Salon Recovery Stream · Powered by WordbitX
            <span className="ml-auto hidden font-semibold normal-case text-slate-300 sm:inline">
              Hover to pause stream
            </span>
          </div>
          <Ticker
            items={[
              <span key="1"><b className="text-[#f3d474]">Signature Balayage</b> — Ayesha · 5:30 PM <span className="text-slate-300">· Recovered from missed call (PKR 14,500)</span></span>,
              <span key="2"><b className="text-[#f3d474]">Hydra Glow Facial</b> — Mahnoor · 5:00 PM <span className="text-slate-300">· 10:42 PM late-night WhatsApp</span></span>,
              <span key="3"><b className="text-[#f3d474]">Bridal Barat Trial</b> — Zunaira · Kal 2:00 PM <span className="text-slate-300">· Senior Artist Sana</span></span>,
              <span key="4"><b className="text-[#f3d474]">Gel Nail Extensions</b> — Komal · 4:00 PM <span className="text-slate-300">· Waitlist auto-backfill</span></span>,
              <span key="5"><b className="text-[#f3d474]">Keratin Ritual</b> — Hira · 6:00 PM <span className="text-slate-300">· Repeat VIP client recognized</span></span>,
              <span key="6"><b className="text-[#f3d474]">5★ Google Review</b> — Fatima <span className="text-slate-300">· Sent automatically post-service</span></span>,
            ]}
          />
        </div>
      </section>

      {/* ── Warm Champagne Pearl Boutique Section ───────────────────────── */}
      <ProductCatalog limit={5} />

      {/* ── Executive Problem Showcase: Why Luxury Salons Lose Bookings ─── */}
      <section className="site-container home-problem grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <Reveal>
          <div className="card-luxe-featured rounded-2xl p-7 sm:p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5c158]/45 bg-[#e5c158]/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#f3d474]">
              <TrendingUp size={12} /> The Luxury Salon Revenue Leak
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
              Receptionist Replace Nahi Hota — <span className="text-[#f3d474]">Overflow Recover</span> Hota Hai.
            </h2>
            <p className="mt-4 text-[13.5px] leading-relaxed text-slate-200">
              Jab client bridal ya facial ke liye 3 salons ko WhatsApp karta hai,{" "}
              <strong className="text-white">jo salon pehle 30 second mein professional jawab de, booking usi ki hoti hai.</strong>{" "}
              Peak hours aur raat 9 baje ke baad miss hone wali har call seedha revenue loss hai.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-5">
              <div className="rounded-xl border border-white/12 bg-white/6 p-3.5">
                <p className="text-2xl font-extrabold text-[#f3d474]">78%</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-200">
                  Clients book with the first salon that replies
                </p>
              </div>
              <div className="rounded-xl border border-white/12 bg-white/6 p-3.5">
                <p className="text-2xl font-extrabold text-white">24 / 7</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-200">
                  Peak-hour, late-night &amp; Sunday coverage
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-[11.5px] text-slate-300">
              <span>Engineered for Pakistani Luxury Salons</span>
              <a href="http://wordbitx.pk" target="_blank" className="font-extrabold text-[#f3d474] underline">
                by WordbitX (wordbitx.pk) ↗
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal group className="grid gap-4 sm:grid-cols-2">
          {[
            {
              n: "01",
              t: "Peak Hours: Aik Waqt, Aik Call",
              d: "Receptionist front-desk par client deal kar rahi ho to baaki calls aur WhatsApp messages wait karte reh jate hain.",
            },
            {
              n: "02",
              t: "Client 3–4 Salons Ko Message Karta Hai",
              d: "Der se reply ka matlab hai client kisi doosre studio mein apna slot confirm kar chuka hai.",
            },
            {
              n: "03",
              t: "Free WhatsApp Business App Kaafi Nahi",
              d: "Static away-message booking confirm nahi karta, na chair conflict rokta hai aur na waitlist chala sakta hai.",
            },
            {
              n: "04",
              t: "Complete AI Brain + White-Glove Setup",
              d: "WordbitX aap ke salon ke rates, stylists aur chairs ke mutabiq poora automated booking system tayyar kar ke deta hai.",
            },
          ].map((r) => (
            <div key={r.n} className="reveal-item card-luxe-tier rounded-2xl p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-luxe/45 bg-luxe-soft text-xs font-extrabold text-mint">
                {r.n}
              </span>
              <h3 className="mt-3.5 text-[15px] font-extrabold text-ink">{r.t}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-mut">{r.d}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ── How It Works — Rich Royal Midnight Navy Showcase Band ───────── */}
      <section id="how-it-works" className="home-section-navy home-section">
        <div className="site-container">
          <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5c158]/40 bg-[#e5c158]/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#f3d474]">
                <Sparkles size={11} /> Seamless 4-Step Architecture
              </span>
              <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
                Missed Call Se Confirmed Chair Tak — <span className="text-[#f3d474]">Khudkar Flow</span>
              </h2>
            </div>
            <RippleButton href="/demo" variant="luxe" className="!py-2.5 text-xs">
              Interactive Chat Chalayein <ArrowRight size={14} />
            </RippleButton>
          </Reveal>

          <Reveal group className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: PhoneMissed,
                step: "STEP 01",
                t: "Call Ya Message Miss Hua",
                d: "Peak hour, raat 11 baje ya chhutti — system usi second inquiry ko detect kar leta hai.",
              },
              {
                icon: MessageCircle,
                step: "STEP 02",
                t: "3-Second Luxury Reply",
                d: "Roman Urdu + English mein aap ke salon ki asli price list aur available slots pesh karta hai.",
              },
              {
                icon: CalendarCheck,
                step: "STEP 03",
                t: "Stylist & Chair Lock",
                d: "Double-booking guard ke sath chair reserve hoti hai aur 2 ghante pehle reminder lag jata hai.",
              },
              {
                icon: ClipboardList,
                step: "STEP 04",
                t: "Owner Daily Revenue Brief",
                d: "Dashboard par live update: aaj kitni bookings aur kitne hazar PKR recover hue.",
              },
            ].map((s) => (
              <div key={s.t} className="reveal-item home-luxe-step-card">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#e5c158]/40 bg-[#e5c158]/15 text-[#f3d474]">
                    <s.icon size={20} />
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/8 px-2.5 py-0.5 text-[9.5px] font-extrabold tracking-wider text-[#f3d474]">
                    {s.step}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-extrabold text-white">{s.t}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-300">{s.d}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── 3 Executive Command Pillars (Dashboard / Floor / Admin) ─────── */}
      <section className="site-container home-section">
        <Reveal className="mb-9 text-center">
          <span className="badge-luxe mx-auto">
            <LayoutDashboard size={11} /> Executive Salon Command Center
          </span>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Poora Salon Aik Luxury Workspace Mein
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-mut">
            Owner, Manager aur Reception ke liye alag role-based access — mobile aur desktop dono par mukammal control.
          </p>
        </Reveal>

        <Reveal group className="grid gap-6 md:grid-cols-3">
          <div className="reveal-item card-luxe-tier flex flex-col rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-[#f3d474] shadow-sm">
                <LayoutDashboard size={20} />
              </span>
              <span className="badge-luxe">Live Telemetry</span>
            </div>
            <h3 className="mt-4 text-lg font-extrabold">Executive Owner Dashboard</h3>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-mut">
              Recovered revenue, 7-day booking analytics, waitlist queue, Google reviews, client CRM aur retail orders — sab aik nazar mein.
            </p>
            <RippleButton href="/dashboard" variant="brand" className="mt-5 w-full !py-2.5 text-xs">
              Open Owner Dashboard <ArrowRight size={13} />
            </RippleButton>
          </div>

          <div className="reveal-item card-luxe-featured flex flex-col rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#e5c158]/40 bg-[#e5c158]/20 text-[#f3d474]">
                <Armchair size={20} />
              </span>
              <span className="rounded-full border border-[#e5c158]/40 bg-[#e5c158]/15 px-2.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-[#f3d474]">
                Zero Conflict
              </span>
            </div>
            <h3 className="mt-4 text-lg font-extrabold text-white">Chair-Level Double-Booking Guard</h3>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-200">
              Aik hi chair aur waqt par doosri booking mumkin nahi. Conflict aane par system khud alternate slot ya stylist suggest karta hai.
            </p>
            <RippleButton href="/dashboard/floor" variant="luxe" className="mt-5 w-full !py-2.5 text-xs">
              Explore Chair Floor View <ArrowRight size={13} />
            </RippleButton>
          </div>

          <div className="reveal-item card-luxe-tier flex flex-col rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-luxe/45 bg-luxe-soft text-mint">
                <ShieldCheck size={20} />
              </span>
              <span className="badge-luxe">Demo PIN: 2468</span>
            </div>
            <h3 className="mt-4 text-lg font-extrabold">Full Admin Console</h3>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-mut">
              Staff, services, chairs, retail products, client profiles aur multi-tenant switching — PIN <b className="text-ink">2468</b> se full CRUD control.
            </p>
            <RippleButton href="/admin" variant="ghost" className="mt-5 w-full !py-2.5 text-xs">
              Launch Admin Console <ArrowRight size={13} />
            </RippleButton>
          </div>
        </Reveal>
      </section>

      {/* ── Luxury Feature Matrix (Warm Champagne Pearl Band) ───────────── */}
      <section className="home-section-band home-section">
        <div className="site-container">
          <Reveal className="text-center">
            <span className="badge-luxe mx-auto">
              <Crown size={11} /> Complete Luxury Feature Suite
            </span>
            <h2 className="mt-3 mx-auto max-w-2xl text-3xl font-extrabold sm:text-4xl">
              Core Har Plan Mein — Signature Features Aap Ke Salon Ko Mumtaz Banayein
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <Reveal className="card-luxe-featured flex flex-col justify-between rounded-2xl p-7">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#f3d474]">
                    <ListChecks size={16} /> Core Standard · Every Plan
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-white">
                    7 Pillars
                  </span>
                </div>
                <h3 className="mt-3 text-2xl font-extrabold text-white">
                  Har Package Mein Mukammal Booking &amp; Recovery Engine
                </h3>
                <ul className="mt-6 grid gap-3.5">
                  {CORE.map((c) => (
                    <li key={c} className="flex items-start gap-3 text-[13.5px] leading-relaxed text-slate-100">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#d4af37]/25 text-[#f3d474]">
                        <Check size={12} />
                      </span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-7 flex items-center justify-between gap-3 rounded-xl border border-[#e5c158]/35 bg-white/6 px-4 py-3 text-[12px] text-slate-200">
                <span className="flex items-center gap-2">
                  <Camera size={15} className="shrink-0 text-[#f3d474]" />
                  Instagram DM &amp; Official Meta Cloud API ready
                </span>
                <a href="http://wordbitx.pk" target="_blank" className="font-extrabold text-[#f3d474] underline">
                  wordbitx.pk ↗
                </a>
              </div>
            </Reveal>

            <Reveal group className="grid gap-3.5 sm:grid-cols-2">
              {NEW_FEATURES.map((f, idx) => (
                <div key={f.title} className="reveal-item card-luxe-tier rounded-xl p-4.5">
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-lg border",
                      idx % 2 === 0
                        ? "border-luxe/45 bg-luxe-soft text-mint"
                        : "border-brand/20 bg-brand-soft text-accent",
                    )}
                  >
                    <f.icon size={16} />
                  </span>
                  <h4 className="mt-3 text-[14px] font-extrabold text-ink">{f.title}</h4>
                  <p className="mt-1 text-[12px] leading-relaxed text-mut">{f.desc}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Owner Control + WordbitX Engineering ────────────────────────── */}
      <section className="site-container home-section">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="badge-luxe">
              <ShieldCheck size={12} /> Owner Control · Engineered by WordbitX
            </span>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Owner Hamesha Control Mein — AI Concierge Aap Ke Hukum Par
            </h2>
            <ul className="mt-5 grid gap-3.5 text-[13.5px]">
              {[
                "Owner jab chahe conversation mein aa jaye — AI concierge usi pal pause ho jata hai",
                "Har message, booking aur revenue figure owner dashboard par transparent rehta hai",
                "Rozana subah executive summary: 'Aaj kitni bookings aur kitni रकम bachi'",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-luxe-soft text-mint">
                    <ShieldCheck size={13} />
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Clock, t: "24h Fast Setup" },
                { icon: Users, t: "WordbitX Team" },
                { icon: FileText, t: "Executive Reports" },
                { icon: Rocket, t: "Full Onboarding" },
              ].map((s) => (
                <div key={s.t} className="rounded-xl border border-luxe/35 bg-luxe-soft/60 p-3.5 text-center">
                  <s.icon size={17} className="mx-auto text-mint" />
                  <p className="mt-2 text-[11.5px] font-extrabold leading-tight text-ink">{s.t}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-mut">
              Engineered by{" "}
              <a href="http://wordbitx.pk" target="_blank" className="font-extrabold text-mint underline">
                WordbitX (wordbitx.pk)
              </a>{" "}
              — WordbitX agency ya freelancer nahi, aik dedicated software company aur luxury salon technology brand hai.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="card-luxe-tier overflow-hidden rounded-2xl">
              <div
                className="flex items-center justify-between px-6 py-4 text-white"
                style={{ background: "linear-gradient(135deg, #0b162e 0%, #162c58 100%)" }}
              >
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#f3d474]">
                    EXECUTIVE DAILY BRIEF
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold">Elan Beauty · Gulberg &amp; DHA</p>
                </div>
                <a
                  href="http://wordbitx.pk"
                  target="_blank"
                  className="rounded-full border border-[#e5c158]/45 bg-[#e5c158]/15 px-3 py-1 text-[10px] font-extrabold text-[#f3d474]"
                >
                  WordbitX Suite ↗
                </a>
              </div>
              <div className="grid grid-cols-3 divide-x divide-line border-b border-line bg-raised/50">
                {[
                  { v: 6, suffix: "", l: "Bookings Recovered", gold: false },
                  { v: 24500, suffix: "", l: "PKR Saved Today", gold: true },
                  { v: 5, suffix: "★", l: "Reviews Sent", gold: false },
                ].map((s) => (
                  <div key={s.l} className="px-4 py-4 text-center">
                    <CountUp
                      value={s.v}
                      suffix={s.suffix}
                      className={cn("text-2xl font-extrabold sm:text-3xl", s.gold ? "text-mint" : "text-accent")}
                    />
                    <p className="mt-1 text-[10.5px] font-bold text-mut">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 py-5">
                <p className="text-[13px] leading-relaxed text-mut">
                  “Aaj <b className="text-ink">6 missed inquiries</b> ko confirmed bookings mein badla gaya (<b className="text-mint">PKR 24,500</b>).
                  Waitlist par 2 VIP clients hain — cancellation aate hi slot automatically offer ho jayega.”
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-luxe/40 bg-luxe-soft px-3 py-1.5 text-[11px] font-extrabold text-mint">
                    <Download size={12} /> Revenue CSV Export
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-raised px-3 py-1.5 text-[11px] font-bold">
                    <BellRing size={12} className="text-accent" /> Smart Reminders Active
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-raised px-3 py-1.5 text-[11px] font-bold">
                    <GitBranch size={12} className="text-accent" /> Multi-Branch Sync
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Pricing (Warm Champagne Pearl Band) ─────────────────────────── */}
      <section id="pricing" className="home-section-band home-section scroll-mt-24">
        <div className="site-container">
          <Reveal className="text-center">
            <span className="badge-luxe mx-auto">
              <Crown size={12} /> Executive Salon Plans · Powered by WordbitX
            </span>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Transparent Investment — Tailored for Luxury Salons
            </h2>
            <p className="mx-auto mt-2.5 max-w-2xl text-[13.5px] leading-relaxed text-mut">
              Har salon ke scale aur workflow ke mutabiq crafted packages — baghair kisi hidden charges ke, 24 ghante mein{" "}
              <a href="http://wordbitx.pk" target="_blank" className="font-bold text-mint underline">
                WordbitX
              </a>{" "}
              team ke sath mukammal onboarding.
            </p>
            <div className="mt-5 inline-flex rounded-lg border border-line bg-card p-1 shadow-2xs" role="group" aria-label="Currency">
              {(["PKR", "USD"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={currency === c}
                  onClick={() => setCurrency(c)}
                  className={cn(
                    "rounded-md px-4 py-1.5 text-xs font-extrabold transition-colors",
                    currency === c ? "bg-brand text-white shadow-xs" : "text-mut hover:text-ink",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal group className="mt-10 grid items-stretch gap-6 lg:grid-cols-3">
            {PLANS.map((p) => {
              const waText = encodeURIComponent(
                `Assalam o Alaikum! Mujhe Elan Beauty (${p.name} Package — PKR ${p.pkr}/month) ke baray mein details aur setup chahiye.`,
              );
              const waHref = `https://wa.me/923251888841?text=${waText}`;

              return (
                <div
                  key={p.name}
                  className={cn(
                    "reveal-item relative flex flex-col rounded-2xl p-7 transition-all duration-300",
                    p.popular
                      ? "card-luxe-featured lg:-translate-y-2"
                      : "card-luxe-tier",
                  )}
                >
                  {p.popular ? (
                    <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#e5c458] bg-gradient-to-r from-[#d4af37] to-[#b68919] px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#091224] shadow-md">
                      <Crown size={11} /> Most Popular · Recommended
                    </span>
                  ) : (
                    <span className="w-fit rounded-md border border-luxe/35 bg-luxe-soft px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-mint">
                      {p.tier}
                    </span>
                  )}

                  <div className={cn(p.popular ? "mt-2" : "mt-3")}>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={cn("text-xl font-extrabold", p.popular ? "text-white" : "text-ink")}>
                        {p.name}
                      </h3>
                      {p.popular && (
                        <span className="rounded-full border border-[#d4af37]/40 bg-[#d4af37]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#f3d474]">
                          Signature Tier
                        </span>
                      )}
                    </div>
                    <p className={cn("mt-1 text-[12px] font-medium leading-relaxed", p.popular ? "text-slate-300" : "text-mut")}>
                      {p.tagline}
                    </p>
                  </div>

                  <div className={cn("my-5 border-y py-4", p.popular ? "border-white/15" : "border-line")}>
                    <p className={cn("text-4xl font-extrabold tracking-tight", p.popular ? "text-white" : "text-ink")}>
                      {currency === "PKR" ? (
                        <>
                          <span className={cn("text-base font-bold", p.popular ? "text-[#e5c458]" : "text-mint")}>PKR </span>
                          {p.pkr}
                        </>
                      ) : (
                        <>
                          <span className={cn("text-base font-bold", p.popular ? "text-[#e5c458]" : "text-mint")}>$</span>
                          {p.usd}
                        </>
                      )}
                      <span className={cn("text-xs font-semibold", p.popular ? "text-slate-300" : "text-mut")}> / month</span>
                    </p>
                  </div>

                  <ul className="grid flex-1 gap-3">
                    {p.base && (
                      <li className={cn("flex items-start gap-2.5 text-[13px] font-extrabold", p.popular ? "text-[#f3d474]" : "text-mint")}>
                        <Crown size={14} className="mt-0.5 shrink-0" /> {p.base} +
                      </li>
                    )}
                    {p.features.map((f) => (
                      <li
                        key={f}
                        className={cn("flex items-start gap-2.5 text-[13px]", p.popular ? "text-slate-100" : "text-ink")}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full",
                            p.popular ? "bg-[#d4af37]/25 text-[#f3d474]" : "bg-brand-soft text-accent",
                          )}
                        >
                          <Check size={11} />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <RippleButton
                    href={waHref}
                    variant={p.popular ? "luxe" : "brand"}
                    className="mt-7 w-full"
                  >
                    <MessageCircle size={15} />
                    {p.popular
                      ? "Contact on WhatsApp · +92 325 1888841"
                      : `WhatsApp par rabta — ${p.name}`}
                  </RippleButton>
                </div>
              );
            })}
          </Reveal>

          <Reveal className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="card flex items-start gap-3.5 border-l-2 border-l-brand p-4 text-[13px]">
              <Settings2 size={17} className="mt-0.5 shrink-0 text-mint" />
              <p>
                <b>White-Glove Setup Service: PKR 5,000 / $29</b>
                <span className="text-mut">
                  {" "}— Aap ke salon ki tamam services, prices aur FAQs{" "}
                  <a href="http://wordbitx.pk" target="_blank" className="font-bold text-mint underline">
                    WordbitX (wordbitx.pk)
                  </a>{" "}
                  ki team 24 ghante mein khud configure karegi.
                </span>
              </p>
            </div>
            <div className="card flex items-start gap-3.5 border-l-2 border-l-luxe p-4 text-[13px]">
              <MessageCircle size={17} className="mt-0.5 shrink-0 text-mint" />
              <p>
                <b>Direct WhatsApp Onboarding:</b>
                <span className="text-mut"> Apna package activate karne ke liye seedha WhatsApp par rabta karein: </span>
                <a
                  href="https://wa.me/923251888841?text=Assalam%20o%20Alaikum!%20Mujhe%20Elan%20Beauty%20Growth%20plan%20activate%20karna%20hai."
                  target="_blank"
                  className="font-extrabold text-mint hover:underline"
                >
                  +92 325 1888841
                </a>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Guardrails + FAQ ────────────────────────────────────────────── */}
      <section className="site-container home-section">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <span className="badge-luxe">
              <ShieldCheck size={12} /> Enterprise Guardrails
            </span>
            <h2 className="mt-3 text-3xl font-extrabold">Bharosa Aur Brand Safety Sab Se Pehle</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-mut">
              Luxury salons ke liye client trust sab se qeemti hai — is liye hamara system zero-spam aur strict privacy principles par kaam karta hai.
            </p>
            <div className="card-luxe-tier mt-6 flex items-start gap-3.5 rounded-2xl p-5">
              <ShieldCheck size={20} className="mt-0.5 shrink-0 text-mint" />
              <p className="text-[13px] leading-relaxed">
                <b>100% Tenant Isolation:</b>{" "}
                <span className="text-mut">
                  Har record par dedicated salon_id + Row Level Security — Salon B ko Salon A ki aik booking bhi nazar nahi aati.
                </span>
              </p>
            </div>
          </Reveal>
          <Reveal group className="grid content-start gap-3 sm:grid-cols-2">
            {NOT_DOING.map((t) => (
              <div key={t} className="reveal-item flex items-start gap-2.5 rounded-xl border border-line bg-raised/70 p-4 text-[12.5px] leading-relaxed">
                <Ban size={14} className="mt-0.5 shrink-0 text-mint" /> {t}
              </div>
            ))}
          </Reveal>
        </div>

        <Reveal className="mt-16">
          <div className="text-center">
            <span className="badge-luxe mx-auto">Frequently Asked Questions</span>
            <h2 className="mt-2.5 text-3xl font-extrabold">Aam Sawalat Ke Jawab</h2>
          </div>
          <div className="home-faq mx-auto mt-8 grid max-w-3xl gap-3.5">
            {FAQS.map((f) => (
              <details key={f.q} className="card group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-extrabold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <Plus size={16} className="shrink-0 text-mint transition-transform group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-[13px] leading-relaxed text-mut">{f.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── Final Luxury Executive CTA Banner ───────────────────────────── */}
      <section className="home-final-cta">
        <div className="site-container">
          <Reveal className="home-final-luxe-box flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5c158]/45 bg-[#e5c158]/15 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#f3d474]">
              <Crown size={12} /> Elan Beauty Suite · Powered by WordbitX
            </span>
            <h2 className="mx-auto mt-4 max-w-2xl font-extrabold">
              Apne Salon Ki Har Missed Call Ko <span className="text-[#f3d474]">Confirmed Booking</span> Mein Badlein
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[13.5px] leading-relaxed text-slate-300">
              Abhi live interactive demo check karein ya{" "}
              <a href="http://wordbitx.pk" target="_blank" className="font-bold text-[#f3d474] underline">
                WordbitX (wordbitx.pk)
              </a>{" "}
              team ke sath WhatsApp par 24-hour setup shuru karein.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3.5">
              <RippleButton href="/demo" variant="luxe">
                <Play size={15} fill="currentColor" /> Live Demo Chalayein
              </RippleButton>
              <RippleButton
                href="https://wa.me/923251888841?text=Assalam%20o%20Alaikum!%20Mujhe%20Elan%20Beauty%20by%20WordbitX%20ke%20baray%20mein%20details%20chahiye."
                variant="brand"
                className="!border-[#e5c158]/50 !bg-white/10 hover:!bg-white/18"
              >
                <MessageCircle size={15} className="text-[#f3d474]" /> WhatsApp · +92 325 1888841
              </RippleButton>
              <RippleButton
                href="http://wordbitx.pk"
                variant="ghost"
                className="!border-white/20 !text-white hover:!bg-white/10"
              >
                WordbitX Official (wordbitx.pk) <ArrowRight size={14} />
              </RippleButton>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[12px] font-semibold text-slate-300">
              <a href="https://wa.me/923251888841" target="_blank" className="inline-flex items-center gap-1.5 hover:text-[#f3d474]">
                <Phone size={12} className="text-[#f3d474]" /> WhatsApp +92 325 1888841
              </a>
              <a href="http://wordbitx.pk" target="_blank" className="inline-flex items-center gap-1.5 font-bold text-[#f3d474] hover:underline">
                Engineered by WordbitX (wordbitx.pk)
              </a>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={12} className="text-[#f3d474]" /> 24-Hour White-Glove Setup
              </span>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
