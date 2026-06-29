"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";
import type {
  ColumnMap,
  ExcelSheet,
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
  onImportComplete: (count: number) => void;
}

const STEP_LABELS = [
  { label: "Load Workbook", short: "Load" },
  { label: "Select Worksheets", short: "Worksheets" },
  { label: "Map Scientific Variables", short: "Variables" },
  { label: "Review Benchmark Study", short: "Review" },
];

const NEXT_LABELS = [
  "Select Worksheets →",
  "Map Variables →",
  "Review Benchmark Study →",
  "Create Benchmark Study",
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
  const [importError, setImportError] = useState<string | null>(null);

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
    setImportError(null);
    try {
      const result = await api.excel.import(token, projectId, samples);
      if (result.imported.length > 0) {
        onImportComplete(result.imported.length);
        onClose();
      } else {
        const reasons = result.errors
          .map((e) => `${e.sample_name}: ${e.reason}`)
          .join("; ");
        setImportError(reasons || "No experimental runs were imported.");
      }
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    if (token) api.excel.deleteSession(token).catch(() => {});
    onClose();
  }

  const canProceedStep1 = token !== null && selectedSheets.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3">
      <div
        className="bg-bg border border-border rounded-2xl shadow-2xl w-full h-full flex flex-col"
        style={{ maxWidth: "98vw", maxHeight: "96vh" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <Image
              src="/logo_dark.png"
              alt="Disinfection ICT Workbench"
              width={140}
              height={38}
              className="hidden dark:block"
            />
            <Image
              src="/logo_light.png"
              alt="Disinfection ICT Workbench"
              width={140}
              height={38}
              className="block dark:hidden"
            />
            <div className="w-px h-8 bg-border" />
            <div>
              <h2 className="font-semibold text-primary text-sm">
                Import Laboratory Dataset
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Prepare experimental observations for ICT modeling ·{" "}
                {filename ?? "No workbook loaded"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-muted hover:text-primary transition-colors p-1 rounded-lg hover:bg-surface-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Step indicator ── */}
        <div className="flex items-center px-6 py-3 border-b border-border shrink-0 gap-0">
          {STEP_LABELS.map(({ label }, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div key={n} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-150 ${
                      active
                        ? "bg-accent text-white shadow-sm shadow-accent/30"
                        : done
                          ? "bg-success/20 text-success border border-success/30"
                          : "bg-surface-2 text-muted border border-border"
                    }`}
                  >
                    {done ? <CheckCircle2 size={12} /> : n}
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors ${
                      active
                        ? "text-primary"
                        : done
                          ? "text-success"
                          : "text-muted"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`w-8 h-px mx-3 transition-colors ${done ? "bg-success/30" : "bg-border"}`}
                  />
                )}
              </div>
            );
          })}
          <div className="ml-auto text-xs text-muted">
            Step {step} of {STEP_LABELS.length}
          </div>
        </div>

        {/* ── Body ── */}
        <div
          className={`flex-1 min-h-0 flex flex-col ${step === 2 || step === 3 ? "px-4 py-3" : "px-6 py-5 overflow-y-auto"}`}
        >
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
            <>
              {importError && (
                <div className="mb-3 bg-error/10 border border-error/30 rounded-xl px-4 py-3 text-error text-sm shrink-0">
                  {importError}
                </div>
              )}
              <Step4Review
                samples={pendingSamples}
                sheetRawCache={sheetRawCache}
                onBack={() => setStep(3)}
                onImport={handleImport}
                importing={importing}
              />
            </>
          )}
        </div>

        {/* ── Footer (step 1 only) ── */}
        {step === 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
            <button
              onClick={handleClose}
              className="text-sm text-muted hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {NEXT_LABELS[0]}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
