import numpy as np
from typing import Dict, Any, List


def compute_quality_score(
    stats: Dict[str, Any],
    diagnostics: Dict[str, Any],
    params: List[float],
    param_defs: List[Dict],
    covariance: Any,
    n_obs: int,
    converged: bool,
) -> Dict[str, Any]:
    score = 100.0
    deductions = []
    strengths = []
    weaknesses = []
    recommendations = []

    # --- Data Quality (20 pts) ---
    dq = 20.0
    if n_obs < 5:
        d = min(10.0, (5 - n_obs) * 2.5)
        dq -= d
        deductions.append({"category": "Data Quality", "reason": f"Only {n_obs} observations (≥5 recommended)", "points": d})
        weaknesses.append(f"Low observation count ({n_obs})")
        recommendations.append("Collect more time points for robust fitting")
    elif n_obs >= 10:
        strengths.append(f"Good observation count ({n_obs} points)")

    if n_obs >= 5:
        strengths.append("Sufficient ICT coverage for fitting")

    score -= (20.0 - dq)

    # --- Optimization Quality (20 pts) ---
    oq = 20.0
    if not converged:
        oq -= 15.0
        deductions.append({"category": "Optimization", "reason": "Optimizer did not converge", "points": 15.0})
        weaknesses.append("Convergence failure")
        recommendations.append("Try different initial parameter guesses or tighter bounds")
    else:
        strengths.append("Stable convergence achieved")

    cov_bad = covariance is None or np.any(np.isnan(covariance)) or np.any(np.isinf(covariance))
    if cov_bad:
        d = 5.0
        oq -= d
        deductions.append({"category": "Optimization", "reason": "Ill-conditioned covariance matrix", "points": d})
        weaknesses.append("Covariance matrix ill-conditioned — parameter uncertainty unreliable")
    else:
        strengths.append("Well-conditioned covariance matrix")

    score -= (20.0 - oq)

    # --- Statistical Quality (30 pts) ---
    sq = 30.0
    r2 = stats.get("r_squared", 0)
    rmse = stats.get("rmse", 1)
    aic = stats.get("aic", 0)

    if r2 >= 0.98:
        strengths.append(f"Excellent R² = {r2:.4f}")
    elif r2 >= 0.95:
        strengths.append(f"Good R² = {r2:.4f}")
    elif r2 >= 0.85:
        d = 5.0
        sq -= d
        deductions.append({"category": "Statistics", "reason": f"Moderate R² = {r2:.4f}", "points": d})
        weaknesses.append(f"Moderate fit quality (R² = {r2:.4f})")
    else:
        d = 15.0
        sq -= d
        deductions.append({"category": "Statistics", "reason": f"Poor R² = {r2:.4f}", "points": d})
        weaknesses.append(f"Poor fit quality (R² = {r2:.4f})")
        recommendations.append("Consider a different model or check data quality")

    std_resids = np.array(diagnostics.get("standardized_residuals", []))
    if len(std_resids) > 2:
        max_std = np.max(np.abs(std_resids))
        if max_std > 3.0:
            d = 5.0
            sq -= d
            deductions.append({"category": "Statistics", "reason": f"Outlier detected (max |std residual| = {max_std:.2f})", "points": d})
            weaknesses.append("Potential outlier in residuals")
            recommendations.append("Inspect observations with |standardized residual| > 3")

    score -= (30.0 - sq)

    # --- Scientific / Diagnostics Quality (30 pts) ---
    scq = 30.0

    # Parameter bounds check
    params_out_of_range = 0
    for i, (p, pdef) in enumerate(zip(params, param_defs)):
        lo, hi = pdef.get("min", -np.inf), pdef.get("max", np.inf)
        if p <= lo * 1.01 or p >= hi * 0.99:
            params_out_of_range += 1

    if params_out_of_range > 0:
        d = 5.0 * params_out_of_range
        scq -= d
        deductions.append({"category": "Scientific", "reason": f"{params_out_of_range} parameter(s) at boundary — identifiability concern", "points": d})
        weaknesses.append("Parameter(s) hitting bounds — model may be over-parameterized")
        recommendations.append("Consider a simpler model or wider bounds")
    else:
        strengths.append("All parameters within plausible range")

    # Covariance correlation check
    if not cov_bad and covariance is not None:
        try:
            std = np.sqrt(np.diag(covariance))
            corr = covariance / np.outer(std, std + 1e-15)
            np.fill_diagonal(corr, 0)
            max_corr = np.max(np.abs(corr))
            if max_corr > 0.95:
                d = 6.0
                scq -= d
                deductions.append({"category": "Scientific", "reason": f"High parameter correlation (max |r| = {max_corr:.2f}) — identifiability risk", "points": d})
                weaknesses.append(f"High parameter correlation ({max_corr:.2f})")
                recommendations.append("Highly correlated parameters may indicate an over-parameterized model")
            elif max_corr > 0.8:
                d = 3.0
                scq -= d
                deductions.append({"category": "Scientific", "reason": f"Moderate parameter correlation (max |r| = {max_corr:.2f})", "points": d})
                weaknesses.append(f"Moderate parameter correlation ({max_corr:.2f})")
        except Exception:
            pass

    cooks = np.array(diagnostics.get("cooks_distance", []))
    if len(cooks) > 0 and np.any(cooks > 1.0):
        d = 4.0
        scq -= d
        n_influential = int(np.sum(cooks > 1.0))
        deductions.append({"category": "Scientific", "reason": f"{n_influential} influential observation(s) (Cook's D > 1)", "points": d})
        weaknesses.append(f"{n_influential} influential point(s) detected")
        recommendations.append("Review observations with Cook's Distance > 1")

    score -= (30.0 - scq)

    score = max(0.0, min(100.0, score))

    if score >= 90:
        rating = "Excellent"
    elif score >= 75:
        rating = "Good"
    elif score >= 60:
        rating = "Fair"
    else:
        rating = "Poor"

    return {
        "score": round(score, 1),
        "rating": rating,
        "data_quality": round(dq, 1),
        "optimization_quality": round(oq, 1),
        "statistical_quality": round(sq, 1),
        "scientific_quality": round(scq, 1),
        "strengths": strengths,
        "weaknesses": weaknesses,
        "deductions": deductions,
        "recommendations": recommendations,
    }
