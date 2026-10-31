import type { ReactNode } from "react";
import { AdminProvider } from "@/components/dash/admin";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminProvider>{children}</AdminProvider>;
}
