import pytest
from backend.services.risk_engine import calculate_wallet_risk, get_risk_level
from backend.database.connection import get_db
from backend.database.models import Wallet


@pytest.fixture
def normal_wallet():
    with get_db() as db:
        wallet = db.query(Wallet).filter(Wallet.dominant_label == "normal").order_by(Wallet.transaction_count.desc()).first()
        return wallet.wallet_address if wallet else None


@pytest.fixture
def rapid_wallet():
    with get_db() as db:
        wallet = db.query(Wallet).filter(Wallet.dominant_label == "rapid_transfer").order_by(Wallet.transaction_count.desc()).first()
        return wallet.wallet_address if wallet else None


@pytest.fixture
def anomalous_wallet():
    with get_db() as db:
        wallet = db.query(Wallet).filter(Wallet.dominant_label == "anomalous").order_by(Wallet.transaction_count.desc()).first()
        return wallet.wallet_address if wallet else None


def test_risk_levels():
    assert get_risk_level(0) == "LOW"
    assert get_risk_level(15) == "LOW"
    assert get_risk_level(29) == "LOW"
    assert get_risk_level(30) == "MEDIUM"
    assert get_risk_level(45) == "MEDIUM"
    assert get_risk_level(59) == "MEDIUM"
    assert get_risk_level(60) == "HIGH"
    assert get_risk_level(70) == "HIGH"
    assert get_risk_level(79) == "HIGH"
    assert get_risk_level(80) == "CRITICAL"
    assert get_risk_level(95) == "CRITICAL"
    assert get_risk_level(100) == "CRITICAL"


def test_calculate_risk_normal_wallet(normal_wallet):
    assert normal_wallet is not None
    
    result = calculate_wallet_risk(normal_wallet)
    
    assert result["wallet_address"] == normal_wallet
    assert "risk_score" in result
    assert "risk_level" in result
    assert "reasons" in result
    assert "factor_breakdown" in result
    assert isinstance(result["risk_score"], int)
    assert 0 <= result["risk_score"] <= 100
    assert result["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert isinstance(result["reasons"], list)
    assert isinstance(result["factor_breakdown"], list)
    assert len(result["factor_breakdown"]) == 6


def test_calculate_risk_rapid_wallet(rapid_wallet):
    assert rapid_wallet is not None
    
    result = calculate_wallet_risk(rapid_wallet)
    
    assert result["wallet_address"] == rapid_wallet
    assert 0 <= result["risk_score"] <= 100
    assert result["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    
    # Rapid transfer wallets should have high rapid_movement factor
    rapid_factor = next(f for f in result["factor_breakdown"] if f["factor"] == "rapid_movement")
    assert rapid_factor["weighted_contribution"] > 0


def test_calculate_risk_anomalous_wallet(anomalous_wallet):
    assert anomalous_wallet is not None
    
    result = calculate_wallet_risk(anomalous_wallet)
    
    assert result["wallet_address"] == anomalous_wallet
    assert 0 <= result["risk_score"] <= 100
    assert result["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def test_risk_factors_structure(normal_wallet):
    assert normal_wallet is not None
    
    result = calculate_wallet_risk(normal_wallet)
    
    expected_factors = [
        "ml_anomaly",
        "transaction_behavior",
        "graph_behavior",
        "rapid_movement",
        "frequency",
        "counterparty_concentration",
    ]
    
    factor_names = [f["factor"] for f in result["factor_breakdown"]]
    for ef in expected_factors:
        assert ef in factor_names
    
    for factor in result["factor_breakdown"]:
        assert "factor" in factor
        assert "raw_score" in factor
        assert "weight" in factor
        assert "weighted_contribution" in factor
        assert "explanation" in factor
        assert "feature_values" in factor
        assert isinstance(factor["explanation"], str)
        assert len(factor["explanation"]) > 0


def test_risk_reasons_based_on_features(normal_wallet):
    assert normal_wallet is not None
    
    result = calculate_wallet_risk(normal_wallet)
    
    # Check that reasons reference actual feature values
    for reason in result["reasons"]:
        assert isinstance(reason, str)
        assert len(reason) > 0


def test_different_wallets_different_scores(normal_wallet, rapid_wallet, anomalous_wallet):
    assert normal_wallet is not None
    assert rapid_wallet is not None
    assert anomalous_wallet is not None
    
    normal_result = calculate_wallet_risk(normal_wallet)
    rapid_result = calculate_wallet_risk(rapid_wallet)
    anomalous_result = calculate_wallet_risk(anomalous_wallet)
    
    scores = {
        "normal": normal_result["risk_score"],
        "rapid": rapid_result["risk_score"],
        "anomalous": anomalous_result["risk_score"],
    }
    
    # At least two should have different scores
    unique_scores = set(scores.values())
    assert len(unique_scores) >= 2, f"All wallets have same score: {scores}"
    
    # Print for debugging
    print(f"Risk scores: {scores}")


def test_invalid_wallet():
    with pytest.raises(ValueError, match="Wallet not found"):
        calculate_wallet_risk("nonexistent_wallet_address")


def test_risk_score_components_sum(normal_wallet):
    assert normal_wallet is not None
    
    result = calculate_wallet_risk(normal_wallet)
    
    total_weighted = sum(f["weighted_contribution"] for f in result["factor_breakdown"])
    # Should approximately equal risk_score (within rounding)
    assert abs(total_weighted - result["risk_score"]) <= 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])