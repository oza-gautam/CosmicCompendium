"use client";

import { useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import type { PendingSample, SheetRawResult } from "@/types";

interface Props {
  samples: PendingSample[];
  sheetRawCache: Record<string, SheetRawResult>;
  onBack: () => void;
  onImport: (samples: PendingSample[]) => Promise<void>;
  importing: boolean;
}

export default function Step4Review({
  samples,
  sheetRawCache,
  onBack,
  onImport,
  importing,
}: Props) {
  const [editedSamples, setEditedSamples] = useState<PendingSample[]>(
    () => JSON.parse(JSON.stringify(samples)) as PendingSample[],
  );

  function getMappedColDefs(sample: PendingSample) {
    const raw = sheetRawCache[sample.sheetName];
    if (!raw) return [];
    const headerRow = raw.rows[sample.headerRowIndex] ?? [];
    return Object.entries(sample.columnMap)
      .filter(([, v]) => v)
      .map(([field, colName]) => ({
        field,
        colName: colName!,
        colIdx: headerRow.indexOf(colName!),
      }))
      .filter(({ colIdx }) => colIdx >= 0);
  }

  function getAllDataRows(sample: PendingSample): string[][] {
    const raw = sheetRawCache[sample.sheetName];
    if (!raw) return [];
    return sample.dataRowIndices.map((ri) => raw.rows[ri] ?? []);
  }

  function updateCell(
    sampleIdx: number,
    rowIdx: number,
    colIdx: number,
    value: string,
  ) {
    setEditedSamples((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as PendingSample[];
      const s = next[sampleIdx] as PendingSample & {
        __edits?: Record<number, Record<number, string>>;
      };
      if (!s.__edits) s.__edits = {};
      const absRowIdx = s.dataRowIndices[rowIdx];
      if (!s.__edits[absRowIdx]) s.__edits[absRowIdx] = {};
      s.__edits[absRowIdx][colIdx] = value;
      return next;
    });
  }

  function updateSampleName(idx: number, name: string) {
    setEditedSamples((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], sampleName: name };
      return next;
    });
  }

  function getCellValue(
    sample: PendingSample & {
      __edits?: Record<number, Record<number, string>>;
    },
    absRowIdx: number,
    colIdx: number,
    rawValue: string,
  ): string {
    return sample.__edits?.[absRowIdx]?.[colIdx] ?? rawValue;
  }

  function handleImport() {
    const withOverrides = editedSamples.map((s) => {
      const se = s as PendingSample & {
        __edits?: Record<number, Record<number, string>>;
      };
      const result = { ...s };
      if (se.__edits && Object.keys(se.__edits).length > 0) {
        result.rowOverrides = se.__edits as Record<
          number,
          Record<number, string>
        >;
      }
      return result;
    });
    onImport(withOverrides);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <p className="text-sm text-slate-400 shrink-0">
        Review all data before importing. Click any cell to edit. Rename samples
        in the header.
      </p>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-5 pr-1">
        {editedSamples.map((sample, sIdx) => {
          const colDefs = getMappedColDefs(sample);
          const dataRows = getAllDataRows(sample);
          const rawSample = sample as PendingSample & {
            __edits?: Record<number, Record<number, string>>;
          };

          return (
            <div
              key={sIdx}
              className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700 bg-slate-800/60">
                <input
                  type="text"
                  value={sample.sampleName}
                  onChange={(e) => updateSampleName(sIdx, e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-slate-500 shrink-0">
                  {dataRows.length} rows · Sheet: {sample.sheetName}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-slate-800">
                      <th className="px-3 py-2 text-slate-500 font-medium text-left border-r border-slate-700 w-8">
                        #
                      </th>
                      {colDefs.map(({ field, colName }) => (
                        <th
                          key={field}
                          className="px-3 py-2 text-slate-400 font-medium text-left border-r border-slate-700 last:border-r-0"
                        >
                          <span className="text-slate-300">{colName}</span>
                          <span className="text-slate-600 ml-1">({field})</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.map((row, rIdx) => {
                      const absRowIdx = sample.dataRowIndices[rIdx];
                      return (
                        <tr
                          key={rIdx}
                          className={
                            rIdx % 2 === 0
                              ? "bg-transparent"
                              : "bg-slate-800/20"
                          }
                        >
                          <td className="px-3 py-1 text-slate-600 border-r border-slate-700/50 font-mono">
                            {rIdx + 1}
                          </td>
                          {colDefs.map(({ colIdx, field }) => {
                            const raw = row[colIdx] ?? "";
                            const val = getCellValue(
                              rawSample,
                              absRowIdx,
                              colIdx,
                              raw,
                            );
                            const requiredNumeric = [
                              "time",
                              "concentration",
                              "cfu",
                            ].includes(field);
                            const isInvalid =
                              requiredNumeric &&
                              val !== "" &&
                              isNaN(Number(val));
                            return (
                              <td
                                key={field}
                                className="border-r border-slate-700/40 last:border-r-0 p-0"
                              >
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) =>
                                    updateCell(
                                      sIdx,
                                      rIdx,
                                      colIdx,
                                      e.target.value,
                                    )
                                  }
                                  className={`w-full px-3 py-1 bg-transparent font-mono focus:outline-none focus:bg-blue-950/30 ${
                                    isInvalid
                                      ? "text-red-400 bg-red-950/20"
                                      : "text-slate-300"
                                  }`}
                                  title={
                                    isInvalid ? "Must be a number" : undefined
                                  }
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-2 shrink-0">
        <button
          onClick={onBack}
          disabled={importing}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 transition-colors disabled:opacity-40"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <button
          onClick={handleImport}
          disabled={importing || editedSamples.length === 0}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {importing && <Loader2 size={14} className="animate-spin" />}
          Import All ({editedSamples.length} sample
          {editedSamples.length !== 1 ? "s" : ""})
        </button>
      </div>
    </div>
  );
}
