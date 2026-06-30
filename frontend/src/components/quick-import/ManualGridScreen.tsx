"use client";

import { useState } from "react";
import type {
  QuickImportSheetPreview,
  QuickImportConfirmedColMap,
  QuickImportSheetConfig,
} from "@/types";

const FIELD_OPTIONS = [
  { value: "", label: "— ignore —" },
  { value: "group", label: "Group / Sample ID" },
  { value: "time", label: "Time" },
  { value: "cfu", label: "CFU / Organism count" },
  { value: "concentration", label: "Disinfectant concentration" },
];

interface Props {
  sheet: QuickImportSheetPreview;
  onConfirm: (cfg: QuickImportSheetConfig) => void;
  onCancel: () => void;
}

export default function ManualGridScreen({
  sheet,
  onConfirm,
  onCancel,
}: Props) {
  const rows = sheet.raw_rows ?? [];
  const numCols = rows.reduce((max, r) => Math.max(max, r.length), 0);

  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set());
  const [checkedCols, setCheckedCols] = useState<Set<number>>(new Set());
  // col index -> field role
  const [colRoles, setColRoles] = useState<Record<number, string>>({});
  const [experimentName, setExperimentName] = useState(sheet.experiment_name);
  const [error, setError] = useState<string | null>(null);

  // First checked row = header
  const sortedCheckedRows = Array.from(checkedRows).sort((a, b) => a - b);
  const headerRowIndex = sortedCheckedRows[0] ?? -1;
  const dataRowIndices = sortedCheckedRows.slice(1);

  function toggleRow(i: number) {
    setCheckedRows((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function toggleCol(j: number) {
    setCheckedCols((prev) => {
      const next = new Set(prev);
      if (next.has(j)) next.delete(j);
      else next.add(j);
      return next;
    });
  }

  function handleConfirm() {
    setError(null);
    if (checkedRows.size < 2) {
      setError("Select at least one header row and one data row.");
      return;
    }

    // Build col_map from colRoles for checked cols
    const colMap: Partial<QuickImportConfirmedColMap> & { group?: string } = {};
    for (const j of checkedCols) {
      const role = colRoles[j];
      if (!role) continue;
      const headerVal =
        headerRowIndex >= 0 && rows[headerRowIndex]
          ? (rows[headerRowIndex][j] ?? `col_${j}`)
          : `col_${j}`;
      if (role === "group") colMap.group = headerVal;
      else if (role === "time") colMap.time = headerVal;
      else if (role === "cfu") colMap.cfu = headerVal;
      else if (role === "concentration") colMap.concentration = headerVal;
    }

    if (!colMap.time || !colMap.cfu || !colMap.concentration) {
      setError("Must map at least Time, CFU, and Concentration columns.");
      return;
    }

    // Build synthetic headers from the header row
    const headerRow = headerRowIndex >= 0 ? (rows[headerRowIndex] ?? []) : [];
    const synthHeaders = Array.from({ length: numCols }, (_, j) =>
      checkedCols.has(j) ? headerRow[j] || `col_${j}` : `__ignore_${j}`,
    );

    onConfirm({
      sheet_name: sheet.sheet_name,
      experiment_name: experimentName,
      header_row_index: headerRowIndex,
      col_map: colMap as QuickImportConfirmedColMap,
      data_row_indices: dataRowIndices,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div>
          <label className="text-xs text-muted block mb-1">
            Experiment name
          </label>
          <input
            value={experimentName}
            onChange={(e) => setExperimentName(e.target.value)}
            className="bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <p className="text-xs text-muted">
        <strong className="text-secondary">Step 1:</strong> Check rows to
        include (first checked = header).&nbsp;
        <strong className="text-secondary">Step 2:</strong> Check columns to
        use, then assign their roles below.
      </p>

      {/* Grid */}
      <div className="overflow-auto max-h-72 border border-border rounded-xl">
        <table className="text-xs w-full border-collapse">
          <thead>
            <tr className="bg-surface-2 sticky top-0 z-10">
              <th className="w-8 border-b border-border px-2 py-1 text-center text-muted">
                Row
              </th>
              {Array.from({ length: numCols }, (_, j) => (
                <th
                  key={j}
                  className="border-b border-r border-border px-2 py-1 text-center"
                >
                  <input
                    type="checkbox"
                    checked={checkedCols.has(j)}
                    onChange={() => toggleCol(j)}
                    className="accent-accent"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isHeader = i === headerRowIndex;
              return (
                <tr
                  key={i}
                  className={
                    isHeader
                      ? "bg-accent/10"
                      : checkedRows.has(i)
                        ? "bg-surface-2"
                        : "hover:bg-surface-2/50"
                  }
                >
                  <td className="border-b border-border px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={checkedRows.has(i)}
                      onChange={() => toggleRow(i)}
                      className="accent-accent"
                    />
                  </td>
                  {Array.from({ length: numCols }, (_, j) => (
                    <td
                      key={j}
                      className={`border-b border-r border-border px-2 py-1 max-w-[120px] truncate ${
                        !checkedCols.has(j)
                          ? "text-muted/40"
                          : isHeader
                            ? "font-semibold text-primary"
                            : "text-primary"
                      }`}
                    >
                      {row[j] ?? ""}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Col role assignments */}
      {checkedCols.size > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">
            Assign column roles
          </p>
          <div className="flex flex-wrap gap-3">
            {Array.from(checkedCols)
              .sort((a, b) => a - b)
              .map((j) => {
                const headerVal =
                  headerRowIndex >= 0 && rows[headerRowIndex]
                    ? (rows[headerRowIndex][j] ?? `Col ${j + 1}`)
                    : `Col ${j + 1}`;
                return (
                  <div key={j} className="flex flex-col gap-1 min-w-[160px]">
                    <label
                      className="text-xs text-secondary font-medium truncate"
                      title={headerVal}
                    >
                      {headerVal}
                    </label>
                    <select
                      value={colRoles[j] ?? ""}
                      onChange={(e) =>
                        setColRoles((prev) => ({
                          ...prev,
                          [j]: e.target.value,
                        }))
                      }
                      className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-primary focus:outline-none focus:border-accent"
                    >
                      {FIELD_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-error">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-secondary hover:text-primary border border-border rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
        >
          Use These Selections →
        </button>
      </div>
    </div>
  );
}
