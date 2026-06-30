"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import type { Project, Experiment, Sample } from "@/types";
import {
  Home,
  ChevronRight,
  Play,
  FlaskConical,
  CheckSquare,
  Square,
} from "lucide-react";
import ExperimentMetaPanel from "@/components/ExperimentMetaPanel";
import SavedFitsPanel from "@/components/SavedFitsPanel";
import ThemeToggle from "@/components/ThemeToggle";
import FontSizeControl from "@/components/FontSizeControl";

export default function ExperimentPage({
  params,
}: {
  params: Promise<{ id: string; eid: string }>;
}) {
  const { id, eid } = use(params);
  const eidNum = Number(eid);
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.projects.get(id),
      api.experiments.get(eidNum),
      api.experiments.samples(eidNum),
    ])
      .then(([proj, exp, samps]) => {
        setProject(proj);
        setExperiment(exp);
        setSamples(samps);
        setSelected(new Set(samps.map((s) => s.id)));
      })
      .finally(() => setLoading(false));
  }, [id, eidNum]);

  function toggleSample(sid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  }

  function handleFit() {
    if (selected.size === 0) return;
    const sids = Array.from(selected);
    // Navigate to the first selected sample's page with all selected pre-pooled
    const primary = sids[0];
    const query = new URLSearchParams();
    query.set("pooled", sids.join(","));
    query.set("experimentId", eid);
    router.push(`/projects/${id}/samples/${primary}?${query.toString()}`);
  }

  function handleRestore(params: Record<string, number>) {
    if (samples.length === 0) return;
    const primary = samples[0].id;
    const sids = samples.map((s) => s.id).join(",");
    const query = new URLSearchParams();
    query.set("pooled", sids);
    query.set("experimentId", eid);
    query.set("initMode", "fixed");
    query.set("beta", String(params.beta ?? 0));
    query.set("kd", String(params.kd ?? 0));
    query.set("kp", String(params.kp ?? 0));
    query.set("m", String(params.m ?? 1));
    router.push(`/projects/${id}/samples/${primary}?${query.toString()}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-muted text-sm">
        Loading…
      </div>
    );
  }

  if (!project || !experiment) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-error">
        Not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-primary">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-10 bg-bg/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="shrink-0 flex items-center">
            <Image
              src="/logo_dark.png"
              alt="ICT Workbench"
              width={150}
              height={40}
              className="hidden dark:block h-9 object-contain"
            />
            <Image
              src="/logo_light.png"
              alt="ICT Workbench"
              width={150}
              height={40}
              className="block dark:hidden h-9 object-contain"
            />
          </Link>
          <span className="text-border mx-1">|</span>
          <nav className="flex items-center gap-1 text-sm text-secondary">
            <Link
              href="/"
              className="hover:text-primary flex items-center gap-1 transition-colors"
            >
              <Home size={13} /> Studies
            </Link>
            <ChevronRight size={13} className="text-muted" />
            <Link
              href={`/projects/${id}`}
              className="hover:text-primary transition-colors"
            >
              {project.name}
            </Link>
            <ChevronRight size={13} className="text-muted" />
            <span className="text-primary font-medium">{experiment.name}</span>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <FontSizeControl />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-1">
            Experiment
          </p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                {experiment.name}
              </h1>
              <p className="text-secondary text-sm mt-1">
                {samples.length} sample{samples.length !== 1 ? "s" : ""} ·{" "}
                {selected.size} selected for fitting
              </p>
            </div>
            <button
              onClick={handleFit}
              disabled={selected.size === 0}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Play size={14} />
              Fit Selected
            </button>
          </div>
        </div>

        {/* 3-column layout */}
        <div className="flex gap-6">
          {/* LEFT — metadata */}
          <div className="w-64 shrink-0 flex flex-col gap-4">
            <ExperimentMetaPanel
              experiment={experiment}
              onUpdated={setExperiment}
            />
          </div>

          {/* CENTER — samples */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted uppercase tracking-widest">
                  Samples
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                  {samples.length}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => setSelected(new Set(samples.map((s) => s.id)))}
                  className="text-accent hover:text-accent/80 transition-colors"
                >
                  Select all
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-muted hover:text-secondary transition-colors"
                >
                  None
                </button>
              </div>
            </div>

            {samples.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl">
                <FlaskConical size={32} className="text-muted/40 mb-3" />
                <p className="text-sm text-muted">
                  No samples in this experiment.
                </p>
                <p className="text-xs text-muted/60 mt-1">
                  Upload CSV files from the project page, then assign them here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {samples.map((s) => {
                  const checked = selected.has(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSample(s.id)}
                      className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border transition-all ${
                        checked
                          ? "bg-accent/5 border-accent/30"
                          : "bg-surface border-border hover:border-border/80"
                      }`}
                    >
                      {checked ? (
                        <CheckSquare
                          size={16}
                          className="text-accent shrink-0"
                        />
                      ) : (
                        <Square size={16} className="text-muted shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">
                          {s.name}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          {s.observation_count} observation
                          {s.observation_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Link
                        href={`/projects/${id}/samples/${s.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-muted hover:text-accent transition-colors shrink-0 px-2 py-1 rounded hover:bg-surface-2"
                      >
                        Open →
                      </Link>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT — saved fits */}
          <div className="w-72 shrink-0">
            <SavedFitsPanel experimentId={eidNum} onRestore={handleRestore} />
          </div>
        </div>
      </div>
    </div>
  );
}
