from typing import Dict
from .models.base import ScientificModel
from .models.traditional_ct import TraditionalCT
from .models.first_order_ict import FirstOrderICT
from .models.chick_watson import ChickWatson
from .models.hom import HomModel
from .models.weibull import WeibullModel
from .models.biphasic import BiphasicModel
from .models.two_population import TwoPopulationICT

_REGISTRY: Dict[str, ScientificModel] = {}


def _register(model: ScientificModel):
    _REGISTRY[model.id] = model


_register(TraditionalCT())
_register(FirstOrderICT())
_register(ChickWatson())
_register(HomModel())
_register(WeibullModel())
_register(BiphasicModel())
_register(TwoPopulationICT())


def get_model(model_id: str) -> ScientificModel:
    if model_id not in _REGISTRY:
        raise ValueError(f"Unknown model: {model_id}")
    return _REGISTRY[model_id]


def list_models():
    return list(_REGISTRY.values())
