from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple
import numpy as np


class ScientificModel(ABC):
    id: str
    name: str
    description: str
    equation: str
    x_variable: str = "ICT"

    @property
    @abstractmethod
    def parameter_definitions(self) -> List[Dict[str, Any]]:
        """Return list of {name, description, default, min, max}."""
        ...

    @abstractmethod
    def predict(self, x: np.ndarray, params: List[float]) -> np.ndarray:
        """Predict N/N0 (survival fraction) given x values and parameters."""
        ...

    def initial_guess(self, x: np.ndarray, y: np.ndarray) -> List[float]:
        return [p["default"] for p in self.parameter_definitions]

    def bounds(self, x: np.ndarray, y: np.ndarray) -> Tuple[List[float], List[float]]:
        lower = [p["min"] for p in self.parameter_definitions]
        upper = [p["max"] for p in self.parameter_definitions]
        return lower, upper

    def predict_counts(self, x: np.ndarray, params: List[float], n0: float) -> np.ndarray:
        return n0 * self.predict(x, params)
