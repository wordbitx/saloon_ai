"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, CalendarCheck, Users, Scissors, Armchair, UserCog, Settings2, ShieldCheck, Menu, X, ChevronsLeft, ChevronsRight, MessageCircle, LogOut, Building2, ArrowUpRight, ChevronDown, Zap, GitBranch, Clock, ShoppingBag, Package } from "lucide-react";
import {cn, Logo, ThemeToggle} from "@/components/ui";
import { AdminProvider, useAdmin } from "@/components/dash/admin";

const NAV = [
  { group: "Recovery", items: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/floor", label: "Chair Schedule", icon: CalendarDays },
    { href: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck },
    { href: "/dashboard/waitlist", label: "Waitlist", icon: Clock },
    { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
  ]},
  { group: "Salon", items: [
    { href: "/dashboard/clients", label: "Clients", icon: Users },
    { href: "/dashboard/products", label: "Products", icon: Package },
    { href: "/dashboard/team", label: "Staff", icon: UserCog },
    { href: "/dashboard/services", label: "Services", icon: Scissors },
    { href: "/dashboard/chairs", label: "Chairs", icon: Armchair },
  ]},
  { group: "Control", items: [
    { href: "/dashboard/settings", label: "Settings", icon: Settings2 },
    { href: "/admin", label: "Admin Console", icon: ShieldCheck },
  ]},
];

const ROLE_HIDDEN: Record<string, string[]> = {
  reception: ["/dashboard/team", "/dashboard/services", "/dashboard/products", "/dashboard/chairs", "/dashboard/settings", "/admin", "/dashboard/admin"],
  manager: ["/admin", "/dashboard/admin"],
};

