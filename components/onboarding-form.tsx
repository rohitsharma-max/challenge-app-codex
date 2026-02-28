"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Category, Difficulty } from "@/types/app";

const categories: Category[] = ["Fitness", "Productivity", "Learning", "Fun", "Social"];
const difficulties: Difficulty[] = ["Easy", "Medium", "Hard"];

export function OnboardingForm() {
  const router = useRouter();
  const [selected, setSelected] = useState<Category[]>(["Productivity"]);
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [allowOutdoor, setAllowOutdoor] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleCategory(category: Category) {
    setSelected((current) => {
      if (current.includes(category)) {
        return current.filter((c) => c !== category);
      }
      return [...current, category];
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected.length === 0) {
      setError("Pick at least one category.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ categories: selected, difficulty, allowOutdoor })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to save preferences");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="center-page">
      <div className="card auth-card" style={{ width: "min(620px, 100%)" }}>
        <h1 style={{ marginTop: 0 }}>Set Your Daily Challenge Style</h1>
        <p className="muted">
          We generate one personalized challenge per day based on your preferences.
        </p>

        <form className="form-col" onSubmit={onSubmit}>
          <div>
            <div className="label">Interest Categories</div>
            <div className="inline-actions">
              {categories.map((category) => {
                const active = selected.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    className={`btn ${active ? "primary" : ""}`}
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="label">Difficulty</div>
            <select
              className="select"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as Difficulty)}
            >
              {difficulties.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div className="inline-actions">
            <input
              id="outdoor-toggle"
              type="checkbox"
              checked={allowOutdoor}
              onChange={(event) => setAllowOutdoor(event.target.checked)}
            />
            <label htmlFor="outdoor-toggle">Allow outdoor challenges</label>
          </div>

          {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Start My Daily Challenges"}
          </button>
        </form>
      </div>
    </div>
  );
}
