"use client";

import { useEffect, useState } from "react";
import { X, FileSpreadsheet } from "lucide-react";
import { api } from "@/lib/api";
import type {
  ColumnMap,
  ExcelSheet,
  ImportError,
  ImportedSample,
  ImportTemplate,
  PendingSample,
  SheetRawResult,
} from "@/types";
import Step1Upload from "./excel/Step1Upload";
import Step2SheetNavigator from "./excel/Step2SheetNavigator";
import Step3ColumnMapping from "./excel/Step3ColumnMapping";
import Step4Review from "./excel/Step4Review";

interface Props {
  projectId: string;
  onClose: () => void;
  onImportComplete: () => void;
}

const STEP_LABELS = [
  "Upload",
  "Select Tables",
  "Map Columns",
  "Review & Import",
];

export default function ExcelImportModal({
  projectId,
  onClose,
  onImportComplete,
}: Props) {
  const [step, setStep] = useState(1);

  // Step 1 state
  const [token, setToken] = useState<string | null>(null);
  const [sheets, setSheets] = useState<ExcelSheet[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [filename, setFilename] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Step 2 state
  const [sheetRawCache, setSheetRawCache] = useState<
    Record<string, SheetRawResult>
  >({});

  // Step 3/4 state
  const [pendingSamples, setPendingSamples] = useState<PendingSample[]>([]);
  const [templates, setTemplates] = useState<ImportTemplate[]>([]);

  // Step 4 results
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<ImportedSample[]>([]);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);

  useEffect(() => {
    api.templates
      .list()
      .then(setTemplates)
      .catch(() => {});
  }, []);

  async function handleFileSelect(file: File) {
    setUploadError(null);
    setUploadLoading(true);
    setFilename(file.name);
    try {
      const result = await api.excel.upload(file);
      setToken(result.token);
      setSheets(result.sheets);
      setSelectedSheets(result.sheets.map((s) => s.name));
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : String(e));
      setFilename(null);
    } finally {
      setUploadLoading(false);
    }
  }

  function toggleSheet(name: string) {
    setSelectedSheets((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  }

  function selectAll() {
    if (selectedSheets.length === sheets.length) setSelectedSheets([]);
    else setSelectedSheets(sheets.map((s) => s.name));
  }

  async function fetchSheetRaw(sheetName: string): Promise<SheetRawResult> {
    if (sheetRawCache[sheetName]) return sheetRawCache[sheetName];
    const result = await api.excel.sheetRaw(token!, sheetName);
    setSheetRawCache((prev) => ({ ...prev, [sheetName]: result }));
    return result;
  }

  function handleStep2Complete(samples: PendingSample[]) {
    setPendingSamples(samples);
    setStep(3);
  }

  async function handleSaveTemplate(
    name: string,
    map: ColumnMap,
    groupColumn?: string,
  ) {
    const t = await api.templates.create(name, map, groupColumn);
    setTemplates((prev) => [t, ...prev]);
  }

  async function handleImport(samples: PendingSample[]) {
    if (!token) return;
    setImporting(true);
    try {
      const result = await api.excel.import(token, projectId, samples);
      setImported(result.imported);
      setImportErrors(result.errors);
      if (result.imported.length > 0) {
        onImportComplete();
      }
    } catch (e: unknown) {
      setImportErrors([
        {
          sample_name: "All samples",
          reason: e instanceof Error ? e.message : String(e),
        },
      ]);
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    if (token) api.excel.deleteSession(token).catch(() => {});
    onClose();
  }

  const canProceedStep1 = token !== null && selectedSheets.length > 0;
  const importDone = imported.length > 0 || importErrors.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f1117] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="text-emerald-400" size={20} />
            <h2 className="font-semibold text-slate-100">Import from Excel</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-slate-800 shrink-0">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div key={n} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      active
                        ? "bg-blue-600 text-white"
                        : done
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-700 text-slate-500"
                    }`}
                  >
                    {n}
                  </div>
                  <span
                    className={`text-xs font-medium ${active ? "text-slate-200" : done ? "text-emerald-400" : "text-slate-600"}`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className="w-8 h-px bg-slate-700 mx-3" />
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <Step1Upload
              sheets={sheets}
              selectedSheets={selectedSheets}
              onFileSelect={handleFileSelect}
              onToggleSheet={toggleSheet}
              onSelectAll={selectAll}
              loading={uploadLoading}
              error={uploadError}
              filename={filename}
            />
          )}
          {step === 2 && token && (
            <Step2SheetNavigator
              token={token}
              sheets={selectedSheets}
              onComplete={handleStep2Complete}
              onBack={() => setStep(1)}
              fetchSheetRaw={fetchSheetRaw}
            />
          )}
          {step === 3 && (
            <Step3ColumnMapping
              samples={pendingSamples}
              sheetRawCache={sheetRawCache}
              templates={templates}
              onChange={setPendingSamples}
              onSaveTemplate={handleSaveTemplate}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <Step4Review
              samples={pendingSamples}
              sheetRawCache={sheetRawCache}
              onBack={() => setStep(3)}
              onImport={handleImport}
              importing={importing}
              imported={imported}
              errors={importErrors}
            />
          )}
        </div>

        {/* Footer — only for step 1 */}
        {step === 1 && (
          <div className="px-6 py-4 border-t border-slate-800 flex justify-end shrink-0">
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* Footer — import done */}
        {step === 4 && importDone && (
          <div className="px-6 py-4 border-t border-slate-800 flex justify-end shrink-0">
            <button
              onClick={handleClose}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
