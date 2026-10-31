"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck, Lock, KeyRound, Loader2, ArrowUpRight } from "lucide-react";

type Role = "admin" | "manager" | "reception";

interface AdminState {
  admin: boolean;
  role: Role;
  loading: boolean;
  login: (pin: string, role?: Role) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  deniedMessage: string | null;
  setDeniedMessage: (m: string | null) => void;
}

const Ctx = createContext<AdminState | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState(false);
  const [role, setRole] = useState<Role>("admin");
  const [loading, setLoading] = useState(true);
  const [deniedMessage, setDeniedMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session", { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        setAdmin(Boolean(d.admin));
        if (d.role === "manager" || d.role === "reception" || d.role === "admin") setRole(d.role);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (pin: string, entryRole?: Role) => {
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, role: entryRole ?? "admin" }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setAdmin(true);
      if (d.role === "manager" || d.role === "reception" || d.role === "admin") setRole(d.role);
      setDeniedMessage(null);
      return { ok: true };
    }
    return { ok: false, message: d.message ?? "Login nahi hua." };
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAdmin(false);
    setRole("admin");
  }, []);

  return (
    <Ctx.Provider value={{ admin, role, loading, login, logout, refresh, deniedMessage, setDeniedMessage }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdmin AdminProvider ke andar chalega");
  return ctx;
}

export function AdminLoginCard({ compact = false, role }: { compact?: boolean; role?: Role }) {
  const { login } = useAdmin();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!pin.trim()) return;
    setBusy(true);
    setErr(null);
    const r = await login(pin.trim(), role);
    if (!r.ok) setErr(r.message ?? "PIN ghalat hai");
    setBusy(false);
  };

  return (
    <div className={compact ? "" : "card p-5"}>
      <p className="flex items-center gap-2 text-[13px] font-extrabold">
        <Lock size={15} className="text-accent" /> Admin login
      </p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-mut">
        Full control (add / edit / delete staff, services, chairs, clients, bookings) admin ke paas hai.
        Demo PIN: <b className="text-accent">2468</b>
      </p>
      <div className="mt-3 flex gap-2">
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          type="password"
          inputMode="numeric"
          placeholder="Admin PIN"
          aria-label="Admin PIN"
          className="input max-w-[140px]"
        />
        <button type="button" onClick={submit} disabled={busy} className="btn-brand !px-3.5 !py-2 text-xs">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />} Login
        </button>
      </div>
      {err && <p className="mt-2 text-[11px] font-semibold text-red-400">{err}</p>}
      <Link href="/admin" className="mt-3 inline-flex items-center gap-1 text-[11px] font-extrabold text-accent hover:underline">
        Full Admin Console kholen <ArrowUpRight size={11} />
      </Link>
    </div>
  );
}

export function AdminOnlyNote({ children }: { children?: ReactNode }) {
  const { admin, loading } = useAdmin();
  if (loading) return null;
  if (admin)
    return (
      <p className="flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand-soft px-3 py-1.5 text-[10.5px] font-extrabold text-accent">
        <ShieldCheck size={12} /> Admin access — full CRUD enabled
      </p>
    );
  return (
    <div className="w-full">
      <AdminLoginCard />
      {children}
    </div>
  );
}