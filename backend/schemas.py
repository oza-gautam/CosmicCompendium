from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any


class _Base(BaseModel):
    model_config = ConfigDict(protected_namespaces=())


class ProjectCreate(_Base):
    name: str
    description: Optional[str] = None
    output_path: Optional[str] = None


class ProjectUpdate(_Base):
    name: Optional[str] = None
    description: Optional[str] = None
    output_path: Optional[str] = None


class ProjectOut(_Base):
    id: str
    name: str
    description: Optional[str]
    output_path: Optional[str] = None
    created_at: str


class ExperimentMetadata(_Base):
    organism: Optional[str] = None
    disinfectant: Optional[str] = None
    matrix: Optional[str] = None
    water_temp: Optional[str] = None
    analyst: Optional[str] = None
    notes: Optional[str] = None


class ExperimentCreate(_Base):
    project_id: str
    name: str
    metadata: Optional[ExperimentMetadata] = None


class ExperimentUpdate(_Base):
    name: Optional[str] = None
    metadata: Optional[ExperimentMetadata] = None


class ExperimentOut(_Base):
    id: int
    project_id: str
    name: str
    metadata: Optional[ExperimentMetadata] = None
    created_at: str
    sample_count: int = 0
    last_fit_label: Optional[str] = None
    last_fit_at: Optional[str] = None


class ExperimentFitCreate(_Base):
    label: str
    parameters: Dict[str, float]


class ExperimentFitOut(_Base):
    id: int
    experiment_id: int
    label: str
    parameters: Dict[str, float]
    created_at: str


class SampleOut(_Base):
    id: str
    project_id: str
    name: str
    column_map: Optional[Dict[str, str]]
    created_at: str
    observation_count: int = 0
    experiment_id: Optional[int] = None


class ObservationOut(_Base):
    id: int
    sample_id: str
    time: float
    concentration: float
    cfu: float
    ict: Optional[float]
    replicate: Optional[str]
    dose: Optional[float]
    row_index: Optional[int]


class ColumnMapRequest(_Base):
    column_map: Dict[str, str]


class ObservationRow(_Base):
    time: float
    concentration: float
    cfu: float


class UpdateRowsRequest(_Base):
    rows: List[ObservationRow]


class FitRequest(_Base):
    model_id: str
    initial_params: Optional[List[float]] = None
    bounds_lower: Optional[List[float]] = None
    bounds_upper: Optional[List[float]] = None
    sample_ids: Optional[List[str]] = None


class PredictRequest(_Base):
    model_id: str
    params: List[float]
    x_min: Optional[float] = None
    x_max: Optional[float] = None
    n_points: int = 200


class PredictResponse(_Base):
    x: List[float]
    y: List[float]
    y_log: List[Optional[float]]


class ParameterEstimate(_Base):
    name: str
    value: float
    std_error: Optional[float]
    ci_lower: Optional[float]
    ci_upper: Optional[float]
    t_stat: Optional[float]
    p_value: Optional[float]


class FitStatistics(_Base):
    sse: float
    mse: float
    rmse: float
    mae: float
    r_squared: float
    adj_r_squared: float
    aic: float
    bic: float
    log_likelihood: float
    n_obs: int
    n_params: int
    converged: bool
    n_iterations: Optional[int]


class QualityDeduction(_Base):
    category: str
    reason: str
    points: float


class QualityScoreOut(_Base):
    score: float
    rating: str
    data_quality: float
    optimization_quality: float
    statistical_quality: float
    scientific_quality: float
    strengths: List[str]
    weaknesses: List[str]
    deductions: List[QualityDeduction]
    recommendations: List[str]


class DiagnosticsOut(_Base):
    residuals: List[float]
    standardized_residuals: List[float]
    fitted_values: List[float]
    ict_values: List[float]
    cooks_distance: List[float]
    leverage: List[float]
    qq_theoretical: List[float]
    qq_sample: List[float]


class FitResultOut(_Base):
    id: str
    sample_id: str
    model_id: str
    model_name: str
    model_equation: str
    parameters: List[ParameterEstimate]
    statistics: FitStatistics
    diagnostics: DiagnosticsOut
    quality_score: QualityScoreOut
    created_at: str
    pooled_sample_ids: Optional[List[str]] = None
    label: Optional[str] = None


class ModelInfo(_Base):
    id: str
    name: str
    description: str
    equation: str
    parameters: List[Dict[str, Any]]
    x_variable: str


class CompareRequest(_Base):
    fit_ids: List[str]


class ReportRequest(_Base):
    fit_id: str
    chart_png_base64: Optional[str] = None
    sample_names: List[str] = []
    sample_ids: Optional[List[str]] = None
    calculated_n: List[Any] = []
    experiment_id: Optional[int] = None
