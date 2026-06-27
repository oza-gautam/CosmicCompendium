"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Project } from "@/types";
import { FlaskConical, Plus, Trash2, ChevronRight } from "lucide-react";

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);

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
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this project and all its samples?")) return;
    await api.projects.delete(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-200">
      <header className="border-b border-slate-800 sticky top-0 z-10 bg-[#0f1117]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-3">
          <FlaskConical className="text-blue-400" size={22} />
          <span className="font-semibold text-slate-100 tracking-tight">
            Disinfection Benchmark Workbench
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Projects</h1>
            <p className="text-slate-400 text-sm mt-1">
              Organize your disinfection benchmark studies
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {showForm && (
          <div className="mb-6 bg-slate-800/60 border border-slate-700 rounded-xl p-5">
            <h2 className="text-sm font-medium text-slate-300 mb-3">
              New Project
            </h2>
            <div className="flex gap-3">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createProject()}
                placeholder="Project name (e.g. PAA Study 2026)"
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={createProject}
                disabled={creating || !newName.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {creating ? "Creating…" : "Create"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-slate-500 text-sm">Loading…</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <FlaskConical size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No projects yet</p>
            <p className="text-sm mt-1">
              Create your first project to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <div
                key={p.id}
                className="group bg-slate-800/50 border border-slate-700 hover:border-slate-600 rounded-xl p-5 flex items-center gap-4 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/projects/${p.id}`}
                    className="font-medium text-slate-100 hover:text-blue-400 transition-colors"
                  >
                    {p.name}
                  </Link>
                  <p className="text-slate-500 text-xs mt-1">
                    Created {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteProject(p.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-2 rounded-lg transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-slate-400 hover:text-slate-200 p-2 rounded-lg transition-colors"
                  >
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
