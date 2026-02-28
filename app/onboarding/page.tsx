import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { getCurrentUser } from "@/lib/auth";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.onboardingComplete) redirect("/dashboard");

  return <OnboardingForm />;
}
