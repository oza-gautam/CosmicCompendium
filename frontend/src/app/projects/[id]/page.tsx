"use client";

import { useEffect, useState, useRef } from "react";
import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import type { Project, Sample, Experiment, ExperimentMetadata } from "@/types";
import {
  ChevronRight,
  Upload,
  Beaker,
  Home,
  FileSpreadsheet,
  Plus,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  FileUp,
  FlaskConical,
  ChevronDown,
  X,
  CheckSquare,
  Square,
  ArrowRight,
  Pencil,
  Check,
  FolderOpen,
} from "lucide-react";
import ExcelImportModal from "@/components/ExcelImportModal";
import QuickImportModal from "@/components/QuickImportModal";
import ThemeToggle from "@/components/ThemeToggle";

function Logo() {
  return (
    <>
      <Image
        src="/logo_dark.png"
        alt="Disinfection ICT Workbench"
        width={160}
        height={40}
        className="hidden dark:block h-10 object-contain"
        priority
      />
      <Image
        src="/logo_light.png"
        alt="Disinfection ICT Workbench"
        width={160}
        height={40}
        className="block dark:hidden h-10 object-contain"
        priority
      />
    </>
  );
}

function relDate(iso: string) {
  const diffDays = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 86400000,
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

function SampleStatusBadge({ sample }: { sample: Sample }) {
  const hasObs = sample.observation_count > 0;
  if (!hasObs)
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted border border-border">
        <span className="w-1.5 h-1.5 rounded-full bg-muted inline-block" />
        Empty
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
      <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
      Ready for Calibration
    </span>
  );
}

function ExperimentCard({
  experiment,
  projectId,
}: {
  experiment: Experiment;
  projectId: string;
}) {
  return (
    <Link
      href={`/projects/${projectId}/experiments/${experiment.id}`}
      className="group bg-surface border border-border hover:border-accent/50 rounded-xl p-5 flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/5 transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/10">
            <FlaskConical size={14} className="text-accent" />
          </div>
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
            Experiment
          </span>
        </div>
        <ChevronRight
          size={14}
          className="text-muted group-hover:text-accent transition-colors mt-0.5"
        />
      </div>

      <div>
        <h3 className="font-semibold text-primary text-base leading-tight">
          {experiment.name}
        </h3>
        <p className="text-secondary text-xs mt-1">
          {experiment.sample_count} sample
          {experiment.sample_count !== 1 ? "s" : ""}
          {experiment.last_fit_label && (
            <> · Last fit: {experiment.last_fit_label}</>
          )}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
          <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
          Ready for Calibration
        </span>
        <span className="flex items-center gap-1 text-xs text-muted">
          <Clock size={10} />
          {relDate(experiment.created_at)}
        </span>
      </div>
    </Link>
  );
}

