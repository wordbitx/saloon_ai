import { redirect } from "next/navigation";

/** Admin ab /admin par hai — purana link maintain rahe */
export default function DashboardAdminRedirect() {
  redirect("/admin");
}
