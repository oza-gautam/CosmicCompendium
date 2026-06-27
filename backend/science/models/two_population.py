import numpy as np
from .base import ScientificModel


class TwoPopulationICT(ScientificModel):
    id = "two_population_ict"
    name = "Two-Population ICT"
    description = "Two sub-populations with distinct ICT-based inactivation kinetics; dominant population uses power-law ICT"
    equation = "N/N₀ = (1-β)·exp(-kd·ICTᵐ) + β·exp(-kp·ICT)"
    x_variable = "ICT"

    @property
    def parameter_definitions(self):
        return [
            {"name": "beta", "description": "Fraction of persistent/resistant population (β)", "default": 0.15, "min": 0.001, "max": 0.999},
            {"name": "kd",   "description": "Inactivation rate of dominant population (kd)",        "default": 0.5,  "min": 1e-6,  "max": 100.0},
            {"name": "kp",   "description": "Inactivation rate of persistent population (kp)",       "default": 0.05, "min": 1e-6,  "max": 100.0},
            {"name": "m",    "description": "Power-law exponent for dominant population (m)",         "default": 1.0,  "min": 0.1,   "max": 5.0},
        ]

    def predict(self, x, params):
        beta, kd, kp, m = params
        x = np.asarray(x, dtype=float)
        dominant  = (1 - beta) * np.exp(-kd * np.power(np.maximum(x, 0), m))
        persistent = beta * np.exp(-kp * x)
        return np.clip(dominant + persistent, 1e-15, None)

    def initial_guess(self, x, y):
        """
        Data-driven initial guess that handles both:
          - Fast-kill curves (set1/set2): large kd, small beta
          - Slow/resistant curves (set3): small kd, large beta
        """
        y = np.asarray(y, dtype=float)
        x = np.asarray(x, dtype=float)

        # Survival at last time point estimates persistent fraction
        y_end = float(np.min(y))
        beta0 = float(np.clip(y_end * 1.5, 0.01, 0.90))

        # Estimate kd from the initial steep drop (first non-zero ICT)
        nz = x > 0
        if np.any(nz):
            x1 = x[nz][0]
            y1 = float(y[nz][0])
            dominant_frac = max(y1 - beta0, 1e-6)
            dominant_remaining = max(dominant_frac / (1 - beta0), 1e-10)
            kd0 = float(-np.log(dominant_remaining) / max(x1, 1e-6))
            kd0 = float(np.clip(kd0, 1e-4, 50.0))
        else:
            kd0 = 0.5

        # kp from long-term tail
        kp0 = float(np.clip(0.05 * kd0, 1e-5, 1.0))

        # m: start at 1 (linear), optimizer will refine
        m0 = 1.0

        return [beta0, kd0, kp0, m0]
