"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  Download,
  Save,
  X,
} from "lucide-react";
import PlotlyChart, {
  type SampleGroup,
  SAMPLE_COLORS,
} from "@/components/PlotlyChart";
import ParameterSliders from "@/components/ParameterSliders";
import StatisticsPanel from "@/components/StatisticsPanel";
import QualityScoreCard from "@/components/QualityScoreCard";
import DiagnosticsPanel from "@/components/DiagnosticsPanel";
import JournalTab from "@/components/JournalTab";
import ThemeToggle from "@/components/ThemeToggle";
import FontSizeControl from "@/components/FontSizeControl";

type RightTab = "statistics" | "quality" | "diagnostics";
type CenterTab = "plot" | "data" | "observed" | "calculated" | "journal";
type FitMode = "individual" | "pooled";
type InitMode = "auto" | "manual" | "fixed";

export default function WorkbenchPage({
  params,
}: {
  params: Promise<{ id: string; sid: string }>;
}) {
  const { id, sid } = use(params);
  const searchParams = useSearchParams();
  const urlExperimentId = searchParams.get("experimentId")
    ? Number(searchParams.get("experimentId"))
    : null;
  // resolved after sample loads — falls back to sample.experiment_id
  const [experimentId, setExperimentId] = useState<number | null>(
    urlExperimentId,
  );
  const urlPooled = searchParams.get("pooled");
  const urlInitMode = searchParams.get("initMode") as InitMode | null;
  const urlBeta = searchParams.get("beta");
  const urlKd = searchParams.get("kd");
  const urlKp = searchParams.get("kp");
  const urlM = searchParams.get("m");

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
  const [pooledSampleIds, setPooledSampleIds] = useState<Set<string>>(
    new Set(),
  );
  const [showSamplePicker, setShowSamplePicker] = useState(false);
  const [initMode, setInitMode] = useState<InitMode>("auto");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [logScale, setLogScale] = useState(true);
  const [rightTab, setRightTab] = useState<RightTab>("statistics");
  const [centerTab, setCenterTab] = useState<CenterTab>("plot");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportFitId, setReportFitId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showSaveFit, setShowSaveFit] = useState(false);
  const [saveFitLabel, setSaveFitLabel] = useState("");
  const [savingFit, setSavingFit] = useState(false);
  // inline data editing — keyed by observation DB id
  type EditMap = Record<
    number,
    { time: string; concentration: string; cfu: string }
  >;
  const [rowEdits, setRowEdits] = useState<EditMap>({});
  const [savingRows, setSavingRows] = useState(false);

  const predictDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const samplePickerRef = useRef<HTMLDivElement>(null);
  const selectedModel = models.find((m) => m.id === selectedModelId);
  const observations = obsMap[sid] ?? [];

  const activeSamples =
    fitMode === "pooled" && pooledSampleIds.size > 0
      ? allSamples.filter((s) => pooledSampleIds.has(s.id))
      : allSamples;

  const sampleGroups: SampleGroup[] = activeSamples.map((s) => ({
    sampleId: s.id,
    sampleName: s.name,
    observations: obsMap[s.id] ?? [],
  }));

  const allObservations = allSamples
    .filter((s) => fitMode !== "pooled" || pooledSampleIds.has(s.id))
    .flatMap((s, i) =>
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
        const foundSample = samps.find((s) => s.id === sid) ?? null;
        setSample(foundSample);
        if (!urlExperimentId && foundSample?.experiment_id) {
          setExperimentId(foundSample.experiment_id);
        }
        setModels(mdls);
        setPastFits(fits);
        if (fits.length > 0) {
          setFitResult(fits[0]);
          setRightTab("statistics");
        }
        // Apply URL params from experiment page navigation
        if (urlPooled) {
          const ids = urlPooled.split(",").filter(Boolean);
          setFitMode("pooled");
          setPooledSampleIds(new Set(ids));
        }
        if (urlInitMode) setInitMode(urlInitMode);
        if (urlInitMode === "fixed" && urlBeta && urlKd && urlKp && urlM) {
          setParamValues([
            parseFloat(urlBeta),
            parseFloat(urlKd),
            parseFloat(urlKp),
            parseFloat(urlM),
          ]);
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

  const initializedModelId = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedModel) return;
    if (initializedModelId.current === selectedModelId) return;
    initializedModelId.current = selectedModelId;
    setParamValues(selectedModel.parameters.map((p) => p.default));
    setFitResult(null);
    setPrediction(null);
  }, [selectedModelId, selectedModel]);

  useEffect(() => {
    if (!showSamplePicker) return;
    const handler = (e: MouseEvent) => {
      if (!samplePickerRef.current?.contains(e.target as Node)) {
        setShowSamplePicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSamplePicker]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const runPredict = useCallback(
    (values: number[]) => {
      if (!selectedModel || observations.length === 0) return;
      if (predictDebounce.current) clearTimeout(predictDebounce.current);
      predictDebounce.current = setTimeout(async () => {
        try {
          setPrediction(
            await api.fitting.predict(sid, selectedModelId, values, 0, 50),
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
      if (initMode === "fixed") {
        const result = await api.fitting.fitFixed(
          sid,
          selectedModelId,
          paramValues,
        );
        setFitResult(result);
        setReportFitId(result.id);
        setPastFits((prev) => [result, ...prev]);
        const pred = await api.fitting.predict(
          sid,
          selectedModelId,
          paramValues,
          0,
          60,
        );
        setPrediction(pred);
        setRightTab("statistics");
        setCenterTab("plot");
        setFitting(false);
        return;
      }

      const initialParams = initMode === "manual" ? paramValues : undefined;
      const result =
        fitMode === "pooled"
          ? await api.fitting.fitPooled(
              id,
              selectedModelId,
              initialParams,
              fitMode === "pooled" ? Array.from(pooledSampleIds) : undefined,
            )
          : await api.fitting.fit(sid, selectedModelId, initialParams);

      setFitResult(result);
      setReportFitId(result.id);
      setPastFits((prev) => [result, ...prev]);
      const fitted = result.parameters.map((p) => p.value);
      setParamValues(fitted);
      setPrediction(
        await api.fitting.predict(sid, selectedModelId, fitted, 0, 50),
      );
      setRightTab("statistics");
      setCenterTab("plot");
    } catch (e) {
      setError(String(e));
    } finally {
      setFitting(false);
    }
  }

  function n0ForReport(): number {
    return observations.length > 0
      ? Math.max(...observations.map((o) => o.cfu))
      : 1;
  }
  // suppress unused warning
  void n0ForReport;

  async function handleDownloadReport() {
    if (!reportFitId) return;
    setDownloading(true);
    try {
      const { ictSteps, sampleCols } = getCalculatedN();
      const cnRows: Array<{ ict: number; values: number[] }> = ictSteps.map(
        (ict) => ({
          ict,
          values: sampleCols.map((s) => predictN(ict, paramValues, s.n0)),
        }),
      );

      await api.report.download(sid, {
        fit_id: reportFitId,
        sample_names: sampleCols.map((s) => s.name),
        sample_ids: activeSamples.map((s) => s.id),
        calculated_n: cnRows,
        experiment_id: experimentId ?? undefined,
      });

      setToast(
        `Report downloaded — ${sample?.name ?? "report"} · ${new Date().toLocaleDateString()}`,
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setDownloading(false);
    }
  }

  async function handleSaveFit() {
    if (!experimentId || !saveFitLabel.trim() || paramValues.length < 4) return;
    setSavingFit(true);
    try {
      const [beta, kd, kp, m] = paramValues;
      await api.experiments.saveFit(experimentId, saveFitLabel.trim(), {
        beta,
        kd,
        kp,
        m,
      });
      setToast(`Fit saved: "${saveFitLabel.trim()}"`);
      setSaveFitLabel("");
      setShowSaveFit(false);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingFit(false);
    }
  }

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

  function getCalculatedN() {
    if (!fitResult)
      return {
        ictSteps: [] as number[],
        sampleCols: [] as { name: string; color: string; n0: number }[],
      };
    const ictSteps = Array.from({ length: 61 }, (_, i) => i);

    const rawSamples =
      fitMode === "pooled"
        ? activeSamples.map((s, i) => ({
            name: s.name,
            color: SAMPLE_COLORS[i % SAMPLE_COLORS.length],
            obs: obsMap[s.id] ?? [],
          }))
        : [
            {
              name: sample?.name ?? "",
              color: SAMPLE_COLORS[0],
              obs: observations,
            },
          ];

    const sampleCols = rawSamples.map((s) => ({
      name: s.name,
      color: s.color,
      n0: s.obs.length > 0 ? Math.max(...s.obs.map((o) => o.cfu)) : 1,
    }));

    return { ictSteps, sampleCols };
  }

  function buildEquation(fit: FitResult): string {
    const p: Record<string, number> = {};
    for (const pe of fit.parameters) p[pe.name] = pe.value;
    const fmt = (v: number) => {
      if (v === 0) return "0";
      const abs = Math.abs(v);
      if (abs < 0.001 || abs >= 100000) return v.toExponential(4);
      if (abs < 0.1) return v.toFixed(6);
      return v.toFixed(4);
    };
    if (fit.model_id === "two_population_ict") {
      const beta = fmt(p["beta"] ?? 0);
      const kd = fmt(p["kd"] ?? 0);
      const kp = fmt(p["kp"] ?? 0);
      const m = fmt(p["m"] ?? 1);
      return `N/N₀ = (1 − ${beta})·exp(−${kd}·ICT^${m}) + ${beta}·exp(−${kp}·ICT)`;
    }
    // Generic fallback
    let eq = fit.model_equation;
    for (const [name, val] of Object.entries(p)) {
      eq = eq.replace(new RegExp(name, "g"), fmt(val));
    }
    return eq;
  }

  function predictN(ict: number, params: number[], n0: number): number {
    if (selectedModelId === "two_population_ict" && params.length === 4) {
      const [beta, kd, kp, m] = params;
      const frac =
        (1 - beta) * Math.exp(-kd * Math.pow(Math.max(ict, 0), m)) +
        beta * Math.exp(-kp * ict);
      return Math.max(frac, 1e-15) * n0;
    }
    if (!prediction) return n0;
    let closestIdx = 0;
    let minDist = Infinity;
    prediction.x.forEach((px, i) => {
      const d = Math.abs(px - ict);
      if (d < minDist) {
        minDist = d;
        closestIdx = i;
      }
    });
    return prediction.y[closestIdx] * n0;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-muted text-sm">
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

  const hasPendingEdits = Object.keys(rowEdits).length > 0;

  async function saveRowEdits() {
    setSavingRows(true);
    try {
      // Group edited observations by sample_id
      const bySample: Record<
        string,
        Array<{ time: number; concentration: number; cfu: number }>
      > = {};
      for (const row of tableRows) {
        const edit = rowEdits[row.id];
        const entry = {
          time: parseFloat(edit?.time ?? String(row.time)),
          concentration: parseFloat(
            edit?.concentration ?? String(row.concentration),
          ),
          cfu: parseFloat(edit?.cfu ?? String(row.cfu)),
        };
        if (!bySample[row.sample_id]) bySample[row.sample_id] = [];
        bySample[row.sample_id].push(entry);
      }
      // Only save samples that have at least one edit
      const editedSampleIds = new Set(
        Object.keys(rowEdits)
          .map((obsId) => {
            const row = tableRows.find((r) => r.id === Number(obsId));
            return row?.sample_id;
          })
          .filter(Boolean) as string[],
      );

      await Promise.all(
        [...editedSampleIds].map((sId) =>
          api.samples.updateRows(sId, bySample[sId]),
        ),
      );
      // Reload all affected samples
      const refreshed = await Promise.all(
        [...editedSampleIds].map((sId) =>
          api.samples.data(sId).then((d) => [sId, d] as const),
        ),
      );
      setObsMap((prev) => {
        const next = { ...prev };
        for (const [sId, d] of refreshed) next[sId] = d;
        return next;
      });
      setRowEdits({});
      setToast("Data saved and ICT recalculated");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingRows(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-primary flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-bg sticky top-0 z-10 shrink-0">
        <div className="px-5 h-13 flex items-center gap-3">
          <Link href="/" className="shrink-0 flex items-center">
            <Image
              src="/logo_dark.png"
              alt="Disinfection ICT Workbench"
              width={150}
              height={40}
              className="hidden dark:block object-contain"
              style={{ maxHeight: 36, width: "auto" }}
            />
            <Image
              src="/logo_light.png"
              alt="Disinfection ICT Workbench"
              width={150}
              height={40}
              className="block dark:hidden object-contain"
              style={{ maxHeight: 36, width: "auto" }}
            />
          </Link>
          <span className="text-border mx-1 text-xs shrink-0">|</span>
          <nav className="flex items-center gap-1 text-sm text-secondary truncate">
            <Link
              href="/"
              className="hover:text-primary flex items-center gap-1 transition-colors shrink-0"
            >
              <Home size={13} /> Studies
            </Link>
            <ChevronRight size={13} className="text-muted shrink-0" />
            <Link
              href={`/projects/${id}`}
              className="hover:text-primary transition-colors truncate max-w-[120px]"
            >
              Project
            </Link>
            <ChevronRight size={13} className="text-muted shrink-0" />
            <span className="text-primary truncate max-w-[200px]">
              {sample?.name ?? sid}
            </span>
          </nav>

          <div className="ml-auto flex items-center gap-3 shrink-0">
            {/* Fit mode toggle */}
            <div
              className="flex items-center bg-surface border border-border rounded-lg p-0.5 gap-0.5 relative"
              ref={samplePickerRef}
            >
              <button
                onClick={() => {
                  setFitMode("individual");
                  setPrediction(null);
                  setFitResult(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${fitMode === "individual" ? "bg-surface-2 text-primary" : "text-secondary hover:text-primary"}`}
              >
                <FileText size={13} /> This Sample
              </button>
              <button
                onClick={() => {
                  if (fitMode !== "pooled") {
                    setFitMode("pooled");
                    setPooledSampleIds(new Set(allSamples.map((s) => s.id)));
                    setPrediction(null);
                    setFitResult(null);
                  }
                  setShowSamplePicker((v) => !v);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${fitMode === "pooled" ? "bg-accent text-white" : "text-secondary hover:text-primary"}`}
              >
                <Layers size={13} />
                {fitMode === "pooled"
                  ? `${pooledSampleIds.size} of ${allSamples.length} Samples ▾`
                  : `All ${allSamples.length} Samples ▾`}
              </button>

              {showSamplePicker && fitMode === "pooled" && (
                <div className="absolute top-full right-0 mt-1 bg-surface border border-border rounded-xl shadow-xl z-50 min-w-[220px] p-2">
                  <div className="flex items-center justify-between px-2 py-1 mb-1">
                    <span className="text-xs text-secondary font-medium">
                      Select samples to pool
                    </span>
                    <button
                      onClick={() => setShowSamplePicker(false)}
                      className="text-muted hover:text-secondary text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  {allSamples.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface-2/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={pooledSampleIds.has(s.id)}
                        onChange={(e) => {
                          setPooledSampleIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(s.id);
                            else next.delete(s.id);
                            return next;
                          });
                          setPrediction(null);
                          setFitResult(null);
                        }}
                        className="accent-blue-500"
                      />
                      <span className="text-xs text-secondary truncate max-w-[160px]">
                        {s.name}
                      </span>
                    </label>
                  ))}
                  <div className="flex gap-2 mt-1 px-2 pt-1 border-t border-border">
                    <button
                      onClick={() =>
                        setPooledSampleIds(new Set(allSamples.map((s) => s.id)))
                      }
                      className="text-xs text-accent hover:text-accent-hover"
                    >
                      All
                    </button>
                    <button
                      onClick={() => setPooledSampleIds(new Set())}
                      className="text-xs text-muted hover:text-secondary"
                    >
                      None
                    </button>
                    <button
                      onClick={() => setPooledSampleIds(new Set([sid]))}
                      className="text-xs text-muted hover:text-secondary"
                    >
                      Only this
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setLogScale((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary transition-colors"
            >
              {logScale ? (
                <ToggleRight size={18} className="text-accent" />
              ) : (
                <ToggleLeft size={18} />
              )}
              Log scale
            </button>

            <FontSizeControl />
            <ThemeToggle />

            {experimentId && (
              <div className="relative">
                <button
                  onClick={() => setShowSaveFit((v) => !v)}
                  disabled={paramValues.length < 4}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-accent/50 text-secondary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save size={13} />
                  Save Fit
                </button>
                {showSaveFit && (
                  <div className="absolute top-full right-0 mt-1 bg-surface border border-border rounded-xl shadow-xl z-50 w-64 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-secondary">
                        Label this fit
                      </span>
                      <button
                        onClick={() => setShowSaveFit(false)}
                        className="text-muted hover:text-primary"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <input
                      autoFocus
                      value={saveFitLabel}
                      onChange={(e) => setSaveFitLabel(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveFit()}
                      placeholder="e.g. Run 1 – post calibration"
                      className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-accent mb-2"
                    />
                    <button
                      onClick={handleSaveFit}
                      disabled={savingFit || !saveFitLabel.trim()}
                      className="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 text-white rounded-lg py-1.5 text-xs font-medium transition-colors"
                    >
                      {savingFit ? "Saving…" : "Save to Experiment"}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleDownloadReport}
              disabled={!reportFitId || downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-emerald-500 text-secondary hover:text-emerald-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              Download Report
            </button>

            <button
              onClick={handleFit}
              disabled={fitting || observations.length === 0}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              {fitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}
              {fitting
                ? "Fitting…"
                : initMode === "fixed"
                  ? "Apply Fixed Params"
                  : fitMode === "pooled"
                    ? "Fit Pooled"
                    : "Fit Model"}
            </button>
          </div>
        </div>
      </header>

      {fitMode === "pooled" && (
        <div className="bg-accent/10 border-b border-accent/30 px-5 py-2 text-xs text-accent flex items-center gap-2 shrink-0">
          <Layers size={13} />
          <strong>Pooled mode</strong> — {activeSamples.length} sample
          {activeSamples.length !== 1 ? "s" : ""}. Each normalized to its own
          N₀.
          <span className="flex items-center gap-2 ml-2">
            {activeSamples.map((s, i) => (
              <span key={s.id} className="flex items-center gap-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{
                    background: SAMPLE_COLORS[i % SAMPLE_COLORS.length],
                  }}
                />
                <span className="text-secondary">{s.name}</span>
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
        <div className="w-72 shrink-0 border-r border-border flex flex-col overflow-y-auto scrollbar-thin">
          <div className="p-4 space-y-5">
            {/* Model selector */}
            <div>
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-2">
                Model
              </label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {selectedModel && (
                <div className="mt-2 bg-surface/60 rounded-lg p-3">
                  <p className="text-xs text-muted mb-1">
                    {selectedModel.description}
                  </p>
                  <p className="text-xs font-mono text-accent">
                    {selectedModel.equation}
                  </p>
                </div>
              )}
            </div>

            {/* Initial guess / fit mode */}
            <div>
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-2">
                Parameter Mode
              </label>
              <div className="space-y-1">
                {(
                  [
                    {
                      value: "auto",
                      label: "Auto-fit (recommended)",
                      desc: "Optimizer picks starting points automatically.",
                    },
                    {
                      value: "manual",
                      label: "Seed & fit",
                      desc: "Use slider values as starting guess, then optimize.",
                    },
                    {
                      value: "fixed",
                      label: "Fixed — no fit",
                      desc: "Use slider values exactly, skip the optimizer.",
                    },
                  ] as const
                ).map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className="flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div
                      className={`w-3.5 h-3.5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${initMode === value ? "border-accent bg-accent" : "border-border group-hover:border-secondary"}`}
                    >
                      {initMode === value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <span
                        className={`text-xs block ${initMode === value ? "text-primary" : "text-secondary"}`}
                      >
                        {label}
                      </span>
                      {initMode === value && (
                        <span className="text-xs text-muted">{desc}</span>
                      )}
                    </div>
                    <input
                      type="radio"
                      className="sr-only"
                      checked={initMode === value}
                      onChange={() => setInitMode(value)}
                    />
                  </label>
                ))}
              </div>
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
                <div className="bg-surface/60 rounded-xl border border-border/60 overflow-hidden">
                  <table className="w-full text-xs">
                    <tbody>
                      {fitResult.parameters.map((p, i) => (
                        <tr
                          key={i}
                          className={
                            i % 2 === 0 ? "bg-transparent" : "bg-surface-2/30"
                          }
                        >
                          <td className="px-3 py-2 font-mono text-accent font-medium">
                            {p.name}
                          </td>
                          <td className="px-3 py-2 font-mono text-primary text-right">
                            {p.value.toPrecision(5)}
                          </td>
                          {p.std_error != null && (
                            <td className="px-3 py-2 text-muted text-right">
                              ±{p.std_error.toPrecision(2)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted">
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

            {/* Advanced: manual sliders */}
            {selectedModel &&
              paramValues.length === selectedModel.parameters.length && (
                <div>
                  <button
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="flex items-center gap-2 text-xs text-muted hover:text-secondary transition-colors w-full"
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
                    <div className="mt-3 border border-border/60 rounded-xl p-3 bg-surface/40">
                      <p className="text-xs text-muted mb-3">
                        Manually explore parameter sensitivity. These values are
                        used as initial guesses only when{" "}
                        <strong className="text-secondary">Manual</strong> mode
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
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-2">
                  Pooled Samples
                </label>
                <ul className="space-y-1">
                  {activeSamples.map((s, i) => (
                    <li
                      key={s.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${s.id === sid ? "bg-surface-2/60" : ""}`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          background: SAMPLE_COLORS[i % SAMPLE_COLORS.length],
                        }}
                      />
                      <span className="truncate text-secondary">{s.name}</span>
                      <span className="text-muted ml-auto shrink-0">
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
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-2">
                  Previous Fits
                </label>
                <div className="space-y-1.5">
                  {pastFits.slice(0, 5).map((f) => (
                    <div key={f.id} className="flex items-start gap-1.5">
                      <input
                        type="radio"
                        checked={reportFitId === f.id}
                        onChange={() => setReportFitId(f.id)}
                        className="accent-blue-500 mt-2.5 shrink-0"
                        title="Select for report"
                      />
                      <button
                        onClick={() => {
                          setFitResult(f);
                          setSelectedModelId(f.model_id);
                          setParamValues(f.parameters.map((p) => p.value));
                          setRightTab("statistics");
                          if (
                            f.pooled_sample_ids &&
                            f.pooled_sample_ids.length > 0
                          ) {
                            setFitMode("pooled");
                            setPooledSampleIds(new Set(f.pooled_sample_ids));
                          } else {
                            setFitMode("individual");
                            setPooledSampleIds(new Set());
                          }
                        }}
                        className={`flex-1 text-left px-3 py-2 rounded-lg text-xs transition-colors border ${fitResult?.id === f.id ? "border-accent bg-accent/10 text-accent" : "border-border hover:border-border text-secondary"}`}
                      >
                        <div className="font-medium truncate">
                          {f.model_name}
                        </div>
                        <div className="text-muted mt-0.5">
                          R² {f.statistics.r_squared.toFixed(3)} · Score{" "}
                          {f.quality_score.score.toFixed(0)}
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Center panel ────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 p-4 gap-0">
          {/* Center tab bar */}
          <div className="flex border-b border-border bg-surface/60 rounded-t-xl shrink-0">
            {[
              { key: "plot" as CenterTab, label: "Plot" },
              { key: "data" as CenterTab, label: "Data" },
              {
                key: "observed" as CenterTab,
                label: "Observed vs Predicted",
                disabled: !fitResult || !prediction,
              },
              {
                key: "calculated" as CenterTab,
                label: "Calculated N",
                disabled: !fitResult,
              },
              {
                key: "journal" as CenterTab,
                label: "Process Journal",
              },
            ].map(({ key, label, disabled }) => (
              <button
                key={key}
                onClick={() => !disabled && setCenterTab(key)}
                disabled={!!disabled}
                className={`px-5 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                  centerTab === key
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:text-secondary"
                } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Center tab content */}
          <div className="flex-1 bg-surface/40 border border-border border-t-0 rounded-b-xl overflow-hidden">
            {/* ── Plot tab ── */}
            {centerTab === "plot" &&
              (observations.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted text-sm">
                  No observations. Check column mapping.
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex-1 min-h-0">
                    {fitMode === "pooled" ? (
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
                    )}
                  </div>
                  {fitResult && (
                    <div className="relative z-10 shrink-0 border-t border-border bg-surface px-5 py-2.5 flex items-baseline gap-3 overflow-x-auto scrollbar-thin">
                      <span className="text-xs text-muted font-semibold uppercase tracking-wider shrink-0 select-none">
                        Fitted equation
                      </span>
                      <code className="text-xs font-mono text-accent select-all whitespace-nowrap leading-relaxed">
                        {buildEquation(fitResult)}
                      </code>
                    </div>
                  )}
                </div>
              ))}

            {/* ── Data tab ── */}
            {centerTab === "data" && (
              <div className="flex flex-col h-full">
                {/* Save bar */}
                {hasPendingEdits && (
                  <div className="shrink-0 flex items-center gap-3 px-4 py-2 bg-accent/10 border-b border-accent/30 text-xs">
                    <span className="text-accent font-medium">
                      Unsaved changes
                    </span>
                    <button
                      onClick={saveRowEdits}
                      disabled={savingRows}
                      className="px-3 py-1 rounded bg-accent text-white font-semibold hover:bg-accent-hover disabled:opacity-50"
                    >
                      {savingRows ? "Saving…" : "Save & recalculate ICT"}
                    </button>
                    <button
                      onClick={() => setRowEdits({})}
                      className="text-muted hover:text-secondary"
                    >
                      Discard
                    </button>
                  </div>
                )}
                <div className="overflow-auto scrollbar-thin flex-1">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-surface-2/90">
                      <tr>
                        {showSampleCol && (
                          <th className="text-left px-4 py-3 text-secondary font-semibold whitespace-nowrap">
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
                            className="text-left px-4 py-3 text-secondary font-semibold whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((o, i) => {
                        const edit = rowEdits[o.id];
                        const cellCls =
                          "px-1 py-0.5 w-full bg-transparent font-mono text-primary outline-none border border-transparent focus:border-accent rounded";
                        return (
                          <tr
                            key={o.id}
                            className={
                              i % 2 === 0 ? "bg-transparent" : "bg-surface-2/20"
                            }
                          >
                            {showSampleCol && (
                              <td className="px-4 py-2.5">
                                <span className="flex items-center gap-1.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                    style={{ background: o.sampleColor }}
                                  />
                                  <span className="text-secondary">
                                    {o.sampleName}
                                  </span>
                                </span>
                              </td>
                            )}
                            <td className="px-3 py-1.5">
                              <input
                                type="number"
                                className={cellCls}
                                value={edit?.time ?? o.time}
                                onChange={(e) =>
                                  setRowEdits((prev) => ({
                                    ...prev,
                                    [o.id]: {
                                      time: e.target.value,
                                      concentration:
                                        prev[o.id]?.concentration ??
                                        String(o.concentration),
                                      cfu: prev[o.id]?.cfu ?? String(o.cfu),
                                    },
                                  }))
                                }
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                type="number"
                                className={cellCls}
                                value={
                                  edit?.concentration ??
                                  o.concentration.toFixed(3)
                                }
                                onChange={(e) =>
                                  setRowEdits((prev) => ({
                                    ...prev,
                                    [o.id]: {
                                      time: prev[o.id]?.time ?? String(o.time),
                                      concentration: e.target.value,
                                      cfu: prev[o.id]?.cfu ?? String(o.cfu),
                                    },
                                  }))
                                }
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                type="number"
                                className={cellCls}
                                value={edit?.cfu ?? o.cfu}
                                onChange={(e) =>
                                  setRowEdits((prev) => ({
                                    ...prev,
                                    [o.id]: {
                                      time: prev[o.id]?.time ?? String(o.time),
                                      concentration:
                                        prev[o.id]?.concentration ??
                                        String(o.concentration),
                                      cfu: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </td>
                            <td className="px-4 py-2.5 font-mono text-muted">
                              {o.ict != null ? o.ict.toFixed(3) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="shrink-0 px-4 py-1.5 border-t border-border text-xs text-muted/60">
                  ICT is read-only — recalculated from Time &amp; Conc. on save.
                </div>
              </div>
            )}

            {/* ── Observed vs Predicted tab ── */}
            {centerTab === "observed" && (
              <div className="overflow-auto scrollbar-thin h-full">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-surface-2/90">
                    <tr>
                      {showSampleCol && (
                        <th className="text-left px-4 py-3 text-secondary font-semibold whitespace-nowrap">
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
                          className="text-left px-4 py-3 text-secondary font-semibold whitespace-nowrap"
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
                          i % 2 === 0 ? "bg-transparent" : "bg-surface-2/20"
                        }
                      >
                        {showSampleCol && (
                          <td className="px-4 py-2.5">
                            <span className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                style={{ background: row.sampleColor }}
                              />
                              <span className="text-secondary">
                                {row.sampleName}
                              </span>
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-2.5 font-mono text-secondary">
                          {(row.ict ?? 0).toFixed(3)}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-primary font-medium">
                          {row.cfu.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-accent">
                          {Math.round(row.predN).toLocaleString()}
                        </td>
                        <td
                          className={`px-4 py-2.5 font-mono ${Math.abs(row.residual) > row.cfu * 0.3 ? "text-amber-400" : "text-secondary"}`}
                        >
                          {row.residual > 0 ? "+" : ""}
                          {Math.round(row.residual).toLocaleString()}
                        </td>
                        <td
                          className={`px-4 py-2.5 font-mono ${Math.abs(row.pctError) > 30 ? "text-amber-400" : "text-secondary"}`}
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

            {/* ── Calculated N tab ── */}
            {centerTab === "calculated" &&
              (() => {
                const { ictSteps, sampleCols } = getCalculatedN();
                return (
                  <div className="overflow-auto scrollbar-thin h-full">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-surface-2/90">
                        <tr>
                          <th className="text-left px-4 py-3 text-secondary font-semibold whitespace-nowrap">
                            ICT (mg·min/L)
                          </th>
                          {sampleCols.map((s) => (
                            <th
                              key={s.name}
                              className="text-left px-4 py-3 font-semibold whitespace-nowrap"
                              style={{ color: s.color }}
                            >
                              {s.name} N (CFU/100mL)
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ictSteps.map((ict, i) => (
                          <tr
                            key={ict}
                            className={
                              i % 2 === 0 ? "bg-transparent" : "bg-surface-2/20"
                            }
                          >
                            <td className="px-4 py-2 font-mono text-secondary">
                              {ict.toFixed(0)}
                            </td>
                            {sampleCols.map((s) => {
                              const n = predictN(ict, paramValues, s.n0);
                              return (
                                <td
                                  key={s.name}
                                  className="px-4 py-2 font-mono text-accent"
                                >
                                  {n >= 1 ? n.toFixed(2) : n.toExponential(2)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

            {/* ── Journal tab ── */}
            {centerTab === "journal" && (
              <div className="h-full overflow-y-auto">
                <JournalTab sampleId={sid} />
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel ─────────────────────────────────────────────── */}
        <div className="w-80 shrink-0 border-l border-border flex flex-col overflow-hidden">
          <div className="flex border-b border-border shrink-0">
            {(["statistics", "quality", "diagnostics"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setRightTab(t)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors capitalize ${rightTab === t ? "text-accent border-b-2 border-accent" : "text-muted hover:text-secondary"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
            {!fitResult ? (
              <div className="text-center py-12 text-muted text-sm">
                <Play size={28} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium text-secondary mb-2">Ready to fit</p>
                <p className="text-xs">
                  Select a model and click{" "}
                  <strong className="text-primary">Fit Model</strong>.
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

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl text-sm font-medium animate-slide-up">
          <CheckCircle2 size={16} />
          {toast}
          <button
            onClick={() => setToast(null)}
            className="ml-2 opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
