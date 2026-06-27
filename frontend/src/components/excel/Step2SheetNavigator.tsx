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
  token,
  sheets,
  onComplete,
  onBack,
  fetchSheetRaw,
}: Props) {
  const [sheetIdx, setSheetIdx] = useState(0);
  const [rawData, setRawData] = useState<SheetRawResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-sheet accumulated confirmed selections
  const [pendingSamples, setPendingSamples] = useState<PendingSample[]>([]);

  // Current in-progress selection state
  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set());
  const [headerRow, setHeaderRow] = useState<number | null>(null);
  const [sampleName, setSampleName] = useState("");
  const [useGroupColumn, setUseGroupColumn] = useState(false);
  const [groupColumn, setGroupColumn] = useState("");
  const [selections, setSelections] = useState<TableSelection[]>([]);

  const lastChecked = useRef<number | null>(null);

  const sheetName = sheets[sheetIdx];

  useEffect(() => {
    if (!sheetName) return;
    setLoading(true);
    setError(null);
    setRawData(null);
    setCheckedRows(new Set());
    setHeaderRow(null);
    setSampleName(sheetName);
    setUseGroupColumn(false);
    setGroupColumn("");
    setSelections([]);
    lastChecked.current = null;

    fetchSheetRaw(sheetName)
      .then(setRawData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sheetName]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleRow(rowIdx: number, e: React.MouseEvent) {
    const newSet = new Set(checkedRows);
    if (e.shiftKey && lastChecked.current !== null) {
      const lo = Math.min(lastChecked.current, rowIdx);
      const hi = Math.max(lastChecked.current, rowIdx);
      const allChecked = Array.from(
        { length: hi - lo + 1 },
        (_, i) => lo + i,
      ).every((i) => newSet.has(i));
      for (let i = lo; i <= hi; i++) {
        if (allChecked) newSet.delete(i);
        else newSet.add(i);
      }
    } else {
      if (newSet.has(rowIdx)) newSet.delete(rowIdx);
      else newSet.add(rowIdx);
    }
    lastChecked.current = rowIdx;
    setCheckedRows(newSet);
  }

  function setHeader(rowIdx: number) {
    if (!checkedRows.has(rowIdx)) return;
    setHeaderRow(rowIdx === headerRow ? null : rowIdx);
  }

  function confirmTable() {
    if (headerRow === null || checkedRows.size === 0) return;
    const dataRows = Array.from(checkedRows)
      .filter((i) => i !== headerRow)
      .sort((a, b) => a - b);
    if (dataRows.length === 0) return;
    const sel: TableSelection = {
      headerRowIndex: headerRow,
      dataRowIndices: dataRows,
      sampleName,
      groupColumn: useGroupColumn ? groupColumn : "",
      useGroupColumn,
    };
    setSelections((prev) => [...prev, sel]);
    // Reset for next table on same sheet
    setCheckedRows(new Set());
    setHeaderRow(null);
    setSampleName(
      sheetName +
        (selections.length + 1 > 0 ? ` (${selections.length + 2})` : ""),
    );
    setUseGroupColumn(false);
    setGroupColumn("");
  }

  function removeSelection(idx: number) {
    setSelections((prev) => prev.filter((_, i) => i !== idx));
  }

  function skipSheet() {
    advance([]);
  }

  function advance(sheetSelections: TableSelection[]) {
    const rows = rawData?.rows ?? [];
    const newSamples: PendingSample[] = sheetSelections.map((sel) => ({
      sheetName,
      sampleName: sel.sampleName,
      headerRowIndex: sel.headerRowIndex,
      dataRowIndices: sel.dataRowIndices,
      columnMap: {},
      groupColumn: sel.useGroupColumn ? sel.groupColumn : undefined,
    }));

    const combined = [...pendingSamples, ...newSamples];
    setPendingSamples(combined);

    if (sheetIdx + 1 < sheets.length) {
      setSheetIdx((prev) => prev + 1);
    } else {
      onComplete(combined);
    }
    void rows;
  }

  function nextSheet() {
    advance(selections);
  }

  const rows = rawData?.rows ?? [];
  const numCols = rows.reduce((max, r) => Math.max(max, r.length), 0);
  const headerCols =
    headerRow !== null && rows[headerRow] ? rows[headerRow] : [];

  return (
    <div className="flex gap-4 h-[520px]">
      {/* Grid area */}
      <div className="flex-1 overflow-auto border border-slate-700 rounded-xl bg-slate-900/50">
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
              <div className="px-3 py-2 bg-amber-900/30 border-b border-amber-700 text-amber-300 text-xs">
                Showing first 500 of {rawData.total_rows} rows
              </div>
            )}
            <table className="text-xs w-full border-collapse">
              <thead className="sticky top-0 bg-slate-800 z-10">
                <tr>
                  <th className="w-8 border-r border-slate-700 px-2 py-1 text-slate-500 text-center">
                    #
                  </th>
                  <th className="w-6 border-r border-slate-700"></th>
                  {Array.from({ length: numCols }, (_, i) => (
                    <th
                      key={i}
                      className="border-r border-slate-700 px-2 py-1 text-slate-400 font-normal text-center min-w-[80px]"
                    >
                      {colLetter(i)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => {
                  const isHeader = ri === headerRow;
                  const isChecked = checkedRows.has(ri);
                  return (
                    <tr
                      key={ri}
                      className={`border-b border-slate-800 ${
                        isHeader
                          ? "bg-blue-900/40 text-blue-200"
                          : isChecked
                            ? "bg-slate-700/40 text-slate-200"
                            : "text-slate-400 hover:bg-slate-800/40"
                      }`}
                    >
                      {/* Row number — click to set as header if row is checked */}
                      <td
                        className={`border-r border-slate-700 px-2 py-1 text-center select-none ${
                          isChecked
                            ? "cursor-pointer hover:text-blue-300"
                            : "text-slate-600"
                        } ${isHeader ? "text-blue-400 font-bold" : ""}`}
                        onClick={() => setHeader(ri)}
                        title={isChecked ? "Click to mark as header row" : ""}
                      >
                        {ri}
                      </td>
                      {/* Checkbox */}
                      <td className="border-r border-slate-700 px-1 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          onClick={(e) => toggleRow(ri, e)}
                          className="accent-blue-500 cursor-pointer"
                        />
                      </td>
                      {Array.from({ length: numCols }, (_, ci) => (
                        <td
                          key={ci}
                          className="border-r border-slate-700 px-2 py-1 max-w-[160px] truncate whitespace-nowrap"
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
      <div className="w-64 flex flex-col gap-4 shrink-0">
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Sheet {sheetIdx + 1} of {sheets.length}: {sheetName}
          </p>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Sample name
            </label>
            <input
              type="text"
              value={sampleName}
              onChange={(e) => setSampleName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="text-xs text-slate-500 space-y-1">
            <p>Checked rows: {checkedRows.size}</p>
            <p>
              Header row:{" "}
              {headerRow !== null ? (
                `row ${headerRow}`
              ) : (
                <span className="text-amber-400">not set</span>
              )}
            </p>
            <p className="text-slate-600 italic">
              Click a row number to set header
            </p>
          </div>

          {headerRow !== null && headerCols.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useGroupColumn}
                  onChange={(e) => setUseGroupColumn(e.target.checked)}
                  className="accent-blue-500"
                />
                Split by group column
              </label>
              {useGroupColumn && (
                <select
                  value={groupColumn}
                  onChange={(e) => setGroupColumn(e.target.value)}
                  className="mt-2 w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
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
            disabled={headerRow === null || checkedRows.size < 2}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Confirm table
          </button>
        </div>

        {/* Confirmed selections on this sheet */}
        {selections.length > 0 && (
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-400">
              Confirmed tables
            </p>
            {selections.map((sel, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs text-slate-300 bg-slate-700/40 rounded-lg px-3 py-1.5"
              >
                <span className="truncate">
                  {sel.sampleName} ({sel.dataRowIndices.length} rows)
                </span>
                <button
                  onClick={() => removeSelection(i)}
                  className="text-red-400 hover:text-red-300 ml-2 shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={nextSheet}
            disabled={selections.length === 0}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
          >
            {sheetIdx + 1 < sheets.length ? (
              <>
                <span>Next sheet</span>
                <ChevronRight size={14} />
              </>
            ) : (
              <span>Done with sheets</span>
            )}
          </button>
          <button
            onClick={skipSheet}
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
