"use client";

import { useState, useEffect, useCallback } from "react";

export interface ScoreEntry {
  id: string;
  playerName: string;
  totalStrokes: number;
  par: number;
  diff: number;
  holeStrokes: string;
  holesPlayed: number;
  createdAt: string;
}

export function useLeaderboard() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scores", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setScores(data.scores ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submit = useCallback(
    async (payload: {
      playerName: string;
      totalStrokes: number;
      par: number;
      holeStrokes: number[];
      holesPlayed: number;
    }) => {
      try {
        const res = await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to submit");
        await refresh();
        return true;
      } catch {
        return false;
      }
    },
    [refresh]
  );

  return { scores, loading, error, refresh, submit };
}
