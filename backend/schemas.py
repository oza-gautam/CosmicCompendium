from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any


class _Base(BaseModel):
    model_config = ConfigDict(protected_namespaces=())


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: str


class SampleOut(BaseModel):
    id: str
    project_id: str
    name: str
    column_map: Optional[Dict[str, str]]
    created_at: str
    observation_count: int = 0


class ObservationOut(BaseModel):
    id: int
    sample_id: str
    time: float
    concentration: float
    cfu: float
    ict: Optional[float]
    replicate: Optional[str]
    dose: Optional[float]
    row_index: Optional[int]


class ColumnMapRequest(BaseModel):
    column_map: Dict[str, str]


class FitRequest(BaseModel):
    model_id: str
    initial_params: Optional[List[float]] = None
    bounds_lower: Optional[List[float]] = None
    bounds_upper: Optional[List[float]] = None


class PredictRequest(BaseModel):
    model_id: str
    params: List[float]
    x_min: Optional[float] = None
    x_max: Optional[float] = None
    n_points: int = 200


class PredictResponse(BaseModel):
    x: List[float]
    y: List[float]
    y_log: List[Optional[float]]


class ParameterEstimate(BaseModel):
    name: str
    value: float
    std_error: Optional[float]
    ci_lower: Optional[float]
    ci_upper: Optional[float]
    t_stat: Optional[float]
    p_value: Optional[float]


class FitStatistics(BaseModel):
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


class QualityDeduction(BaseModel):
    category: str
    reason: str
    points: float


class QualityScoreOut(BaseModel):
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


class DiagnosticsOut(BaseModel):
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


class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    equation: str
    parameters: List[Dict[str, Any]]
    x_variable: str


class CompareRequest(BaseModel):
    fit_ids: List[str]
