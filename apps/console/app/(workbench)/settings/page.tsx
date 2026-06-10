import { redirect } from "next/navigation";
import { AI_INFRASTRUCTURE_PATH } from "@/lib/settings-nav";

export default function SettingsPage() {
  redirect(AI_INFRASTRUCTURE_PATH);
}
