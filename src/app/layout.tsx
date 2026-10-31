import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./premium.css";
import "./dashboard-premium.css";
import { SiteHeader, SiteFooter } from "@/components/site";

export const metadata: Metadata = {
  title: "Missed Booking Recovery — WordbitX",
  description:
    "Salons ke har missed WhatsApp message aur missed call par foran jawab, booking offer, reminder aur waitlist backfill. WordbitX — Lahore, Pakistan.",
};

const themeScript = `(function(){try{var m=localStorage.getItem('wbx-theme')||'dark';var r=m==='system'?(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):m;document.documentElement.dataset.theme=r;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-page font-sans text-ink antialiased">
        {/* Brand ki patli green line — flat, koi gradient nahi */}
        <div className="fixed inset-x-0 top-0 z-[80] h-[2px] bg-brand" aria-hidden />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
