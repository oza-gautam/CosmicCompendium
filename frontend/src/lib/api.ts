import type {
  Project,
  Sample,
  Observation,
  ModelInfo,
  FitResult,
  PredictResponse,
  ExcelUploadResult,
  SheetRawResult,
  ImportResult,
  ImportTemplate,
  PendingSample,
  ColumnMap,
  FitEvent,
  ReportRequest,
} from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

// Projects
export const api = {
  projects: {
    list: () => req<Project[]>("/api/projects"),
    create: (name: string, description?: string) =>
      req<Project>("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      }),
    get: (id: string) => req<Project>(`/api/projects/${id}`),
    delete: (id: string) => req(`/api/projects/${id}`, { method: "DELETE" }),
  },

  samples: {
    list: (projectId: string) =>
      req<Sample[]>(`/api/projects/${projectId}/samples`),
    upload: (projectId: string, file: File, name?: string) => {
      const fd = new FormData();
      fd.append("file", file);
      if (name) fd.append("name", name);
      return req<Sample>(`/api/projects/${projectId}/samples`, {
        method: "POST",
        body: fd,
      });
    },
    detectColumns: (sampleId: string) =>
      req<{ columns: string[]; detected: Record<string, string> }>(
        `/api/samples/${sampleId}/detect-columns`,
      ),
    updateColumnMap: (sampleId: string, column_map: Record<string, string>) =>
      req(`/api/samples/${sampleId}/column-map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ column_map }),
      }),
    data: (sampleId: string) =>
      req<Observation[]>(`/api/samples/${sampleId}/data`),
    updateRows: (
      sampleId: string,
      rows: Array<{ time: number; concentration: number; cfu: number }>,
    ) =>
      req(`/api/samples/${sampleId}/rows`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      }),
  },

  models: {
    list: () => req<ModelInfo[]>("/api/models"),
  },

  fitting: {
    fit: (sampleId: string, model_id: string, initial_params?: number[]) =>
      req<FitResult>(`/api/samples/${sampleId}/fit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id, initial_params }),
      }),
    predict: (
      sampleId: string,
      model_id: string,
      params: number[],
      x_min?: number,
      x_max?: number,
    ) =>
      req<PredictResponse>(`/api/samples/${sampleId}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id, params, x_min, x_max }),
      }),
    fitFixed: (sampleId: string, model_id: string, params: number[]) =>
      req<FitResult>(`/api/samples/${sampleId}/fit-fixed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id, initial_params: params }),
      }),
    listFits: (sampleId: string) =>
      req<FitResult[]>(`/api/samples/${sampleId}/fits`),
    getFit: (fitId: string) => req<FitResult>(`/api/fits/${fitId}`),
    fitPooled: (
      projectId: string,
      model_id: string,
      initial_params?: number[],
      sample_ids?: string[],
    ) =>
      req<FitResult>(`/api/projects/${projectId}/fit-pooled`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id, initial_params, sample_ids }),
      }),
    compare: (fit_ids: string[]) =>
      req<object[]>("/api/fits/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fit_ids }),
      }),
  },

  excel: {
    upload: (file: File): Promise<ExcelUploadResult> => {
      const fd = new FormData();
      fd.append("file", file);
      return req<ExcelUploadResult>("/api/excel/upload", {
        method: "POST",
        body: fd,
      });
    },
    sheetRaw: (token: string, sheet_name: string): Promise<SheetRawResult> =>
      req<SheetRawResult>(`/api/excel/${token}/sheet-raw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet_name }),
      }),
    import: (
      token: string,
      project_id: string,
      samples: PendingSample[],
    ): Promise<ImportResult> =>
      req<ImportResult>(`/api/excel/${token}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id,
          samples: samples.map((s) => ({
            sheet_name: s.sheetName,
            sample_name: s.sampleName,
            header_row_index: s.headerRowIndex,
            data_row_indices: s.dataRowIndices,
            column_map: s.columnMap,
            group_column: s.groupColumn,
            selected_columns: s.selectedColumns,
            row_overrides: s.rowOverrides,
          })),
        }),
      }),
    deleteSession: (token: string) =>
      req(`/api/excel/${token}`, { method: "DELETE" }),
  },

  journal: {
    list: (sampleId: string): Promise<FitEvent[]> =>
      req<FitEvent[]>(`/api/samples/${sampleId}/journal`),
    addEvent: (
      sampleId: string,
      event: {
        event_type: string;
        title: string;
        body: string;
        metadata?: Record<string, unknown>;
      },
    ) =>
      req(`/api/samples/${sampleId}/journal/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }),
    selectForReport: (sampleId: string, fitId: string) =>
      req(`/api/samples/${sampleId}/fits/${fitId}/select-for-report`, {
        method: "POST",
      }),
  },

  report: {
    download: async (
      sampleId: string,
      payload: ReportRequest,
    ): Promise<void> => {
      const res = await fetch(`${BASE}/api/samples/${sampleId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Report failed: ${await res.text()}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
        "report.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    },
  },

  templates: {
    list: (): Promise<ImportTemplate[]> =>
      req<ImportTemplate[]>("/api/templates"),
    create: (
      name: string,
      column_map: ColumnMap,
      group_column?: string,
    ): Promise<ImportTemplate> =>
      req<ImportTemplate>("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, column_map, group_column }),
      }),
    delete: (id: string) => req(`/api/templates/${id}`, { method: "DELETE" }),
  },
};