function UncategorizedCard({
  sample,
  projectId,
  checked,
  onToggle,
}: {
  sample: Sample;
  projectId: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`group bg-surface border rounded-xl p-4 flex flex-col gap-2 transition-all duration-150 ${
        checked ? "border-accent/50 bg-accent/5" : "border-border"
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className="shrink-0 text-muted hover:text-accent transition-colors"
        >
          {checked ? (
            <CheckSquare size={14} className="text-accent" />
          ) : (
            <Square size={14} />
          )}
        </button>
        <Link
          href={`/projects/${projectId}/samples/${sample.id}`}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <span className="text-xs font-medium text-primary truncate">
            {sample.name}
          </span>
          <ChevronRight
            size={12}
            className="text-muted group-hover:text-accent ml-auto shrink-0"
          />
        </Link>
      </div>
      <div className="flex items-center justify-between pl-5">
        <SampleStatusBadge sample={sample} />
        <span className="text-xs text-muted">{relDate(sample.created_at)}</span>
      </div>
    </div>
  );
}

const META_FIELDS: { key: keyof ExperimentMetadata; label: string }[] = [
  { key: "organism", label: "Organism" },
  { key: "disinfectant", label: "Disinfectant" },
  { key: "matrix", label: "Matrix" },
  { key: "water_temp", label: "Temp (°C)" },
  { key: "analyst", label: "Analyst" },
  { key: "notes", label: "Notes" },
];

function NewExperimentModal({
  onClose,
  onCreated,
  projectId,
}: {
  onClose: () => void;
  onCreated: (exp: Experiment) => void;
  projectId: string;
}) {
  const [name, setName] = useState("");
  const [meta, setMeta] = useState<ExperimentMetadata>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const exp = await api.experiments.create(
        projectId,
        name.trim(),
        Object.values(meta).some(Boolean) ? meta : undefined,
      );
      onCreated(exp);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-primary">
            New Experiment
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-secondary block mb-1">
              Experiment Name *
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Clean Water Series - PAA"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
              Metadata (optional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {META_FIELDS.map(({ key, label }) => (
                <div key={key} className={key === "notes" ? "col-span-2" : ""}>
                  <label className="text-xs text-muted block mb-1">
                    {label}
                  </label>
                  <input
                    value={meta[key] ?? ""}
                    onChange={(e) =>
                      setMeta((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-error">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-secondary hover:text-primary border border-border rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors disabled:opacity-40"
            >
              {saving ? "Creating…" : "Create Experiment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewExp, setShowNewExp] = useState(false);
  const [uncatOpen, setUncatOpen] = useState(true);
  const [editingPath, setEditingPath] = useState(false);
  const [pathDraft, setPathDraft] = useState("");
  const [savingPath, setSavingPath] = useState(false);
  const [selectedUncat, setSelectedUncat] = useState<Set<string>>(new Set());
  const [moveTargetId, setMoveTargetId] = useState<string>("");
  const [moving, setMoving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
    currentName: string;
  } | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showQuickImport, setShowQuickImport] = useState(false);
  const [importBanner, setImportBanner] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      api.projects.get(id),
      api.experiments.list(id),
      api.samples.list(id),
    ])
      .then(([proj, exps, samps]) => {
        setProject(proj);
        setExperiments(exps);
        setSamples(samps);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const uncategorized = samples.filter((s) => !s.experiment_id);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadErrors([]);
    const errors: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({
        done: i,
        total: files.length,
        currentName: file.name,
      });
      try {
        const sample = await api.samples.upload(
          id,
          file,
          file.name.replace(/\.(csv|xlsx?)$/i, ""),
        );
        setSamples((prev) => [...prev, sample]);
      } catch (err) {
        errors.push(`${file.name}: ${err}`);
      }
    }
    setUploadProgress(null);
    if (errors.length > 0) setUploadErrors(errors);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function refreshAll() {
    const [exps, samps] = await Promise.all([
      api.experiments.list(id),
      api.samples.list(id),
    ]);
    setExperiments(exps);
    setSamples(samps);
  }

  async function saveOutputPath() {
    setSavingPath(true);
    try {
      const updated = await api.projects.update(id, {
        output_path: pathDraft.trim() || undefined,
      });
      setProject(updated);
      setEditingPath(false);
    } finally {
      setSavingPath(false);
    }
  }

  async function handleMove() {
    if (!moveTargetId || selectedUncat.size === 0) return;
    setMoving(true);
    try {
      await Promise.all(
        Array.from(selectedUncat).map((sid) =>
          api.samples.patch(sid, { experiment_id: Number(moveTargetId) }),
        ),
      );
      setSelectedUncat(new Set());
      setMoveTargetId("");
      await refreshAll();
    } finally {
      setMoving(false);
    }
  }

  function toggleUncat(sid: string) {
    setSelectedUncat((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-muted text-sm">
        Loading…
      </div>
    );
  }
  if (!project) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-error">
        Project not found
      </div>
    );
  }

  const uploading = uploadProgress !== null;
  const totalObs = samples.reduce((a, s) => a + s.observation_count, 0);
  const calibrated = 0;
  const pending = samples.filter((s) => s.observation_count > 0).length;

  return (
    <div className="min-h-screen bg-bg text-primary">
      {/* ── Header ── */}
      <header className="border-b border-border sticky top-0 z-10 bg-bg/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <Logo />
          <span className="text-border mx-1">|</span>
          <nav className="flex items-center gap-1 text-sm text-secondary">
            <Link
              href="/"
              className="hover:text-primary flex items-center gap-1 transition-colors"
            >
              <Home size={13} />
              Studies
            </Link>
            <ChevronRight size={13} className="text-muted" />
            <span className="text-primary font-medium">{project.name}</span>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Study Overview ── */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-1">
            Benchmark Study
          </p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                {project.name}
              </h1>
              <p className="text-secondary text-sm mt-1">
                {experiments.length} experiment
                {experiments.length !== 1 ? "s" : ""} · {samples.length} sample
                {samples.length !== 1 ? "s" : ""} · {totalObs} total
                observations
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowExcelModal(true)}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border hover:border-accent/50 text-secondary hover:text-primary transition-colors disabled:opacity-40"
              >
                <FileSpreadsheet size={14} />
                Import Sample Data (Excel)
              </button>
              <label
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border border-border hover:border-accent/50 text-secondary hover:text-primary ${
                  uploading ? "opacity-40 cursor-not-allowed" : ""
                }`}
              >
                {uploading ? (
                  <span>
                    Uploading {uploadProgress.done + 1}/{uploadProgress.total}
                  </span>
                ) : (
                  <>
                    <Upload size={14} />
                    Import Sample Data (CSVs)
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  multiple
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
              <button
                onClick={() => setShowQuickImport(true)}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-40"
              >
                <FlaskConical size={14} />
                Create Experiment from Wizard
              </button>
            </div>
          </div>
        </div>

        {/* ── Banners ── */}
        {uploading && uploadProgress && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-secondary mb-1">
              <span>Uploading {uploadProgress.currentName}</span>
              <span>
                {uploadProgress.done}/{uploadProgress.total}
              </span>
            </div>
            <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{
                  width: `${(uploadProgress.done / uploadProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
        {importBanner && (
          <div className="bg-success/10 border border-success/30 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
            <span className="text-success text-sm">{importBanner}</span>
            <button
              onClick={() => setImportBanner(null)}
              className="text-success/60 hover:text-success text-xs ml-4 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
        {uploadErrors.length > 0 && (
          <div className="mb-6 bg-error/10 border border-error/30 rounded-xl p-4">
            <p className="text-error text-sm font-medium mb-2">
              Some files failed to upload:
            </p>
            <ul className="space-y-1">
              {uploadErrors.map((e, i) => (
                <li key={i} className="text-error/80 text-xs font-mono">
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Main 3-column layout ── */}
        <div className="flex gap-6">
          {/* LEFT sidebar */}
          <div className="w-52 shrink-0 flex flex-col gap-4">
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
                Study Metadata
              </p>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs text-muted">Created</p>
                  <p className="text-sm text-primary mt-0.5">
                    {new Date(project.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Status</p>
                  <span className="inline-flex items-center gap-1 text-xs text-accent mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                    Active
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted">Model</p>
                  <p className="text-xs text-secondary mt-0.5">
                    Two-Population ICT
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs text-muted flex items-center gap-1">
                      <FolderOpen size={10} />
                      Report Output Path
                    </p>
                    {!editingPath && (
                      <button
                        onClick={() => {
                          setPathDraft(project.output_path ?? "");
                          setEditingPath(true);
                        }}
                        className="text-muted hover:text-accent transition-colors"
                      >
                        <Pencil size={10} />
                      </button>
                    )}
                  </div>
                  {editingPath ? (
                    <div className="flex flex-col gap-1.5 mt-1">
                      <input
                        autoFocus
                        value={pathDraft}
                        onChange={(e) => setPathDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveOutputPath();
                          if (e.key === "Escape") setEditingPath(false);
                        }}
                        placeholder="C:\Reports\..."
                        className="w-full bg-surface-2 border border-border rounded px-2 py-1 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-accent"
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={saveOutputPath}
                          disabled={savingPath}
                          className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium disabled:opacity-40"
                        >
                          <Check size={10} />
                          {savingPath ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingPath(false)}
                          className="text-xs text-muted hover:text-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-secondary mt-0.5 break-all">
                      {project.output_path ?? (
                        <span className="text-muted italic">Not set</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
                Quick Actions
              </p>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setShowNewExp(true)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-secondary hover:text-primary hover:bg-surface-2 transition-colors text-left"
                >
                  <FlaskConical size={12} className="text-accent shrink-0" />
                  New Experiment
                </button>
                <button
                  onClick={() => setShowExcelModal(true)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-secondary hover:text-primary hover:bg-surface-2 transition-colors text-left"
                >
                  <FileUp size={12} className="text-accent shrink-0" />
                  Import Data
                </button>
                <button
                  disabled
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted cursor-not-allowed text-left"
                >
                  <BarChart3 size={12} className="shrink-0" />
                  Start Calibration
                </button>
              </div>
            </div>
          </div>

          {/* CENTER — Experiments */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted uppercase tracking-widest">
                  Experiments
                </span>
                {experiments.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                    {experiments.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowNewExp(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent hover:bg-accent-hover text-white transition-colors"
              >
                <Plus size={12} />
                New Experiment
              </button>
            </div>

            {experiments.length === 0 && uncategorized.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 opacity-20">
                  <Image
                    src="/icon_dark.png"
                    alt=""
                    width={64}
                    height={64}
                    className="hidden dark:block"
                  />
                  <Image
                    src="/icon_light.png"
                    alt=""
                    width={64}
                    height={64}
                    className="block dark:hidden"
                  />
                </div>
                <p className="text-lg font-semibold text-primary">
                  No Experiments Yet
                </p>
                <p className="text-sm text-muted mt-2 max-w-xs">
                  Create an experiment to group samples and begin ICT modeling.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowNewExp(true)}
                    className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FlaskConical size={14} />
                    New Experiment
                  </button>
                  <button
                    onClick={() => setShowQuickImport(true)}
                    className="flex items-center gap-2 border border-border hover:border-accent/50 text-secondary hover:text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FileSpreadsheet size={14} />
                    Create Experiment from Wizard
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {experiments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {experiments.map((exp) => (
                      <ExperimentCard
                        key={exp.id}
                        experiment={exp}
                        projectId={id}
                      />
                    ))}
                  </div>
                )}

                {/* Uncategorized samples */}
                {uncategorized.length > 0 && (
                  <div>
                    {/* Header row */}
                    <div className="flex items-center gap-3 mb-3">
                      <button
                        onClick={() => setUncatOpen((v) => !v)}
                        className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-widest hover:text-secondary transition-colors"
                      >
                        <ChevronDown
                          size={13}
                          className={`transition-transform ${uncatOpen ? "" : "-rotate-90"}`}
                        />
                        Uncategorized ({uncategorized.length} sample
                        {uncategorized.length !== 1 ? "s" : ""})
                      </button>
                      {uncatOpen && (
                        <div className="flex items-center gap-2 text-xs ml-1">
                          <button
                            onClick={() =>
                              setSelectedUncat(
                                new Set(uncategorized.map((s) => s.id)),
                              )
                            }
                            className="text-accent hover:text-accent/80 transition-colors"
                          >
                            All
                          </button>
                          <span className="text-border">·</span>
                          <button
                            onClick={() => setSelectedUncat(new Set())}
                            className="text-muted hover:text-secondary transition-colors"
                          >
                            None
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action bar */}
                    {selectedUncat.size > 0 && (
                      <div className="flex items-center gap-3 mb-3 bg-accent/10 border border-accent/30 rounded-xl px-4 py-2.5">
                        <span className="text-xs font-medium text-accent shrink-0">
                          {selectedUncat.size} selected
                        </span>
                        <ArrowRight
                          size={13}
                          className="text-accent/60 shrink-0"
                        />
                        <select
                          value={moveTargetId}
                          onChange={(e) => setMoveTargetId(e.target.value)}
                          className="flex-1 bg-surface border border-border rounded-lg px-2 py-1 text-xs text-primary focus:outline-none focus:border-accent min-w-0"
                        >
                          <option value="">
                            {experiments.length === 0
                              ? "No experiments yet"
                              : "Select experiment…"}
                          </option>
                          {experiments.map((exp) => (
                            <option key={exp.id} value={String(exp.id)}>
                              {exp.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleMove}
                          disabled={
                            moving || !moveTargetId || experiments.length === 0
                          }
                          className="px-3 py-1 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors shrink-0"
                        >
                          {moving ? "Moving…" : "Move"}
                        </button>
                        <button
                          onClick={() => setSelectedUncat(new Set())}
                          className="text-xs text-muted hover:text-secondary transition-colors shrink-0"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {uncatOpen && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {uncategorized.map((s) => (
                          <UncategorizedCard
                            key={s.id}
                            sample={s}
                            projectId={id}
                            checked={selectedUncat.has(s.id)}
                            onToggle={() => toggleUncat(s.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT sidebar */}
          <div className="w-56 shrink-0 flex flex-col gap-4">
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
                Study Summary
              </p>
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: "Experiments",
                    value: experiments.length,
                    icon: FlaskConical,
                  },
                  { label: "Observations", value: totalObs, icon: Activity },
                  {
                    label: "Calibrated",
                    value: calibrated,
                    icon: CheckCircle2,
                  },
                  { label: "Pending", value: pending, icon: AlertCircle },
                ].map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={12} className="text-muted" />
                      <span className="text-xs text-secondary">{label}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
                Recent Activity
              </p>
              {experiments.length === 0 ? (
                <p className="text-xs text-muted">No activity yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {experiments.slice(0, 4).map((exp) => (
                    <div key={exp.id} className="flex items-start gap-2">
                      <div className="mt-0.5 p-1 rounded-full bg-accent/10 shrink-0">
                        <FlaskConical size={9} className="text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-primary truncate">
                          {exp.name}
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(exp.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showNewExp && (
        <NewExperimentModal
          projectId={id}
          onClose={() => setShowNewExp(false)}
          onCreated={(exp) => {
            setExperiments((prev) => [exp, ...prev]);
            setShowNewExp(false);
          }}
        />
      )}

      {showExcelModal && (
        <ExcelImportModal
          projectId={id}
          onClose={() => setShowExcelModal(false)}
          onImportComplete={(count) => {
            setImportBanner(
              `Import complete — ${count} sample${count !== 1 ? "s" : ""} added`,
            );
            refreshAll();
          }}
        />
      )}

      {showQuickImport && (
        <QuickImportModal
          projectId={id}
          onClose={() => setShowQuickImport(false)}
          onImportComplete={(count) => {
            setImportBanner(
              `Quick Import complete — ${count} experiment${count !== 1 ? "s" : ""} created`,
            );
            refreshAll();
          }}
        />
      )}
    </div>
  );
}
