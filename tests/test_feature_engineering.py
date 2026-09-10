import pytest
from backend.services.feature_engineering import (
    extract_wallet_features, 
    safe_divide, 
    FEATURE_DESCRIPTIONS
)
from backend.database.connection import get_db
from backend.database.models import Wallet


@pytest.fixture
def normal_wallet():
    with get_db() as db:
        wallet = db.query(Wallet).filter(Wallet.dominant_label == 'normal').order_by(Wallet.transaction_count.desc()).first()
        return wallet.wallet_address if wallet else None


@pytest.fixture
def rapid_wallet():
    with get_db() as db:
        wallet = db.query(Wallet).filter(Wallet.dominant_label == 'rapid_transfer').order_by(Wallet.transaction_count.desc()).first()
        return wallet.wallet_address if wallet else None


@pytest.fixture
def anomalous_wallet():
    with get_db() as db:
        wallet = db.query(Wallet).filter(Wallet.dominant_label == 'anomalous').order_by(Wallet.transaction_count.desc()).first()
        return wallet.wallet_address if wallet else None


def test_safe_divide():
    assert safe_divide(10, 2) == 5.0
    assert safe_divide(10, 0) == 0.0
    assert safe_divide(10, 0, default=-1) == -1
    assert safe_divide(0, 10) == 0.0


def test_extract_features_normal_wallet(normal_wallet):
    assert normal_wallet is not None
    
    features = extract_wallet_features(normal_wallet)
    
    assert features["wallet_address"] == normal_wallet
    assert features["transaction_count"] > 0
    assert features["incoming_count"] + features["outgoing_count"] == features["transaction_count"]
    assert features["total_received"] >= 0
    assert features["total_sent"] >= 0
    assert features["average_transaction_amount"] >= 0
    assert features["maximum_transaction_amount"] >= features["average_transaction_amount"]
    assert features["active_days"] >= 1
    assert features["unique_counterparties"] > 0
    assert features["incoming_counterparties"] + features["outgoing_counterparties"] >= features["unique_counterparties"]
    assert features["rapid_transfer_ratio"] == 0.0
    assert features["degree"] > 0
    assert features["clustering_coefficient"] >= 0
    assert features["dominant_label"] == "normal"


def test_extract_features_rapid_wallet(rapid_wallet):
    assert rapid_wallet is not None
    
    features = extract_wallet_features(rapid_wallet)
    
    assert features["wallet_address"] == rapid_wallet
    assert features["transaction_count"] > 0
    assert features["rapid_transfer_ratio"] == 1.0
    assert features["dominant_label"] == "rapid_transfer"


def test_extract_features_anomalous_wallet(anomalous_wallet):
    assert anomalous_wallet is not None
    
    features = extract_wallet_features(anomalous_wallet)
    
    assert features["wallet_address"] == anomalous_wallet
    assert features["dominant_label"] == "anomalous"


def test_feature_completeness(normal_wallet):
    assert normal_wallet is not None
    
    features = extract_wallet_features(normal_wallet)
    
    expected_features = [
        "wallet_address",
        "transaction_count", "incoming_count", "outgoing_count",
        "total_received", "total_sent", "average_transaction_amount", 
        "maximum_transaction_amount", "transaction_frequency",
        "active_days", "average_time_between_transactions", "transaction_burst_score",
        "unique_counterparties", "incoming_counterparties", "outgoing_counterparties",
        "incoming_outgoing_ratio", "rapid_transfer_ratio", "multi_hop_connections",
        "degree", "in_degree", "out_degree", "clustering_coefficient", 
        "connected_component_size",
        "dominant_label", "first_seen", "last_seen"
    ]
    
    for feat in expected_features:
        assert feat in features, f"Missing feature: {feat}"


def test_feature_descriptions_complete(normal_wallet):
    assert normal_wallet is not None
    
    features = extract_wallet_features(normal_wallet)
    for feat in features:
        assert feat in FEATURE_DESCRIPTIONS, f"Missing description for feature: {feat}"


def test_invalid_wallet():
    with pytest.raises(ValueError, match="Wallet not found"):
        extract_wallet_features("nonexistent_wallet_address")


def test_no_transactions_wallet():
    with get_db() as db:
        wallet = db.query(Wallet).filter(Wallet.transaction_count == 0).first()
        if wallet:
            features = extract_wallet_features(wallet.wallet_address)
            assert features["transaction_count"] == 0
            assert features["incoming_count"] == 0
            assert features["outgoing_count"] == 0
            assert features["total_received"] == 0.0
            assert features["total_sent"] == 0.0


def test_deterministic_features(normal_wallet):
    assert normal_wallet is not None
    
    features1 = extract_wallet_features(normal_wallet)
    features2 = extract_wallet_features(normal_wallet)
    
    assert features1 == features2


def test_edge_cases():
    assert safe_divide(5, 0, default=float('inf')) == float('inf')
    assert safe_divide(0, 0, default=999) == 999


if __name__ == "__main__":
    pytest.main([__file__, "-v"])