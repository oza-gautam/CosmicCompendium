"use client";

import dynamic from "next/dynamic";
import type { Observation, PredictResponse } from "@/types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export const SAMPLE_COLORS = [
  "#60a5fa", // blue
  "#34d399", // emerald
  "#f472b6", // pink
  "#fb923c", // orange
  "#a78bfa", // violet
  "#facc15", // yellow
  "#22d3ee", // cyan
  "#f87171", // red
];

// Detection limit: 1 CFU/100mL — below this the assay cannot distinguish from zero.
// Zero CFU readings are replaced with this value for log-scale plotting.
const DETECTION_LIMIT = 1;

export interface SampleGroup {
  sampleId: string;
  sampleName: string;
  observations: Observation[];
}

interface Props {
  observations?: Observation[];
  sampleGroups?: SampleGroup[];
  prediction?: PredictResponse | null;
  logScale?: boolean;
  xVariable?: string;
}

function getN0(obs: Observation[]): number {
  // N0 = CFU at first time point (t=0); fall back to max if first is zero
  if (obs.length === 0) return 1;
  const first = obs[0].cfu;
  return first > 0 ? first : Math.max(...obs.map((o) => o.cfu), 1);
}

/** Replace 0 CFU with detection limit so log scale stays valid. */
function safeCFU(cfu: number): number {
  return cfu > 0 ? cfu : DETECTION_LIMIT;
}

function obsToXY(obs: Observation[], xVariable: string) {
  const x = obs.map((o) =>
    xVariable === "ICT" ? (o.ict ?? 0) : o.time * o.concentration,
  );
  const y = obs.map((o) => safeCFU(o.cfu));
  // Mark zero-CFU points with a different symbol so the user knows they're at detection limit
  const symbols = obs.map((o) => (o.cfu <= 0 ? "triangle-down" : "circle"));
  return { x, y, symbols };
}

