import numpy as np
from scipy import stats
from typing import Dict, Any


def compute_diagnostics(
    y_obs: np.ndarray,
    y_pred: np.ndarray,
    x: np.ndarray,
    n_params: int,
) -> Dict[str, Any]:
    """Diagnostics computed in log₁₀ space to match the optimizer objective."""
    n = len(y_obs)

    log_obs  = np.log10(np.clip(y_obs,  1e-15, None))
    log_pred = np.log10(np.clip(y_pred, 1e-15, None))

    residuals = log_obs - log_pred          # log-space residuals (log10 units)
    mse = float(np.sum(residuals ** 2) / max(n - n_params, 1))
    std_resid = residuals / (np.sqrt(mse) + 1e-15)

    # Hat matrix diagonal (leverage)
    X = np.column_stack([np.ones(n), x])
    try:
        XtX_inv = np.linalg.pinv(X.T @ X)
        H = np.diag(X @ XtX_inv @ X.T)
        leverage = np.clip(H, 0, 1).tolist()
    except Exception:
        leverage = [1.0 / n] * n

    lev = np.array(leverage)
    cooks_d = (std_resid ** 2 * lev) / (n_params * (1 - lev + 1e-10))
    cooks_d = np.clip(cooks_d, 0, None)

    sorted_resid = np.sort(std_resid)
    theoretical = stats.norm.ppf(np.linspace(0.025, 0.975, n))

    return {
        "residuals": residuals.tolist(),
        "standardized_residuals": std_resid.tolist(),
        "fitted_values": y_pred.tolist(),
        "ict_values": x.tolist(),
        "cooks_distance": cooks_d.tolist(),
        "leverage": leverage,
        "qq_theoretical": theoretical.tolist(),
        "qq_sample": sorted_resid.tolist(),
    }
