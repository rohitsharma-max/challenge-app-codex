import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.onboardingComplete ? "/dashboard" : "/onboarding");
  }
  return <AuthForm mode="signup" />;
}
