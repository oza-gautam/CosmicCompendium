"use client";

import type { QualityScore } from "@/types";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

interface Props {
  qs: QualityScore;
}

const ratingColor: Record<string, string> = {
  Excellent: "text-emerald-400",
  Good: "text-blue-400",
  Fair: "text-yellow-400",
  Poor: "text-red-400",
};

const ratingBg: Record<string, string> = {
  Excellent: "bg-emerald-500/10 border-emerald-500/30",
  Good: "bg-blue-500/10 border-blue-500/30",
  Fair: "bg-yellow-500/10 border-yellow-500/30",
  Poor: "bg-red-500/10 border-red-500/30",
};

function CategoryBar({
  label,
  score,
  max,
}: {
  label: string;
  score: number;
  max: number;
}) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 55 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono text-slate-300">
          {score.toFixed(0)}/{max}
        </span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function QualityScoreCard({ qs }: Props) {
  return (
    <div className="space-y-4">
      {/* Score gauge */}
      <div
        className={`rounded-xl border p-4 text-center ${ratingBg[qs.rating] ?? "bg-slate-800/60 border-slate-700"}`}
      >
        <div
          className={`text-5xl font-bold tabular-nums ${ratingColor[qs.rating] ?? "text-slate-200"}`}
        >
          {qs.score.toFixed(0)}
        </div>
        <div
          className={`text-sm font-semibold mt-1 ${ratingColor[qs.rating] ?? "text-slate-400"}`}
        >
          {qs.rating}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">out of 100</div>
      </div>

      {/* Category breakdown */}
      <div className="bg-slate-900/60 rounded-lg p-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Category Breakdown
        </p>
        <CategoryBar label="Data Quality" score={qs.data_quality} max={20} />
        <CategoryBar
          label="Optimization"
          score={qs.optimization_quality}
          max={20}
        />
        <CategoryBar
          label="Statistical Fit"
          score={qs.statistical_quality}
          max={30}
        />
        <CategoryBar
          label="Scientific"
          score={qs.scientific_quality}
          max={30}
        />
      </div>

      {/* Strengths */}
      {qs.strengths.length > 0 && (
        <div className="bg-slate-900/60 rounded-lg p-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Strengths
          </p>
          <ul className="space-y-1">
            {qs.strengths.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-emerald-400"
              >
                <CheckCircle size={12} className="mt-0.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {qs.weaknesses.length > 0 && (
        <div className="bg-slate-900/60 rounded-lg p-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Weaknesses
          </p>
          <ul className="space-y-1">
            {qs.weaknesses.map((w, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-red-400"
              >
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Deductions */}
      {qs.deductions.length > 0 && (
        <div className="bg-slate-900/60 rounded-lg p-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Deductions
          </p>
          <ul className="space-y-1.5">
            {qs.deductions.map((d, i) => (
              <li key={i} className="text-xs text-slate-400">
                <span className="text-red-400 font-mono font-semibold">
                  -{d.points}
                </span>
                <span className="text-slate-500 mx-1">·</span>
                <span className="text-slate-500">[{d.category}]</span>{" "}
                {d.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {qs.recommendations.length > 0 && (
        <div className="bg-slate-900/60 rounded-lg p-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Recommendations
          </p>
          <ul className="space-y-1">
            {qs.recommendations.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-blue-300"
              >
                <Info size={12} className="mt-0.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
