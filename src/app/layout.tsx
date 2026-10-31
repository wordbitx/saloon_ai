import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./premium.css";
import "./dashboard-premium.css";
import { SiteHeader, SiteFooter } from "@/components/site";

export const metadata: Metadata = {
  title: "Elan Beauty — Salon Booking & Missed Call Recovery",
  description:
    "Elan Beauty — Salons ke har missed WhatsApp message aur missed call par foran jawab, booking offer, reminder aur waitlist backfill.",
};

const themeScript = `(function(){try{var m=localStorage.getItem('elan-theme')||'light';var r=m==='system'?(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):m;document.documentElement.dataset.theme=r;}catch(e){document.documentElement.dataset.theme='light';}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-page font-sans text-ink antialiased">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
