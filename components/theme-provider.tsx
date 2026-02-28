"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem("daily-theme");
    const theme = saved === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  return <>{children}</>;
}
