import numpy as np
from .base import ScientificModel


class WeibullModel(ScientificModel):
    id = "weibull"
    name = "Weibull"
    description = "Captures non-linear (sigmoidal/shouldered) microbial survival curves"
    equation = "ln(N/N₀) = -(ICT/δ)^p"
    x_variable = "ICT"

    @property
    def parameter_definitions(self):
        return [
            {"name": "delta", "description": "Scale parameter (δ) — ICT at first log reduction", "default": 5.0, "min": 1e-4, "max": 1000.0},
            {"name": "p", "description": "Shape parameter — p<1 concave, p>1 convex", "default": 1.0, "min": 0.1, "max": 10.0},
        ]

    def predict(self, x, params):
        delta, p = params
        x = np.asarray(x)
        return np.exp(-((x / delta) ** p))
