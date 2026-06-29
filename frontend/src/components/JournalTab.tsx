"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { FitEvent } from "@/types";
import {
  FileText,
  Zap,
  CheckCircle,
  AlertCircle,
  Settings,
  Loader2,
  FlaskConical,
} from "lucide-react";

const EVENT_META: Record<
  string,
  { icon: React.ReactNode; color: string; dotColor: string; label: string }
> = {
  sample_created: {
    icon: <FlaskConical size={13} />,
    color: "text-emerald-400",
    dotColor: "bg-emerald-500",
    label: "Sample Created",
  },
  fit_completed: {
    icon: <Zap size={13} />,
    color: "text-accent",
    dotColor: "bg-blue-500",
    label: "Fit Completed",
  },
  fit_approved: {
    icon: <CheckCircle size={13} />,
    color: "text-emerald-400",
    dotColor: "bg-emerald-500",
    label: "Fit Approved",
  },
  params_fixed: {
    icon: <Settings size={13} />,
    color: "text-amber-400",
    dotColor: "bg-amber-500",
    label: "Parameters Fixed",
  },
  fit_failed: {
    icon: <AlertCircle size={13} />,
    color: "text-red-400",
    dotColor: "bg-red-500",
    label: "Fit Failed",
  },
};

const DEFAULT_META = {
  icon: <FileText size={13} />,
  color: "text-secondary",
  dotColor: "bg-slate-500",
  label: "Event",
};

function formatTime(ts: string): string {
  try {
    const d = new Date(ts.endsWith("Z") ? ts : ts + "Z");
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}

function MetaRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline gap-1.5 text-xs">
      <span className="text-muted shrink-0 w-28">{label}</span>
      <span className="font-mono text-primary">{value}</span>
    </div>
  );
}

function EventCard({
  ev,
  index,
  total,
}: {
  ev: FitEvent;
  index: number;
  total: number;
}) {
  const meta = EVENT_META[ev.event_type] ?? DEFAULT_META;
  const md = ev.metadata as Record<string, unknown> | null | undefined;

  return (
    <div className="relative pl-8">
      {/* Vertical timeline line */}
      {index < total - 1 && (
        <div className="absolute left-3 top-6 bottom-0 w-px bg-border" />
      )}

      {/* Timeline dot */}
      <div
        className={`absolute left-1.5 top-2 w-3 h-3 rounded-full ${meta.dotColor} ring-2 ring-bg`}
      />

      <div className="mb-5">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`${meta.color} flex items-center gap-1 text-xs font-semibold uppercase tracking-wide`}
          >
            {meta.icon}
            {meta.label}
          </span>
          <span className="text-muted text-xs">
            {formatTime(ev.created_at)}
          </span>
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-primary mb-2">{ev.title}</p>

        {/* Narrative */}
        <p className="text-xs text-secondary leading-relaxed mb-3">{ev.body}</p>

        {/* Structured metadata for fit events */}
        {md && ev.event_type === "fit_completed" && (
          <div className="bg-surface-2 border border-border rounded-lg p-3 space-y-1">
            {md.r_squared != null && (
              <MetaRow
                label="R² (log space)"
                value={Number(md.r_squared).toFixed(4)}
              />
            )}
            {md.score != null && (
              <MetaRow
                label="Quality Score"
                value={`${Number(md.score).toFixed(0)} / 100`}
              />
            )}
            {md.converged != null && (
              <MetaRow label="Converged" value={md.converged ? "Yes" : "No"} />
            )}
            {md.fit_id != null && (
              <MetaRow
                label="Fit ID"
                value={String(md.fit_id).slice(0, 8) + "…"}
              />
            )}
          </div>
        )}

        {/* Metadata for sample_created */}
        {md && ev.event_type === "sample_created" && (
          <div className="bg-surface-2 border border-border rounded-lg p-3 space-y-1">
            {md.obs_count != null && (
              <MetaRow label="Observations" value={String(md.obs_count)} />
            )}
            {md.source != null && (
              <MetaRow label="Source" value={String(md.source).toUpperCase()} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function JournalTab({ sampleId }: { sampleId: string }) {
  const [events, setEvents] = useState<FitEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.journal
      .list(sampleId)
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sampleId]);

  useEffect(() => {
    const timer = setInterval(() => {
      api.journal
        .list(sampleId)
        .then(setEvents)
        .catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [sampleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-secondary text-sm">
        <Loader2 size={16} className="animate-spin mr-2" /> Loading journal…
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-secondary text-sm">
        <FileText size={28} className="mb-3 opacity-20" />
        No events yet. Run a fit to start the process journal.
      </div>
    );
  }

  return (
    <div className="p-5 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
          Process Journal
        </h3>
        <span className="text-xs text-muted">{events.length} events</span>
      </div>

      {events.map((ev, i) => (
        <EventCard key={ev.id} ev={ev} index={i} total={events.length} />
      ))}
    </div>
  );
}
