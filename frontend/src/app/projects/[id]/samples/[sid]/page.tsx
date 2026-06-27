"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type {
  Sample,
  Observation,
  ModelInfo,
  FitResult,
  PredictResponse,
} from "@/types";
import {
  FlaskConical,
  Home,
  ChevronRight,
  Play,
  ToggleLeft,
  ToggleRight,
  Layers,
  FileText,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import PlotlyChart, {
  type SampleGroup,
  SAMPLE_COLORS,
} from "@/components/PlotlyChart";
import ParameterSliders from "@/components/ParameterSliders";
import StatisticsPanel from "@/components/StatisticsPanel";
import QualityScoreCard from "@/components/QualityScoreCard";
import DiagnosticsPanel from "@/components/DiagnosticsPanel";

type RightTab = "statistics" | "quality" | "diagnostics";
type CenterTab = "plot" | "data" | "observed";
type FitMode = "individual" | "pooled";
type InitMode = "auto" | "manual";

export default function WorkbenchPage({
  params,
}: {
  params: Promise<{ id: string; sid: string }>;
}) {
  const { id, sid } = use(params);

  const [sample, setSample] = useState<Sample | null>(null);
  const [allSamples, setAllSamples] = useState<Sample[]>([]);
  const [obsMap, setObsMap] = useState<Record<string, Observation[]>>({});
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModelId, setSelectedModelId] =
    useState<string>("two_population_ict");
  const [paramValues, setParamValues] = useState<number[]>([]);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [fitResult, setFitResult] = useState<FitResult | null>(null);
  const [pastFits, setPastFits] = useState<FitResult[]>([]);
  const [fitting, setFitting] = useState(false);
  const [fitMode, setFitMode] = useState<FitMode>("individual");
  const [initMode, setInitMode] = useState<InitMode>("auto");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [logScale, setLogScale] = useState(true);
  const [rightTab, setRightTab] = useState<RightTab>("statistics");
  const [centerTab, setCenterTab] = useState<CenterTab>("plot");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const predictDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedModel = models.find((m) => m.id === selectedModelId);
  const observations = obsMap[sid] ?? [];

  const sampleGroups: SampleGroup[] = allSamples.map((s) => ({
    sampleId: s.id,
    sampleName: s.name,
    observations: obsMap[s.id] ?? [],
  }));

  const allObservations = allSamples.flatMap((s, i) =>
    (obsMap[s.id] ?? []).map((o) => ({
      ...o,
      sampleName: s.name,
      sampleColor: SAMPLE_COLORS[i % SAMPLE_COLORS.length],
    })),
  );

  useEffect(() => {
    Promise.all([
      api.samples.list(id),
      api.models.list(),
      api.fitting.listFits(sid),
    ])
      .then(async ([samps, mdls, fits]) => {
        setAllSamples(samps);
        setSample(samps.find((s) => s.id === sid) ?? null);
        setModels(mdls);
        setPastFits(fits);
        if (fits.length > 0) {
          setFitResult(fits[0]);
          setRightTab("statistics");
        }

        const entries = await Promise.all(
          samps.map((s) =>
            api.samples.data(s.id).then((obs) => [s.id, obs] as const),
          ),
        );
        setObsMap(Object.fromEntries(entries));
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id, sid]);

  useEffect(() => {
    if (!selectedModel) return;
    setParamValues(selectedModel.parameters.map((p) => p.default));
    setFitResult(null);
    setPrediction(null);
  }, [selectedModelId, selectedModel]);

  const runPredict = useCallback(
    (values: number[]) => {
      if (!selectedModel || observations.length === 0) return;
      if (predictDebounce.current) clearTimeout(predictDebounce.current);
      predictDebounce.current = setTimeout(async () => {
        try {
          setPrediction(
            await api.fitting.predict(sid, selectedModelId, values),
          );
        } catch {
          /* ignore */
        }
      }, 120);
    },
    [sid, selectedModelId, selectedModel, observations.length],
  );

  function handleSliderChange(values: number[]) {
    setParamValues(values);
    runPredict(values);
  }

  async function handleFit() {
    setFitting(true);
    setError(null);
    try {
      const initialParams = initMode === "manual" ? paramValues : undefined;
      const result =
        fitMode === "pooled"
          ? await api.fitting.fitPooled(id, selectedModelId, initialParams)
          : await api.fitting.fit(sid, selectedModelId, initialParams);

      setFitResult(result);
      setPastFits((prev) => [result, ...prev]);
      const fitted = result.parameters.map((p) => p.value);
      setParamValues(fitted);
      setPrediction(await api.fitting.predict(sid, selectedModelId, fitted));
      setRightTab("statistics");
      setCenterTab("plot");
    } catch (e) {
      setError(String(e));
    } finally {
      setFitting(false);
    }
  }

  // Observed vs Predicted table rows (uses fitResult + observations)
  function getObsVsPred() {
    if (!fitResult || !prediction) return [];
    const obs =
      fitMode === "pooled"
        ? allObservations
        : observations.map((o) => ({
            ...o,
            sampleName: sample?.name ?? "",
            sampleColor: SAMPLE_COLORS[0],
          }));
    // Match each observation's ICT to nearest prediction x
    return obs.map((o) => {
      const oict = o.ict ?? 0;
      let closestIdx = 0;
      let minDist = Infinity;
      prediction.x.forEach((px, i) => {
        const d = Math.abs(px - oict);
        if (d < minDist) {
          minDist = d;
          closestIdx = i;
        }
      });
      // prediction.y is survival fraction; scale by N0 (max cfu in the obs set for that sample)
      const sampleObs =
        fitMode === "pooled"
          ? (obsMap[
              allSamples.find((s) => s.name === o.sampleName)?.id ?? ""
            ] ?? [])
          : observations;
      const n0 =
        sampleObs.length > 0 ? Math.max(...sampleObs.map((x) => x.cfu)) : 1;
      const predN = prediction.y[closestIdx] * n0;
      const residual = o.cfu - predN;
      const pctError = n0 > 0 ? (residual / o.cfu) * 100 : 0;
      return { ...o, predN, residual, pctError };
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center text-slate-500 text-sm">
        Loading workbench…
      </div>
    );
  }

  const tableRows =
    fitMode === "pooled"
      ? allObservations
      : observations.map((o) => ({
          ...o,
          sampleName: sample?.name ?? "",
          sampleColor: SAMPLE_COLORS[0],
        }));
  const showSampleCol = fitMode === "pooled" && allSamples.length > 1;
  const obsVsPred = getObsVsPred();

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-200 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f1117] sticky top-0 z-10 shrink-0">
        <div className="px-5 h-13 flex items-center gap-3">
          <FlaskConical className="text-blue-400 shrink-0" size={20} />
          <nav className="flex items-center gap-1 text-sm text-slate-400 truncate">
            <Link
              href="/"
              className="hover:text-slate-200 flex items-center gap-1 transition-colors shrink-0"
            >
              <Home size={13} /> Projects
            </Link>
            <ChevronRight size={13} className="text-slate-600 shrink-0" />
            <Link
              href={`/projects/${id}`}
              className="hover:text-slate-200 transition-colors truncate max-w-[120px]"
            >
              Project
            </Link>
            <ChevronRight size={13} className="text-slate-600 shrink-0" />
            <span className="text-slate-200 truncate max-w-[200px]">
              {sample?.name ?? sid}
            </span>
          </nav>

          <div className="ml-auto flex items-center gap-3 shrink-0">
            {/* Fit mode toggle */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => {
                  setFitMode("individual");
                  setPrediction(null);
                  setFitResult(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${fitMode === "individual" ? "bg-slate-600 text-slate-100" : "text-slate-400 hover:text-slate-200"}`}
              >
                <FileText size={13} /> This Sample
              </button>
              <button
                onClick={() => {
                  setFitMode("pooled");
                  setPrediction(null);
                  setFitResult(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${fitMode === "pooled" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                <Layers size={13} /> All {allSamples.length} Samples
              </button>
            </div>

            <button
              onClick={() => setLogScale((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              {logScale ? (
                <ToggleRight size={18} className="text-blue-400" />
              ) : (
                <ToggleLeft size={18} />
              )}
              Log scale
            </button>

            <button
              onClick={handleFit}
              disabled={fitting || observations.length === 0}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              {fitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}
              {fitting
                ? "Fitting…"
                : fitMode === "pooled"
                  ? "Fit Pooled"
                  : "Fit Model"}
            </button>
          </div>
        </div>
      </header>

      {fitMode === "pooled" && (
        <div className="bg-blue-900/30 border-b border-blue-800/50 px-5 py-2 text-xs text-blue-300 flex items-center gap-2 shrink-0">
          <Layers size={13} />
          <strong>Pooled mode</strong> — all {allSamples.length} samples. Each
          normalized to its own N₀.
          <span className="flex items-center gap-2 ml-2">
            {allSamples.map((s, i) => (
              <span key={s.id} className="flex items-center gap-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{
                    background: SAMPLE_COLORS[i % SAMPLE_COLORS.length],
                  }}
                />
                <span className="text-slate-400">{s.name}</span>
              </span>
            ))}
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-900/40 border-b border-red-800 text-red-300 text-xs px-5 py-2 shrink-0">
          {error}
        </div>
      )}

      {/* 3-panel layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left panel ─────────────────────────────────────────────── */}
        <div className="w-72 shrink-0 border-r border-slate-800 flex flex-col overflow-y-auto scrollbar-thin">
          <div className="p-4 space-y-5">
            {/* Model selector */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Model
              </label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {selectedModel && (
                <div className="mt-2 bg-slate-900/60 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">
                    {selectedModel.description}
                  </p>
                  <p className="text-xs font-mono text-blue-300">
                    {selectedModel.equation}
                  </p>
                </div>
              )}
            </div>

            {/* Initial guess mode */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Initial Guess
              </label>
              <div className="space-y-1">
                {(["auto", "manual"] as const).map((mode) => (
                  <label
                    key={mode}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${initMode === mode ? "border-blue-500 bg-blue-500" : "border-slate-600 group-hover:border-slate-400"}`}
                    >
                      {initMode === mode && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span
                      className={`text-xs ${initMode === mode ? "text-slate-200" : "text-slate-400"}`}
                    >
                      {mode === "auto"
                        ? "Automatic (recommended)"
                        : "Manual override"}
                    </span>
                    <input
                      type="radio"
                      className="sr-only"
                      checked={initMode === mode}
                      onChange={() => setInitMode(mode)}
                    />
                  </label>
                ))}
              </div>
              {initMode === "auto" && (
                <p className="text-xs text-slate-600 mt-2">
                  The optimizer selects starting points automatically using
                  multi-start search.
                </p>
              )}
            </div>

            {/* Fit result: estimated parameters */}
            {fitResult && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2
                    size={14}
                    className="text-emerald-400 shrink-0"
                  />
                  <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Estimated Parameters
                  </label>
                </div>
                <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 overflow-hidden">
                  <table className="w-full text-xs">
                    <tbody>
                      {fitResult.parameters.map((p, i) => (
                        <tr
                          key={i}
                          className={
                            i % 2 === 0 ? "bg-transparent" : "bg-slate-800/30"
                          }
                        >
                          <td className="px-3 py-2 font-mono text-blue-300 font-medium">
                            {p.name}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-200 text-right">
                            {p.value.toPrecision(5)}
                          </td>
                          {p.std_error != null && (
                            <td className="px-3 py-2 text-slate-500 text-right">
                              ±{p.std_error.toPrecision(2)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span>R² {fitResult.statistics.r_squared.toFixed(4)}</span>
                  <span>·</span>
                  <span>RMSE {fitResult.statistics.rmse.toPrecision(3)}</span>
                  <span>·</span>
                  <span
                    className={`font-medium ${fitResult.statistics.converged ? "text-emerald-400" : "text-amber-400"}`}
                  >
                    {fitResult.statistics.converged
                      ? "Converged"
                      : "Not converged"}
                  </span>
                </div>
              </div>
            )}

            {/* Advanced: manual sliders (collapsed by default) */}
            {selectedModel &&
              paramValues.length === selectedModel.parameters.length && (
                <div>
                  <button
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors w-full"
                  >
                    <Sliders size={12} />
                    <span>Advanced / Manual Override</span>
                    {showAdvanced ? (
                      <ChevronUp size={12} className="ml-auto" />
                    ) : (
                      <ChevronDown size={12} className="ml-auto" />
                    )}
                  </button>
                  {showAdvanced && (
                    <div className="mt-3 border border-slate-700/60 rounded-xl p-3 bg-slate-900/40">
                      <p className="text-xs text-slate-500 mb-3">
                        Manually explore parameter sensitivity. These values are
                        used as initial guesses only when{" "}
                        <strong className="text-slate-400">Manual</strong> mode
                        is selected above.
                      </p>
                      <ParameterSliders
                        model={selectedModel}
                        values={paramValues}
                        onChange={handleSliderChange}
                      />
                      {prediction && (
                        <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                          <AlertCircle size={11} />
                          Preview only — run Fit Model to update statistics.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

            {/* Pooled sample list */}
            {fitMode === "pooled" && (
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Pooled Samples
                </label>
                <ul className="space-y-1">
                  {allSamples.map((s, i) => (
                    <li
                      key={s.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${s.id === sid ? "bg-slate-800/60" : ""}`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          background: SAMPLE_COLORS[i % SAMPLE_COLORS.length],
                        }}
                      />
                      <span className="truncate text-slate-300">{s.name}</span>
                      <span className="text-slate-600 ml-auto shrink-0">
                        {s.observation_count} obs
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Previous fits */}
            {pastFits.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Previous Fits
                </label>
                <div className="space-y-1.5">
                  {pastFits.slice(0, 5).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFitResult(f);
                        setSelectedModelId(f.model_id);
                        setParamValues(f.parameters.map((p) => p.value));
                        setRightTab("statistics");
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors border ${fitResult?.id === f.id ? "border-blue-600 bg-blue-900/30 text-blue-300" : "border-slate-700 hover:border-slate-600 text-slate-400"}`}
                    >
                      <div className="font-medium truncate">{f.model_name}</div>
                      <div className="text-slate-500 mt-0.5">
                        R² {f.statistics.r_squared.toFixed(3)} · Score{" "}
                        {f.quality_score.score.toFixed(0)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Center panel ────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 p-4 gap-0">
          {/* Center tab bar */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 rounded-t-xl shrink-0">
            {[
              { key: "plot" as CenterTab, label: "Plot" },
              { key: "data" as CenterTab, label: "Data" },
              {
                key: "observed" as CenterTab,
                label: "Observed vs Predicted",
                disabled: !fitResult || !prediction,
              },
            ].map(({ key, label, disabled }) => (
              <button
                key={key}
                onClick={() => !disabled && setCenterTab(key)}
                disabled={!!disabled}
                className={`px-5 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                  centerTab === key
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Center tab content — takes all remaining height */}
          <div className="flex-1 bg-slate-900/40 border border-slate-800 border-t-0 rounded-b-xl overflow-hidden">
            {/* ── Plot tab ── */}
            {centerTab === "plot" &&
              (observations.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  No observations. Check column mapping.
                </div>
              ) : fitMode === "pooled" ? (
                <PlotlyChart
                  sampleGroups={sampleGroups}
                  prediction={prediction}
                  logScale={logScale}
                  xVariable={selectedModel?.x_variable ?? "ICT"}
                />
              ) : (
                <PlotlyChart
                  observations={observations}
                  prediction={prediction}
                  logScale={logScale}
                  xVariable={selectedModel?.x_variable ?? "ICT"}
                />
              ))}

            {/* ── Data tab ── */}
            {centerTab === "data" && (
              <div className="overflow-auto scrollbar-thin h-full">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-800/90">
                    <tr>
                      {showSampleCol && (
                        <th className="text-left px-4 py-3 text-slate-400 font-semibold whitespace-nowrap">
                          Sample
                        </th>
                      )}
                      {[
                        "Time (min)",
                        "Conc. (mg/L)",
                        "CFU/100mL",
                        "ICT (mg·min/L)",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-slate-400 font-semibold whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((o, i) => (
                      <tr
                        key={`${o.id}-${i}`}
                        className={
                          i % 2 === 0 ? "bg-transparent" : "bg-slate-800/20"
                        }
                      >
                        {showSampleCol && (
                          <td className="px-4 py-2.5">
                            <span className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                style={{ background: o.sampleColor }}
                              />
                              <span className="text-slate-300">
                                {o.sampleName}
                              </span>
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-2.5 font-mono text-slate-300">
                          {o.time}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-300">
                          {o.concentration.toFixed(3)}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-300">
                          {o.cfu.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-300">
                          {o.ict != null ? o.ict.toFixed(3) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Observed vs Predicted tab ── */}
            {centerTab === "observed" && (
              <div className="overflow-auto scrollbar-thin h-full">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-800/90">
                    <tr>
                      {showSampleCol && (
                        <th className="text-left px-4 py-3 text-slate-400 font-semibold whitespace-nowrap">
                          Sample
                        </th>
                      )}
                      {[
                        "ICT (mg·min/L)",
                        "Observed N (CFU/100mL)",
                        "Predicted N (CFU/100mL)",
                        "Residual",
                        "% Error",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-slate-400 font-semibold whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {obsVsPred.map((row, i) => (
                      <tr
                        key={i}
                        className={
                          i % 2 === 0 ? "bg-transparent" : "bg-slate-800/20"
                        }
                      >
                        {showSampleCol && (
                          <td className="px-4 py-2.5">
                            <span className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                style={{ background: row.sampleColor }}
                              />
                              <span className="text-slate-300">
                                {row.sampleName}
                              </span>
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-2.5 font-mono text-slate-300">
                          {(row.ict ?? 0).toFixed(3)}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-200 font-medium">
                          {row.cfu.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-blue-300">
                          {Math.round(row.predN).toLocaleString()}
                        </td>
                        <td
                          className={`px-4 py-2.5 font-mono ${Math.abs(row.residual) > row.cfu * 0.3 ? "text-amber-400" : "text-slate-400"}`}
                        >
                          {row.residual > 0 ? "+" : ""}
                          {Math.round(row.residual).toLocaleString()}
                        </td>
                        <td
                          className={`px-4 py-2.5 font-mono ${Math.abs(row.pctError) > 30 ? "text-amber-400" : "text-slate-400"}`}
                        >
                          {row.pctError > 0 ? "+" : ""}
                          {row.pctError.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel ─────────────────────────────────────────────── */}
        <div className="w-80 shrink-0 border-l border-slate-800 flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-800 shrink-0">
            {(["statistics", "quality", "diagnostics"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setRightTab(t)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors capitalize ${rightTab === t ? "text-blue-400 border-b-2 border-blue-500" : "text-slate-500 hover:text-slate-300"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
            {!fitResult ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                <Play size={28} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium text-slate-400 mb-2">Ready to fit</p>
                <p className="text-xs">
                  Select a model and click{" "}
                  <strong className="text-slate-300">Fit Model</strong>.
                </p>
                <p className="text-xs mt-1">
                  The optimizer will automatically estimate all parameters from
                  your data.
                </p>
              </div>
            ) : (
              <>
                {rightTab === "statistics" && (
                  <StatisticsPanel fit={fitResult} />
                )}
                {rightTab === "quality" && (
                  <QualityScoreCard qs={fitResult.quality_score} />
                )}
                {rightTab === "diagnostics" && (
                  <DiagnosticsPanel fit={fitResult} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