export default function PlotlyChart({
  observations,
  sampleGroups,
  prediction,
  logScale = true,
  xVariable = "ICT",
}: Props) {
  const traces: Plotly.Data[] = [];
  const n0Values: number[] = [];

  if (sampleGroups && sampleGroups.length > 0) {
    sampleGroups.forEach((group, i) => {
      if (group.observations.length === 0) return;
      const n0 = getN0(group.observations);
      n0Values.push(n0);
      const color = SAMPLE_COLORS[i % SAMPLE_COLORS.length];
      const { x, y, symbols } = obsToXY(group.observations, xVariable);

      // Split into detected and non-detected so we can style differently
      const xDetected = x.filter((_, j) => group.observations[j].cfu > 0);
      const yDetected = y.filter((_, j) => group.observations[j].cfu > 0);
      const xNonDetect = x.filter((_, j) => group.observations[j].cfu <= 0);
      const yNonDetect = y.filter((_, j) => group.observations[j].cfu <= 0);

      traces.push({
        x: xDetected,
        y: yDetected,
        mode: "markers",
        type: "scatter",
        name: group.sampleName,
        legendgroup: group.sampleName,
        marker: { color, size: 9, symbol: "circle" },
        hovertemplate: `<b>${group.sampleName}</b><br>ICT: %{x:.3f}<br>CFU: %{y:,.0f}<extra></extra>`,
      });

      if (xNonDetect.length > 0) {
        traces.push({
          x: xNonDetect,
          y: yNonDetect,
          mode: "markers",
          type: "scatter",
          name: `${group.sampleName} (<DL)`,
          legendgroup: group.sampleName,
          showlegend: false,
          marker: {
            color,
            size: 10,
            symbol: "triangle-down",
            opacity: 0.5,
            line: { color, width: 1.5 },
          },
          hovertemplate: `<b>${group.sampleName}</b><br>ICT: %{x:.3f}<br>Below detection limit<extra></extra>`,
        });
      }
    });
  } else if (observations && observations.length > 0) {
    const n0 = getN0(observations);
    n0Values.push(n0);
    const { x, y } = obsToXY(observations, xVariable);

    const xDetected = x.filter((_, j) => observations[j].cfu > 0);
    const yDetected = y.filter((_, j) => observations[j].cfu > 0);
    const xNonDetect = x.filter((_, j) => observations[j].cfu <= 0);
    const yNonDetect = y.filter((_, j) => observations[j].cfu <= 0);

    traces.push({
      x: xDetected,
      y: yDetected,
      mode: "markers",
      type: "scatter",
      name: "Observed",
      marker: { color: SAMPLE_COLORS[0], size: 9, symbol: "circle" },
      hovertemplate: `ICT: %{x:.3f}<br>CFU: %{y:,.0f}<extra></extra>`,
    });

    if (xNonDetect.length > 0) {
      traces.push({
        x: xNonDetect,
        y: yNonDetect,
        mode: "markers",
        type: "scatter",
        name: "Below detection limit",
        showlegend: true,
        marker: {
          color: SAMPLE_COLORS[0],
          size: 10,
          symbol: "triangle-down",
          opacity: 0.5,
          line: { color: SAMPLE_COLORS[0], width: 1.5 },
        },
        hovertemplate: `ICT: %{x:.3f}<br>Below detection limit (shown at ${DETECTION_LIMIT} CFU)<extra></extra>`,
      });
    }
  }

  // Prediction curve
  if (prediction && prediction.x.length > 0) {
    const n0 =
      n0Values.length > 0
        ? Math.exp(
            n0Values.reduce((s, v) => s + Math.log(Math.max(v, 1)), 0) /
              n0Values.length,
          )
        : 1;

    // Clamp predicted curve to detection limit floor — never plot below 1 CFU
    const yPred = prediction.y.map((frac) =>
      Math.max(frac * n0, DETECTION_LIMIT),
    );

    traces.push({
      x: prediction.x,
      y: yPred,
      mode: "lines",
      type: "scatter",
      name: "Model fit",
      line: { color: "#f59e0b", width: 2.5 },
      hovertemplate: `ICT: %{x:.3f}<br>Fit: %{y:,.1f} CFU<extra></extra>`,
    });
  }

  // Detection limit line (only shown on log scale where it matters)
  if (logScale) {
    const xMax =
      prediction && prediction.x.length > 0 ? Math.max(...prediction.x) : 50;
    traces.push({
      x: [0, xMax],
      y: [DETECTION_LIMIT, DETECTION_LIMIT],
      mode: "lines",
      type: "scatter",
      name: `Detection limit (${DETECTION_LIMIT} CFU)`,
      line: { color: "#64748b", width: 1, dash: "dot" },
      hoverinfo: "skip",
    });
  }

  const yaxisType = logScale ? "log" : "linear";

  // Y range: floor at 10^0 = 1 CFU (x-axis crosses here), auto ceiling
  const yaxisRange = logScale ? [0, undefined] : undefined;

  const layout: Partial<Plotly.Layout> = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "#111827",
    font: { color: "#94a3b8", size: 12 },
    xaxis: {
      title: {
        text:
          xVariable === "ICT" ? "Total ICT (mg·min/L)" : "Total CT (mg·min/L)",
        font: { size: 12 },
      },
      gridcolor: "#1f2937",
      linecolor: "#374151",
      tickfont: { color: "#64748b" },
      zeroline: true,
      zerolinecolor: "#374151",
      rangemode: "tozero",
      // X axis line sits at y=1 (log10=0) when log scale is on
      ...(logScale ? { anchor: "y", position: 0 } : {}),
    },
    yaxis: {
      title: { text: "Viable Microbes (CFU/100mL)", font: { size: 12 } },
      type: yaxisType,
      range: yaxisRange,
      gridcolor: "#1f2937",
      linecolor: "#374151",
      tickfont: { color: "#64748b" },
      zeroline: false,
      // Force decade ticks: 1, 10, 100, 1000, 10000...
      ...(logScale
        ? {
            dtick: 1, // 1 unit in log10 space = one decade
            tick0: 0, // start ticks at 10^0 = 1
            tickmode: "linear",
            exponentformat: "power",
            showexponent: "all",
          }
        : {}),
    },
    legend: {
      bgcolor: "rgba(15,17,23,0.8)",
      bordercolor: "#374151",
      borderwidth: 1,
      font: { color: "#94a3b8", size: 11 },
    },
    margin: { t: 20, r: 20, b: 50, l: 75 },
    hovermode: "closest",
  };

  return (
    <Plot
      data={traces}
      layout={layout}
      config={{ responsive: true, displayModeBar: true, displaylogo: false }}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
