"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { HistoryRecord } from "@/types/app";

type HistoryResponse = {
  history: HistoryRecord[];
};

export function HistoryClient() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/history");
        const body = (await response.json()) as HistoryResponse | { error?: string };
        if (!response.ok || !("history" in body)) {
          throw new Error((body as { error?: string }).error ?? "Failed to load history");
        }
        setHistory(body.history);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        setLoading(false);
      }
    }

    void loadHistory();
  }, []);

  return (
    <AppShell title="Challenge History">
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Previous Challenges</h2>
        {loading ? <p>Loading history...</p> : null}
        {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
        {!loading && !error && history.length === 0 ? <p className="muted">No history yet.</p> : null}

        <div className="list">
          {history.map((item) => (
            <article key={item.date} className="history-item">
              <div className="row">
                <strong>{item.date}</strong>
                <span className={`status ${item.status}`}>{item.status.toUpperCase()}</span>
              </div>
              <p style={{ marginBottom: 8 }}>{item.challenge.text}</p>
              <div className="row muted">
                <span>
                  {item.challenge.category} | {item.challenge.difficulty}
                </span>
                <span>XP: +{item.xpEarned}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
