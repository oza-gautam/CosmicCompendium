import numpy as np
from .base import ScientificModel


class ChickWatson(ScientificModel):
    id = "chick_watson"
    name = "Chick-Watson"
    description = "Log reduction proportional to disinfectant concentration and exposure time"
    equation = "ln(N/N₀) = -k · Cⁿ · T"
    x_variable = "ICT"

    @property
    def parameter_definitions(self):
        return [
            {"name": "k", "description": "Inactivation rate constant", "default": 0.1, "min": 1e-6, "max": 100.0},
            {"name": "n", "description": "Concentration exponent (dilution coefficient)", "default": 1.0, "min": 0.1, "max": 5.0},
        ]

    def predict(self, x, params):
        k, n = params
        x = np.asarray(x)
        return np.exp(-k * (x ** n))
