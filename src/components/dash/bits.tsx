"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { X, Loader2, AlertTriangle, MessageCircle, Info } from "lucide-react";
import { cn } from "@/components/ui";

/* ── Toast ───────────────────────────────────────────────────────────────── */
export function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((t: string) => {
    setToast(t);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3000);
  }, []);
  const node = toast ? (
    <div className="toast-in fixed bottom-5 left-1/2 z-[90] w-max max-w-[92vw] -translate-x-1/2 rounded-lg border border-brand bg-card px-4 py-2.5 text-[12.5px] font-bold text-ink shadow-lg">
      {toast}
    </div>
  ) : null;
  return { show, node };
}

/* ── Section card ────────────────────────────────────────────────────────── */
export function Panel({
  title,
  subtitle,
  icon,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card overflow-hidden", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div>
            {title && (
              <h2 className="flex items-center gap-2 text-[13px] font-extrabold">
                {icon} {title}
              </h2>
            )}
            {subtitle && <p className="mt-0.5 text-[11px] text-mut">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

/* ── Modal ───────────────────────────────────────────────────────────────── */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className={cn("card max-h-[92vh] w-full overflow-y-auto rounded-b-none sm:rounded-xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-card px-4 py-3">
          <h3 className="text-[13.5px] font-extrabold">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Band karein" className="grid h-8 w-8 place-items-center rounded-lg border border-line text-mut hover:text-ink">
            <X size={15} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/* ── Form field ──────────────────────────────────────────────────────────── */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10.5px] leading-snug text-mut">{hint}</span>}
    </label>
  );
}

/* ── Primary button ──────────────────────────────────────────────────────── */
export function Btn({
  children,
  onClick,
  variant = "brand",
  disabled,
  busy,
  className,
  type = "button",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "brand" | "ghost" | "danger" | "soft";
  disabled?: boolean;
  busy?: boolean;
  className?: string;
  type?: "button" | "submit";
  title?: string;
}) {
  const styles =
    variant === "brand"
      ? "btn-brand"
      : variant === "ghost"
        ? "btn-ghost"
        : variant === "danger"
          ? "inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] font-bold text-red-400 transition-colors hover:bg-red-500/20"
          : "inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand/40 bg-brand-soft px-3 py-2 text-[12px] font-bold text-accent transition-colors hover:bg-brand hover:text-white";
  return (
    <button type={type} onClick={onClick} disabled={disabled || busy} title={title} className={cn(styles, "!py-2 !text-xs", className)}>
      {busy && <Loader2 size={13} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ── Conflict banner (same chair / same time) ────────────────────────────── */
export function ConflictBanner({ message, chairName }: { message: string; chairName?: string | null }) {
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3.5">
      <p className="flex items-center gap-2 text-[12px] font-extrabold text-amber-400">
        <AlertTriangle size={14} /> Slot already booked{chairName ? ` — ${chairName}` : ""}
      </p>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink/90">{message}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent("Assalam o Alaikum! Is slot ke liye rabta kar rahi hoon (demo).")}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-2.5 py-1.5 text-[11px] font-extrabold text-white"
        >
          <MessageCircle size={12} /> Is slot ke liye WhatsApp par rabta
        </a>
        <span className="text-[10.5px] text-mut">warna doosra chair ya slot chunein</span>
      </div>
    </div>
  );
}

export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 rounded-lg border border-dashed border-line bg-raised px-3 py-2 text-[11px] leading-relaxed text-mut">
      <Info size={12} className="mt-0.5 shrink-0 text-accent" /> <span>{children}</span>
    </p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-[12px] text-mut">{children}</p>;
}

export function Tag({ children, tone = "mut" }: { children: ReactNode; tone?: "mut" | "brand" | "amber" | "red" }) {
  const cls =
    tone === "brand"
      ? "bg-brand-soft text-accent border-transparent"
      : tone === "amber"
        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
        : tone === "red"
          ? "bg-red-500/10 text-red-400 border-red-500/30"
          : "bg-raised text-mut border-line";
  return <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide", cls)}>{children}</span>;
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-brand-soft font-extrabold text-accent"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials || "?"}
    </span>
  );
}