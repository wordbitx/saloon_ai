"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, MessageCircle, LayoutDashboard, Settings2, Tags, Menu, X, Mail, Phone, Globe, ShieldCheck, ListChecks, ArrowUpRight, ShoppingBag } from "lucide-react";
import { Logo, ThemeToggle, ScrollProgress } from "@/components/ui";

const NAV = [
  { href: "/", label: "Product", icon: Zap },
  { href: "/#how-it-works", label: "How it works", icon: ListChecks },
  { href: "/demo", label: "Demo Chat", icon: MessageCircle },
  { href: "/products", label: "Shop", icon: ShoppingBag },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/#pricing", label: "Pricing", icon: Tags },
];

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isApp =
    path.startsWith("/dashboard") ||
    path === "/admin" || path.startsWith("/admin/") ||
    path === "/manager" || path.startsWith("/manager/") ||
    path === "/reception" || path.startsWith("/reception/");

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = menuRef.current;
    dialog?.querySelector<HTMLButtonElement>("[data-menu-close]")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "Tab" || !dialog) return;
      const all = Array.from(dialog.querySelectorAll<HTMLElement>('a, button:not([disabled]), input, select, [tabindex="0"]'));
      const first = all[0];
      const last = all.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", key);
      triggerRef.current?.focus();
    };
  }, [open]);

  if (isApp) return null;

  return (
    <>
      <header className="site-header">
        <div className="site-container site-header-inner">
          <Link href="/" aria-label="Elan Beauty home" onClick={() => setOpen(false)} className="site-logo-link">
            <Logo sub />
          </Link>
          <nav className="site-desktop-nav" aria-label="Main navigation">
            {NAV.map((n) => {
              const active = n.href === "/" ? path === "/" : !n.href.includes("#") && path.startsWith(n.href);
              const Icon = n.icon;
              return (
                <Link key={n.href} href={n.href} data-active={active} className="site-nav-link">
                  <Icon size={14} /> {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="site-header-actions">
            <div className="site-theme-control"><ThemeToggle /></div>
            <button
              ref={triggerRef}
              type="button"
              className="site-menu-trigger"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Menu band karein" : "Menu kholen"}
              aria-expanded={open}
              aria-controls="site-mobile-menu"
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
          <ScrollProgress />
        </div>
      </header>

      {open && (
        <div className="site-mobile-menu-layer" id="site-mobile-menu">
          <button type="button" onClick={() => setOpen(false)} className="site-menu-scrim" aria-label="Menu band karein" tabIndex={-1} />
          <div ref={menuRef} className="site-mobile-menu" role="dialog" aria-modal="true" aria-label="Main navigation">
            <div className="site-mobile-menu-heading">
              <div><span className="site-mobile-eyebrow">ELAN BEAUTY</span><p>Explore your workspace</p></div>
              <button type="button" data-menu-close onClick={() => setOpen(false)} aria-label="Menu band karein" className="site-icon-button"><X size={19} /></button>
            </div>
            <nav className="site-mobile-menu-nav" aria-label="Mobile navigation">
              {NAV.map((n) => {
                const Icon = n.icon;
                const active = n.href === "/" ? path === "/" : !n.href.includes("#") && path.startsWith(n.href);
                return (
                  <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="site-mobile-menu-link" data-active={active}>
                    <span className="site-menu-icon"><Icon size={17} /></span>
                    <span>{n.label}</span>
                    <ArrowUpRight size={14} className="ml-auto opacity-40" />
                  </Link>
                );
              })}
              <div className="site-menu-rule" />
              <Link href="/dashboard/settings" onClick={() => setOpen(false)} className="site-mobile-menu-link"><span className="site-menu-icon"><Settings2 size={17} /></span><span>Salon settings</span></Link>
            </nav>
            <div className="site-mobile-menu-footer">
              <p className="flex items-center justify-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand" /> Elan Beauty · Lahore · Setup in 24h</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function isAppChrome(path: string) {
  return (
    path.startsWith("/dashboard") ||
    path === "/admin" || path.startsWith("/admin/") ||
    path === "/manager" || path.startsWith("/manager/") ||
    path === "/reception" || path.startsWith("/reception/")
  );
}

export function SiteFooter() {
  const path = usePathname();
  if (isAppChrome(path)) return null;

  return (
    <footer className="site-footer">
      <div className="site-container site-footer-grid">
        <div className="site-footer-brand">
          <Logo />
          <p>Missed messages. Better conversations. Bookings recovered.</p>
          <p className="site-footer-about">Elan Beauty — Lahore, Pakistan. Salons ke missed messages aur calls ko bookings mein badalne ka poora system.</p>
          <span className="site-footer-assurance"><ShieldCheck size={13} /> Official WhatsApp Cloud API · Phase 2 only</span>
        </div>
        <div className="site-footer-links">
          <h3>PRODUCT</h3>
          <Link href="/demo">Try the demo <ArrowUpRight size={12} /></Link>
          <Link href="/products">Salon shop <ArrowUpRight size={12} /></Link>
          <Link href="/dashboard">Owner dashboard <ArrowUpRight size={12} /></Link>
          <Link href="/dashboard/settings">Salon settings <ArrowUpRight size={12} /></Link>
          <Link href="/#pricing">Plans & pricing <ArrowUpRight size={12} /></Link>
        </div>
        <div className="site-footer-links">
          <h3>GET IN TOUCH</h3>
          <a href="https://elanbeauty.pk" target="_blank" rel="noreferrer"><Globe size={12} /> elanbeauty.pk</a>
          <a href="mailto:info@elanbeauty.pk"><Mail size={12} /> info@elanbeauty.pk</a>
          <a href="tel:+923251888841"><Phone size={12} /> PK +92 325 1888841</a>
          <a href="tel:+19296197699"><Phone size={12} /> USA +1 (929) 619-7699</a>
        </div>
        <div className="site-footer-links site-footer-roadmap">
          <h3>WHAT&apos;S NEXT</h3>
          <p>Phase 2: live WhatsApp, after Meta Business verification and approved templates.</p>
          <p>Instagram DMs · Clinics after 5 paying salons.</p>
        </div>
      </div>
      <div className="site-container site-footer-bottom">
        <p>© {new Date().getFullYear()} Elan Beauty · Missed Booking Recovery</p>
        <p>Made for salons. No guarantees. No spam.</p>
        <span>LAHORE, PAKISTAN <span className="text-accent">↗</span></span>
      </div>
    </footer>
  );
}
