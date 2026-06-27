import numpy as np
from scipy import stats
from typing import List, Optional, Dict, Any


def compute_statistics(
    y_obs: np.ndarray,
    y_pred: np.ndarray,
    n_params: int,
    covariance: Optional[np.ndarray] = None,
    alpha: float = 0.05,
) -> Dict[str, Any]:
    """
    Compute goodness-of-fit statistics in BOTH linear and log₁₀ space.

    Since the optimizer now minimizes log-space residuals, the primary
    metrics (R², RMSE, AIC, BIC) are computed in log₁₀ space. Linear-space
    metrics are also included for reference.
    """
    n = len(y_obs)
    y_obs = np.asarray(y_obs, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)

    # ── Linear-space metrics (kept for reference) ──────────────────────
    residuals_lin = y_obs - y_pred
    sse_lin = float(np.sum(residuals_lin ** 2))
    ss_tot_lin = float(np.sum((y_obs - np.mean(y_obs)) ** 2))
    r2_lin = 1.0 - sse_lin / ss_tot_lin if ss_tot_lin > 0 else 0.0

    # ── Log₁₀-space metrics (primary — matches optimizer objective) ─────
    log_obs  = np.log10(np.clip(y_obs,  1e-15, None))
    log_pred = np.log10(np.clip(y_pred, 1e-15, None))

    residuals_log = log_obs - log_pred
    sse_log  = float(np.sum(residuals_log ** 2))
    mse_log  = sse_log / max(n - n_params, 1)
    rmse_log = float(np.sqrt(mse_log))
    mae_log  = float(np.mean(np.abs(residuals_log)))

    ss_tot_log = float(np.sum((log_obs - np.mean(log_obs)) ** 2))
    r2_log     = 1.0 - sse_log / ss_tot_log if ss_tot_log > 0 else 0.0
    adj_r2_log = 1.0 - (1 - r2_log) * (n - 1) / max(n - n_params - 1, 1)

    # Information criteria in log space
    log_lik = -n / 2 * np.log(2 * np.pi * mse_log) - sse_log / (2 * mse_log) if mse_log > 0 else -np.inf
    aic = float(2 * n_params - 2 * log_lik)
    bic = float(n_params * np.log(n) - 2 * log_lik)

    # ── Parameter uncertainty ───────────────────────────────────────────
    param_stats = []
    if covariance is not None and not np.any(np.isnan(covariance)):
        std_errors = np.sqrt(np.diag(np.abs(covariance)))
        dof = max(n - n_params, 1)
        t_crit = stats.t.ppf(1 - alpha / 2, dof) if dof > 0 else np.nan
        for se in std_errors:
            param_stats.append({
                "std_error": float(se),
                "ci_lower": None,
                "ci_upper": None,
                "t_stat": None,
                "p_value": None,
            })
    else:
        param_stats = [
            {"std_error": None, "ci_lower": None, "ci_upper": None, "t_stat": None, "p_value": None}
        ] * n_params

    return {
        # Primary (log-space) metrics exposed to UI
        "sse":             sse_log,
        "mse":             mse_log,
        "rmse":            rmse_log,
        "mae":             mae_log,
        "r_squared":       float(r2_log),
        "adj_r_squared":   float(adj_r2_log),
        "aic":             float(aic),
        "bic":             float(bic),
        "log_likelihood":  float(log_lik),
        "n_obs":           n,
        "n_params":        n_params,
        "converged":       True,
        "n_iterations":    None,
        "param_stats":     param_stats,
        # Linear-space kept for reference / diagnostics
        "sse_linear":      sse_lin,
        "r_squared_linear": float(r2_lin),
    }
