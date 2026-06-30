"use client";

import { useState } from "react";
import type {
  QuickImportSheetPreview,
  QuickImportConfirmedColMap,
  QuickImportSheetConfig,
} from "@/types";

const FIELD_KEYS: (keyof QuickImportConfirmedColMap)[] = [
  "group",
  "time",
  "cfu",
  "concentration",
];

const FIELD_LABELS: Record<string, string> = {
  group: "Group / Sample ID",
  time: "Time",
  cfu: "CFU / Organism count",
  concentration: "Disinfectant conc.",
};

interface Props {
  sheet: QuickImportSheetPreview;
  override?: QuickImportSheetConfig; // pre-filled from ManualGridScreen
  onChange: (cfg: QuickImportSheetConfig) => void;
}

export default function ConfirmScreen({ sheet, override, onChange }: Props) {
  const [experimentName, setExperimentName] = useState(
    override?.experiment_name ?? sheet.experiment_name,
  );

  const initialColMap: QuickImportConfirmedColMap = {
    group: override?.col_map.group ?? sheet.col_map.group,
    time: override?.col_map.time ?? sheet.col_map.time ?? "",
    cfu: override?.col_map.cfu ?? sheet.col_map.cfu ?? "",
    concentration:
      override?.col_map.concentration ?? sheet.col_map.concentration ?? "",
  };
  const [colMap, setColMap] =
    useState<QuickImportConfirmedColMap>(initialColMap);

  const headers = sheet.all_headers.filter(Boolean);

  function emit(name: string, map: QuickImportConfirmedColMap) {
    onChange({
      sheet_name: sheet.sheet_name,
      experiment_name: name,
      header_row_index: override?.header_row_index ?? sheet.header_row_index,
      col_map: map,
      data_row_indices: override?.data_row_indices,
    });
  }

  function handleNameChange(v: string) {
    setExperimentName(v);
    emit(v, colMap);
  }

  function handleColChange(
    field: keyof QuickImportConfirmedColMap,
    value: string,
  ) {
    const next = { ...colMap, [field]: value || undefined };
    setColMap(next);
    emit(experimentName, next);
  }

  // Derive sample groups from col_map if group col is set (auto-detect case)
  const groups = sheet.sample_groups;

  const isValid =
    experimentName.trim() && colMap.time && colMap.cfu && colMap.concentration;

  return (
    <div className="flex flex-col gap-4">
      {/* Experiment name */}
      <div>
        <label className="text-xs text-muted block mb-1">Experiment name</label>
        <input
          value={experimentName}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-accent"
        />
      </div>

      {/* Column mapping */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">
          Column mapping
        </p>
        <div className="grid grid-cols-2 gap-3">
          {FIELD_KEYS.map((field) => (
            <div key={field}>
              <label className="text-xs text-secondary block mb-1">
                {FIELD_LABELS[field]}
                {field !== "group" && (
                  <span className="text-error ml-0.5">*</span>
                )}
              </label>
              <select
                value={colMap[field] ?? ""}
                onChange={(e) => handleColChange(field, e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm text-primary focus:outline-none focus:border-accent"
              >
                <option value="">— none —</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Sample groups preview */}
      {groups.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">
            Samples detected ({groups.length})
          </p>
          <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
            {groups.map((g) => (
              <div
                key={g.group_value}
                className="flex items-center justify-between px-3 py-1.5 bg-surface-2 rounded-lg border border-border"
              >
                <span className="text-sm text-primary">{g.sample_name}</span>
                <span className="text-xs text-muted">{g.row_count} obs.</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isValid && (
        <p className="text-xs text-muted italic">
          Map Time, CFU, and Concentration to confirm this sheet.
        </p>
      )}
    </div>
  );
}
