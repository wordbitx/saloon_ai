# Missed Booking Recovery — WordbitX (Phase 1: Sellable Demo)

**WordbitX** — Software Development Company, Lahore, Pakistan
wordbitx.pk · info@wordbitx.pk · PK +92 325 1888841 · USA +1 (929) 619-7699

Salon ke har **missed WhatsApp message aur missed call** par foran jawab, booking offer, reminder, aur
cancellation par **waitlist backfill**. Owner ko roz aik list: **"Aaj kitni booking bachi."**

> **Phase 1 = yeh repo:** simulated demo chat + **responsive admin dashboard** + chair-level double-booking guard.
> Har jagah **SAMPLE DATA** label. Koi live WhatsApp connection **NAHI** (Phase 2 stub), koi "live" ka jhoota dawa **NAHI**.

---

## Local run

```bash
npm install
cp .env.example .env      # DATABASE_URL
npx drizzle-kit push      # tables
npm run dev               # http://localhost:3000
```

Pehli API call par fictional seed data aata hai: **Glow Salon (Demo A)** + **Noor Lounge (Demo B, khaali — isolation proof)**.

## Routes

| Route | Kya hai |
|---|---|
| `/` | Landing — problem, features, pricing (PKR/USD), guardrails, FAQ. Header mein **Admin** button. |
| `/demo` | Simulated WhatsApp chat + **9 one-click scenarios** (incl. same-chair conflict) + owner override |
| `/dashboard` | Overview — KPI counters, 7-day chart, aaj ka chair-wise schedule, waitlist, reviews, activity |
| `/dashboard/floor` | **Chair-by-chair schedule** — har slot par har chair ka status, free slot se booking |
| `/dashboard/bookings` | Bookings CRUD + filters + **chair conflict guard** (409 → WhatsApp CTA + alternate chairs) |
| `/dashboard/waitlist` | **Waitlist** — jin clients ko slot nahi mila unki queue; yahan se manually slot dena (backfill) + history |
| `/dashboard/clients` | Client profiles (visits, spend, notes, preferred stylist, booking history) + CRUD |
| `/dashboard/team` | Multiple staff, role, rating, masked phone, active toggle, chair mapping + CRUD |
| `/dashboard/services` | Services + rates CRUD (chat turant naya rate bolta hai) |
| `/dashboard/chairs` | Chairs / rooms CRUD — double-booking guard inhi par |
| `/dashboard/settings` | Salon settings (naam, area, greeting, timing, band din, review URL, branches, staff/services) + quick test |
| `/admin` | **Admin console (full control)** — PIN keypad login, control room, aur har entity ka CRUD (bookings, schedule, clients, staff, services, chairs, settings) ek hi jagah tabs mein |
| `/dashboard/admin` | `/admin` par redirect (purana link) |
| `/settings` | `/dashboard/settings` par redirect |
| `/api/*` | chat, summary, availability, bookings CRUD, crud/{chairs,staff,services,clients}, admin/session, settings, review, export, isolation-check, demo/reset, whatsapp/webhook stub |

## Responsive dashboard

- **Collapsible sidebar** (desktop: open/close + localStorage yaad; mobile: off-canvas drawer + overlay, route change par auto close)
- Sticky topbar: hamburger, salon switcher, theme (Dark/Light/System), admin state, Admin button, avatar
- Mobile-first grids, horizontally scrollable tables (sticky time column on floor view), bottom-sheet modals on phones

## Admin access (demo)

- `/admin` — admin ka apna full-screen area (public header/footer ke bina). Header, dashboard sidebar aur mobile menu ka **Admin** button wahin jata hai.
- Login **PIN keypad** se hota hai (digits + backspace + clear; keyboard typing bhi chalti hai). Galat PIN par error + shake.
- **Demo PIN: `2468`** (per-salon `admin_pin` column; production mein badlein — admin console se change ho sakta hai)
- Admin = full CRUD: staff (multiple), services, chairs, clients, bookings (add/edit/reschedule/delete), settings, plan, PIN, reset, export
- Owner (non-admin) = read + cancel/complete + review request; mutations API level par **401** dete hain
- Production: Supabase Auth + `app_metadata.salon_id` / role claim (see `supabase/schema.sql`)

## "Source" aur "Waitlist" ka matlab (jo dashboard par likha hai)

**Source = booking aayi kahan se.** Yeh sirf record hai; "Recovered" counter inhi se banta hai:

| Source | Matlab |
|---|---|
| **Chat** | Customer ne khud WhatsApp chat mein booking ki |
| **Recovered** | Missed WhatsApp message ka foran jawab diya — booking wahan se bani |
| **Missed call** | Call miss hui, assistant ne khud WhatsApp kiya — usi se booking |
| **Waitlist** | Slot pehle full tha; khaali hote hi waitlist wale client ko mila |
| **Walk-in** | Salon par khud aa kar book karwaya |
| **Admin** | Owner/admin ne dashboard se manually banayi |

Source Bookings page ke legend mein bhi likha hai, aur booking edit form mein **select** kar ke badla ja sakta hai (admin).

