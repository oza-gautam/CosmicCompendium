"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, FileUp, CheckCircle2 } from "lucide-react";
import type { ExcelSheet } from "@/types";

interface Props {
  sheets: ExcelSheet[];
  selectedSheets: string[];
  onFileSelect: (file: File) => void;
  onToggleSheet: (name: string) => void;
  onSelectAll: () => void;
  loading: boolean;
  error: string | null;
  filename: string | null;
}

export default function Step1Upload({
  sheets,
  selectedSheets,
  onFileSelect,
  onToggleSheet,
  onSelectAll,
  loading,
  error,
  filename,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      alert("Only .xlsx files are supported.");
      return;
    }
    onFileSelect(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  const allSelected =
    sheets.length > 0 && selectedSheets.length === sheets.length;

  return (
    <div className="flex gap-6 h-full">
      {/* Main upload area */}
      <div className="flex-1 space-y-5">
        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-150 cursor-pointer ${
            dragging
              ? "border-accent bg-accent/5 shadow-lg shadow-accent/10"
              : filename
                ? "border-success/50 bg-success/5"
                : "border-border hover:border-accent/50 hover:bg-surface-2/50"
          }`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
              <p className="text-secondary text-sm">
                Reading laboratory workbook…
              </p>
            </div>
          ) : filename ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 size={40} className="text-success" />
              <div>
                <p className="text-primary font-semibold">{filename}</p>
                <p className="text-muted text-sm mt-1">
                  Workbook loaded — select worksheets below
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-surface-2 border border-border">
                <FileUp size={28} className="text-accent" />
              </div>
              <div>
                <p className="text-primary font-semibold text-base">
                  Drop Laboratory Workbook Here
                </p>
                <p className="text-muted text-sm mt-1">
                  or{" "}
                  <span className="text-accent hover:text-accent-hover transition-colors">
                    browse files
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/50 inline-block" />
                  .xlsx · .xlsm
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/50 inline-block" />
                  Max 100 MB
                </span>
              </div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleChange}
          />
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 rounded-xl p-3 text-error text-sm">
            {error}
          </div>
        )}

        {sheets.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-primary">
                Worksheets Detected
                <span className="ml-2 text-xs font-normal text-muted">
                  ({sheets.length} found)
                </span>
              </p>
              <button
                onClick={onSelectAll}
                className="text-xs text-accent hover:text-accent-hover transition-colors"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sheets.map((sheet) => {
                const checked = selectedSheets.includes(sheet.name);
                return (
                  <button
                    key={sheet.name}
                    onClick={() => onToggleSheet(sheet.name)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      checked
                        ? "bg-accent/15 border-accent/50 text-accent"
                        : "bg-surface-2 border-border text-secondary hover:border-accent/30"
                    }`}
                  >
                    <FileSpreadsheet
                      size={12}
                      className="inline mr-1.5 opacity-70"
                    />
                    {sheet.name}
                    <span className="ml-1.5 text-xs opacity-60">
                      {sheet.row_count} rows
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right guidance panel */}
      <div className="w-56 shrink-0 flex flex-col gap-4">
        <div className="bg-surface-2 border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
            Expected Columns
          </p>
          <div className="space-y-2">
            {[
              { label: "Time", unit: "min", required: true },
              { label: "Concentration", unit: "mg/L", required: true },
              { label: "CFU / Organisms", unit: "count", required: true },
              { label: "ICT", unit: "mg·min/L", required: false },
              { label: "Replicate", unit: "", required: false },
            ].map(({ label, unit, required }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-secondary">
                  {label}
                  {required && (
                    <span className="text-error ml-1 text-xs">*</span>
                  )}
                </span>
                {unit && (
                  <span className="text-xs text-muted font-mono">{unit}</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted mt-3">
            <span className="text-error">*</span> Required for calibration
          </p>
        </div>

        <div className="bg-surface-2 border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
            Validation Checks
          </p>
          <ul className="space-y-1.5 text-xs text-secondary">
            <li className="flex items-start gap-2">
              <CheckCircle2
                size={11}
                className="text-success mt-0.5 shrink-0"
              />
              Time values must be numeric
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                size={11}
                className="text-success mt-0.5 shrink-0"
              />
              CFU values must be positive
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                size={11}
                className="text-success mt-0.5 shrink-0"
              />
              Concentration units consistent
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                size={11}
                className="text-success mt-0.5 shrink-0"
              />
              No missing required values
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
