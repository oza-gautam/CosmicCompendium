"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ExperimentFit } from "@/types";
import { RotateCcw, Save } from "lucide-react";

export default function SavedFitsPanel({
  experimentId,
  onRestore,
}: {
  experimentId: number;
  onRestore: (params: Record<string, number>) => void;
}) {
  const [fits, setFits] = useState<ExperimentFit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.experiments
      .listFits(experimentId)
      .then(setFits)
      .finally(() => setLoading(false));
  }, [experimentId]);

  if (loading) return <p className="text-xs text-muted">Loading saved fits…</p>;

  if (fits.length === 0)
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">
          Saved Fits
        </p>
        <p className="text-xs text-muted">
          No fits saved yet. Use &ldquo;Save Fit&rdquo; on the analysis page.
        </p>
      </div>
    );

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Save size={13} className="text-accent" />
        <p className="text-xs font-semibold text-muted uppercase tracking-widest">
          Saved Fits
        </p>
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium ml-auto">
          {fits.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {fits.map((fit) => {
          const p = fit.parameters;
          return (
            <div
              key={fit.id}
              className="flex items-center justify-between gap-2 bg-surface-2 rounded-lg px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-primary truncate">
                  {fit.label}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  β={p.beta?.toFixed(4) ?? "—"} · kd={p.kd?.toFixed(4) ?? "—"} ·
                  kp={p.kp?.toFixed(4) ?? "—"} · m={p.m?.toFixed(4) ?? "—"}
                </p>
                <p className="text-xs text-muted/60 mt-0.5">
                  {new Date(fit.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => onRestore(fit.parameters)}
                className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium transition-colors shrink-0"
                title="Restore these parameters"
              >
                <RotateCcw size={11} />
                Restore
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
