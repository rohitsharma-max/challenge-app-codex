"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

type AppShellProps = {
  title: string;
  children: ReactNode;
};

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" }
];

export function AppShell({ title, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="app-shell">
      <div className="container">
        <header className="topbar">
          <div className="brand">Daily AI Challenge App</div>
          <nav className="nav-links">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${pathname === link.href ? "active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
            <ThemeToggle />
            <button className="btn danger" onClick={logout} type="button">
              Logout
            </button>
          </nav>
        </header>

        <main className="grid" style={{ gap: 16 }}>
          <div>
            <h1 style={{ marginBottom: 0 }}>{title}</h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
