"""Optional XGBoost priority model with a deterministic demo fallback."""
from __future__ import annotations

from typing import Any

try:
    from xgboost import XGBRegressor
except ImportError:
    XGBRegressor = None

_MODEL = None


def _features(values: dict[str, float]) -> list[float]:
    return [
        values.get("severity", 0),
        values.get("exposure", 0),
        values.get("location", 0),
        values.get("recurrence", 0),
        values.get("weather", 0),
        values.get("frequency", 0),
    ]


def _demo_fallback(values: dict[str, float]) -> float:
    return min(100.0, sum(_features(values)))


def predict(values: dict[str, float], category: str = "", exposure_context: str = "") -> dict[str, Any]:
    """Return a model score and label; train a tiny synthetic model only when available.

    The synthetic fit keeps this prototype self-contained. Production training should
    replace it with validated historical outcomes and persisted model artifacts.
    """
    global _MODEL
    fallback_score = _demo_fallback(values)
    model_name = "xgboost-demo-fallback"
    score = fallback_score

    if XGBRegressor is not None:
        try:
            if _MODEL is None:
                training = [
                    [6, 8, 8, 0, 2, 1], [14, 14, 8, 4, 2, 2],
                    [22, 16, 12, 8, 5, 4], [30, 20, 18, 12, 8, 5],
                    [30, 20, 20, 15, 10, 5],
                ]
                targets = [22, 42, 61, 82, 96]
                _MODEL = XGBRegressor(
                    n_estimators=24, max_depth=2, learning_rate=0.08,
                    objective="reg:squarederror", random_state=7,
                    n_jobs=1, verbosity=0,
                )
                _MODEL.fit(training, targets)
            score = float(_MODEL.predict([_features(values)])[0])
            model_name = "xgboost-demo"
        except Exception:
            score = fallback_score

    # Hard safety floor: dangerous open manholes and electrical hazards cannot be downgraded.
    if category == "manhole" and exposure_context in {"school", "hospital", "high_pedestrian"}:
        score = max(score, 82.0)
    if category == "electrical_hazard":
        score = max(score, 80.0)

    score = round(max(0.0, min(100.0, score)), 1)
    label = "P1" if score >= 80 else "P2" if score >= 60 else "P3" if score >= 40 else "P4"
    return {"score": score, "priority": label, "model": model_name}
