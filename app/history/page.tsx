import { redirect } from "next/navigation";
import { HistoryClient } from "@/components/history-client";
import { getCurrentUser } from "@/lib/auth";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingComplete) redirect("/onboarding");

  return <HistoryClient />;
}
