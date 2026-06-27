import uuid
import json
import numpy as np
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import io
from ..db.database import get_connection
from ..schemas import (
    FitRequest, FitResultOut, PredictRequest, PredictResponse,
    ModelInfo, CompareRequest, ParameterEstimate, FitStatistics,
    DiagnosticsOut, QualityScoreOut, QualityDeduction,
)
from ..science.model_registry import get_model, list_models
from ..science.optimizer import fit_model
from ..science.statistics import compute_statistics
from ..science.diagnostics import compute_diagnostics
from ..science.quality_score import compute_quality_score

router = APIRouter(prefix="/api", tags=["fitting"])


@router.get("/models", response_model=list[ModelInfo])
def get_models():
    return [
        ModelInfo(
            id=m.id,
            name=m.name,
            description=m.description,
            equation=m.equation,
            parameters=m.parameter_definitions,
            x_variable=m.x_variable,
        )
        for m in list_models()
    ]


@router.post("/samples/{sample_id}/fit", response_model=FitResultOut)
def fit(sample_id: str, body: FitRequest):
    conn = get_connection()
    obs = conn.execute(
        "SELECT time, concentration, cfu, ict FROM observations WHERE sample_id = ? ORDER BY time",
        (sample_id,),
    ).fetchall()
    if not obs:
        conn.close()
        raise HTTPException(404, "No observations found for this sample")

    model = get_model(body.model_id)

    rows = [dict(r) for r in obs]
    use_ict = model.x_variable == "ICT"

    if use_ict:
        x = np.array([r["ict"] for r in rows], dtype=float)
    else:
        x = np.array([r["time"] * r["concentration"] for r in rows], dtype=float)

    cfus = np.array([r["cfu"] for r in rows], dtype=float)
    n0 = cfus[0] if cfus[0] > 0 else max(cfus)
    y_frac = cfus / n0

    result = fit_model(
        model, x, y_frac,
        initial_params=body.initial_params,
        bounds_lower=body.bounds_lower,
        bounds_upper=body.bounds_upper,
    )

    params = result["params"]
    cov = result["covariance"]
    converged = result["converged"]

    y_pred = model.predict(x, params)
    stats = compute_statistics(y_frac, y_pred, len(params), cov)
    stats["converged"] = converged
    diag = compute_diagnostics(y_frac, y_pred, x, len(params))
    qs = compute_quality_score(stats, diag, params, model.parameter_definitions, cov, len(rows), converged)

    fit_id = str(uuid.uuid4())

    param_stats = stats.get("param_stats", [{}] * len(params))
    param_ests = []
    for i, (p, pdef) in enumerate(zip(params, model.parameter_definitions)):
        ps = param_stats[i] if i < len(param_stats) else {}
        param_ests.append(ParameterEstimate(
            name=pdef["name"],
            value=float(p),
            std_error=ps.get("std_error"),
            ci_lower=ps.get("ci_lower"),
            ci_upper=ps.get("ci_upper"),
            t_stat=ps.get("t_stat"),
            p_value=ps.get("p_value"),
        ))

    fit_stats = FitStatistics(
        sse=stats["sse"], mse=stats["mse"], rmse=stats["rmse"], mae=stats["mae"],
        r_squared=stats["r_squared"], adj_r_squared=stats["adj_r_squared"],
        aic=stats["aic"], bic=stats["bic"], log_likelihood=stats["log_likelihood"],
        n_obs=stats["n_obs"], n_params=stats["n_params"],
        converged=converged, n_iterations=stats.get("n_iterations"),
    )

    diag_out = DiagnosticsOut(**{k: v for k, v in diag.items()})

    qs_deductions = [QualityDeduction(**d) for d in qs["deductions"]]
    qs_out = QualityScoreOut(
        score=qs["score"], rating=qs["rating"],
        data_quality=qs["data_quality"], optimization_quality=qs["optimization_quality"],
        statistical_quality=qs["statistical_quality"], scientific_quality=qs["scientific_quality"],
        strengths=qs["strengths"], weaknesses=qs["weaknesses"],
        deductions=qs_deductions, recommendations=qs["recommendations"],
    )

    store_params = [{"name": pe.name, "value": pe.value, "std_error": pe.std_error} for pe in param_ests]
    conn.execute(
        "INSERT INTO model_fits (id, sample_id, model_id, parameters, statistics, diagnostics, quality_score) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (fit_id, sample_id, body.model_id,
         json.dumps(store_params), json.dumps(stats), json.dumps(diag), json.dumps(qs)),
    )
    conn.commit()
    conn.close()

    from datetime import datetime
    return FitResultOut(
        id=fit_id, sample_id=sample_id, model_id=model.id,
        model_name=model.name, model_equation=model.equation,
        parameters=param_ests, statistics=fit_stats,
        diagnostics=diag_out, quality_score=qs_out,
        created_at=datetime.utcnow().isoformat(),
    )


