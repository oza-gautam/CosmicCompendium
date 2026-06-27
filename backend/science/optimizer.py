import numpy as np
from scipy.optimize import least_squares
from typing import List, Optional, Dict, Any
from .models.base import ScientificModel


def _log_residuals(params, model, x, log_y_obs):
    """Residuals in log₁₀ space: log10(predicted) - log10(observed)."""
    y_pred = model.predict(x, list(params))
    y_pred = np.clip(y_pred, 1e-15, None)
    return np.log10(y_pred) - log_y_obs


def fit_model(
    model: ScientificModel,
    x: np.ndarray,
    y_frac: np.ndarray,
    initial_params: Optional[List[float]] = None,
    bounds_lower: Optional[List[float]] = None,
    bounds_upper: Optional[List[float]] = None,
    n_starts: int = 8,
) -> Dict[str, Any]:
    """
    Fit model to survival fraction data using log₁₀-space least squares.

    Minimizing Σ(log10(N_pred/N0) - log10(N_obs/N0))² gives equal weight
    to every log decade of inactivation, so tail observations at high ICT
    are not drowned out by the large absolute counts near ICT=0.
    """
    if initial_params is None:
        initial_params = model.initial_guess(x, y_frac)

    lower, upper = model.bounds(x, y_frac)
    if bounds_lower is not None:
        lower = bounds_lower
    if bounds_upper is not None:
        upper = bounds_upper

    # Work in log space — clip fractions away from zero before taking log
    y_safe = np.clip(y_frac, 1e-10, 1.0)
    log_y_obs = np.log10(y_safe)

    bounds_ls = (lower, upper)

    best_result = None
    best_sse_log = np.inf

    # Build diverse starting points
    rng = np.random.default_rng(42)
    seeds = [list(initial_params)]
    for _ in range(n_starts - 1):
        jitter = []
        for i, (lo, hi) in enumerate(zip(lower, upper)):
            lo_safe = max(lo, 1e-10) if lo > -np.inf else 1e-10
            hi_safe = min(hi, 1e10) if hi < np.inf else 1e10
            center = float(initial_params[i])
            val = center * rng.uniform(0.3, 3.0)
            val = float(np.clip(val, lo_safe, hi_safe))
            jitter.append(val)
        seeds.append(jitter)

    for p0 in seeds:
        try:
            res = least_squares(
                _log_residuals,
                p0,
                args=(model, x, log_y_obs),
                bounds=bounds_ls,
                method="trf",
                max_nfev=20000,
                ftol=1e-12,
                xtol=1e-12,
                gtol=1e-12,
                loss="linear",
            )
            if res.success or res.cost < best_sse_log:
                sse_log = float(2 * res.cost)  # scipy stores 0.5 * ||r||^2
                if sse_log < best_sse_log:
                    best_sse_log = sse_log
                    # Compute covariance from Jacobian
                    try:
                        J = res.jac
                        _, s, Vt = np.linalg.svd(J, full_matrices=False)
                        threshold = np.finfo(float).eps * max(J.shape) * s[0]
                        s_inv = np.where(s > threshold, 1.0 / s, 0.0)
                        pcov = (Vt.T @ np.diag(s_inv ** 2) @ Vt)
                        # Scale by MSE in log space
                        dof = max(len(x) - len(p0), 1)
                        mse_log = sse_log / dof
                        pcov = pcov * mse_log
                    except Exception:
                        pcov = np.diag([np.nan] * len(p0))

                    best_result = {
                        "params": res.x.tolist(),
                        "covariance": pcov,
                        "converged": res.success,
                        "method": "trf-log",
                        "n_iterations": res.nfev,
                        "cost_log": sse_log,
                    }
        except Exception:
            continue

    # Fallback: try Levenberg-Marquardt in log space (no bounds)
    if best_result is None:
        try:
            res = least_squares(
                _log_residuals,
                initial_params,
                args=(model, x, log_y_obs),
                method="lm",
                max_nfev=20000,
                ftol=1e-12,
                xtol=1e-12,
                gtol=1e-12,
            )
            try:
                J = res.jac
                _, s, Vt = np.linalg.svd(J, full_matrices=False)
                threshold = np.finfo(float).eps * max(J.shape) * s[0]
                s_inv = np.where(s > threshold, 1.0 / s, 0.0)
                pcov = Vt.T @ np.diag(s_inv ** 2) @ Vt
                dof = max(len(x) - len(initial_params), 1)
                pcov = pcov * (2 * res.cost / dof)
            except Exception:
                pcov = np.diag([np.nan] * len(initial_params))

            best_result = {
                "params": res.x.tolist(),
                "covariance": pcov,
                "converged": res.success,
                "method": "lm-log",
                "n_iterations": res.nfev,
            }
        except Exception as e:
            best_result = {
                "params": initial_params,
                "covariance": np.diag([np.nan] * len(initial_params)),
                "converged": False,
                "method": "failed",
                "error": str(e),
            }

    return best_result
