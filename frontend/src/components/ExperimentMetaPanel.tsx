"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Experiment, ExperimentMetadata } from "@/types";
import { Pencil, X, Check } from "lucide-react";

const FIELDS: { key: keyof ExperimentMetadata; label: string }[] = [
  { key: "organism", label: "Organism" },
  { key: "disinfectant", label: "Disinfectant" },
  { key: "matrix", label: "Matrix" },
  { key: "water_temp", label: "Temp (°C)" },
  { key: "analyst", label: "Analyst" },
  { key: "notes", label: "Notes" },
];

export default function ExperimentMetaPanel({
  experiment,
  onUpdated,
}: {
  experiment: Experiment;
  onUpdated: (exp: Experiment) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ExperimentMetadata>(
    experiment.metadata ?? {},
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const updated = await api.experiments.update(experiment.id, {
        metadata: draft,
      });
      onUpdated(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(experiment.metadata ?? {});
    setEditing(false);
  }

  const meta = experiment.metadata ?? {};
  const hasAny = FIELDS.some(({ key }) => meta[key]);

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest">
          Experiment Metadata
        </p>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors"
          >
            <Pencil size={11} />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={cancel}
              className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
            >
              <X size={11} />
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium transition-colors disabled:opacity-40"
            >
              <Check size={11} />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      {!editing ? (
        hasAny ? (
          <div className="flex flex-col gap-2">
            {FIELDS.filter(({ key }) => meta[key]).map(({ key, label }) => (
              <div key={key} className="flex gap-2">
                <span className="text-xs text-muted w-24 shrink-0">
                  {label}
                </span>
                <span className="text-xs text-primary">{meta[key]}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">
            No metadata set. Click Edit to add.
          </p>
        )
      ) : (
        <div className="flex flex-col gap-2">
          {FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <label className="text-xs text-muted w-24 shrink-0">
                {label}
              </label>
              <input
                value={draft[key] ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="flex-1 bg-surface-2 border border-border rounded px-2 py-1 text-xs text-primary focus:outline-none focus:border-accent"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
