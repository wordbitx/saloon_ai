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
  Mail,
  Phone,
  Plus,
  LayoutDashboard,
  Armchair,
} from "lucide-react";
import {RippleButton, Reveal, CountUp, Ticker, cn} from "@/components/ui";
import { LandingHero } from "@/components/home/hero";
import { ProductCatalog } from "@/components/shop/catalog";

/* ── Data (sab fictional / prompt se) ────────────────────────────────────── */
const CORE = [
  "Missed message par foran jawab — Roman Urdu + simple English",
  "Salon ki apni list se price / service jawab",
  "Booking flow: service → date → time → naam → confirmation",
  "Booking se pehle reminder",
  "Cancellation par waitlist backfill — khaali slot waitlist ko offer",
  "Owner dashboard: recovered, missed, pending, daily summary + CSV export",
  "Owner override — owner beech mein aaye, assistant peeche hat jaye",
];

const NEW_FEATURES = [
  { icon: PhoneMissed, title: "Missed call → foran WhatsApp", desc: "Call miss ho to customer ko khud message: 'Aap ne call ki thi, booking chahiye?'" },
  { icon: UserCheck, title: "Repeat customer ki pehchan", desc: "'Walaikum Assalam Ayesha! Last time balayage karwaya tha — is baar bhi wohi?'" },
  { icon: Star, title: "Google review request", desc: "Service complete hone par customer ko review ka link jata hai." },
  { icon: Users, title: "Staff-wise booking", desc: "'Hina se hi booking chahiye' — stylist loyalty salons ki jaan hai." },
  { icon: Crown, title: "Bridal / package upsell", desc: "Bridal booking par mehndi / trial ka mashwara — bara ticket, khush customer." },
  { icon: Mic, title: "Voice-note summary", desc: "Customer ka voice note text summary ban kar owner ko milta hai. Assistant khud voice mein baat NAHI karta." },
  { icon: GitBranch, title: "Multi-branch + subah ki brief", desc: "Roz subah aik message: aaj ki bookings, khaali slots, kal ke missed." },
  { icon: Settings2, title: "Editable salon settings", desc: "Naam, services, prices, timing badlein — chat aur dashboard usi waqt badal jate hain." },
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
  "Koi fake testimonial, client count ya result ka dawa nahi",
  "Koi bulk / cold spam messaging nahi — kabhi nahi",
  "Koi unofficial / personal-number WhatsApp automation nahi",
  "Meta partnership ka koi dawa nahi",
  "'Guaranteed sales' jaisi guarantee nahi — demo proof deta hai",
  "Sample data hamesha  label ke sath",
];

const FAQS = [
  {
    q: "Kya ye receptionist ko replace karta hai?",
    a: "Nahi. Receptionist voice calls, guidelines aur mushkil queries mein acha hai — ye product us ka overflow pakarta hai: peak hours mein aik waqt par aik call, raat ko koi nahi, chhutti par koi nahi.",
  },
  {
    q: "WhatsApp Business free app se farq kya hai?",
    a: "Free app sirf greeting / away / quick-reply templates deta hai — har jawab phir bhi insan bhejta hai. Booking, reminder, waitlist aur report wo NAHI karta. Yeh product wohi kaam karta hai.",
  },
  {
    q: "Meta ka Cloud API to khud available hai — product kya hai?",
    a: "Cloud API sirf rasta (pipe) hai. Us ke upar dimagh (jawab + booking flow), setup aur maintenance hi yeh product hai. Phase 2 mein sirf Official Cloud API use hoga — Meta verification + approved templates ke baad.",
  },
  {
    q: "Setup kitni dair mein hota hai?",
    a: "24 ghante mein setup — Elan Beauty ki poori team onboarding karti hai. Optional setup service (PKR 5,000 / $29) mein services, prices aur FAQs hum khud enter karte hain.",
  },
  {
    q: "Mere salon ka data kaun dekh sakta hai?",
    a: "Sirf aap. Har row par salon_id hai aur Row Level Security aisi ke aik salon doosre salon ka data kabhi na dekhe. Dashboard par live isolation tests khud chala kar dekhein.",
  },
  {
    q: "Hamare followers bohat zyada hain — phir bhi zaroorat?",
    a: "Bara following = bara leak, kam zaroorat nahi. Jitne zyada followers, utne zyada missed messages — recovery ki qeemat bhi utni zyada.",
  },
];

