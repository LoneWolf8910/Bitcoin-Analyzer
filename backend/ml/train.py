import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path

from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import RobustScaler
from sklearn.pipeline import Pipeline

from backend.database.connection import get_db
from backend.database.models import Wallet
from backend.services.feature_engineering import extract_wallet_features, FEATURE_DESCRIPTIONS


MODEL_DIR = Path(__file__).parent.parent.parent / "models"
MODEL_PATH = MODEL_DIR / "wallet_anomaly_model.joblib"
FEATURE_CONFIG_PATH = MODEL_DIR / "wallet_anomaly_feature_config.json"

NUMERICAL_FEATURES = [
    "transaction_count",
    "incoming_count",
    "outgoing_count",
    "total_received",
    "total_sent",
    "average_transaction_amount",
    "maximum_transaction_amount",
    "transaction_frequency",
    "active_days",
    "average_time_between_transactions",
    "transaction_burst_score",
    "unique_counterparties",
    "incoming_counterparties",
    "outgoing_counterparties",
    "incoming_outgoing_ratio",
    "rapid_transfer_ratio",
    "multi_hop_connections",
    "degree",
    "in_degree",
    "out_degree",
    "clustering_coefficient",
    "connected_component_size",
]


@dataclass
class ModelConfig:
    feature_names: List[str]
    numerical_features: List[str]
    contamination: float
    n_estimators: int
    max_samples: str
    random_state: int
    trained_at: str
    n_training_samples: int
    feature_means: Dict[str, float]
    feature_stds: Dict[str, float]


def load_training_data() -> Tuple[pd.DataFrame, List[str]]:
    with get_db() as db:
        wallets = db.query(Wallet).filter(Wallet.transaction_count > 0).all()
        wallet_addresses = [w.wallet_address for w in wallets]

    print(f"Loading features for {len(wallet_addresses)} wallets...")

    features_list = []
    valid_addresses = []

    for addr in wallet_addresses:
        try:
            features = extract_wallet_features(addr)
            numerical = {k: features[k] for k in NUMERICAL_FEATURES if k in features}
            
            clean_numerical = {}
            for k, v in numerical.items():
                if v is None:
                    clean_numerical[k] = 0.0
                elif isinstance(v, float) and (np.isnan(v) or np.isinf(v)):
                    clean_numerical[k] = 0.0
                else:
                    clean_numerical[k] = float(v)
            
            features_list.append(clean_numerical)
            valid_addresses.append(addr)
        except Exception as e:
            print(f"Warning: Failed to extract features for {addr}: {e}")
            continue

    df = pd.DataFrame(features_list, index=valid_addresses)
    df = df[NUMERICAL_FEATURES]
    
    print(f"Training data shape: {df.shape}")
    print(f"Features: {list(df.columns)}")
    
    return df, valid_addresses


def create_pipeline(contamination: float = 0.1, n_estimators: int = 200, random_state: int = 42) -> Pipeline:
    pipeline = Pipeline([
        ("scaler", RobustScaler()),
        ("model", IsolationForest(
            contamination=contamination,
            n_estimators=n_estimators,
            max_samples="auto",
            random_state=random_state,
            n_jobs=-1,
            verbose=0,
        )),
    ])
    return pipeline


def train_model(
    contamination: float = 0.1,
    n_estimators: int = 200,
    random_state: int = 42,
) -> Dict[str, Any]:
    df, wallet_addresses = load_training_data()

    if len(df) < 10:
        raise ValueError(f"Insufficient training data: {len(df)} samples (need at least 10)")

    pipeline = create_pipeline(contamination, n_estimators, random_state)

    print("Training IsolationForest...")
    pipeline.fit(df)

    scores = pipeline.decision_function(df)
    predictions = pipeline.predict(df)
    anomaly_scores = -scores

    n_anomalies = sum(p == -1 for p in predictions)
    anomaly_rate = n_anomalies / len(predictions)

    print(f"Training complete:")
    print(f"  Total samples: {len(df)}")
    print(f"  Anomalies detected: {n_anomalies} ({anomaly_rate:.2%})")
    print(f"  Score range: [{anomaly_scores.min():.4f}, {anomaly_scores.max():.4f}]")

    feature_means = df.mean().to_dict()
    feature_stds = df.std().to_dict()

    config = ModelConfig(
        feature_names=list(df.columns),
        numerical_features=NUMERICAL_FEATURES,
        contamination=contamination,
        n_estimators=n_estimators,
        max_samples="auto",
        random_state=random_state,
        trained_at=datetime.utcnow().isoformat(),
        n_training_samples=len(df),
        feature_means=feature_means,
        feature_stds=feature_stds,
    )

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Saving model to {MODEL_PATH}...")
    joblib.dump(pipeline, MODEL_PATH)

    print(f"Saving config to {FEATURE_CONFIG_PATH}...")
    with open(FEATURE_CONFIG_PATH, "w") as f:
        json.dump(asdict(config), f, indent=2)

    results = {
        "status": "success",
        "model_path": str(MODEL_PATH),
        "config_path": str(FEATURE_CONFIG_PATH),
        "training_samples": len(df),
        "anomalies_detected": int(n_anomalies),
        "anomaly_rate": anomaly_rate,
        "score_range": [float(anomaly_scores.min()), float(anomaly_scores.max())],
        "config": asdict(config),
    }

    return results


def load_model() -> Tuple[Pipeline, ModelConfig]:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Train first.")
    if not FEATURE_CONFIG_PATH.exists():
        raise FileNotFoundError(f"Config not found at {FEATURE_CONFIG_PATH}. Train first.")

    pipeline = joblib.load(MODEL_PATH)
    with open(FEATURE_CONFIG_PATH, "r") as f:
        config_dict = json.load(f)
    config = ModelConfig(**config_dict)

    return pipeline, config


if __name__ == "__main__":
    results = train_model()
    print(json.dumps(results, indent=2))