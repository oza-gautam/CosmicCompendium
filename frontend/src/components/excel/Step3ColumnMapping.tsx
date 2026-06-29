"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Save, BookOpen } from "lucide-react";
import type {
  ColumnMap,
  ImportTemplate,
  PendingSample,
  SheetRawResult,
} from "@/types";

const APP_FIELDS: { key: keyof ColumnMap; label: string; required: boolean }[] =
  [
    { key: "time", label: "Time", required: true },
    { key: "concentration", label: "Concentration", required: true },
    { key: "cfu", label: "CFU / Organisms", required: true },
    { key: "ict", label: "ICT (optional)", required: false },
    { key: "replicate", label: "Replicate (optional)", required: false },
    { key: "dose", label: "Dose (optional)", required: false },
  ];

const ALIASES: Record<keyof ColumnMap, string[]> = {
  time: ["time", "minutes", "time_min", "time (min)", "time(min)", "min"],
  concentration: [
    "concentration",
    "conc",
    "disinfectant",
    "residual",
    "mg/l",
    "mg/ml",
  ],
  cfu: [
    "cfu",
    "colony",
    "count",
    "organisms",
    "coliforms",
    "microorganism",
    "e. coli",
    "log n",
    "n/n0",
  ],
  ict: ["ict", "integrated ct", "integrated contact"],
  replicate: ["replicate", "rep"],
  dose: ["dose", "uv dose"],
};

function autoDetect(columns: string[]): ColumnMap {
  const result: ColumnMap = {};
  for (const [field, aliases] of Object.entries(ALIASES) as [
    keyof ColumnMap,
    string[],
  ][]) {
    for (const col of columns) {
      if (aliases.some((a) => col.toLowerCase().includes(a))) {
        result[field] = col;
        break;
      }
    }
  }
  return result;
}

interface MappingCardProps {
  sample: PendingSample;
  columns: string[];
  onChange: (map: ColumnMap) => void;
  templates: ImportTemplate[];
  onSaveTemplate: (
    name: string,
    map: ColumnMap,
    groupColumn?: string,
  ) => Promise<void>;
}

function MappingCard({
  sample,
  columns,
  onChange,
  templates,
  onSaveTemplate,
}: MappingCardProps) {
  const [map, setMap] = useState<ColumnMap>(() => {
    if (Object.keys(sample.columnMap).length > 0) return sample.columnMap;
    return autoDetect(columns);
  });
  const [templateName, setTemplateName] = useState("");
  const [showSave, setShowSave] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    onChange(map);
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyTemplate(t: ImportTemplate) {
    setMap(t.column_map);
  }

  async function handleSaveTemplate() {
    if (!templateName.trim()) return;
    setSaving(true);
    await onSaveTemplate(templateName.trim(), map, sample.groupColumn);
    setSaving(false);
    setShowSave(false);
    setTemplateName("");
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-slate-100">{sample.sampleName}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Sheet: {sample.sheetName} · {sample.dataRowIndices.length} data rows
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {templates.length > 0 && (
            <select
              className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              defaultValue=""
              onChange={(e) => {
                const t = templates.find((t) => t.id === e.target.value);
                if (t) applyTemplate(t);
              }}
            >
              <option value="" disabled>
                Load template…
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowSave((v) => !v)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 transition-colors"
          >
            <Save size={12} /> Save template
          </button>
        </div>
      </div>

      {showSave && (
        <div className="flex items-center gap-2 bg-slate-900/60 rounded-lg p-3">
          <BookOpen size={14} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Template name…"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-200 focus:outline-none placeholder-slate-600"
          />
          <button
            onClick={handleSaveTemplate}
            disabled={saving || !templateName.trim()}
            className="px-3 py-1 rounded-lg text-xs bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {APP_FIELDS.map(({ key, label, required }) => (
          <div key={key}>
            <label className="text-xs text-slate-400 mb-1 block">
              {label}
              {required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <select
              value={map[key] ?? ""}
              onChange={(e) =>
                setMap((prev) => ({
                  ...prev,
                  [key]: e.target.value || undefined,
                }))
              }
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">— none —</option>
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {["time", "concentration", "cfu"].some(
        (k) => !map[k as keyof ColumnMap],
      ) && (
        <p className="text-xs text-red-400">
          Time, Concentration, and CFU are required before importing.
        </p>
      )}
    </div>
  );
}

interface Props {
  samples: PendingSample[];
  sheetRawCache: Record<string, SheetRawResult>;
  templates: ImportTemplate[];
  onChange: (samples: PendingSample[]) => void;
  onSaveTemplate: (
    name: string,
    map: ColumnMap,
    groupColumn?: string,
  ) => Promise<void>;
  onBack: () => void;
  onNext: () => void;
}

export default function Step3ColumnMapping({
  samples,
  sheetRawCache,
  templates,
  onChange,
  onSaveTemplate,
  onBack,
  onNext,
}: Props) {
  function updateMap(idx: number, map: ColumnMap) {
    const updated = samples.map((s, i) =>
      i === idx ? { ...s, columnMap: map } : s,
    );
    onChange(updated);
  }

  function getColumns(sample: PendingSample): string[] {
    const raw = sheetRawCache[sample.sheetName];
    if (!raw) return [];
    const headerRow = raw.rows[sample.headerRowIndex];
    if (!headerRow) return [];
    if (sample.selectedColumns && sample.selectedColumns.length > 0) {
      return sample.selectedColumns
        .map((ci) => headerRow[ci])
        .filter(Boolean) as string[];
    }
    return headerRow.filter(Boolean);
  }

  const allValid = samples.every(
    (s) => s.columnMap.time && s.columnMap.concentration && s.columnMap.cfu,
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <p className="text-sm text-slate-400">
        Map Excel columns to app fields for each sample. Required fields are
        marked with <span className="text-red-400">*</span>.
      </p>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
        {samples.map((sample, idx) => (
          <MappingCard
            key={idx}
            sample={sample}
            columns={getColumns(sample)}
            onChange={(map) => updateMap(idx, map)}
            templates={templates}
            onSaveTemplate={onSaveTemplate}
          />
        ))}
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!allValid}
          className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Review →
        </button>
      </div>
    </div>
  );
}
