import type { ReactNode } from "react";
import { DashShell } from "@/components/dash/shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashShell>{children}</DashShell>;
}