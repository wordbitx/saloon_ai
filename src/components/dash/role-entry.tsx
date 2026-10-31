"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, KeyRound, ArrowLeft, Building2, ArrowUpRight, Delete, CornerDownLeft, Clock,
} from "lucide-react";
import { Logo, ThemeToggle, cn } from "@/components/ui";

type Role = "admin" | "manager" | "reception";

const COPY: Record<Role, { eyebrow: string; title: string; lede: string; features: string[]; redirectTo: string }> = {
  admin: {
    eyebrow: "ADMINISTRATOR ACCESS",
    title: "Full control.\nHar salon ka apna.",
    lede: "Staff, services, chairs, clients, bookings, plan aur settings — sab yahin se. Tenant isolation aktif: aap ko sirf apna salon nazar aayega.",
    features: [
      "Multiple staff, services aur chairs — add / edit / delete",
      "Booking create, reschedule, cancel, delete (chair guard ke sath)",
      "Client profiles, notes aur booking history",
      "Salon settings, plan, PIN aur demo data control",
      "Workspace: salon + branch switching",
    ],
    redirectTo: "/admin",
  },
  manager: {
    eyebrow: "MANAGER ACCESS",
    title: "Salon operations,\nfull day control.",
    lede: "Manager ke liye: chairs, bookings, waitlist, clients, staff aur services — poora din bina ruke. Plan, PIN aur demo reset admin ke hawale.",
    features: [
      "Chair schedule aur double-booking guard",
      "Bookings: add, edit, reschedule, cancel",
      "Waitlist backfill aur client profiles",
      "Staff, services aur salon settings",
      "Owner dashboard aur daily recovery summary",
    ],
    redirectTo: "/dashboard",
  },
  reception: {
    eyebrow: "RECEPTION ACCESS",
    title: "Front desk,\nsirf bookings.",
    lede: "Receptionist ke liye: aaj ki bookings, nayi booking, floor view aur waitlist. Rates badalne, delete karne aur settings ke liye Manager/Admin login karein.",
    features: [
      "Nayi booking — service, chair, slot",
      "Aaj ki bookings: complete / cancel",
      "Floor view: kaun si chair khali hai",
      "Waitlist ko slot offer karna",
      "Demo chat se customer jawab",
    ],
    redirectTo: "/dashboard/bookings",
  },
};

export function RoleEntry({ role }: { role: Role }) {
  const c = COPY[role];
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [session, setSession] = useState<"checking" | "in" | "out">("checking");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        const d = await res.json().catch(() => ({}));
        if (d.admin) {
          setSession("in");
          window.location.replace(c.redirectTo);
          return;
        }
      } catch {
        /* network — treat as logged out */
      }
      setSession("out");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (pin.trim().length < 4 || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim(), role }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(d.message ?? "PIN ghalat hai. Demo PIN: 2468");
        setPin("");
        inputRef.current?.focus();
        return;
      }
      window.location.replace(c.redirectTo);
    } finally {
      setBusy(false);
    }
  };

  const tap = (k: string) => {
    if (k === "del") return setPin((v) => v.slice(0, -1));
    if (k === "ok") return void submit();
    if (pin.length >= 8) return;
    setPin((v) => v + k);
    setErr(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key >= "0" && e.key <= "9") {
        setPin((v) => (v.length >= 8 ? v : v + e.key));
        setErr(null);
      } else if (e.key === "Backspace") {
        setPin((v) => v.slice(0, -1));
      } else if (e.key === "Enter") {
        void submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="admin-shell admin-login-grid">
      <aside className="admin-login-brand">
        <Logo sub />
        <p className="admin-login-eyebrow">{c.eyebrow}</p>
        <h1>
          {c.title.split("\n").map((line, i) => (
            <span key={i} className="block">{line}</span>
          ))}
        </h1>
        <p className="admin-login-lede">{c.lede}</p>
        <ul className="admin-login-list">
          {c.features.map((t) => <li key={t}><span className="h-1 w-1 rounded-full bg-accent" /> {t}</li>)}
        </ul>
        <div className="admin-login-foot">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-accent"><Clock size={12} /> 24h setup · Lahore</span>
        </div>
      </aside>

      <main className="admin-login-panel">
        <div className="admin-login-panel-head">
          <div>
            <p className="text-[13px] font-extrabold">Elan Beauty · {role === "admin" ? "Admin" : role === "manager" ? "Manager" : "Reception"}</p>
            <p className="text-[10.5px] text-mut">Secure entry · {c.eyebrow.toLowerCase()}</p>
          </div>
          <ThemeToggle compact />
        </div>

        {session === "checking" ? (
          <div className="admin-boot"><span className="pulse-dot inline-block h-2 w-2 rounded-full bg-brand" /> Session check…</div>
        ) : (
          <>
            <div className="mt-5 flex items-center justify-between gap-2">
              <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[9.5px] font-extrabold uppercase tracking-wider", role === "admin" ? "bg-brand-soft text-accent" : "border border-line text-mut")}>
                <ShieldCheck size={11} /> {role} login
              </span>
              <span className="text-[10px] text-mut">Demo PIN <b className="text-accent">2468</b></span>
            </div>

            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 8)); setErr(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
              aria-label="Admin PIN"
              className="mt-4 w-full rounded-xl border border-line bg-raised px-4 py-4 text-center text-2xl font-extrabold tracking-[0.5em] text-ink"
              placeholder="••••"
            />

            <div className="mt-4 grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "ok"].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => tap(k)}
                  disabled={busy}
                  aria-label={k === "del" ? "Delete digit" : k === "ok" ? "Login" : `Digit ${k}`}
                  className={cn(
                    "grid h-13 place-items-center rounded-xl border py-3.5 text-base font-extrabold transition-colors disabled:opacity-50",
                    k === "ok" ? "border-brand bg-brand text-white hover:bg-brand/90" : "border-line bg-card text-ink hover:border-brand hover:text-accent",
                  )}
                >
                  {k === "del" ? <Delete size={17} /> : k === "ok" ? <CornerDownLeft size={17} /> : k}
                </button>
              ))}
            </div>

            {err && <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11.5px] font-bold text-red-400">{err}</p>}
            <button type="button" onClick={() => void submit()} disabled={busy || pin.length < 4} className="btn-brand mt-4 w-full !py-3">
              <KeyRound size={14} /> {busy ? "Verifying…" : "Enter workspace"}
            </button>

            <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[10.5px] text-mut">
              <Link href="/" className="inline-flex items-center gap-1 hover:text-accent"><ArrowLeft size={12} /> Product page</Link>
              <Link href="/dashboard" className="inline-flex items-center gap-1 hover:text-accent">Owner view <ArrowUpRight size={12} /></Link>
            </div>
            <p className="mt-3 text-center text-[9.5px] leading-relaxed text-mut">
              Demo session cookie · Production mein Supabase Auth + role claim.<br />
              Sirf Official WhatsApp Cloud API (Phase 2) · koi spam nahi.
            </p>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wider text-mut">
              <Building2 size={11} className="text-accent" /> Elan Beauty · Lahore, Pakistan
            </p>
          </>
        )}
      </main>
    </div>
  );
}
