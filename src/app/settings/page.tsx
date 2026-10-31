import { redirect } from "next/navigation";

/** Settings ab dashboard shell ke andar hai (sidebar + admin access ke sath) */
export default function SettingsRedirect() {
  redirect("/dashboard/settings");
}