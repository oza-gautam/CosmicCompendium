"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { FitResult } from "@/types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props {
  fit: FitResult;
}

function getThemeColors() {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark";
  return isDark
    ? {
        paper: "transparent",
        plot: "#111827",
        grid: "#1f2937",
        line: "#374151",
        tick: "#64748b",
        font: "#94a3b8",
      }
    : {
        paper: "transparent",
        plot: "#f8fafc",
        grid: "#e2e8f0",
        line: "#e2e8f0",
        tick: "#94a3b8",
        font: "#0f172a",
      };
}

function layout(xtitle: string, ytitle: string): Partial<Plotly.Layout> {
  const C = getThemeColors();
  return {
    paper_bgcolor: C.paper,
    plot_bgcolor: C.plot,
    font: { color: C.font, size: 11 },
    xaxis: {
      title: { text: xtitle },
      gridcolor: C.grid,
      linecolor: C.line,
      tickfont: { color: C.tick },
      zeroline: false,
    },
    yaxis: {
      title: { text: ytitle },
      gridcolor: C.grid,
      linecolor: C.line,
      tickfont: { color: C.tick },
      zeroline: false,
    },
    margin: { t: 16, r: 16, b: 48, l: 56 },
    showlegend: false,
  };
}

const CFG = { responsive: true, displayModeBar: false };

export default function DiagnosticsPanel({ fit }: Props) {
  const [tab, setTab] = useState<"residuals" | "qq" | "histogram" | "cooks">(
    "residuals",
  );
  const d = fit.diagnostics;

  return (
    <div>
      <div className="flex gap-1 mb-3 bg-surface rounded-lg p-1 w-fit">
        {(["residuals", "qq", "histogram", "cooks"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === t
                ? "bg-blue-600 text-white"
                : "text-secondary hover:text-primary"
            }`}
          >
            {t === "residuals"
              ? "Residuals vs ICT"
              : t === "qq"
                ? "Q-Q Plot"
                : t === "histogram"
                  ? "Histogram"
                  : "Cook's Distance"}
          </button>
        ))}
      </div>

      <div style={{ height: 300 }}>
        {tab === "residuals" && (
          <Plot
            data={[
              {
                x: d.ict_values,
                y: d.standardized_residuals,
                mode: "markers",
                type: "scatter",
                marker: { color: "#60a5fa", size: 8 },
                name: "Std. Residual",
              },
              {
                x: [Math.min(...d.ict_values), Math.max(...d.ict_values)],
                y: [0, 0],
                mode: "lines",
                type: "scatter",
                line: { color: "#ef4444", dash: "dash", width: 1 },
                name: "Zero line",
              },
            ]}
            layout={layout("ICT (mg·min/L)", "Standardized Residual")}
            config={CFG}
            style={{ width: "100%", height: "100%" }}
          />
        )}

        {tab === "qq" && (
          <Plot
            data={[
              {
                x: d.qq_theoretical,
                y: d.qq_sample,
                mode: "markers",
                type: "scatter",
                marker: { color: "#a78bfa", size: 8 },
                name: "Q-Q",
              },
              {
                x: [
                  Math.min(...d.qq_theoretical),
                  Math.max(...d.qq_theoretical),
                ],
                y: [
                  Math.min(...d.qq_theoretical),
                  Math.max(...d.qq_theoretical),
                ],
                mode: "lines",
                type: "scatter",
                line: { color: "#ef4444", dash: "dash", width: 1 },
                name: "Normal line",
              },
            ]}
            layout={layout("Theoretical Quantiles", "Sample Quantiles")}
            config={CFG}
            style={{ width: "100%", height: "100%" }}
          />
        )}

        {tab === "histogram" && (
          <Plot
            data={[
              {
                x: d.standardized_residuals,
                type: "histogram",
                nbinsx: Math.max(
                  5,
                  Math.round(d.standardized_residuals.length / 2),
                ),
                marker: { color: "#34d399", opacity: 0.8 },
                name: "Std. Residuals",
              },
            ]}
            layout={{
              ...layout("Standardized Residual", "Count"),
              bargap: 0.05,
            }}
            config={CFG}
            style={{ width: "100%", height: "100%" }}
          />
        )}

        {tab === "cooks" && (
          <Plot
            data={[
              {
                x: d.ict_values.map((_, i) => i + 1),
                y: d.cooks_distance,
                type: "bar",
                marker: {
                  color: d.cooks_distance.map((v) =>
                    v > 1 ? "#ef4444" : v > 0.5 ? "#f59e0b" : "#60a5fa",
                  ),
                },
                name: "Cook's D",
              },
            ]}
            layout={{
              ...layout("Observation Index", "Cook's Distance"),
              shapes: [
                {
                  type: "line",
                  x0: 0,
                  x1: d.ict_values.length + 1,
                  y0: 1,
                  y1: 1,
                  line: { color: "#ef4444", dash: "dash", width: 1 },
                },
              ],
            }}
            config={CFG}
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </div>
    </div>
  );
}