function SidebarBody({
  collapsed, onNavigate, onClose, salonName,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
  salonName?: string;
}) {
  const path = usePathname();
  const { admin, role } = useAdmin();
  const hidden = ROLE_HIDDEN[role] ?? [];
  return (
    <>
      <div className="dash-sidebar-brand">
        <Link href="/dashboard" onClick={onNavigate} aria-label="WordbitX Dashboard">
          {collapsed ? <span className="dash-collapsed-brand">W</span> : <Logo sub />}
        </Link>
        {onClose && <button type="button" onClick={onClose} data-drawer-close className="dash-drawer-close" aria-label="Menu band karein"><X size={18} /></button>}
      </div>
      {!collapsed && (
        <div className="dash-workspace-wrap">
          <Link href="/dashboard/settings" className="dash-workspace" onClick={onNavigate}>
            <span className="dash-workspace-icon"><Building2 size={16} /></span>
            <span className="min-w-0 flex-1"><span className="dash-workspace-eyebrow">YOUR WORKSPACE</span><span className="dash-workspace-name">{salonName ?? "Salon workspace"}</span></span>
            <ChevronDown size={12} className="text-mut" />
          </Link>
        </div>
      )}
      <nav className="dash-sidebar-nav chat-scroll" aria-label="Dashboard navigation">
        {NAV.map((g) => (
          <div key={g.group} className="dash-nav-group">
            {!collapsed && <p className="dash-nav-heading">{g.group}</p>}
            <div className="dash-nav-items">
              {g.items.filter((item) => !hidden.includes(item.href)).map((item) => {
                const active = path === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn("dash-nav-link", active && "is-active", collapsed && "is-collapsed")}
                  >
                    <Icon size={17} strokeWidth={1.65} className="shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                    {active && !collapsed && <span className="dash-nav-indicator" aria-hidden />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="dash-sidebar-bottom">
        <Link href="/demo" onClick={onNavigate} className={cn("dash-demo-link", collapsed && "is-collapsed")} title="Demo chat kholen">
          <span className="dash-demo-icon"><MessageCircle size={15} /></span>
          {!collapsed && <span><b>Explore the demo</b><small>Miss se booking tak</small></span>}
          {!collapsed && <ArrowUpRight size={13} className="ml-auto" />}
        </Link>
        <Link href="/admin" onClick={onNavigate} className={cn("dash-sidebar-account", collapsed && "is-collapsed")} title="Owner / Admin profile">
          <span className="dash-account-avatar">{salonName ? salonName.split(" ").slice(0, 2).map((w) => w[0]).join("") : "GS"}</span>
          {!collapsed && <span className="min-w-0"><b>Salon owner</b><small><span className={cn("h-1 w-1 rounded-full", admin ? "bg-accent" : "bg-mut")} /> {admin ? "Admin access ON" : "Admin access OFF"}</small></span>}
          {!collapsed && <ArrowUpRight size={12} className="ml-auto text-mut" />}
        </Link>
        {!collapsed && <div className="dash-sidebar-note"><span>{salonName ? `${salonName.toUpperCase()} · SECURE WORKSPACE` : "YOUR DATA. YOUR CONTROL."}</span></div>}
      </div>
    </>
  );
}

type SessionInfo = {
  active: string;
  branch: string;
  salonName: string;
  salons: { slug: string; name: string; area: string; branches: string[]; plan: string }[];
};

function Topbar({ onMenu, menuOpen, salon }: { onMenu: () => void; menuOpen: boolean; salon: { name: string; area: string; plan: string } | null }) {
  const { admin, role, logout } = useAdmin();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const path = usePathname();

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch("/api/session", { cache: "no-store" });
      if (alive && res.ok) setSession((await res.json()) as SessionInfo);
    })();
    return () => { alive = false; };
  }, [path]);

  const activeSalon = session?.salons.find((x) => x.slug === session.active) ?? null;
  const title = NAV.flatMap((g) => g.items).find((i) => i.href === path)?.label ?? "Dashboard";
  const displayName = activeSalon?.name ?? salon?.name ?? "Salon";
  const area = activeSalon?.area ?? salon?.area ?? "";
  const plan = activeSalon?.plan ?? salon?.plan ?? "";
  const hours = (salon as { hoursLabel?: string } | null)?.hoursLabel ?? "";
  const openState = (() => {
    const sal = salon as { openTime?: string; closeTime?: string; closedDays?: string[] } | null;
    if (!sal?.openTime || !sal?.closeTime) return null;
    const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
    if ((sal.closedDays ?? []).includes(day)) return { open: false, label: "Aaj band" };
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = sal.openTime.split(":").map(Number);
    const [chh, cm] = sal.closeTime.split(":").map(Number);
    const open = mins >= oh * 60 + om && mins < chh * 60 + cm;
    return { open, label: open ? "OPEN NOW" : "CLOSED" };
  })();
  const branches = activeSalon?.branches ?? [];

  const changeWorkspace = async (slug: string) => {
    if (!session || slug === session.active) return;
    setSession({ ...session, active: slug, salonName: slug }); // optimistic — naya salon foran dikhe
    await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
    window.location.reload();
  };

  const changeBranch = async (branch: string) => {
    if (!session || branch === session.branch) return;
    setSession({ ...session, branch });
    await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ branch }) });
    window.location.reload();
  };

  const roleLabel = !admin ? "PUBLIC VIEW" : role === "reception" ? "RECEPTION" : role === "manager" ? "MANAGER" : "ADMIN";

  return (
    <header className="dash-topbar">
      <div className="dash-topbar-inner">
        <button type="button" id="dashboard-menu-trigger" onClick={onMenu} className="dash-menu-trigger" aria-label="Sidebar menu kholen" aria-expanded={menuOpen} aria-controls="dashboard-mobile-drawer"><Menu size={19} /></button>
        <div className="dash-breadcrumb">
          <span className="dash-breadcrumb-root">WORKSPACE</span>
          <span className="dash-breadcrumb-slash" aria-hidden>/</span>
          <p className="dash-page-title">{title}</p>
          <span className="dash-salon-caption">
            <Building2 size={11} className="text-accent" /> {displayName}{area ? ` · ${area}` : ""}
            {hours && <span className="dash-salon-hours">{hours}</span>}
            {plan && <span className="dash-plan-chip">{plan.toUpperCase()}</span>}
          </span>
        </div>
        <div className="dash-topbar-actions">
          {/* Workspace: Salon */}
          <label className="dash-salon-select" title="Workspace (salon) chunein">
            <Building2 size={13} className="text-accent" />
            <select
              value={session ? session.active : ""}
              disabled={!session || session.salons.length === 0}
              onChange={(e) => void changeWorkspace(e.target.value)}
              aria-label="Salon workspace chunein"
            >
              {!session && <option value="">Loading…</option>}
              {session && session.salons.length === 0 && <option value={session.active}>{displayName}</option>}
              {session?.salons.map((x) => (
                <option key={x.slug} value={x.slug}>{x.name}</option>
              ))}
            </select>
          </label>

          {/* Workspace: Branch (agar salon ke paas branches hain) */}
          {branches.length > 0 && (
            <label className="dash-salon-select" title="Branch filter — bookings & summary">
              <GitBranch size={13} className="text-accent" />
              <select
                value={session?.branch ?? "all"}
                disabled={!session}
                onChange={(e) => void changeBranch(e.target.value)}
                aria-label="Branch chunein"
              >
                <option value="all">All branches</option>
                {branches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>
          )}

          {openState && (
            <span className={openState.open ? "dash-open-chip is-open" : "dash-open-chip"} title={openState.label}>
              <span className="h-1.5 w-1.5 rounded-full" /> {openState.label}
            </span>
          )}
          <div className="dash-theme-control"><ThemeToggle compact /></div>
          <span className="dash-role-chip" title={`Role: ${roleLabel}`}>{roleLabel}</span>
          {role === "admin" && admin && (
            <Link href="/admin" className="btn-brand dash-admin-shortcut" aria-label="Admin Console"><ShieldCheck size={14} /><span>Admin</span></Link>
          )}
          {(role === "manager" || role === "reception" || admin) && <button type="button" onClick={() => void logout()} title="Session logout" className="dash-logout-button"><LogOut size={14} /></button>}
          <span className="dash-topbar-avatar" title={displayName}>{displayName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}</span>
        </div>
      </div>
    </header>
  );
}