@router.post("/samples/{sample_id}/predict", response_model=PredictResponse)
def predict(sample_id: str, body: PredictRequest):
    conn = get_connection()
    obs = conn.execute(
        "SELECT time, concentration, cfu, ict FROM observations WHERE sample_id = ? ORDER BY time",
        (sample_id,),
    ).fetchall()
    conn.close()

    model = get_model(body.model_id)
    rows = [dict(r) for r in obs]
    use_ict = model.x_variable == "ICT"

    if rows:
        if use_ict:
            x_data = [r["ict"] for r in rows]
        else:
            x_data = [r["time"] * r["concentration"] for r in rows]
        x_min = body.x_min if body.x_min is not None else min(x_data)
        x_max = body.x_max if body.x_max is not None else max(x_data) * 1.2
    else:
        x_min = body.x_min or 0.0
        x_max = body.x_max or 10.0

    x = np.linspace(x_min, x_max, body.n_points)
    y = model.predict(x, body.params)
    y_log = [float(np.log10(max(v, 1e-15))) for v in y]

    return PredictResponse(x=x.tolist(), y=y.tolist(), y_log=y_log)


@router.get("/samples/{sample_id}/fits", response_model=list[FitResultOut])
def list_fits(sample_id: str):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM model_fits WHERE sample_id = ? ORDER BY created_at DESC", (sample_id,)
    ).fetchall()
    conn.close()
    return [_row_to_fit(r) for r in rows]


@router.get("/fits/{fit_id}", response_model=FitResultOut)
def get_fit(fit_id: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM model_fits WHERE id = ?", (fit_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Fit not found")
    return _row_to_fit(row)


def _row_to_fit(row) -> FitResultOut:
    r = dict(row)
    params_raw = json.loads(r["parameters"])
    stats_raw = json.loads(r["statistics"])
    diag_raw = json.loads(r["diagnostics"])
    qs_raw = json.loads(r["quality_score"])

    model = get_model(r["model_id"])

    param_ests = [
        ParameterEstimate(
            name=p["name"], value=p["value"],
            std_error=p.get("std_error"), ci_lower=None, ci_upper=None,
            t_stat=None, p_value=None,
        ) for p in params_raw
    ]

    fit_stats = FitStatistics(
        sse=stats_raw["sse"], mse=stats_raw["mse"], rmse=stats_raw["rmse"], mae=stats_raw["mae"],
        r_squared=stats_raw["r_squared"], adj_r_squared=stats_raw["adj_r_squared"],
        aic=stats_raw["aic"], bic=stats_raw["bic"], log_likelihood=stats_raw["log_likelihood"],
        n_obs=stats_raw["n_obs"], n_params=stats_raw["n_params"],
        converged=stats_raw.get("converged", True), n_iterations=stats_raw.get("n_iterations"),
    )

    diag_out = DiagnosticsOut(
        residuals=diag_raw.get("residuals", []),
        standardized_residuals=diag_raw.get("standardized_residuals", []),
        fitted_values=diag_raw.get("fitted_values", []),
        ict_values=diag_raw.get("ict_values", []),
        cooks_distance=diag_raw.get("cooks_distance", []),
        leverage=diag_raw.get("leverage", []),
        qq_theoretical=diag_raw.get("qq_theoretical", []),
        qq_sample=diag_raw.get("qq_sample", []),
    )

    qs_deductions = [QualityDeduction(**d) for d in qs_raw.get("deductions", [])]
    qs_out = QualityScoreOut(
        score=qs_raw["score"], rating=qs_raw["rating"],
        data_quality=qs_raw.get("data_quality", 20),
        optimization_quality=qs_raw.get("optimization_quality", 20),
        statistical_quality=qs_raw.get("statistical_quality", 30),
        scientific_quality=qs_raw.get("scientific_quality", 30),
        strengths=qs_raw.get("strengths", []),
        weaknesses=qs_raw.get("weaknesses", []),
        deductions=qs_deductions,
        recommendations=qs_raw.get("recommendations", []),
    )

    return FitResultOut(
        id=r["id"], sample_id=r["sample_id"], model_id=r["model_id"],
        model_name=model.name, model_equation=model.equation,
        parameters=param_ests, statistics=fit_stats,
        diagnostics=diag_out, quality_score=qs_out,
        created_at=r["created_at"],
    )


