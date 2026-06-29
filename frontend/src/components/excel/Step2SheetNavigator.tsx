"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { PendingSample, SheetRawResult } from "@/types";

interface Props {
  token: string;
  sheets: string[];
  onComplete: (samples: PendingSample[]) => void;
  onBack: () => void;
  fetchSheetRaw: (sheetName: string) => Promise<SheetRawResult>;
}

interface TableSelection {
  headerRowIndex: number;
  dataRowIndices: number[];
  selectedColumns: number[]; // column indices to keep; empty = all
  sampleName: string;
  groupColumn: string;
  useGroupColumn: boolean;
}

function colLetter(i: number): string {
  let s = "";
  i++;
  while (i > 0) {
    i--;
    s = String.fromCharCode(65 + (i % 26)) + s;
    i = Math.floor(i / 26);
  }
  return s;
}

export default function Step2SheetNavigator({
  sheets,
  onComplete,
  onBack,
  fetchSheetRaw,
}: Props) {
  const [sheetIdx, setSheetIdx] = useState(0);
  const [rawData, setRawData] = useState<SheetRawResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingSamples, setPendingSamples] = useState<PendingSample[]>([]);

  // Row selection
  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set());
  const [headerRow, setHeaderRow] = useState<number | null>(null);
  // Column selection (indices); null means "all columns"
  const [selectedCols, setSelectedCols] = useState<Set<number> | null>(null);

  const [sampleName, setSampleName] = useState("");
  const [useGroupColumn, setUseGroupColumn] = useState(false);
  const [groupColumn, setGroupColumn] = useState("");
  const [selections, setSelections] = useState<TableSelection[]>([]);

  const lastClickedRow = useRef<number | null>(null);
  const sheetName = sheets[sheetIdx];

  useEffect(() => {
    if (!sheetName) return;
    setLoading(true);
    setError(null);
    setRawData(null);
    resetSelection(sheetName);
    setSelections([]);

    fetchSheetRaw(sheetName)
      .then(setRawData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sheetName]); // eslint-disable-line react-hooks/exhaustive-deps

  function resetSelection(name: string) {
    setCheckedRows(new Set());
    setHeaderRow(null);
    setSelectedCols(null);
    setSampleName(name);
    setUseGroupColumn(false);
    setGroupColumn("");
    lastClickedRow.current = null;
  }

  // Click on a data cell row — toggle row selection with shift-range support
  function handleRowClick(rowIdx: number, e: React.MouseEvent) {
    if ((e.target as HTMLElement).dataset.role === "header-setter") return;
    if ((e.target as HTMLElement).closest("[data-role='col-check']")) return;
    e.preventDefault();

    setCheckedRows((prev) => {
      const next = new Set(prev);
      if (e.shiftKey && lastClickedRow.current !== null) {
        const lo = Math.min(lastClickedRow.current, rowIdx);
        const hi = Math.max(lastClickedRow.current, rowIdx);
        const allIn = Array.from(
          { length: hi - lo + 1 },
          (_, k) => lo + k,
        ).every((i) => next.has(i));
        for (let i = lo; i <= hi; i++) {
          if (allIn) next.delete(i);
          else next.add(i);
        }
      } else {
        if (next.has(rowIdx)) next.delete(rowIdx);
        else next.add(rowIdx);
      }
      lastClickedRow.current = rowIdx;
      return next;
    });
  }

  function handleHeaderClick(rowIdx: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!checkedRows.has(rowIdx)) return;
    setHeaderRow((prev) => {
      const next = prev === rowIdx ? null : rowIdx;
      // When header is set, start with no columns selected (user picks what they need)
      if (next !== null) setSelectedCols(new Set());
      return next;
    });
  }

  function toggleCol(ci: number) {
    setSelectedCols((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(ci)) next.delete(ci);
      else next.add(ci);
      return next;
    });
  }

  function selectAllCols() {
    setSelectedCols(new Set(Array.from({ length: numCols }, (_, i) => i)));
  }

  function confirmTable() {
    if (headerRow === null || checkedRows.size === 0) return;
    const dataRows = Array.from(checkedRows)
      .filter((i) => i !== headerRow)
      .sort((a, b) => a - b);
    if (dataRows.length === 0) return;

    const rows = rawData?.rows ?? [];
    const totalCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const colIndices = selectedCols
      ? Array.from(selectedCols).sort((a, b) => a - b)
      : Array.from({ length: totalCols }, (_, i) => i);

    const sel: TableSelection = {
      headerRowIndex: headerRow,
      dataRowIndices: dataRows,
      selectedColumns: colIndices,
      sampleName,
      groupColumn: useGroupColumn ? groupColumn : "",
      useGroupColumn,
    };
    const nextSelections = [...selections, sel];
    setSelections(nextSelections);
    resetSelection(`${sheetName} (${nextSelections.length + 1})`);
  }

  function removeSelection(idx: number) {
    setSelections((prev) => prev.filter((_, i) => i !== idx));
  }

  function advance(sheetSelections: TableSelection[]) {
    const rows = rawData?.rows ?? [];
    const totalCols = rows.reduce((m, r) => Math.max(m, r.length), 0);

    const newSamples: PendingSample[] = sheetSelections.map((sel) => {
      const colIndices =
        sel.selectedColumns.length > 0
          ? sel.selectedColumns
          : Array.from({ length: totalCols }, (_, i) => i);

      // Rewrite the headerRowIndex and dataRowIndices to use only selected columns
      // We pass selectedColumns so the backend/step3 can filter
      return {
        sheetName,
        sampleName: sel.sampleName,
        headerRowIndex: sel.headerRowIndex,
        dataRowIndices: sel.dataRowIndices,
        columnMap: {},
        groupColumn:
          sel.useGroupColumn && sel.groupColumn ? sel.groupColumn : undefined,
        selectedColumns: colIndices,
      };
    });

    const combined = [...pendingSamples, ...newSamples];
    setPendingSamples(combined);

    if (sheetIdx + 1 < sheets.length) {
      setSheetIdx((prev) => prev + 1);
    } else {
      onComplete(combined);
    }
  }

  const rows = rawData?.rows ?? [];
  const numCols = rows.reduce((max, r) => Math.max(max, r.length), 0);
  const headerCols =
    headerRow !== null && rows[headerRow] ? rows[headerRow] : [];
  const numSelectedCols = selectedCols === null ? numCols : selectedCols.size;
  const canConfirm =
    headerRow !== null && checkedRows.size >= 2 && numSelectedCols >= 1;

  function isColSelected(ci: number) {
    // null = "header not set yet" → show all dimmed; Set = user's explicit picks
    if (selectedCols === null) return false;
    return selectedCols.has(ci);
  }

  return (
    <div className="flex gap-3 flex-1 min-h-0">
      {/* Grid — fills all available vertical space */}
      <div className="flex-1 overflow-auto border border-slate-700 rounded-xl bg-slate-900/40 select-none min-h-0">
        {loading && (
          <div className="flex items-center justify-center h-full text-slate-500">
            <Loader2 className="animate-spin mr-2" size={18} /> Loading sheet…
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full text-red-400 gap-2">
            <AlertTriangle size={18} /> {error}
          </div>
        )}
        {!loading && !error && rawData && (
          <>
            {rawData.truncated && (
              <div className="px-3 py-1.5 bg-amber-900/30 border-b border-amber-700 text-amber-300 text-xs sticky top-0 z-20">
                Showing first 500 of {rawData.total_rows} rows
              </div>
            )}
            <table className="text-xs w-max border-collapse">
              <thead className="sticky top-0 bg-[#0d1018] z-10">
                <tr>
                  {/* Row # gutter */}
                  <th className="w-10 border-r border-b border-slate-700 px-2 py-1.5 text-slate-600 text-center font-normal sticky left-0 bg-[#0d1018]" />
                  {Array.from({ length: numCols }, (_, ci) => {
                    const sel = isColSelected(ci);
                    const headerSet = headerRow !== null;
                    const label = headerCols[ci] || colLetter(ci);
                    return (
                      <th
                        key={ci}
                        data-role="col-check"
                        onClick={() => headerSet && toggleCol(ci)}
                        className={`border-r border-b border-slate-700 px-3 py-1.5 font-normal text-left min-w-[100px] transition-colors ${
                          headerSet ? "cursor-pointer" : ""
                        } ${
                          sel
                            ? "text-slate-200 bg-blue-950/40 hover:bg-blue-950/60"
                            : headerSet
                              ? "text-slate-500 bg-slate-900/60 hover:bg-slate-800/60"
                              : "text-slate-500 bg-[#0d1018]"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {headerSet && (
                            <input
                              type="checkbox"
                              checked={sel}
                              onChange={() => toggleCol(ci)}
                              onClick={(e) => e.stopPropagation()}
                              className="accent-blue-500 shrink-0"
                            />
                          )}
                          <span
                            className={
                              !headerSet || sel ? "opacity-100" : "opacity-40"
                            }
                          >
                            {label}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => {
                  const isHeader = ri === headerRow;
                  const isChecked = checkedRows.has(ri);
                  return (
                    <tr
                      key={ri}
                      onClick={(e) => handleRowClick(ri, e)}
                      className={`border-b border-slate-800/60 cursor-pointer transition-colors ${
                        isHeader
                          ? "bg-blue-900/40 text-blue-100"
                          : isChecked
                            ? "bg-slate-700/40 text-slate-100 hover:bg-slate-700/60"
                            : "text-slate-400 hover:bg-slate-800/50"
                      }`}
                    >
                      {/* Row number */}
                      <td
                        data-role="header-setter"
                        onClick={(e) => handleHeaderClick(ri, e)}
                        title={
                          isChecked
                            ? isHeader
                              ? "Click to unset header"
                              : "Click to mark as header row"
                            : "Select this row first"
                        }
                        className={`border-r border-slate-700/60 px-2 py-1 text-center font-mono text-xs sticky left-0 transition-colors ${
                          isHeader
                            ? "text-blue-300 font-bold bg-blue-900/60 cursor-pointer"
                            : isChecked
                              ? "text-blue-400 hover:text-blue-200 cursor-pointer bg-slate-800/60"
                              : "text-slate-600 cursor-default bg-[#0d1018]"
                        }`}
                      >
                        {ri}
                      </td>
                      {Array.from({ length: numCols }, (_, ci) => (
                        <td
                          key={ci}
                          className={`border-r border-slate-700/40 px-3 py-1 max-w-[200px] truncate whitespace-nowrap last:border-r-0 transition-opacity ${
                            isColSelected(ci) ? "opacity-100" : "opacity-25"
                          }`}
                        >
                          {row[ci] ?? ""}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-56 flex flex-col gap-2 shrink-0 min-h-0 overflow-y-auto">
        {/* Instructions */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 shrink-0">
          <p className="text-xs font-semibold text-slate-400 mb-1.5">
            How to select
          </p>
          <ul className="text-xs text-slate-500 space-y-1 leading-relaxed">
            <li>• Click rows to toggle</li>
            <li>
              •{" "}
              <kbd className="bg-slate-700 px-1 rounded text-slate-300">
                Shift
              </kbd>
              +click for range
            </li>
            <li>
              • Click a <span className="text-blue-400">row #</span> to set
              header
            </li>
            <li>
              • Check/uncheck{" "}
              <span className="text-slate-300">column headers</span> to pick
              scientific variables
            </li>
            <li>• Multiple experimental runs: confirm each table separately</li>
          </ul>
        </div>

        {/* Current selection */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 flex flex-col gap-2.5 shrink-0">
          <p className="text-xs font-semibold text-slate-300">
            Worksheet {sheetIdx + 1} of {sheets.length}
          </p>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Experimental Run name
            </label>
            <input
              type="text"
              value={sampleName}
              onChange={(e) => setSampleName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="text-xs space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Rows selected</span>
              <span className={checkedRows.size > 0 ? "text-slate-200" : ""}>
                {checkedRows.size}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Header row</span>
              {headerRow !== null ? (
                <span className="text-blue-400">row {headerRow}</span>
              ) : (
                <span className="text-amber-500">not set</span>
              )}
            </div>
            {headerRow !== null && (
              <div className="flex justify-between text-slate-500">
                <span>Columns</span>
                <span
                  className={
                    numSelectedCols > 0 ? "text-slate-200" : "text-amber-500"
                  }
                >
                  {numSelectedCols === 0
                    ? "none selected"
                    : `${numSelectedCols} of ${numCols}`}
                </span>
              </div>
            )}
          </div>

          {headerRow !== null && (
            <div className="flex gap-2">
              <button
                onClick={selectAllCols}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Select all
              </button>
              {numSelectedCols > 0 && (
                <>
                  <span className="text-slate-700">·</span>
                  <button
                    onClick={() => setSelectedCols(new Set())}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          )}

          {headerRow !== null && headerCols.length > 0 && (
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useGroupColumn}
                  onChange={(e) => setUseGroupColumn(e.target.checked)}
                  className="accent-blue-500"
                />
                Group by column (creates one sample per unique value)
              </label>
              {useGroupColumn && (
                <select
                  value={groupColumn}
                  onChange={(e) => setGroupColumn(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">— select column —</option>
                  {headerCols.map(
                    (h, i) =>
                      h && (
                        <option key={i} value={h}>
                          {h}
                        </option>
                      ),
                  )}
                </select>
              )}
            </div>
          )}

          <button
            onClick={confirmTable}
            disabled={!canConfirm}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Confirm table →
          </button>
        </div>

        {/* Confirmed selections */}
        {selections.length > 0 && (
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3 space-y-1.5 shrink-0">
            <p className="text-xs font-semibold text-slate-400">
              Confirmed ({selections.length})
            </p>
            {selections.map((sel, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs text-slate-300 bg-slate-700/40 rounded-lg px-2.5 py-1.5"
              >
                <span className="truncate">
                  {sel.sampleName} · {sel.dataRowIndices.length}r ×{" "}
                  {sel.selectedColumns.length || numCols}c
                </span>
                <button
                  onClick={() => removeSelection(i)}
                  className="text-slate-500 hover:text-red-400 ml-1.5 shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-1.5 shrink-0">
          <button
            onClick={() => advance(selections)}
            disabled={selections.length === 0}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
          >
            {sheetIdx + 1 < sheets.length ? (
              <>
                <span>Next sheet</span>
                <ChevronRight size={14} />
              </>
            ) : (
              <span>Done</span>
            )}
          </button>
          <button
            onClick={() => advance([])}
            className="w-full px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 transition-colors"
          >
            Skip this sheet
          </button>
          <button
            onClick={onBack}
            className="w-full px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 transition-colors"
          >
            <ChevronLeft size={13} /> Back
          </button>
        </div>
      </div>
    </div>
  );
}