function ShellInner({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [salon, setSalon] = useState<{ name: string; area: string; plan: string; hoursLabel?: string; openTime?: string; closeTime?: string; closedDays?: string[] } | null>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const path = usePathname();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { if (mq.matches) setOpen(false); };
    mq.addEventListener("change", onResize);
    return () => mq.removeEventListener("change", onResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("wbx-sidebar-collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/summary", { cache: "no-store" });
      if (res.ok) { const d = await res.json(); setSalon(d.salon); }
    })();
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = drawerRef.current;
    dialog?.querySelector<HTMLButtonElement>("[data-drawer-close]")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "Tab" || !dialog) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>("a,button:not([disabled]),input,select,[tabindex='0']"));
      const first = controls[0];
      const last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", key);
      document.getElementById("dashboard-menu-trigger")?.focus();
    };
  }, [open]);

  const toggleCollapsed = () => {
    setCollapsed((v) => { localStorage.setItem("wbx-sidebar-collapsed", v ? "0" : "1"); return !v; });
  };

  return (
    <div className="dash-shell" data-dashboard-shell>
      <aside className={cn("dash-desktop-sidebar", collapsed && "is-collapsed")} aria-label="Dashboard sidebar">
        <SidebarBody collapsed={collapsed} salonName={salon?.name} />
        <button type="button" onClick={toggleCollapsed} className="dash-sidebar-collapse" aria-label={collapsed ? "Sidebar kholen" : "Sidebar band karein"} title={collapsed ? "Sidebar kholen" : "Sidebar band karein"} aria-expanded={!collapsed}>
          {collapsed ? <ChevronsRight size={13} /> : <ChevronsLeft size={13} />}
        </button>
      </aside>

      {open && (
        <div className="dash-drawer-layer" id="dashboard-mobile-drawer">
          <button type="button" onClick={() => setOpen(false)} className="dash-drawer-scrim" aria-label="Sidebar band karein" tabIndex={-1} />
          <aside ref={drawerRef} className="dash-mobile-sidebar" role="dialog" aria-modal="true" aria-label="Dashboard sidebar menu">
            <SidebarBody collapsed={false} onClose={() => setOpen(false)} onNavigate={() => setOpen(false)} salonName={salon?.name} />
          </aside>
        </div>
      )}

      <div className={cn("dash-work-area", collapsed && "is-collapsed")} inert={open || undefined}>
        <Topbar onMenu={() => setOpen(true)} menuOpen={open} salon={salon} />
        <div className="dash-page-content">{children}</div>
        <div className="dash-footer"><span><Zap size={10} className="text-accent" /> WordbitX · Missed Booking Recovery</span><span>Setup in 24h · Lahore</span><Link href="/">Product page <ArrowUpRight size={10} /></Link></div>
      </div>
    </div>
  );
}

export function DashShell({ children }: { children: ReactNode }) {
  return <AdminProvider><ShellInner>{children}</ShellInner></AdminProvider>;
}
