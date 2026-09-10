import json
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path

import numpy as np
import joblib

from backend.ml.train import NUMERICAL_FEATURES
from backend.services.feature_engineering import extract_wallet_features
from backend.ml.train import load_model, ModelConfig


@dataclass
class AnomalyResult:
    wallet_address: str
    is_anomaly: bool
    anomaly_score: float
    threshold: float
    model_version: str
    model_trained_at: str
    features_used: Dict[str, float]
    feature_descriptions: Dict[str, str]


def predict_anomaly(wallet_address: str) -> AnomalyResult:
    pipeline, config = load_model()

    features = extract_wallet_features(wallet_address)

    feature_vector = []
    features_used = {}
    for feat_name in config.feature_names:
        value = features.get(feat_name, 0.0)
        if value is None:
            value = 0.0
        if isinstance(value, float) and (np.isnan(value) or np.isinf(value)):
            value = 0.0
        feature_vector.append(float(value))
        features_used[feat_name] = float(value)

    X = np.array(feature_vector).reshape(1, -1)

    score = pipeline.decision_function(X)[0]
    prediction = pipeline.predict(X)[0]

    anomaly_score = -score
    is_anomaly = prediction == -1

    threshold = -pipeline.named_steps["model"].offset_ if hasattr(pipeline.named_steps["model"], "offset_") else 0.0

    return AnomalyResult(
        wallet_address=wallet_address,
        is_anomaly=bool(is_anomaly),
        anomaly_score=float(anomaly_score),
        threshold=float(threshold),
        model_version=f"isolation_forest_v1_{config.random_state}",
        model_trained_at=config.trained_at,
        features_used=features_used,
        feature_descriptions={
            k: v for k, v in __import__("backend.services.feature_engineering", fromlist=["FEATURE_DESCRIPTIONS"]).FEATURE_DESCRIPTIONS.items()
            if k in config.feature_names
        },
    )


def get_model_info() -> Dict[str, Any]:
    _, config = load_model()
    return {
        "model_version": f"isolation_forest_v1_{config.random_state}",
        "trained_at": config.trained_at,
        "training_samples": config.n_training_samples,
        "contamination": config.contamination,
        "n_estimators": config.n_estimators,
        "features": config.feature_names,
        "model_path": str(Path(__file__).parent.parent.parent / "models" / "wallet_anomaly_model.joblib"),
    }


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        wallet = sys.argv[1]
        result = predict_anomaly(wallet)
        print(json.dumps(asdict(result), indent=2))
    else:
        info = get_model_info()
        print(json.dumps(info, indent=2))