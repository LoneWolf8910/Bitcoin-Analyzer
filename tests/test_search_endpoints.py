import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.main import app
from backend.database.connection import get_db, set_test_engine, close_db
from backend.database.models import Base, Transaction, Wallet


TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function", autouse=True)
def setup_database():
    set_test_engine(test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    close_db()


def create_test_data(db):
    tx1 = Transaction(
        timestamp=datetime(2024, 1, 1, 10, 0, 0),
        txid="a" * 64,
        input_wallet="wallet_A",
        output_wallet="wallet_B",
        input_amount=1.5,
        output_amount=1.49,
        fee=0.01,
        script_type="P2PKH",
        src_ip="1.2.3.4",
        src_port=8333,
        dst_ip="5.6.7.8",
        dst_port=8333,
        transaction_size=250,
        block_height=800000,
        confirmation_count=10,
        wallet_label="normal",
    )
    tx2 = Transaction(
        timestamp=datetime(2024, 1, 1, 11, 0, 0),
        txid="b" * 64,
        input_wallet="wallet_B",
        output_wallet="wallet_C",
        input_amount=2.0,
        output_amount=1.99,
        fee=0.01,
        script_type="P2WPKH",
        src_ip="9.10.11.12",
        src_port=8333,
        dst_ip="13.14.15.16",
        dst_port=8333,
        transaction_size=260,
        block_height=800001,
        confirmation_count=5,
        wallet_label="high_activity",
    )
    tx3 = Transaction(
        timestamp=datetime(2024, 1, 1, 12, 0, 0),
        txid="c" * 64,
        input_wallet="wallet_A",
        output_wallet="wallet_A",
        input_amount=0.5,
        output_amount=0.49,
        fee=0.01,
        script_type="P2TR",
        src_ip="193.23.244.1",
        src_port=9050,
        dst_ip="185.220.101.1",
        dst_port=443,
        transaction_size=300,
        block_height=800002,
        confirmation_count=3,
        wallet_label="rapid_transfer",
    )

    db.add_all([tx1, tx2, tx3])
    db.flush()

    w1 = Wallet(
        wallet_address="wallet_A",
        total_received=1.99,
        total_sent=2.0,
        incoming_count=2,
        outgoing_count=1,
        transaction_count=3,
        first_seen=datetime(2024, 1, 1, 10, 0, 0),
        last_seen=datetime(2024, 1, 1, 12, 0, 0),
        dominant_label="normal",
    )
    w2 = Wallet(
        wallet_address="wallet_B",
        total_received=1.49,
        total_sent=1.99,
        incoming_count=1,
        outgoing_count=1,
        transaction_count=2,
        first_seen=datetime(2024, 1, 1, 10, 0, 0),
        last_seen=datetime(2024, 1, 1, 11, 0, 0),
        dominant_label="normal",
    )
    w3 = Wallet(
        wallet_address="wallet_C",
        total_received=1.99,
        total_sent=0.0,
        incoming_count=1,
        outgoing_count=0,
        transaction_count=1,
        first_seen=datetime(2024, 1, 1, 11, 0, 0),
        last_seen=datetime(2024, 1, 1, 11, 0, 0),
        dominant_label="high_activity",
    )

    db.add_all([w1, w2, w3])
    db.commit()


client = TestClient(app)


class TestHealth:
    def test_health_endpoint(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["offline"] is True


class TestStats:
    def test_stats_endpoint_empty(self):
        response = client.get("/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["transaction_count"] == 0
        assert data["wallet_count"] == 0

    def test_stats_endpoint_with_data(self):
        with TestingSessionLocal() as db:
            create_test_data(db)
        response = client.get("/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["transaction_count"] == 3
        assert data["wallet_count"] == 3
        assert data["total_btc_volume"] > 0


class TestWallet:
    def test_get_wallet_not_found(self):
        response = client.get("/api/wallet/nonexistent_wallet")
        assert response.status_code == 404

    def test_get_wallet_details(self):
        with TestingSessionLocal() as db:
            create_test_data(db)

        response = client.get("/api/wallet/wallet_A")
        assert response.status_code == 200
        data = response.json()
        assert data["wallet_address"] == "wallet_A"
        assert data["transaction_count"] == 3
        assert data["incoming_count"] == 2
        assert data["outgoing_count"] == 1
        assert data["dominant_label"] == "normal"

    def test_get_wallet_transactions_pagination(self):
        with TestingSessionLocal() as db:
            create_test_data(db)

        response = client.get("/api/wallet/wallet_A/transactions?page=1&page_size=2")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert len(data["items"]) == 2
        assert data["total_pages"] == 1

    def test_get_wallet_transactions_wallet_not_found(self):
        response = client.get("/api/wallet/nonexistent/transactions")
        assert response.status_code == 404


class TestTransaction:
    def test_get_transaction_not_found(self):
        response = client.get("/api/transaction/" + "x" * 64)
        assert response.status_code == 404

    def test_get_transaction_invalid_txid(self):
        response = client.get("/api/transaction/invalid")
        assert response.status_code == 400

    def test_get_transaction_details(self):
        with TestingSessionLocal() as db:
            create_test_data(db)

        response = client.get("/api/transaction/" + "a" * 64)
        assert response.status_code == 200
        data = response.json()
        assert data["txid"] == "a" * 64
        assert data["input_wallet"] == "wallet_A"
        assert data["output_wallet"] == "wallet_B"
        assert data["wallet_label"] == "normal"


class TestSearch:
    def test_search_short_query(self):
        response = client.get("/api/search?q=a")
        assert response.status_code == 422

    def test_search_wallet_partial(self):
        with TestingSessionLocal() as db:
            create_test_data(db)

        response = client.get("/api/search?q=wallet_A")
        assert response.status_code == 200
        data = response.json()
        assert data["total_wallets"] == 1
        assert data["wallets"][0]["value"] == "wallet_A"

    def test_search_transaction_partial(self):
        with TestingSessionLocal() as db:
            create_test_data(db)

        response = client.get("/api/search?q=" + "a" * 10)
        assert response.status_code == 200
        data = response.json()
        assert data["total_transactions"] == 1
        assert data["transactions"][0]["value"].startswith("a" * 10)

    def test_search_no_results(self):
        with TestingSessionLocal() as db:
            create_test_data(db)

        response = client.get("/api/search?q=nonexistent123")
        assert response.status_code == 200
        data = response.json()
        assert data["total_wallets"] == 0
        assert data["total_transactions"] == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])