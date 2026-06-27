import numpy as np
from .base import ScientificModel


class FirstOrderICT(ScientificModel):
    id = "first_order_ict"
    name = "First-Order ICT"
    description = "Simple first-order decay model using Integrated Contact Time"
    equation = "N = N₀ · exp(-k · ICT)"
    x_variable = "ICT"

    @property
    def parameter_definitions(self):
        return [
            {"name": "k", "description": "Inactivation rate constant (L/mg·min)", "default": 0.1, "min": 1e-6, "max": 100.0}
        ]

    def predict(self, x, params):
        k = params[0]
        return np.exp(-k * np.asarray(x))
