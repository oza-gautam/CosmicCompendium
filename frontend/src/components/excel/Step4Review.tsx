"use client";

import { useState } from "react";
import { ChevronLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";
import type {
  ImportError,
  ImportedSample,
  PendingSample,
  SheetRawResult,
} from "@/types";

interface Props {
  samples: PendingSample[];
  sheetRawCache: Record<string, SheetRawResult>;
  onBack: () => void;
  onImport: (samples: PendingSample[]) => Promise<void>;
  importing: boolean;
  imported: ImportedSample[];
  errors: ImportError[];
}

export default function Step4Review({
  samples,
  sheetRawCache,
  onBack,
  onImport,
  importing,
  imported,
  errors,
}: Props) {
  const [names, setNames] = useState<string[]>(
    samples.map((s) => s.sampleName),
  );
  const done = imported.length > 0 || errors.length > 0;

  function getPreviewRows(sample: PendingSample): string[][] {
    const raw = sheetRawCache[sample.sheetName];
    if (!raw) return [];
    const headerRow = raw.rows[sample.headerRowIndex] ?? [];
    const colMap = sample.columnMap;
    const mappedCols = Object.entries(colMap)
      .filter(([, v]) => v)
      .map(([field, col]) => ({ field, col, colIdx: headerRow.indexOf(col!) }))
      .filter(({ colIdx }) => colIdx >= 0);

    const dataRows = sample.dataRowIndices
      .slice(0, 5)
      .map((ri) => raw.rows[ri] ?? []);
    return dataRows.map((row) =>
      mappedCols.map(({ colIdx }) => row[colIdx] ?? ""),
    );
  }

  function getMappedHeaders(sample: PendingSample): string[] {
    const colMap = sample.columnMap;
    return Object.keys(colMap).filter((k) => colMap[k as keyof typeof colMap]);
  }

  function handleImport() {
    const updated = samples.map((s, i) => ({ ...s, sampleName: names[i] }));
    onImport(updated);
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-slate-300">Import complete</p>
        {imported.length > 0 && (
          <div className="space-y-2">
            {imported.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-emerald-900/30 border border-emerald-700 rounded-lg px-4 py-2.5"
              >
                <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                <span className="text-emerald-200 text-sm">{r.name}</span>
                <span className="text-emerald-500 text-xs ml-auto">
                  {r.obs_count} observations
                </span>
              </div>
            ))}
          </div>
        )}
        {errors.length > 0 && (
          <div className="space-y-2">
            {errors.map((e, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-red-900/30 border border-red-700 rounded-lg px-4 py-2.5"
              >
                <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-200 text-sm font-medium">
                    {e.sample_name}
                  </p>
                  <p className="text-red-400 text-xs mt-0.5">{e.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Review the samples below. You can rename them before importing. Showing
        up to 5 preview rows each.
      </p>

      <div className="space-y-5 max-h-[420px] overflow-y-auto pr-1">
        {samples.map((sample, idx) => {
          const headers = getMappedHeaders(sample);
          const preview = getPreviewRows(sample);
          return (
            <div
              key={idx}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={names[idx]}
                  onChange={(e) =>
                    setNames((prev) =>
                      prev.map((n, i) => (i === idx ? e.target.value : n)),
                    )
                  }
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-slate-500 shrink-0">
                  {sample.dataRowIndices.length} rows · Sheet:{" "}
                  {sample.sheetName}
                </span>
              </div>
              {preview.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-slate-700">
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="bg-slate-800">
                        {headers.map((h) => (
                          <th
                            key={h}
                            className="px-3 py-1.5 text-slate-400 font-medium text-left border-r border-slate-700 last:border-r-0"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, ri) => (
                        <tr key={ri} className="border-t border-slate-800">
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className="px-3 py-1 text-slate-300 border-r border-slate-800 last:border-r-0 max-w-[120px] truncate"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          disabled={importing}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 transition-colors disabled:opacity-40"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <button
          onClick={handleImport}
          disabled={importing || samples.length === 0}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {importing && <Loader2 size={14} className="animate-spin" />}
          Import All ({samples.length} sample{samples.length !== 1 ? "s" : ""})
        </button>
      </div>
    </div>
  );
}
