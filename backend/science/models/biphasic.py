import numpy as np
from .base import ScientificModel


class BiphasicModel(ScientificModel):
    id = "biphasic"
    name = "Biphasic"
    description = "Two first-order decay populations (sensitive + resistant sub-populations)"
    equation = "N/N₀ = f·exp(-k1·ICT) + (1-f)·exp(-k2·ICT)"
    x_variable = "ICT"

    @property
    def parameter_definitions(self):
        return [
            {"name": "f", "description": "Fraction of sensitive population", "default": 0.9, "min": 0.01, "max": 0.99},
            {"name": "k1", "description": "Inactivation rate of sensitive population (L/mg·min)", "default": 1.0, "min": 1e-6, "max": 100.0},
            {"name": "k2", "description": "Inactivation rate of resistant population (L/mg·min)", "default": 0.05, "min": 1e-6, "max": 100.0},
        ]

    def predict(self, x, params):
        f, k1, k2 = params
        x = np.asarray(x)
        return f * np.exp(-k1 * x) + (1 - f) * np.exp(-k2 * x)
