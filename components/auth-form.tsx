"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
    const payload = isSignup ? { name, email, password } : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "Request failed");
      }

      const onboardingComplete = Boolean(data?.user?.onboardingComplete);
      router.push(onboardingComplete ? "/dashboard" : "/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-page">
      <div className="card auth-card">
        <h1 style={{ marginTop: 0 }}>{isSignup ? "Create Account" : "Welcome Back"}</h1>
        <p className="muted">
          {isSignup
            ? "Start your daily AI challenges and build a streak."
            : "Log in to continue your challenge streak."}
        </p>

        <form className="form-col" onSubmit={onSubmit}>
          {isSignup ? (
            <div>
              <div className="label">Name</div>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          ) : null}
          <div>
            <div className="label">Email</div>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="label">Password</div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
            />
          </div>

          {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Please wait..." : isSignup ? "Sign Up" : "Login"}
          </button>
        </form>

        <p className="muted" style={{ marginBottom: 0 }}>
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <Link href={isSignup ? "/login" : "/signup"} style={{ color: "var(--primary-strong)" }}>
            {isSignup ? "Login" : "Create account"}
          </Link>
        </p>
      </div>
    </div>
  );
}
