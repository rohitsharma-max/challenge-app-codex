"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { HistoryRecord, UserPreferences } from "@/types/app";

type TodayResponse = {
  today: HistoryRecord;
  metrics: {
    streak: number;
    bestStreak: number;
    xp: number;
    restorableMissedDate?: string;
    restoreDeadline?: string;
  };
  profile: {
    name: string;
    preferences: UserPreferences;
  };
};

export function DashboardClient() {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [proofFileName, setProofFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completed = data?.today.status === "completed";

  const restoreOpen = useMemo(() => {
    if (!data?.metrics.restoreDeadline) return false;
    return new Date(data.metrics.restoreDeadline).getTime() > Date.now();
  }, [data?.metrics.restoreDeadline]);

  async function fetchToday() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/challenges/today");
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Failed to load");
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load challenge");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchToday();
  }, []);

  async function completeChallenge() {
    setBusy(true);
    setError(null);
    setMessage(null);

    const finalProof =
      proofNote.trim() || proofFileName ? `${proofNote.trim()} ${proofFileName ? `(${proofFileName})` : ""}`.trim() : "";

    try {
      const response = await fetch("/api/challenges/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ proofNote: finalProof || undefined })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Failed to complete challenge");

      setMessage(body.xpEarned > 0 ? `Challenge completed. +${body.xpEarned} XP` : "Already completed for today.");
      await fetchToday();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Completion failed");
    } finally {
      setBusy(false);
    }
  }

  async function restoreStreak() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/streak/restore", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Restore failed");
      setMessage(`Streak restored for ${body.cost} XP.`);
      await fetchToday();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Dashboard">
        <div className="card">Loading your daily challenge...</div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell title="Dashboard">
        <div className="card">Unable to load challenge.</div>
      </AppShell>
    );
  }

  const challenge = data.today.challenge;

  return (
    <AppShell title={`Welcome, ${data.profile.name}`}>
      <section className="grid cols-3">
        <div className="card metric">
          <div className="metric-label">Current Streak</div>
          <div className="metric-value">🔥 {data.metrics.streak}</div>
        </div>
        <div className="card metric">
          <div className="metric-label">Best Streak</div>
          <div className="metric-value">{data.metrics.bestStreak}</div>
        </div>
        <div className="card metric">
          <div className="metric-label">XP Points</div>
          <div className="metric-value">⭐ {data.metrics.xp}</div>
        </div>
      </section>

      <section className={`card ${completed ? "celebration" : ""}`}>
        <div className="row">
          <h2 style={{ margin: 0 }}>Today&apos;s Challenge</h2>
          <div className="inline-actions">
            <span className="badge">{challenge.category}</span>
            <span className="badge">{challenge.difficulty}</span>
            <span className="badge">{challenge.outdoor ? "Outdoor" : "Indoor"}</span>
          </div>
        </div>
        <p className="challenge-text">{challenge.text}</p>

        {completed ? (
          <div className="notice">Completed today. Come back tomorrow for a new challenge.</div>
        ) : (
          <div className="form-col">
            <div>
              <div className="label">Optional proof note</div>
              <textarea
                className="textarea"
                value={proofNote}
                onChange={(e) => setProofNote(e.target.value)}
                placeholder="Add quick proof or reflection..."
              />
            </div>
            <div>
              <div className="label">Optional proof upload</div>
              <input
                className="input"
                type="file"
                onChange={(event) => setProofFileName(event.target.files?.[0]?.name ?? "")}
              />
            </div>
            <button className="btn primary" type="button" onClick={completeChallenge} disabled={busy}>
              {busy ? "Updating..." : "Complete Challenge"}
            </button>
          </div>
        )}
      </section>

      {restoreOpen ? (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Restore Missed Streak</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            You missed {data.metrics.restorableMissedDate}. You can restore this streak for 50 XP before{" "}
            {new Date(data.metrics.restoreDeadline as string).toLocaleString()}.
          </p>
          <button className="btn" type="button" onClick={restoreStreak} disabled={busy}>
            Restore Streak (50 XP)
          </button>
        </section>
      ) : null}

      {message ? <div className="card">{message}</div> : null}
      {error ? <div className="card" style={{ color: "var(--danger)" }}>{error}</div> : null}
    </AppShell>
  );
}
