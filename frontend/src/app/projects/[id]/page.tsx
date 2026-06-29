"use client";

import { useEffect, useState, useRef } from "react";
import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import type { Project, Sample } from "@/types";
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
} from "lucide-react";
import ExcelImportModal from "@/components/ExcelImportModal";
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

function SampleStatusBadge({ sample }: { sample: Sample }) {
  const hasObs = sample.observation_count > 0;
  if (!hasObs) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted border border-border">
        <span className="w-1.5 h-1.5 rounded-full bg-muted inline-block" />
        Empty
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
      <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
      Ready for Calibration
    </span>
  );
}

function ExperimentalRunCard({
  sample,
  projectId,
}: {
  sample: Sample;
  projectId: string;
}) {
  const created = new Date(sample.created_at);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - created.getTime()) / 86400000);
  const relativeTime =
    diffDays === 0
      ? "Today"
      : diffDays === 1
        ? "Yesterday"
        : `${diffDays}d ago`;

  return (
    <Link
      href={`/projects/${projectId}/samples/${sample.id}`}
      className="group bg-surface border border-border hover:border-accent/50 rounded-xl p-5 flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/5 transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/10">
            <Beaker size={14} className="text-accent" />
          </div>
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
            Experimental Run
          </span>
        </div>
        <ChevronRight
          size={14}
          className="text-muted group-hover:text-accent transition-colors mt-0.5"
        />
      </div>

      <div>
        <h3 className="font-semibold text-primary text-base leading-tight">
          {sample.name}
        </h3>
        <p className="text-secondary text-xs mt-1">
          {sample.observation_count} observation
          {sample.observation_count !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <SampleStatusBadge sample={sample} />
        <span className="flex items-center gap-1 text-xs text-muted">
          <Clock size={10} />
          {relativeTime}
        </span>
      </div>
    </Link>
  );
}

function EmptyStudy({
  onUpload,
  onExcel,
}: {
  onUpload: () => void;
  onExcel: () => void;
}) {
  return (
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
      <p className="text-lg font-semibold text-primary">No Experimental Runs</p>
      <p className="text-sm text-muted mt-2 max-w-xs">
        Import laboratory data to begin Integrated Contact Time modeling.
      </p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={onExcel}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <FileSpreadsheet size={14} />
          Import Excel
        </button>
        <button
          onClick={onUpload}
          className="flex items-center gap-2 border border-border hover:border-accent/50 text-secondary hover:text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Upload size={14} />
          Upload CSV
        </button>
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
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
    currentName: string;
  } | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [importBanner, setImportBanner] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([api.projects.get(id), api.samples.list(id)])
      .then(([proj, samps]) => {
        setProject(proj);
        setSamples(samps);
      })
      .finally(() => setLoading(false));
  }, [id]);

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

  async function refreshSamples() {
    const samps = await api.samples.list(id);
    setSamples(samps);
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
                {samples.length} experimental run
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
                Import Excel
              </button>
              <label
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  uploading
                    ? "bg-surface-2 text-muted cursor-not-allowed"
                    : "bg-accent hover:bg-accent-hover text-white"
                }`}
              >
                {uploading ? (
                  <span>
                    Uploading {uploadProgress.done + 1}/{uploadProgress.total}
                  </span>
                ) : (
                  <>
                    <Upload size={14} />
                    Upload CSVs
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
            </div>
          </div>
        </div>

        {/* ── Upload progress ── */}
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

        {/* ── Import banner ── */}
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

        {/* ── Upload errors ── */}
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
          {/* LEFT sidebar — Study info */}
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
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
                Quick Actions
              </p>
              <div className="flex flex-col gap-1">
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

          {/* CENTER — Experimental Runs */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-muted uppercase tracking-widest">
                Experimental Runs
              </span>
              {samples.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                  {samples.length}
                </span>
              )}
            </div>

            {samples.length === 0 ? (
              <EmptyStudy
                onUpload={() => fileRef.current?.click()}
                onExcel={() => setShowExcelModal(true)}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {samples.map((s) => (
                  <ExperimentalRunCard key={s.id} sample={s} projectId={id} />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT sidebar — Study summary */}
          <div className="w-56 shrink-0 flex flex-col gap-4">
            {/* Metrics */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
                Study Summary
              </p>
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: "Experimental Runs",
                    value: samples.length,
                    icon: Beaker,
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

            {/* Recent activity */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
                Recent Activity
              </p>
              {samples.length === 0 ? (
                <p className="text-xs text-muted">No activity yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {samples.slice(0, 4).map((s) => (
                    <div key={s.id} className="flex items-start gap-2">
                      <div className="mt-0.5 p-1 rounded-full bg-accent/10 shrink-0">
                        <Plus size={9} className="text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-primary truncate">
                          {s.name}
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(s.created_at).toLocaleDateString()}
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

      {showExcelModal && (
        <ExcelImportModal
          projectId={id}
          onClose={() => setShowExcelModal(false)}
          onImportComplete={(count) => {
            setImportBanner(
              `Import complete — ${count} sample${count !== 1 ? "s" : ""} added`,
            );
            refreshSamples();
          }}
        />
      )}
    </div>
  );
}
