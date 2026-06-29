"use client";

import type { FitResult } from "@/types";

interface Props {
  fit: FitResult;
}

function Stat({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-secondary">{label}</span>
      <span
        className={`text-xs font-mono font-semibold ${good === true ? "text-emerald-400" : good === false ? "text-red-400" : "text-primary"}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function StatisticsPanel({ fit }: Props) {
  const s = fit.statistics;
  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-lg p-3">
        <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
          Fit Quality
          <span className="ml-1.5 text-muted normal-case font-normal">
            (log₁₀ space)
          </span>
        </p>
        <Stat
          label="R² (log)"
          value={s.r_squared.toFixed(4)}
          good={s.r_squared >= 0.95}
        />
        <Stat
          label="Adj. R² (log)"
          value={s.adj_r_squared.toFixed(4)}
          good={s.adj_r_squared >= 0.93}
        />
        <Stat label="RMSE (log₁₀)" value={s.rmse.toFixed(4)} />
        <Stat label="MAE (log₁₀)" value={s.mae.toFixed(4)} />
      </div>

      <div className="bg-surface rounded-lg p-3">
        <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
          Information Criteria
        </p>
        <Stat label="AIC" value={s.aic.toFixed(2)} />
        <Stat label="BIC" value={s.bic.toFixed(2)} />
        <Stat label="Log-Likelihood" value={s.log_likelihood.toFixed(3)} />
        <Stat label="SSE" value={s.sse.toExponential(3)} />
      </div>

      <div className="bg-surface rounded-lg p-3">
        <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
          Parameters
        </p>
        {fit.parameters.map((p) => (
          <div
            key={p.name}
            className="py-1.5 border-b border-border last:border-0"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-accent">{p.name}</span>
              <span className="text-xs font-mono font-semibold text-primary">
                {p.value.toPrecision(5)}
              </span>
            </div>
            {p.std_error != null && (
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-xs text-muted">± SE</span>
                <span className="text-xs font-mono text-secondary">
                  {p.std_error.toExponential(3)}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-lg p-3">
        <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
          Convergence
        </p>
        <Stat
          label="Converged"
          value={s.converged ? "Yes" : "No"}
          good={s.converged}
        />
        <Stat label="Observations" value={String(s.n_obs)} />
        <Stat label="Parameters" value={String(s.n_params)} />
        <Stat label="Degrees of Freedom" value={String(s.n_obs - s.n_params)} />
      </div>
    </div>
  );
}
