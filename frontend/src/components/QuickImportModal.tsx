"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { api } from "@/lib/api";
import type {
  QuickImportPreview,
  QuickImportSheetPreview,
  QuickImportSheetConfig,
} from "@/types";
import ConfirmScreen from "./quick-import/ConfirmScreen";
import ManualGridScreen from "./quick-import/ManualGridScreen";

type TabStatus = "pending" | "confirmed" | "manual";

interface Props {
  projectId: string;
  onClose: () => void;
  onImportComplete: (experimentCount: number) => void;
}

export default function QuickImportModal({
  projectId,
  onClose,
  onImportComplete,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<QuickImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  // sheet index -> confirmed config (undefined = not yet confirmed)
  const [sheetConfigs, setSheetConfigs] = useState<
    Record<number, QuickImportSheetConfig>
  >({});
  // sheet index -> "manual" mode (needs grid picker)
  const [manualSheets, setManualSheets] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);

  async function handleFile(f: File) {
    setFile(f);
    setPreview(null);
    setSheetConfigs({});
    setManualSheets(new Set());
    setError(null);
    setLoading(true);
    try {
      const result = await api.quickImport.preview(projectId, f);
      setPreview(result);
      // Auto-confirm sheets where detection succeeded
      const configs: Record<number, QuickImportSheetConfig> = {};
      result.sheets.forEach((sheet, i) => {
        if (sheet.detected) {
          configs[i] = {
            sheet_name: sheet.sheet_name,
            experiment_name: sheet.experiment_name,
            header_row_index: sheet.header_row_index,
            col_map: {
              group: sheet.col_map.group,
              time: sheet.col_map.time!,
              cfu: sheet.col_map.cfu!,
              concentration: sheet.col_map.concentration!,
            },
          };
        }
      });
      setSheetConfigs(configs);
      // Mark failed-detection sheets as needing manual grid
      const manual = new Set<number>();
      result.sheets.forEach((sheet, i) => {
        if (!sheet.detected) manual.add(i);
      });
      setManualSheets(manual);
      setActiveTab(0);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function tabStatus(i: number, sheet: QuickImportSheetPreview): TabStatus {
    if (sheetConfigs[i]) return "confirmed";
    if (manualSheets.has(i)) return "manual";
    return "pending";
  }

  function handleConfirmChange(i: number, cfg: QuickImportSheetConfig) {
    setSheetConfigs((prev) => ({ ...prev, [i]: cfg }));
  }

  function handleManualDone(i: number, cfg: QuickImportSheetConfig) {
    setManualSheets((prev) => {
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
    setSheetConfigs((prev) => ({ ...prev, [i]: cfg }));
  }

  const allConfirmed =
    preview !== null &&
    preview.sheets.every((_, i) => Boolean(sheetConfigs[i]));

  const confirmedCount = Object.keys(sheetConfigs).length;
  const totalSheets = preview?.sheets.length ?? 0;

  async function handleImportAll() {
    if (!file || !preview || !allConfirmed) return;
    setImporting(true);
    setError(null);
    try {
      const result = await api.quickImport.execute(projectId, file, {
        project_id: projectId,
        sheets: Object.values(sheetConfigs),
      });
      onImportComplete(result.experiment_ids.length);
      onClose();
      router.push(
        `/projects/${projectId}/experiments/${result.first_experiment_id}`,
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-primary">
            Create Experiment from Wizard
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Step 1: Upload */}
          {!preview && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              {loading ? (
                <p className="text-sm text-secondary">Analysing file…</p>
              ) : (
                <>
                  <label className="flex flex-col items-center gap-3 cursor-pointer group">
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-border group-hover:border-accent/60 transition-colors flex items-center justify-center">
                      <Upload
                        size={28}
                        className="text-muted group-hover:text-accent transition-colors"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-primary">
                        Drop an Excel file or click to browse
                      </p>
                      <p className="text-xs text-muted mt-1">
                        .xlsx only · each sheet becomes an experiment
                      </p>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xlsx"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                  </label>
                  {error && (
                    <p className="text-xs text-error text-center">{error}</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 2: Tabbed confirm / manual */}
          {preview && (
            <div className="flex flex-col gap-4">
              {/* Tabs */}
              <div className="flex gap-1 border-b border-border pb-0 overflow-x-auto">
                {preview.sheets.map((sheet, i) => {
                  const status = tabStatus(i, sheet);
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveTab(i)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border border-b-0 transition-colors whitespace-nowrap ${
                        activeTab === i
                          ? "bg-surface border-border text-primary"
                          : "bg-surface-2 border-transparent text-secondary hover:text-primary"
                      }`}
                    >
                      {status === "confirmed" && (
                        <CheckCircle2 size={11} className="text-success" />
                      )}
                      {status === "manual" && (
                        <AlertCircle size={11} className="text-warning" />
                      )}
                      {status === "pending" && (
                        <Clock size={11} className="text-muted" />
                      )}
                      {sheet.sheet_name}
                    </button>
                  );
                })}
              </div>

              {/* Active tab content */}
              {preview.sheets.map((sheet, i) => {
                if (i !== activeTab) return null;
                const status = tabStatus(i, sheet);

                if (
                  status === "manual" ||
                  (status === "pending" && !sheet.detected)
                ) {
                  return (
                    <ManualGridScreen
                      key={i}
                      sheet={sheet}
                      onConfirm={(cfg) => handleManualDone(i, cfg)}
                      onCancel={onClose}
                    />
                  );
                }

                return (
                  <ConfirmScreen
                    key={i}
                    sheet={sheet}
                    override={sheetConfigs[i]}
                    onChange={(cfg) => handleConfirmChange(i, cfg)}
                  />
                );
              })}

              {error && <p className="text-xs text-error">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        {preview && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
            <span className="text-xs text-muted">
              {confirmedCount} of {totalSheets} sheet
              {totalSheets !== 1 ? "s" : ""} confirmed
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-secondary hover:text-primary border border-border rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImportAll}
                disabled={!allConfirmed || importing}
                className="px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {importing
                  ? "Importing…"
                  : `Import All (${totalSheets} experiment${totalSheets !== 1 ? "s" : ""})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
