import numpy as np
from .base import ScientificModel


class HomModel(ScientificModel):
    id = "hom"
    name = "Hom Model"
    description = "Power-law extension of Chick-Watson with time exponent"
    equation = "ln(N/N₀) = -k · Cⁿ · Tᵐ"
    x_variable = "ICT"

    @property
    def parameter_definitions(self):
        return [
            {"name": "k", "description": "Inactivation rate constant", "default": 0.1, "min": 1e-6, "max": 100.0},
            {"name": "n", "description": "Concentration exponent", "default": 1.0, "min": 0.1, "max": 5.0},
            {"name": "m", "description": "Time exponent", "default": 1.0, "min": 0.1, "max": 5.0},
        ]

    def predict(self, x, params):
        k, n, m = params
        x = np.asarray(x)
        return np.exp(-k * (x ** n) * (x ** (m - 1)))
