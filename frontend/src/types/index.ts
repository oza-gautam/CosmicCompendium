export interface Project {
  id: string;
  name: string;
  description?: string;
  output_path?: string;
  created_at: string;
}

export interface Sample {
  id: string;
  project_id: string;
  name: string;
  column_map?: Record<string, string>;
  created_at: string;
  observation_count: number;
  experiment_id?: number;
}

export interface ExperimentMetadata {
  organism?: string;
  disinfectant?: string;
  matrix?: string;
  water_temp?: string;
  analyst?: string;
  notes?: string;
}

export interface Experiment {
  id: number;
  project_id: string;
  name: string;
  metadata?: ExperimentMetadata;
  created_at: string;
  sample_count: number;
  last_fit_label?: string;
  last_fit_at?: string;
}

export interface ExperimentFit {
  id: number;
  experiment_id: number;
  label: string;
  parameters: Record<string, number>;
  created_at: string;
}

export interface Observation {
  id: number;
  sample_id: string;
  time: number;
  concentration: number;
  cfu: number;
  ict?: number;
  replicate?: string;
  dose?: number;
  row_index?: number;
}

export interface ModelParameter {
  name: string;
  description: string;
  default: number;
  min: number;
  max: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  equation: string;
  parameters: ModelParameter[];
  x_variable: string;
}

export interface ParameterEstimate {
  name: string;
  value: number;
  std_error?: number;
  ci_lower?: number;
  ci_upper?: number;
  t_stat?: number;
  p_value?: number;
}

export interface FitStatistics {
  sse: number;
  mse: number;
  rmse: number;
  mae: number;
  r_squared: number;
  adj_r_squared: number;
  aic: number;
  bic: number;
  log_likelihood: number;
  n_obs: number;
  n_params: number;
  converged: boolean;
  n_iterations?: number;
}

export interface QualityDeduction {
  category: string;
  reason: string;
  points: number;
}

export interface QualityScore {
  score: number;
  rating: "Excellent" | "Good" | "Fair" | "Poor";
  data_quality: number;
  optimization_quality: number;
  statistical_quality: number;
  scientific_quality: number;
  strengths: string[];
  weaknesses: string[];
  deductions: QualityDeduction[];
  recommendations: string[];
}

export interface Diagnostics {
  residuals: number[];
  standardized_residuals: number[];
  fitted_values: number[];
  ict_values: number[];
  cooks_distance: number[];
  leverage: number[];
  qq_theoretical: number[];
  qq_sample: number[];
}

export interface FitResult {
  id: string;
  sample_id: string;
  model_id: string;
  model_name: string;
  model_equation: string;
  parameters: ParameterEstimate[];
  statistics: FitStatistics;
  diagnostics: Diagnostics;
  quality_score: QualityScore;
  created_at: string;
  pooled_sample_ids?: string[] | null;
}

export interface PredictResponse {
  x: number[];
  y: number[];
  y_log: number[];
}

// Excel Import Wizard types

export interface ExcelSheet {
  name: string;
  row_count: number;
}

export interface ExcelUploadResult {
  token: string;
  sheets: ExcelSheet[];
}

export interface SheetRawResult {
  rows: string[][];
  row_count: number;
  truncated?: boolean;
  total_rows?: number;
}

export interface ColumnMap {
  time?: string;
  concentration?: string;
  cfu?: string;
  ict?: string;
  replicate?: string;
  dose?: string;
}

export interface PendingSample {
  sheetName: string;
  sampleName: string;
  headerRowIndex: number;
  dataRowIndices: number[];
  columnMap: ColumnMap;
  groupColumn?: string;
  selectedColumns?: number[]; // column indices to keep; undefined = all
  rowOverrides?: Record<number, Record<number, string>>; // absRowIdx -> colIdx -> newValue
}

export interface ImportedSample {
  sample_id: string;
  name: string;
  obs_count: number;
}

export interface ImportError {
  sample_name: string;
  reason: string;
}

export interface ImportResult {
  imported: ImportedSample[];
  errors: ImportError[];
}

export interface ImportTemplate {
  id: string;
  name: string;
  column_map: ColumnMap;
  group_column?: string;
  created_at: string;
}

// Quick Import Wizard types

export interface QuickImportDetectedColMap {
  group?: string;
  time?: string;
  cfu?: string;
  concentration?: string;
}

export interface QuickImportSampleGroup {
  group_value: string;
  sample_name: string;
  row_count: number;
}

export interface QuickImportSheetPreview {
  sheet_name: string;
  experiment_name: string;
  header_row_index: number;
  col_map: QuickImportDetectedColMap;
  sample_groups: QuickImportSampleGroup[];
  detected: boolean;
  raw_rows?: string[][];
  all_headers: string[];
}

export interface QuickImportPreview {
  sheets: QuickImportSheetPreview[];
}

export interface QuickImportConfirmedColMap {
  group?: string;
  time: string;
  cfu: string;
  concentration: string;
}

export interface QuickImportSheetMetadata {
  experiment_date?: string; // YYYY-MM-DD
  analyst?: string;
  notes?: string;
}

export interface QuickImportSheetConfig {
  sheet_name: string;
  experiment_name: string;
  header_row_index: number;
  col_map: QuickImportConfirmedColMap;
  data_row_indices?: number[];
  metadata?: QuickImportSheetMetadata;
}

export interface QuickImportExecuteRequest {
  project_id: string;
  sheets: QuickImportSheetConfig[];
}

export interface QuickImportResult {
  experiment_ids: number[];
  first_experiment_id: number;
  total_samples: number;
  total_observations: number;
}

export interface FitEvent {
  id: string;
  sample_id: string;
  event_type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface CalculatedNRow {
  ict: number;
  values: number[];
}

export interface ReportRequest {
  fit_id: string;
  chart_png_base64?: string;
  sample_names: string[];
  sample_ids?: string[];
  calculated_n: CalculatedNRow[];
  experiment_id?: number;
}