**Waitlist = jin clients ko slot nahi mila unki queue.** Slot full hone par customer yahan aata hai; cancellation ya khaali slot par pehle yehi log offer paate hain — isi ko **waitlist backfill** kehte hain. Chat se bhi khud bharta hai (Booking cancel karein aur dekhein), aur `/dashboard/waitlist` se manually bhi: **Slot dein** → date + slot chunein → chair guard wahan bhi chalta hai.

## Chair-level double-booking guard

- Har booking aik chair lock karti hai — **same chair + same date + same time par doosri booking NAHI** hoti
- Doosri chair par same waqt booking allowed (salon floor reality)
- Conflict par: `409` + message — *"Yeh slot already booked hai (Chair X). Is slot ke liye WhatsApp par rabta karein, warna koi doosra slot book kar lein."* + alternative chairs/times
- Yehi guard chat, booking form, edit/reschedule aur waitlist backfill — sab par chalta hai (`src/lib/availability.ts`)
- Booking form mein **sab slots dikhte hain**: free wale "N free", bhare hue "FULL". Chair chips par live status (`free` / `booked · client · service`).
- Conflict par 3 options: WhatsApp rabta · doosri free chair auto-assign · pehla free slot (us date par sab full hon to agla din suggest hota hai).
- Booking save hote hi filter khud "All" par chala jata hai agar date aaj ke ilawa ho — warna list mein booking "show nahi hoti thi" (yeh fix ho gaya).
- **Demo chat mein calendar icon** 📅: customer khud service → din → slot chun sakta hai. Har chip asli chat flow se guzarti hai — free slot par "khaali hai ✓", FULL slot par *"Yeh slot already booked hai… koi doosra slot book kar lein"*. Band din par "us din band rehte hain". Booking complete hone par suggestions aur calendar dono gaye (stale chips ka bug fix).

## Tenant isolation (non-negotiable)

- Har row par `salon_id`; har query server-side scope
- Cross-tenant API call → **403**, doosre salon ki bookings → **0 rows** (`/api/isolation-check` live tests dashboard + admin mein)
- Demo mein phone hamesha **masked** (`+92 3•• ••••21`), koi email nahi — leak-scan test

## Working vs Stub

**Working:** booking flow (chat + form, chair lock), missed-call one-click, repeat pehchan, cancellation → waitlist backfill, review request, voice-note summary, bridal upsell, staff-wise booking, settings CRUD with live effect, CSV export, admin CRUD + PIN, theme (system live), all motions (reduced-motion respected).

**Stub (Phase 2):** WhatsApp Cloud API send (`src/lib/whatsapp.ts` — tokens hone par bhi Phase 1 mein disabled), webhook processing (`/api/whatsapp/webhook` verify + acknowledge), Supabase Auth wiring, Instagram DM, live multi-branch sync, clinics.

## Owner steps

1. **Supabase:** project → `supabase/schema.sql` (tables + RLS) → Auth on → user `app_metadata.salon_id` → `DATABASE_URL` Supabase URI → `getSessionSalon()` ko Supabase session se replace karein.
2. **Vercel:** import repo → env vars → deploy (preview link Vercel dashboard se).
3. **Meta (Phase 2):** Business verification → Cloud API → approved templates → `WHATSAPP_*` env → webhook subscribe → `src/lib/whatsapp.ts` enable-point uncomment. **Sirf official API; koi spam/unofficial automation nahi.**

## Guardrails

- Fictional demo salon hi (Glow Salon / Noor Lounge) — koi asli naam, number, price invent nahi
- Koi fake testimonial, client count, result ya "guaranteed sales" nahi
- Sample data hamesha labelled; review URL invent nahi — **TODO (owner decision)**
- Koi bulk/cold spam, koi unofficial automation, Meta partnership ka dawa nahi

## Prompt se bahar (chhupaya nahi)

1. Drizzle + local Postgres adapter (sandbox runtime) — Supabase canonical schema sath diya gaya hai.
2. Rule-based chat brain (koi paid AI API nahi) — Phase 2 mein Cloud API inbound isi jagah aayega.
3. Demo admin PIN (cookie-based) — production Auth ke liye placeholder; README mein clearly likha hai.
4. `activity_events` feed, `/api/isolation-check`, `/api/demo/reset`, availability API, demo tenant switcher — acceptance tests ko visible karne ke liye.

## Visual polish (current build)

- Home: premium editorial hero, flat navy/green phone preview (sample-only), clear CTAs, tighter typography, pricing cards and footer polish.
- Dashboard: **one header** — public site header/footer deliberately do not render under `/dashboard/*`.
- Desktop sidebar: open/collapse (saved in localStorage) with clear active state.
- Mobile: off-canvas sidebar + overlay, safe-area spacing, touch targets, Escape to close, focus trapping/restoration, body scroll lock while open.
- Booking, admin, tenant isolation, and live WhatsApp phase logic **unchanged** by this UI-only update.
- Browser checks: `node tests/visual-smoke.mjs` while the preview server is running. For another URL, set `PREVIEW_URL=http://…`.
  - Includes screenshots in `.preview-checks/` (ignored by git).
  - Checks 320 / 390 / 768 / 1024 / 1440px, all themes, header count, overflow, sidebar persistence, keyboard/focus, and route-change close behavior.
  - First local browser setup: `npx playwright install chromium --with-deps` (Linux).
