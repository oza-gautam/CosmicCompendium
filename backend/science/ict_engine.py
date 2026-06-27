import numpy as np
from typing import List, Tuple


def compute_ict(times: List[float], concentrations: List[float]) -> List[float]:
    """Compute cumulative ICT at each time point using trapezoidal integration."""
    times = np.array(times, dtype=float)
    concs = np.array(concentrations, dtype=float)

    order = np.argsort(times)
    times = times[order]
    concs = concs[order]

    ict = np.zeros(len(times))
    for i in range(1, len(times)):
        dt = times[i] - times[i - 1]
        avg_c = (concs[i] + concs[i - 1]) / 2.0
        ict[i] = ict[i - 1] + avg_c * dt

    inverse = np.argsort(order)
    return ict[inverse].tolist()
