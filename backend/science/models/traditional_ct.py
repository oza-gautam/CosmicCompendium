import numpy as np
from .base import ScientificModel


class TraditionalCT(ScientificModel):
    id = "traditional_ct"
    name = "Traditional CT"
    description = "First-order decay model using CT (concentration × time)"
    equation = "N = N₀ · exp(-k · C · T)"
    x_variable = "CT"

    @property
    def parameter_definitions(self):
        return [
            {"name": "k", "description": "Inactivation rate constant (L/mg·min)", "default": 0.1, "min": 1e-6, "max": 100.0}
        ]

    def predict(self, x, params):
        k = params[0]
        return np.exp(-k * np.asarray(x))
