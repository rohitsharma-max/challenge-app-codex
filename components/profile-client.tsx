"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Category, Difficulty, User } from "@/types/app";

type MeResponse = {
  user: Pick<User, "id" | "name" | "email" | "onboardingComplete" | "preferences" | "xp" | "streak">;
};

const categories: Category[] = ["Fitness", "Productivity", "Learning", "Fun", "Social"];
const difficulties: Difficulty[] = ["Easy", "Medium", "Hard"];

export function ProfileClient() {
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [allowOutdoor, setAllowOutdoor] = useState(true);

  async function loadMe() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/user/me");
      const body = (await response.json()) as MeResponse | { error?: string };
      if (!response.ok || !("user" in body)) {
        throw new Error((body as { error?: string }).error ?? "Failed to load profile");
      }
      setUser(body.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMe();
  }, []);

  useEffect(() => {
    if (!user?.preferences) return;
    setSelectedCategories(user.preferences.categories);
    setDifficulty(user.preferences.difficulty);
    setAllowOutdoor(user.preferences.allowOutdoor);
  }, [user]);

  function toggleCategory(category: Category) {
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category]
    );
  }

  async function savePreferences() {
    if (selectedCategories.length === 0) {
      setError("Select at least one category.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          categories: selectedCategories,
          difficulty,
          allowOutdoor
        })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to update preferences");
      }
      setNotice("Preferences updated.");
      await loadMe();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update preferences");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Profile">
      {loading ? <section className="card">Loading profile...</section> : null}
      {error ? (
        <section className="card" style={{ color: "var(--danger)" }}>
          {error}
        </section>
      ) : null}

      {user ? (
        <>
          <section className="grid cols-2">
            <div className="card">
              <h2 style={{ marginTop: 0 }}>{user.name}</h2>
              <p className="muted">{user.email}</p>
              <p>Total XP: {user.xp}</p>
              <p>Current Streak: {user.streak.current}</p>
              <p>Best Streak: {user.streak.best}</p>
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Edit Preferences</h3>
              <div className="form-col">
                <div>
                  <div className="label">Categories</div>
                  <div className="inline-actions">
                    {categories.map((category) => {
                      const active = selectedCategories.includes(category);
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
                    id="profile-allow-outdoor"
                    type="checkbox"
                    checked={allowOutdoor}
                    onChange={(event) => setAllowOutdoor(event.target.checked)}
                  />
                  <label htmlFor="profile-allow-outdoor">Allow outdoor challenges</label>
                </div>

                <button className="btn primary" type="button" onClick={savePreferences} disabled={saving}>
                  {saving ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </div>
          </section>
          {notice ? <section className="card">{notice}</section> : null}
        </>
      ) : null}
    </AppShell>
  );
}
