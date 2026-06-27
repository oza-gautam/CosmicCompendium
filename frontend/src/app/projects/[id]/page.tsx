"use client";

import { useEffect, useState, useRef } from "react";
import { use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Project, Sample } from "@/types";
import {
  FlaskConical,
  ChevronRight,
  Upload,
  Beaker,
  Home,
  FileSpreadsheet,
} from "lucide-react";
import ExcelImportModal from "@/components/ExcelImportModal";

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
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center text-slate-500 text-sm">
        Loading…
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center text-red-400">
        Project not found
      </div>
    );
  }

  const uploading = uploadProgress !== null;

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-200">
      <header className="border-b border-slate-800 sticky top-0 z-10 bg-[#0f1117]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-3">
          <FlaskConical className="text-blue-400" size={22} />
          <span className="font-semibold text-slate-100 tracking-tight">
            Disinfection Benchmark Workbench
          </span>
          <span className="text-slate-600 mx-1">/</span>
          <nav className="flex items-center gap-1 text-sm text-slate-400">
            <Link
              href="/"
              className="hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <Home size={13} /> Projects
            </Link>
            <ChevronRight size={13} className="text-slate-600" />
            <span className="text-slate-200">{project.name}</span>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              {project.name}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {samples.length} sample{samples.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Import from Excel */}
            <button
              onClick={() => setShowExcelModal(true)}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-600 hover:border-emerald-500 text-slate-300 hover:text-emerald-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={15} />
              Import from Excel
            </button>

            {/* Upload CSVs */}
            <label
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${uploading ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
            >
              {uploading ? (
                <span>
                  Uploading {uploadProgress.done + 1}/{uploadProgress.total} —{" "}
                  {uploadProgress.currentName}
                </span>
              ) : (
                <>
                  <Upload size={15} />
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

        {/* Upload progress bar */}
        {uploading && uploadProgress && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Uploading {uploadProgress.currentName}</span>
              <span>
                {uploadProgress.done}/{uploadProgress.total}
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{
                  width: `${(uploadProgress.done / uploadProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Upload errors */}
        {uploadErrors.length > 0 && (
          <div className="mb-6 bg-red-900/30 border border-red-700 rounded-xl p-4">
            <p className="text-red-400 text-sm font-medium mb-2">
              Some files failed to upload:
            </p>
            <ul className="space-y-1">
              {uploadErrors.map((e, i) => (
                <li key={i} className="text-red-300 text-xs font-mono">
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {samples.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <Beaker size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No samples yet</p>
            <p className="text-sm mt-1">
              Upload CSV files or import from an Excel workbook to add benchmark
              datasets
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {samples.map((s) => (
              <Link
                key={s.id}
                href={`/projects/${id}/samples/${s.id}`}
                className="group bg-slate-800/50 border border-slate-700 hover:border-blue-600 rounded-xl p-5 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <Beaker size={18} className="text-blue-400 mt-0.5" />
                  <ChevronRight
                    size={15}
                    className="text-slate-600 group-hover:text-slate-400 transition-colors"
                  />
                </div>
                <h3 className="font-medium text-slate-100 mb-1 truncate">
                  {s.name}
                </h3>
                <p className="text-slate-400 text-sm">
                  {s.observation_count} observation
                  {s.observation_count !== 1 ? "s" : ""}
                </p>
                {s.column_map && Object.keys(s.column_map).length > 0 && (
                  <p className="text-slate-500 text-xs mt-2">
                    Columns: {Object.keys(s.column_map).join(", ")}
                  </p>
                )}
                <p className="text-slate-600 text-xs mt-2">
                  {new Date(s.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showExcelModal && (
        <ExcelImportModal
          projectId={id}
          onClose={() => setShowExcelModal(false)}
          onImportComplete={refreshSamples}
        />
      )}
    </div>
  );
}
