import pytest
from backend.services.graph_service import get_wallet_graph, build_wallet_graph
from backend.database.connection import get_db
from backend.database.models import Wallet


@pytest.fixture
def test_wallet():
    with get_db() as db:
        wallet = db.query(Wallet).filter(Wallet.dominant_label == 'normal').order_by(Wallet.transaction_count.desc()).first()
        return wallet.wallet_address if wallet else None


def test_get_wallet_graph_basic(test_wallet):
    assert test_wallet is not None, "No test wallet found in database"

    result = get_wallet_graph(test_wallet, depth=1)

    assert "nodes" in result
    assert "edges" in result
    assert "center_wallet" in result
    assert "depth" in result
    assert "stats" in result

    assert result["center_wallet"] == test_wallet
    assert result["depth"] == 1
    assert len(result["nodes"]) > 1
    assert len(result["edges"]) > 0


def test_get_wallet_graph_depth_2(test_wallet):
    assert test_wallet is not None

    result = get_wallet_graph(test_wallet, depth=2)

    assert len(result["nodes"]) > 10
    assert result["depth"] == 2
    assert result["stats"]["total_nodes"] == len(result["nodes"])
    assert result["stats"]["total_edges"] == len(result["edges"])


def test_node_structure(test_wallet):
    assert test_wallet is not None

    result = get_wallet_graph(test_wallet, depth=1)

    for node in result["nodes"]:
        assert "id" in node
        assert "type" in node
        assert node["type"] == "wallet"
        assert "transaction_count" in node
        assert isinstance(node["transaction_count"], int)
        assert "total_received" in node
        assert isinstance(node["total_received"], (int, float))
        assert "total_sent" in node
        assert isinstance(node["total_sent"], (int, float))
        assert "degree" in node
        assert "in_degree" in node
        assert "out_degree" in node
        assert "dominant_label" in node


def test_edge_structure(test_wallet):
    assert test_wallet is not None

    result = get_wallet_graph(test_wallet, depth=1)

    for edge in result["edges"]:
        assert "source" in edge
        assert "target" in edge
        assert "txid" in edge
        assert len(edge["txid"]) == 64
        assert "amount" in edge
        assert isinstance(edge["amount"], (int, float))
        assert "timestamp" in edge


def test_graph_metrics(test_wallet):
    assert test_wallet is not None

    result = get_wallet_graph(test_wallet, depth=2)

    stats = result["stats"]
    assert "total_nodes" in stats
    assert "total_edges" in stats
    assert "density" in stats
    assert isinstance(stats["density"], float)
    assert 0 <= stats["density"] <= 1


def test_invalid_wallet():
    with pytest.raises(ValueError, match="Wallet not found"):
        get_wallet_graph("nonexistent_wallet_address", depth=1)


def test_max_nodes_limit(test_wallet):
    assert test_wallet is not None

    result = get_wallet_graph(test_wallet, depth=2, max_nodes=50)
    assert len(result["nodes"]) <= 50


if __name__ == "__main__":
    pytest.main([__file__, "-v"])