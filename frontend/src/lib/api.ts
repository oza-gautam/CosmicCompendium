import type {
  Project,
  Sample,
  Observation,
  ModelInfo,
  FitResult,
  PredictResponse,
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
    listFits: (sampleId: string) =>
      req<FitResult[]>(`/api/samples/${sampleId}/fits`),
    getFit: (fitId: string) => req<FitResult>(`/api/fits/${fitId}`),
    fitPooled: (
      projectId: string,
      model_id: string,
      initial_params?: number[],
    ) =>
      req<FitResult>(`/api/projects/${projectId}/fit-pooled`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id, initial_params }),
      }),
    compare: (fit_ids: string[]) =>
      req<object[]>("/api/fits/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fit_ids }),
      }),
  },
};