@router.post("/projects/{project_id}/fit-pooled", response_model=FitResultOut)
def fit_pooled(project_id: str, body: FitRequest):
    """Fit a model to all observations across every sample in the project, pooled together."""
    conn = get_connection()

    # Get all samples in this project
    samples = conn.execute(
        "SELECT id FROM samples WHERE project_id = ?", (project_id,)
    ).fetchall()
    if not samples:
        conn.close()
        raise HTTPException(404, "No samples found for this project")

    sample_ids = [r["id"] for r in samples]

    # Gather all observations across all samples
    placeholders = ",".join("?" * len(sample_ids))
    obs = conn.execute(
        f"SELECT sample_id, time, concentration, cfu, ict FROM observations WHERE sample_id IN ({placeholders}) ORDER BY sample_id, time",
        sample_ids,
    ).fetchall()

    if not obs:
        conn.close()
        raise HTTPException(404, "No observations found in this project")

    model = get_model(body.model_id)
    rows = [dict(r) for r in obs]
    use_ict = model.x_variable == "ICT"

    # Pool: normalize each sample by its own N0 so survival fractions are comparable
    from collections import defaultdict
    by_sample: dict = defaultdict(list)
    for r in rows:
        by_sample[r["sample_id"]].append(r)

    x_all, y_all = [], []
    for sid, sample_rows in by_sample.items():
        cfus = [float(r["cfu"]) for r in sample_rows]
        n0 = cfus[0] if cfus[0] > 0 else max(cfus)
        if n0 <= 0:
            continue
        for r in sample_rows:
            xval = (r["ict"] if use_ict else r["time"] * r["concentration"]) or 0.0
            x_all.append(xval)
            y_all.append(r["cfu"] / n0)

    x = np.array(x_all, dtype=float)
    y_frac = np.array(y_all, dtype=float)

    result = fit_model(
        model, x, y_frac,
        initial_params=body.initial_params,
        bounds_lower=body.bounds_lower,
        bounds_upper=body.bounds_upper,
    )

    params = result["params"]
    cov = result["covariance"]
    converged = result["converged"]

    y_pred = model.predict(x, params)
    stats = compute_statistics(y_frac, y_pred, len(params), cov)
    stats["converged"] = converged
    diag = compute_diagnostics(y_frac, y_pred, x, len(params))
    qs = compute_quality_score(stats, diag, params, model.parameter_definitions, cov, len(x), converged)

    fit_id = str(uuid.uuid4())
    # Store the pooled fit against the first sample_id (as a convention) with a marker
    anchor_sample_id = sample_ids[0]

    param_stats = stats.get("param_stats", [{}] * len(params))
    param_ests = []
    for i, (p, pdef) in enumerate(zip(params, model.parameter_definitions)):
        ps = param_stats[i] if i < len(param_stats) else {}
        param_ests.append(ParameterEstimate(
            name=pdef["name"], value=float(p),
            std_error=ps.get("std_error"), ci_lower=None, ci_upper=None,
            t_stat=None, p_value=None,
        ))

    fit_stats = FitStatistics(
        sse=stats["sse"], mse=stats["mse"], rmse=stats["rmse"], mae=stats["mae"],
        r_squared=stats["r_squared"], adj_r_squared=stats["adj_r_squared"],
        aic=stats["aic"], bic=stats["bic"], log_likelihood=stats["log_likelihood"],
        n_obs=stats["n_obs"], n_params=stats["n_params"],
        converged=converged, n_iterations=stats.get("n_iterations"),
    )
    diag_out = DiagnosticsOut(**{k: v for k, v in diag.items()})
    qs_deductions = [QualityDeduction(**d) for d in qs["deductions"]]
    qs_out = QualityScoreOut(
        score=qs["score"], rating=qs["rating"],
        data_quality=qs["data_quality"], optimization_quality=qs["optimization_quality"],
        statistical_quality=qs["statistical_quality"], scientific_quality=qs["scientific_quality"],
        strengths=qs["strengths"], weaknesses=qs["weaknesses"],
        deductions=qs_deductions, recommendations=qs["recommendations"],
    )

    store_params = [{"name": pe.name, "value": pe.value, "std_error": pe.std_error} for pe in param_ests]
    conn.execute(
        "INSERT INTO model_fits (id, sample_id, model_id, parameters, statistics, diagnostics, quality_score) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (fit_id, anchor_sample_id, body.model_id,
         json.dumps(store_params), json.dumps(stats), json.dumps(diag), json.dumps(qs)),
    )
    conn.commit()
    conn.close()

    from datetime import datetime
    return FitResultOut(
        id=fit_id, sample_id=anchor_sample_id, model_id=model.id,
        model_name=model.name, model_equation=model.equation,
        parameters=param_ests, statistics=fit_stats,
        diagnostics=diag_out, quality_score=qs_out,
        created_at=datetime.utcnow().isoformat(),
    )


@router.post("/fits/compare")
def compare_fits(body: CompareRequest):
    conn = get_connection()
    results = []
    for fit_id in body.fit_ids:
        row = conn.execute("SELECT * FROM model_fits WHERE id = ?", (fit_id,)).fetchone()
        if row:
            r = dict(row)
            stats = json.loads(r["statistics"])
            qs = json.loads(r["quality_score"])
            model = get_model(r["model_id"])
            results.append({
                "fit_id": fit_id,
                "model_id": r["model_id"],
                "model_name": model.name,
                "r_squared": stats["r_squared"],
                "adj_r_squared": stats["adj_r_squared"],
                "aic": stats["aic"],
                "bic": stats["bic"],
                "rmse": stats["rmse"],
                "quality_score": qs["score"],
                "rating": qs["rating"],
            })
    conn.close()
    results.sort(key=lambda x: x["aic"])
    return results
