import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.connection import get_db
from backend.database.models import Wallet


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def train_model_fixture(client):
    """Train model once for all tests that need it."""
    response = client.post("/api/ml/train", params={"contamination": 0.1, "n_estimators": 50, "random_state": 42})
    assert response.status_code == 200
    yield


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


def test_investigate_endpoint_structure(client, normal_wallet):
    assert normal_wallet is not None
    
    response = client.get(f"/api/investigate/{normal_wallet}")
    assert response.status_code == 200
    
    result = response.json()
    required_keys = ["wallet", "statistics", "features", "anomaly", "risk", "graph", "recent_transactions"]
    for key in required_keys:
        assert key in result


def test_investigate_normal_wallet(client, normal_wallet):
    assert normal_wallet is not None
    
    response = client.get(f"/api/investigate/{normal_wallet}")
    assert response.status_code == 200
    
    result = response.json()
    
    assert "wallet" in result
    assert result["wallet"]["wallet_address"] == normal_wallet
    assert "statistics" in result
    assert "features" in result
    assert "anomaly" in result
    assert "risk" in result
    assert "graph" in result
    assert "recent_transactions" in result
    
    assert result["wallet"]["transaction_count"] > 0
    assert result["statistics"]["total_transactions"] == result["wallet"]["transaction_count"]
    assert isinstance(result["features"], dict)
    assert len(result["features"]) > 20
    assert "is_anomaly" in result["anomaly"]
    assert "risk_score" in result["risk"]
    assert "risk_level" in result["risk"]
    assert isinstance(result["graph"]["nodes"], list)
    assert isinstance(result["graph"]["edges"], list)
    assert isinstance(result["recent_transactions"], list)


def test_investigate_rapid_wallet(client, rapid_wallet):
    assert rapid_wallet is not None
    
    response = client.get(f"/api/investigate/{rapid_wallet}")
    assert response.status_code == 200
    
    result = response.json()
    
    assert result["wallet"]["wallet_address"] == rapid_wallet
    assert result["wallet"]["dominant_label"] == "rapid_transfer"
    assert result["risk"]["risk_score"] >= 0
    assert result["risk"]["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    
    assert result["wallet"]["wallet_address"] == rapid_wallet
    assert result["wallet"]["dominant_label"] == "rapid_transfer"
    assert result["risk"]["risk_score"] >= 0
    assert result["risk"]["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def test_investigate_anomalous_wallet(client, anomalous_wallet):
    assert anomalous_wallet is not None
    
    response = client.get(f"/api/investigate/{anomalous_wallet}")
    assert response.status_code == 200
    
    result = response.json()
    
    assert result["wallet"]["wallet_address"] == anomalous_wallet
    assert result["wallet"]["dominant_label"] == "anomalous"


def test_investigate_graph_params(client, normal_wallet):
    assert normal_wallet is not None
    
    response = client.get(f"/api/investigate/{normal_wallet}?graph_depth=1&graph_max_nodes=100")
    assert response.status_code == 200
    
    result = response.json()
    assert result["graph"]["depth"] == 1
    assert len(result["graph"]["nodes"]) <= 100


def test_investigate_recent_tx_limit(client, normal_wallet):
    assert normal_wallet is not None
    
    response = client.get(f"/api/investigate/{normal_wallet}?recent_tx_limit=5")
    assert response.status_code == 200
    
    result = response.json()
    assert len(result["recent_transactions"]) <= 5


def test_investigate_unknown_wallet(client):
    response = client.get("/api/investigate/nonexistent_wallet_address")
    assert response.status_code == 404


def test_investigate_feature_completeness(client, normal_wallet):
    assert normal_wallet is not None
    
    response = client.get(f"/api/investigate/{normal_wallet}")
    assert response.status_code == 200
    
    result = response.json()
    
    expected_features = [
        "transaction_count", "incoming_count", "outgoing_count",
        "total_received", "total_sent", "average_transaction_amount",
        "maximum_transaction_amount", "transaction_frequency",
        "active_days", "average_time_between_transactions", "transaction_burst_score",
        "unique_counterparties", "incoming_counterparties", "outgoing_counterparties",
        "incoming_outgoing_ratio", "rapid_transfer_ratio", "multi_hop_connections",
        "degree", "in_degree", "out_degree", "clustering_coefficient", "connected_component_size",
    ]
    
    for feat in expected_features:
        assert feat in result["features"], f"Missing feature: {feat}"


def test_investigate_anomaly_has_model_info(client, normal_wallet):
    assert normal_wallet is not None
    
    response = client.get(f"/api/investigate/{normal_wallet}")
    assert response.status_code == 200
    
    result = response.json()
    
    if "error" not in result["anomaly"]:
        assert "is_anomaly" in result["anomaly"]
        assert "anomaly_score" in result["anomaly"]
        assert "threshold" in result["anomaly"]
        assert "model_version" in result["anomaly"]
        assert "model_trained_at" in result["anomaly"]


def test_investigate_risk_has_breakdown(client, normal_wallet):
    assert normal_wallet is not None
    
    response = client.get(f"/api/investigate/{normal_wallet}")
    assert response.status_code == 200
    
    result = response.json()
    
    assert "risk_score" in result["risk"]
    assert "risk_level" in result["risk"]
    assert "reasons" in result["risk"]
    assert "factor_breakdown" in result["risk"]
    assert len(result["risk"]["factor_breakdown"]) == 6
    
    for factor in result["risk"]["factor_breakdown"]:
        assert "factor" in factor
        assert "raw_score" in factor
        assert "weight" in factor
        assert "weighted_contribution" in factor
        assert "explanation" in factor
        assert "feature_values" in factor


def test_investigate_graph_has_stats(client, normal_wallet):
    assert normal_wallet is not None
    
    response = client.get(f"/api/investigate/{normal_wallet}")
    assert response.status_code == 200
    
    result = response.json()
    
    assert "center_wallet" in result["graph"]
    assert "depth" in result["graph"]
    assert "nodes" in result["graph"]
    assert "edges" in result["graph"]
    assert "stats" in result["graph"]
    assert "total_nodes" in result["graph"]["stats"]
    assert "total_edges" in result["graph"]["stats"]
    assert "density" in result["graph"]["stats"]


def test_investigate_recent_transactions_structure(client, normal_wallet):
    assert normal_wallet is not None
    
    response = client.get(f"/api/investigate/{normal_wallet}")
    assert response.status_code == 200
    
    result = response.json()
    
    for tx in result["recent_transactions"]:
        assert "id" in tx
        assert "txid" in tx
        assert "timestamp" in tx
        assert "input_wallet" in tx
        assert "output_wallet" in tx
        assert "input_amount" in tx
        assert "output_amount" in tx
        assert "fee" in tx
        assert "wallet_label" in tx


if __name__ == "__main__":
    pytest.main([__file__, "-v"])