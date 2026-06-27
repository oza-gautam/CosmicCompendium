export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Sample {
  id: string;
  project_id: string;
  name: string;
  column_map?: Record<string, string>;
  created_at: string;
  observation_count: number;
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
}

export interface PredictResponse {
  x: number[];
  y: number[];
  y_log: number[];
}
