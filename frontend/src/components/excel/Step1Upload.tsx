"use client";

import { useRef, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
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
    <div className="space-y-6">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragging
            ? "border-blue-500 bg-blue-500/10"
            : "border-slate-600 hover:border-slate-500"
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
          <div className="text-slate-400 text-sm">Reading file…</div>
        ) : filename ? (
          <div className="flex items-center justify-center gap-3">
            <FileSpreadsheet className="text-green-400" size={24} />
            <span className="text-slate-200 font-medium">{filename}</span>
          </div>
        ) : (
          <>
            <Upload className="mx-auto mb-3 text-slate-500" size={32} />
            <p className="text-slate-300 font-medium">Drop .xlsx file here</p>
            <p className="text-slate-500 text-sm mt-1">or click to browse</p>
          </>
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
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {sheets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-300">
              Sheets found ({sheets.length})
            </p>
            <button
              onClick={onSelectAll}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
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
                      ? "bg-blue-600/30 border-blue-500 text-blue-300"
                      : "bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500"
                  }`}
                >
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
  );
}
