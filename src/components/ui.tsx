"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Link from "next/link";
import { Moon, Sun, Monitor, ChevronDown, Check } from "lucide-react";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ── Ripple button ───────────────────────────────────────────────────────── */
export function RippleButton({
  children,
  className,
  onClick,
  href,
  disabled,
  variant = "brand",
  title,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  variant?: "brand" | "ghost" | "luxe";
  title?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  const spawn = useCallback((e: ReactPointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const span = document.createElement("span");
    span.className = "ripple-ink";
    span.style.width = span.style.height = `${size}px`;
    span.style.left = `${e.clientX - rect.left - size / 2}px`;
    span.style.top = `${e.clientY - rect.top - size / 2}px`;
    el.appendChild(span);
    window.setTimeout(() => span.remove(), 600);
  }, []);

  const cls = cn(
    variant === "brand" ? "btn-brand" : variant === "luxe" ? "btn-luxe" : "btn-ghost",
    className,
  );

  if (href) {
    const isExternal = /^https?:\/\//i.test(href);
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener"
          ref={ref as never}
          className={cls}
          title={title}
          onPointerDown={spawn}
          onClick={onClick}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href}
        ref={ref as never}
        className={cls}
        title={title}
        onPointerDown={spawn}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }
  return (
    <button
      ref={ref as never}
      type="button"
      className={cls}
      title={title}
      disabled={disabled}
      onPointerDown={spawn}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/* ── Scroll reveal ───────────────────────────────────────────────────────── */
export function Reveal({
  children,
  className,
  delay = 0,
  group = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  group?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            el.classList.add("is-in");
            io.disconnect();
          }
        });
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={cn(group ? "reveal-group" : "reveal", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* ── Headline: lafz ba lafz uthta hai ────────────────────────────────────── */
export function Words({ text, className, baseDelay = 0 }: { text: string; className?: string; baseDelay?: number }) {
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="word-mask">
          <span className="word-inner" style={{ animationDelay: `${baseDelay + i * 85}ms` }}>
            {w}
          </span>
          {i < text.split(" ").length - 1 ? <span>&nbsp;</span> : null}
        </span>
      ))}
    </span>
  );
}

/* ── Animated counter ────────────────────────────────────────────────────── */
export function CountUp({
  value,
  className,
  duration = 900,
  suffix = "",
}: {
  value: number;
  className?: string;
  duration?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const animate = () => {
      if (reduced) {
        setDisplay(value);
        fromRef.current = value;
        return;
      }
      const from = fromRef.current;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = Math.round(from + (value - from) * eased);
        setDisplay(v);
        if (p < 1) requestAnimationFrame(tick);
        else fromRef.current = value;
      };
      requestAnimationFrame(tick);
    };

    if (startedRef.current) {
      animate();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          startedRef.current = true;
          animate();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString("en-PK")}
      {suffix}
    </span>
  );
}

/* ── Ticker (hover par pause) ────────────────────────────────────────────── */
export function Ticker({ items }: { items: ReactNode[] }) {
  return (
    <div className="ticker" aria-label="Recovered bookings ticker (sample data)">
      <div className="ticker-track py-1">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex gap-3" aria-hidden={dup === 1}>
            {items.map((item, i) => (
              <div key={i} className="card flex items-center gap-2 px-3.5 py-2 text-xs whitespace-nowrap">
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Theme: Light / Dark / System Dropdown ───────────────────────────────── */
type ThemeMode = "light" | "dark" | "system";
const THEME_STORAGE_KEY = "elan-theme";

function applyTheme(mode: ThemeMode) {
  const resolved =
    mode === "system"
      ? window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
      : mode;
  document.documentElement.dataset.theme = resolved;
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null) ?? "light";
    setMode(saved);
    applyTheme(saved);
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if ((localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null) === "system") applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pick = (m: ThemeMode) => {
    setMode(m);
    localStorage.setItem(THEME_STORAGE_KEY, m);
    applyTheme(m);
    setOpen(false);
  };

  const opts: { key: ThemeMode; icon: ReactNode; label: string }[] = [
    { key: "light", icon: <Sun size={14} />, label: "Light" },
    { key: "dark", icon: <Moon size={14} />, label: "Dark" },
    { key: "system", icon: <Monitor size={14} />, label: "System" },
  ];

  const activeOpt = opts.find((o) => o.key === mode) ?? opts[0];

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Theme switcher"
        title={`Theme: ${activeOpt.label}`}
        className="flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[11.5px] font-semibold text-ink transition-colors hover:border-brand hover:bg-raised"
      >
        <span className="text-accent">{activeOpt.icon}</span>
        {!compact && <span className="hidden sm:inline">{activeOpt.label}</span>}
        <ChevronDown size={12} className={cn("text-mut transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Select theme"
          className="absolute right-0 top-[calc(100%+6px)] z-[120] min-w-[136px] rounded-xl border border-line bg-card p-1 shadow-xl"
        >
          {opts.map((o) => {
            const isSelected = mode === o.key;
            return (
              <button
                key={o.key}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                title={`${o.label} theme`}
                onClick={() => pick(o.key)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] font-semibold transition-colors",
                  isSelected ? "bg-brand-soft text-accent" : "text-ink hover:bg-raised",
                )}
              >
                <span className={isSelected ? "text-accent" : "text-mut"}>{o.icon}</span>
                <span className="flex-1">{o.label}</span>
                {isSelected && <Check size={13} className="text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Scroll progress bar ─────────────────────────────────────────────────── */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      ref={ref}
      className="absolute inset-x-0 bottom-[-1px] h-[2px] origin-left bg-brand"
      style={{ transform: "scaleX(0)" }}
      aria-hidden
    />
  );
}

/* ── Phone 3D tilt (sirf fine pointers par) ──────────────────────────────── */
export function PhoneTilt({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: ReactMouseEvent) => {
    const el = ref.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 6}deg)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "rotateY(0deg) rotateX(0deg)";
  };

  return (
    <div className={cn("tilt-wrap", className)} onMouseMove={onMove} onMouseLeave={onLeave}>
      <div ref={ref} className="tilt-body">
        {children}
      </div>
    </div>
  );
}

/* ── Brand logo: Elan Beauty ─────────────────────────────────────────────── */
export function Logo({ sub = false }: { sub?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-white font-extrabold text-[15px] shadow-xs">
        E
      </span>
      <span className="leading-none">
        <span className="block text-[15px] font-extrabold tracking-tight text-ink">
          Elan <span className="text-accent">Beauty</span>
        </span>
        {sub && <span className="mt-0.5 block text-[9.5px] font-semibold uppercase tracking-[0.14em] text-mut">Salon & Studio</span>}
      </span>
    </span>
  );
}


/* ── Toggle switch ───────────────────────────────────────────────────────── */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
        checked ? "border-brand bg-brand" : "border-line bg-raised",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-all",
          checked ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
}
