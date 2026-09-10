import os
import pytest
import json
from pathlib import Path

from backend.ml.train import train_model, load_model, NUMERICAL_FEATURES
from backend.ml.predict import predict_anomaly, get_model_info, AnomalyResult
from backend.database.connection import get_db
from backend.database.models import Wallet


MODEL_PATH = Path(__file__).parent.parent / "models" / "wallet_anomaly_model.joblib"
CONFIG_PATH = Path(__file__).parent.parent / "models" / "wallet_anomaly_feature_config.json"


@pytest.fixture(scope="module")
def trained_model():
    if MODEL_PATH.exists():
        MODEL_PATH.unlink()
    if CONFIG_PATH.exists():
        CONFIG_PATH.unlink()

    results = train_model(contamination=0.1, n_estimators=50, random_state=42)
    yield results

    if MODEL_PATH.exists():
        MODEL_PATH.unlink()
    if CONFIG_PATH.exists():
        CONFIG_PATH.unlink()


def test_train_model_creates_files(trained_model):
    assert MODEL_PATH.exists(), "Model file not created"
    assert CONFIG_PATH.exists(), "Config file not created"


def test_train_model_returns_expected_structure(trained_model):
    assert trained_model["status"] == "success"
    assert "model_path" in trained_model
    assert "config_path" in trained_model
    assert "training_samples" in trained_model
    assert "anomalies_detected" in trained_model
    assert "anomaly_rate" in trained_model
    assert "score_range" in trained_model
    assert "config" in trained_model

    assert trained_model["training_samples"] > 10
    assert 0 <= trained_model["anomaly_rate"] <= 1
    assert len(trained_model["score_range"]) == 2


def test_train_model_config_saved(trained_model):
    config = trained_model["config"]
    assert config["feature_names"] == NUMERICAL_FEATURES
    assert config["numerical_features"] == NUMERICAL_FEATURES
    assert config["contamination"] == 0.1
    assert config["n_estimators"] == 50
    assert config["random_state"] == 42
    assert config["n_training_samples"] == trained_model["training_samples"]
    assert "trained_at" in config
    assert "feature_means" in config
    assert "feature_stds" in config


def test_load_model(trained_model):
    pipeline, config = load_model()
    assert pipeline is not None
    assert config is not None
    assert config.n_training_samples == trained_model["training_samples"]


def test_predict_anomaly_normal_wallet(trained_model):
    with get_db() as db:
        wallet = db.query(Wallet).filter(Wallet.dominant_label == "normal").order_by(Wallet.transaction_count.desc()).first()
        assert wallet is not None
        wallet_address = wallet.wallet_address

    result = predict_anomaly(wallet_address)

    assert isinstance(result, AnomalyResult)
    assert result.wallet_address == wallet_address
    assert isinstance(result.is_anomaly, bool)
    assert isinstance(result.anomaly_score, float)
    assert isinstance(result.threshold, float)
    assert result.model_version.startswith("isolation_forest_v1_")
    assert len(result.features_used) == len(NUMERICAL_FEATURES)
    assert all(k in result.features_used for k in NUMERICAL_FEATURES)


def test_predict_anomaly_rapid_wallet(trained_model):
    with get_db() as db:
        wallet = db.query(Wallet).filter(Wallet.dominant_label == "rapid_transfer").order_by(Wallet.transaction_count.desc()).first()
        assert wallet is not None
        wallet_address = wallet.wallet_address

    result = predict_anomaly(wallet_address)

    assert result.wallet_address == wallet_address
    assert isinstance(result.is_anomaly, bool)
    assert isinstance(result.anomaly_score, float)


def test_predict_anomaly_anomalous_wallet(trained_model):
    with get_db() as db:
        wallet = db.query(Wallet).filter(Wallet.dominant_label == "anomalous").order_by(Wallet.transaction_count.desc()).first()
        assert wallet is not None
        wallet_address = wallet.wallet_address

    result = predict_anomaly(wallet_address)

    assert result.wallet_address == wallet_address
    assert isinstance(result.is_anomaly, bool)
    assert isinstance(result.anomaly_score, float)


def test_predict_unknown_wallet():
    if not MODEL_PATH.exists():
        train_model(contamination=0.1, n_estimators=50, random_state=42)

    with pytest.raises(ValueError, match="Wallet not found"):
        predict_anomaly("nonexistent_wallet_address")


def test_get_model_info(trained_model):
    info = get_model_info()

    assert info["model_version"].startswith("isolation_forest_v1_")
    assert info["trained_at"] == trained_model["config"]["trained_at"]
    assert info["training_samples"] == trained_model["training_samples"]
    assert info["contamination"] == 0.1
    assert info["n_estimators"] == 50
    assert info["features"] == NUMERICAL_FEATURES
    assert "model_path" in info


def test_model_persistence():
    # This test verifies model can be retrained with different params
    results1 = train_model(contamination=0.15, n_estimators=100, random_state=123)
    
    pipeline, config = load_model()
    assert config.contamination == 0.15
    assert config.n_estimators == 100
    assert config.random_state == 123

    # Restore original model for other tests
    train_model(contamination=0.1, n_estimators=50, random_state=42)


def test_feature_values_are_finite(trained_model):
    with get_db() as db:
        wallet = db.query(Wallet).filter(Wallet.transaction_count > 0).first()
        wallet_address = wallet.wallet_address

    result = predict_anomaly(wallet_address)

    for feat, value in result.features_used.items():
        assert not (isinstance(value, float) and (value != value or value == float('inf') or value == float('-inf'))), f"Non-finite value for {feat}: {value}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])