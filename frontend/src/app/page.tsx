"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import type { Project } from "@/types";
import {
  Plus,
  Trash2,
  ChevronRight,
  FlaskConical,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileUp,
  BookOpen,
  Activity,
  Upload,
  X,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import FontSizeControl from "@/components/FontSizeControl";
import QuickImportModal from "@/components/QuickImportModal";

function Logo() {
  return (
    <>
      <Image
        src="/logo_dark.png"
        alt="Disinfection ICT Workbench"
        width={180}
        height={40}
        className="hidden dark:block h-10 object-contain"
        priority
      />
      <Image
        src="/logo_light.png"
        alt="Disinfection ICT Workbench"
        width={180}
        height={40}
        className="block dark:hidden h-10 object-contain"
        priority
      />
    </>
  );
}

function StatusBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
      {count}
    </span>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-start gap-3">
      <div
        className={`mt-0.5 p-1.5 rounded-lg ${accent ? "bg-accent/10 text-accent" : "bg-surface-2 text-secondary"}`}
      >
        <Icon size={14} />
      </div>
      <div>
        <p className="text-2xl font-bold text-primary leading-none">{value}</p>
        <p className="text-xs text-muted mt-1">{label}</p>
      </div>
    </div>
  );
}

function StudyCard({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: (id: string) => void;
}) {
  const created = new Date(project.created_at);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const relativeTime =
    diffDays === 0
      ? "Today"
      : diffDays === 1
        ? "Yesterday"
        : `${diffDays}d ago`;

  return (
    <div className="group relative bg-surface border border-border rounded-xl p-5 flex flex-col gap-4 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all duration-150">
      {/* top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/10">
            <FlaskConical size={15} className="text-accent" />
          </div>
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Benchmark Study
          </span>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete(project.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-muted hover:text-error p-1 rounded transition-all"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* study name */}
      <div>
        <Link href={`/projects/${project.id}`}>
          <h3 className="font-semibold text-primary text-lg leading-tight hover:text-accent transition-colors">
            {project.name}
          </h3>
        </Link>
        <p className="text-secondary text-xs mt-1">
          Integrated Contact Time · Two-Population Model
        </p>
      </div>

      {/* meta row */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Clock size={11} />
          {relativeTime}
        </span>
        <Link
          href={`/projects/${project.id}`}
          className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-medium transition-colors"
        >
          Continue Analysis
          <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}

function EmptyWorkbench({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 opacity-20">
        <Image
          src="/icon_dark.png"
          alt=""
          width={72}
          height={72}
          className="hidden dark:block"
        />
        <Image
          src="/icon_light.png"
          alt=""
          width={72}
          height={72}
          className="block dark:hidden"
        />
      </div>
      <p className="text-lg font-semibold text-primary">
        No Benchmark Studies Yet
      </p>
      <p className="text-sm text-muted mt-2 max-w-xs">
        Create your first study to begin importing laboratory data and
        calibrating Integrated Contact Time models.
      </p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={onNew}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          New Benchmark Study
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [wizardProject, setWizardProject] = useState<{
    id: string;
    file: File;
  } | null>(null);

  useEffect(() => {
    api.projects
      .list()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  async function createProject() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const p = await api.projects.create(newName.trim());
      setProjects((prev) => [p, ...prev]);
      setNewName("");
      setShowForm(false);
      if (droppedFile) {
        setWizardProject({ id: p.id, file: droppedFile });
        setDroppedFile(null);
      }
    } finally {
      setCreating(false);
    }
  }

  function handleFormFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.name.toLowerCase().endsWith(".xlsx")) setDroppedFile(f);
  }

  function handleFormFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setDroppedFile(f);
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this benchmark study and all its samples?")) return;
    await api.projects.delete(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  const recentActivity = [
    { icon: Activity, label: "Workbench initialized", time: "Just now" },
    { icon: BookOpen, label: "ICT model library loaded", time: "Just now" },
  ];

  return (
    <div className="min-h-screen bg-bg text-primary">
      {/* ── Header ── */}
      <header className="border-b border-border sticky top-0 z-10 bg-bg/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <Logo />
          <div className="ml-auto flex items-center gap-3">
            <FontSizeControl />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Welcome banner ── */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-1">
              Scientific Modeling Environment
            </p>
            <h1 className="text-2xl font-bold text-primary">
              Continue your laboratory benchmarking and kinetic model analysis.
            </h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={15} />
            New Benchmark Study
          </button>
        </div>

        {/* ── New study form ── */}
        {showForm && (
          <div className="mb-8 bg-surface border border-accent/30 rounded-xl p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              New Benchmark Study
            </h2>
            <div className="flex gap-3 mb-4">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createProject()}
                placeholder="e.g. HRSD PAA Benchmark 2026"
                className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              />
              <button
                onClick={createProject}
                disabled={creating || !newName.trim()}
                className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {creating
                  ? "Creating…"
                  : droppedFile
                    ? "Create & Import"
                    : "Create Study"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setDroppedFile(null);
                }}
                className="text-secondary hover:text-primary px-3 py-2 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Excel drop zone */}
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFormFileDrop}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed cursor-pointer transition-colors ${
                droppedFile
                  ? "border-accent/60 bg-accent/5"
                  : "border-border hover:border-accent/40 hover:bg-surface-2"
              }`}
            >
              {droppedFile ? (
                <>
                  <Upload size={14} className="text-accent shrink-0" />
                  <span className="text-sm text-accent font-medium flex-1 truncate">
                    {droppedFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setDroppedFile(null);
                    }}
                    className="text-muted hover:text-primary transition-colors"
                  >
                    <X size={13} />
                  </button>
                </>
              ) : (
                <>
                  <Upload size={14} className="text-muted shrink-0" />
                  <span className="text-sm text-muted">
                    Optional: drop an Excel file to launch the Experiment Wizard
                    after creation
                  </span>
                  <input
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    onChange={handleFormFilePick}
                  />
                </>
              )}
            </label>
          </div>
        )}

        {/* Quick Import Wizard launched from study creation */}
        {wizardProject && (
          <QuickImportModal
            projectId={wizardProject.id}
            initialFile={wizardProject.file}
            onClose={() => setWizardProject(null)}
            onImportComplete={() => setWizardProject(null)}
          />
        )}

        {/* ── Main workbench ── */}
        <div className="flex gap-6">
          {/* LEFT 70% — Active Studies */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted uppercase tracking-widest">
                  Active Studies
                </span>
                <StatusBadge count={projects.length} />
              </div>
            </div>

            {loading ? (
              <div className="text-muted text-sm py-8">Loading studies…</div>
            ) : projects.length === 0 ? (
              <EmptyWorkbench onNew={() => setShowForm(true)} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((p) => (
                  <StudyCard key={p.id} project={p} onDelete={deleteProject} />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT 30% — Sidebar */}
          <div className="w-72 shrink-0 flex flex-col gap-4">
            {/* Quick Actions */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
                Quick Actions
              </p>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-primary hover:bg-surface-2 transition-colors text-left"
                >
                  <Plus size={14} className="text-accent shrink-0" />
                  New Benchmark Study
                </button>
                <button
                  disabled
                  title="Select a study first"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted cursor-not-allowed text-left"
                >
                  <FileUp size={14} className="shrink-0" />
                  Import Dataset
                </button>
                <button
                  disabled
                  title="Select a study first"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted cursor-not-allowed text-left"
                >
                  <BarChart3 size={14} className="shrink-0" />
                  Open Analysis
                </button>
              </div>
            </div>

            {/* Workspace Summary */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
                Workspace Summary
              </p>
              <div className="grid grid-cols-2 gap-2">
                <MetricCard
                  label="Studies"
                  value={projects.length}
                  icon={FlaskConical}
                  accent
                />
                <MetricCard label="Calibrated" value={0} icon={CheckCircle2} />
                <MetricCard
                  label="Pending"
                  value={projects.length}
                  icon={AlertCircle}
                />
                <MetricCard label="Reports" value={0} icon={BarChart3} />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
                Recent Activity
              </p>
              <div className="flex flex-col gap-3">
                {projects.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-start gap-2.5">
                    <div className="mt-0.5 p-1 rounded-full bg-accent/10">
                      <FlaskConical size={10} className="text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-primary truncate">
                        Study created — {p.name}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {projects.length === 0 &&
                  recentActivity.map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="mt-0.5 p-1 rounded-full bg-surface-2">
                        <a.icon size={10} className="text-muted" />
                      </div>
                      <div>
                        <p className="text-xs text-secondary">{a.label}</p>
                        <p className="text-xs text-muted mt-0.5">{a.time}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Model info */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">
                Active Model
              </p>
              <p className="text-sm font-medium text-primary">
                Two-Population ICT
              </p>
              <p className="text-xs text-muted mt-1 leading-relaxed font-mono">
                N/N₀ = (1−β)·e^(−kd·ICT^m) + β·e^(−kp·ICT)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