export default function LandingPage() {
  const [currency, setCurrency] = useState<"PKR" | "USD">("PKR");

  return (
    <div className="home-page">
      <LandingHero />

      <ProductCatalog limit={5} />

      {/* ── Recovered ticker ────────────────────────────────────────────── */}
      <section className="home-activity py-3.5">
        <div className="site-container">
          <div className="mb-2.5 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-wider text-mut">
            <CalendarCheck size={12} className="text-accent" /> Aaj bachai gayi bookings
            <span className="ml-auto hidden font-medium normal-case sm:inline">Hover par rukta hai</span>
          </div>
          <Ticker
            items={[
              <span key="1"><b className="text-accent">Balayage</b> — Ayesha · 5:30 PM <span className="text-mut">· missed-call se</span></span>,
              <span key="2"><b className="text-accent">Facial</b> — Mahnoor · 3:30 PM <span className="text-mut">· raat ke message se</span></span>,
              <span key="3"><b className="text-accent">Manicure</b> — Komal · kal <span className="text-mut">· waitlist backfill</span></span>,
              <span key="4"><b className="text-accent">Bridal Makeup</b> — booking + trial upsell <span className="text-mut">· voice note se</span></span>,
              <span key="5"><b className="text-accent">Haircut</b> — Hina ke sath <span className="text-mut">· staff loyalty</span></span>,
              <span key="6"><b className="text-accent">Review ★</b> — Fatima ko link gaya <span className="text-mut">· service ke baad</span></span>,
            ]}
          />
        </div>
      </section>

      {/* ── Problem: growth nahi, recovery ──────────────────────────────── */}
      <section className="site-container home-problem grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-accent">Problem</p>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Growth nahi —<br />recovery.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mut">
            Receptionist replace nahi hota — us ka <strong className="text-ink">overflow</strong> pakra jata hai. Jo customer
            pehle jawab deta hai, booking us ki.
          </p>
          <div className="card mt-6 flex items-start gap-3 border-l-2 border-l-brand p-4">
            <TrendingUp size={18} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-[13px] leading-relaxed">
              <strong>Bara following = bara leak.</strong>{" "}
              <span className="text-mut">Jitne zyada followers, utne zyada missed messages — kam zaroorat nahi.</span>
            </p>
          </div>
        </Reveal>
        <Reveal group>
          {[
            { n: "01", t: "Peak hours: aik waqt, aik call", d: "Receptionist line par hai to baaki calls miss — raat ko aur chhutti par to koi hai hi nahi." },
            { n: "02", t: "Customer 3–4 salons ko message karta hai", d: "Jo pehle reply kare, booking us ki. Der se reply = customer doosre salon chala gaya." },
            { n: "03", t: "WhatsApp Business app kaafi nahi", d: "Sirf greeting / away / quick-reply templates — har jawab phir bhi insan bhejta hai. Booking, reminder, waitlist, report? Nahi." },
            { n: "04", t: "Cloud API sirf pipe hai", d: "Meta ka API rasta deta hai — dimagh us ke upar banana parta hai. Dimagh + setup + maintenance = yeh product." },
          ].map((r) => (
            <div key={r.n} className="reveal-item flex gap-5 border-t border-line py-5 first:border-t-0 first:pt-0">
              <span className="text-xl font-extrabold text-accent">{r.n}</span>
              <div>
                <h3 className="text-[15px] font-bold">{r.t}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-mut">{r.d}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="home-section-band home-section">
        <div className="site-container">
          <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-accent">Kaise chalta hai</p>
              <h2 className="mt-2 text-3xl font-extrabold">Miss se report tak — aik hi system</h2>
            </div>
            <RippleButton href="/demo" variant="ghost" className="!py-2 text-xs">
              Khud chala kar dekhein <ArrowRight size={13} />
            </RippleButton>
          </Reveal>
          <Reveal group className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: PhoneMissed, t: "Message / call miss hua", d: "Peak hour, raat ya chhutti — system ne pakar liya." },
              { icon: MessageCircle, t: "Foran jawab gaya", d: "Roman Urdu + simple English, salon ki apni prices ke sath." },
              { icon: CalendarCheck, t: "Booking flow chala", d: "Service → date → time → naam → confirmation + reminder." },
              { icon: ClipboardList, t: "Owner ko roz list", d: "'Aaj kitni booking bachi' — dashboard, summary aur CSV." },
            ].map((s, i) => (
              <div key={s.t} className="reveal-item relative rounded-xl border border-line bg-page p-5">
                <span className="absolute right-4 top-4 text-[11px] font-extrabold text-mut">{i + 1}/4</span>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-accent">
                  <s.icon size={18} />
                </span>
                <h3 className="mt-4 text-sm font-bold">{s.t}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-mut">{s.d}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Dashboard / admin strip ─────────────────────────────────────── */}
      <section className="site-container home-section">
        <Reveal group className="grid gap-4 md:grid-cols-3">
          <div className="reveal-item card flex flex-col p-5">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-accent"><LayoutDashboard size={18} /></span>
            <h3 className="mt-3 text-[15px] font-extrabold">Aap ka poora salon — aik dashboard</h3>
            <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-mut">
              Responsive sidebar (open/close), overview, chair-by-chair floor view, bookings, clients, staff, services, chairs aur settings — mobile par bhi.
            </p>
            <RippleButton href="/dashboard" variant="ghost" className="mt-4 !py-2 text-xs">Dashboard kholen <ArrowRight size={12} /></RippleButton>
          </div>
          <div className="reveal-item card flex flex-col p-5">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-accent"><Armchair size={18} /></span>
            <h3 className="mt-3 text-[15px] font-extrabold">Chair-level double-booking guard</h3>
            <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-mut">
              Same chair + same time par doosri booking NAHI. Conflict par customer ko WhatsApp par rabta karne ka mashwara, warna doosra free slot.
            </p>
            <RippleButton href="/dashboard/floor" variant="ghost" className="mt-4 !py-2 text-xs">Floor view dekhein <ArrowRight size={12} /></RippleButton>
          </div>
          <div className="reveal-item card flex flex-col p-5">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-accent"><ShieldCheck size={18} /></span>
            <h3 className="mt-3 text-[15px] font-extrabold">Admin console — full access</h3>
            <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-mut">
              Admin har cheez CRUD kar sakta hai: multiple staff, services, chairs, clients, bookings. Owner view read-only. /admin par login — demo PIN 2468.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="site-container home-section">
        <Reveal>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-accent">Features — sab shamil</p>
          <h2 className="mt-2 max-w-xl text-3xl font-extrabold sm:text-4xl">Core har plan mein. Naye features owner ko impress karne ke liye.</h2>
        </Reveal>

        <div className="mt-9 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal className="card p-6">
            <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-mut">
              <ListChecks size={15} className="text-accent" /> Core — har plan mein
            </h3>
            <ul className="mt-4 grid gap-3">
              {CORE.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed">
                  <Check size={15} className="mt-0.5 shrink-0 text-accent" />
                  {c}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-line bg-raised px-3.5 py-2.5 text-[12px] text-mut">
              <Camera size={14} className="shrink-0 text-accent" />
              Instagram DM coverage — <b className="text-ink">Phase 2</b> mein (abhi nahi).
            </div>
          </Reveal>

          <Reveal group className="grid gap-3 sm:grid-cols-2">
            {NEW_FEATURES.map((f) => (
              <div key={f.title} className="reveal-item card p-4 transition-colors hover:border-brand/50">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-accent">
                  <f.icon size={16} />
                </span>
                <h4 className="mt-3 text-[13.5px] font-bold">{f.title}</h4>
                <p className="mt-1 text-[12px] leading-relaxed text-mut">{f.desc}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Owner control + WordbitX service ────────────────────────────── */}
      <section className="home-section-band home-section">
        <div className="site-container grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-accent">Owner control</p>
            <h2 className="mt-2 text-3xl font-extrabold">Owner hamesha control mein — assistant peeche</h2>
            <ul className="mt-5 grid gap-3 text-[13.5px]">
              {[
                "Owner jab chahe beech mein aa jaye — assistant usi waqt peeche hat jata hai",
                "Har reply owner ko nazar aata hai — kuch chhupta nahi",
                "Roz aik summary: 'Aaj kitni booking bachi' — subah ki brief ke sath",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0 text-accent" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Clock, t: "24 ghante mein setup" },
                { icon: Users, t: "Poori team ki support" },
                { icon: FileText, t: "Monthly report" },
                { icon: Rocket, t: "Proper onboarding" },
              ].map((s) => (
                <div key={s.t} className="rounded-lg border border-line bg-page p-3 text-center">
                  <s.icon size={16} className="mx-auto text-accent" />
                  <p className="mt-2 text-[11px] font-bold leading-tight">{s.t}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] text-mut">Elan Beauty — salons ke liye banaya gaya complete booking &amp; recovery system.</p>
          </Reveal>

          <Reveal delay={120}>
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <p className="text-[13px] font-bold">Aaj ki summary — Elan Beauty</p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
                {[
                  { v: 3, l: "Recovered" },
                  { v: 2, l: "Pending replies" },
                  { v: 1, l: "Review gaya" },
                ].map((s) => (
                  <div key={s.l} className="px-4 py-4 text-center">
                    <CountUp value={s.v} className="text-3xl font-extrabold text-accent" />
                    <p className="mt-1 text-[10.5px] font-semibold text-mut">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4">
                <p className="text-[13px] leading-relaxed text-mut">
                  “Aaj <b className="text-ink">3 bookings bachi</b>. 6 missed messages mein se 2 abhi pending. Waitlist par 2
                  customers — cancellation hote hi slot offer ho jayega.”
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-raised px-2.5 py-1.5 text-[11px] font-bold">
                    <Download size={12} className="text-accent" /> CSV export
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-raised px-2.5 py-1.5 text-[11px] font-bold">
                    <BellRing size={12} className="text-accent" /> Reminders on
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-raised px-2.5 py-1.5 text-[11px] font-bold">
                    <GitBranch size={12} className="text-accent" /> 2 branches
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="site-container home-section scroll-mt-24">
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
          <div className="mt-5 inline-flex rounded-lg border border-line bg-raised p-1" role="group" aria-label="Currency">
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
                <span className="text-sm font-semibold text-mut">/month</span>
              </p>
              <ul className="mt-5 grid flex-1 gap-2.5">
                {p.base && (
                  <li className="flex items-start gap-2 text-[13px] font-bold text-mint">
                    <Check size={14} className="mt-0.5 shrink-0 text-accent" /> {p.base} +
                  </li>
                )}
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px]">
                    <Check size={14} className="mt-0.5 shrink-0 text-accent" /> {f}
                  </li>
                ))}
              </ul>
              <RippleButton
                href={`mailto:info@elanbeauty.pk?subject=Elan%20Beauty%20—%20${p.name}%20plan%20enquiry`}
                variant={p.popular ? "brand" : "ghost"}
                className="mt-6 w-full"
              >
                {p.popular ? (
                  <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#e5c458] bg-gradient-to-r from-[#d4af37] to-[#b68919] px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#091224] shadow-md">
                    <Crown size={11} /> Most Popular · Recommended
                  </span>
                ) : (
                  <span className="w-fit rounded-md border border-line bg-raised px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-mint">
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
              <b>Optional setup: PKR 5,000 / $29</b>
              <span className="text-mut"> — services, prices aur FAQs Elan Beauty team khud enter karegi.</span>
            </p>
          </div>
          <div className="card flex items-start gap-3.5 border-l-2 border-l-luxe p-4 text-[13px]">
            <MessageCircle size={17} className="mt-0.5 shrink-0 text-mint" />
            <p>
              <b>Phase 1 mein checkout nahi</b>
              <span className="text-mut"> — sale enquiry par hoti hai: </span>
              <a href="mailto:info@elanbeauty.pk" className="font-bold text-accent hover:underline">info@elanbeauty.pk</a>
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── Guardrails ──────────────────────────────────────────────────── */}
      <section className="home-section-band home-section">
        <div className="site-container grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-accent">Guardrails — non-negotiable</p>
            <h2 className="mt-2 text-3xl font-extrabold">Hum kya NAHI karte</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-mut">
              Bharosa feature list se bara hai. Is liye jo hum nahi karte, woh bhi likha hai — taake aap ka brand mehfooz rahe.
            </p>
            <div className="card mt-6 flex items-start gap-3 border-l-2 border-l-brand p-4">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-accent" />
              <p className="text-[13px] leading-relaxed">
                <b>Tenant isolation:</b>{" "}
                <span className="text-mut">
                  Har row par salon_id + Row Level Security — Salon B ko Salon A ki aik booking bhi nazar nahi aati. Dashboard
                  par live tests mojood hain.
                </span>
              </p>
            </div>
          </Reveal>
          <Reveal group className="grid content-start gap-3 sm:grid-cols-2">
            {NOT_DOING.map((t) => (
              <div key={t} className="reveal-item flex items-start gap-2.5 rounded-lg border border-line bg-page p-3.5 text-[12.5px] leading-relaxed">
                <Ban size={14} className="mt-0.5 shrink-0 text-accent" /> {t}
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Phases + FAQ ────────────────────────────────────────────────── */}
      <section className="site-container home-section">
        <Reveal group className="grid gap-5 md:grid-cols-2">
          <div className="reveal-item card border-l-2 border-l-brand p-6">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-accent">Phase 1 — abhi (yeh demo)</p>
            <h3 className="mt-2 text-xl font-extrabold">Sellable demo</h3>
            <ul className="mt-4 grid gap-2 text-[13px] text-mut">
              <li>• Simulated demo chat + owner dashboard</li>
              <li>• Editable salon settings — live asar</li>
              <li>• Pricing + brand strip</li>
              <li>• Har jagah  label — koi 'live' ka jhoota dawa nahi</li>
            </ul>
          </div>
          <div className="reveal-item card p-6">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-mut">Phase 2 — structure ab, connection baad mein</p>
            <h3 className="mt-2 text-xl font-extrabold">Live WhatsApp Cloud API</h3>
            <ul className="mt-4 grid gap-2 text-[13px] text-mut">
              <li>• Meta Business verification + approved templates ke baad hi</li>
              <li>• Webhook stub + send-message structure abhi se mojood</li>
              <li>• Instagram DM coverage</li>
              <li>• Clinics — sirf 5 paying salons ke baad</li>
            </ul>
          </div>
        </Reveal>

        <Reveal className="mt-14">
          <h2 className="text-center text-3xl font-extrabold">Aam sawal</h2>
          <div className="home-faq mx-auto mt-7 grid max-w-3xl gap-3">
            {FAQS.map((f) => (
              <details key={f.q} className="card group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-bold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <Plus size={16} className="shrink-0 text-accent transition-transform group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-[13px] leading-relaxed text-mut">{f.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="home-final-cta">
        <div className="site-container flex flex-col items-center gap-6 text-center">
          <Reveal>
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold sm:text-4xl">
              Apne salon ka leak <span className="text-accent">khud dekhein</span> — demo mein.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-mut">
              Pehla buyer sirf Lahore ke salons hain. Demo ka kaam proof dena hai — guarantee nahi.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <RippleButton href="/demo">
                <Play size={15} /> Abhi demo chalayein
              </RippleButton>
              <RippleButton href="mailto:info@elanbeauty.pk?subject=Elan%20Beauty%20enquiry" variant="ghost">
                <Mail size={15} /> info@elanbeauty.pk
              </RippleButton>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[12px] font-semibold text-mut">
              <a href="https://wa.me/923251888841" target="_blank" className="inline-flex items-center gap-1.5 hover:text-mint">
                <Phone size={12} className="text-mint" /> WhatsApp +92 325 1888841
              </a>
              <a href="http://wordbitx.pk" target="_blank" className="inline-flex items-center gap-1.5 font-bold text-mint hover:underline">
                Powered by WordbitX (wordbitx.pk)
              </a>
              <span className="inline-flex items-center gap-1.5"><Clock size={12} className="text-mint" /> Setup: 24 ghante</span>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}