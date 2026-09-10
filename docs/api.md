# Bitcoin Transaction Analyzer API Documentation

**Version:** 0.1.0  
**Project:** Smart India Hackathon 2026 (PS 26146)  
**Description:** Offline AI-powered Bitcoin transaction analysis system

---

## Base URL

```
http://localhost:8000
```

---

## Authentication

No authentication required. The system operates completely offline.

---

## Endpoints

### Health Check

#### GET /health

Check system health status.

**Response:**
```json
{
  "status": "ok",
  "offline": true
}
```

---

### System Statistics

#### GET /api/stats

Get overall system statistics.

**Response:**
```json
{
  "transaction_count": 12000,
  "wallet_count": 330,
  "total_btc_volume": 84533780.14,
  "earliest_timestamp": "2024-01-01T00:00:24",
  "latest_timestamp": "2024-01-09T10:07:45"
}
```

---

### Data Ingestion

#### POST /api/ingest

Trigger background ingestion of the synthetic Bitcoin transaction CSV into SQLite.

**Response:**
```json
{
  "message": "Ingestion started in background",
  "stats": {}
}
```

---

### Wallet Endpoints

#### GET /api/wallet/{wallet_address}

Get basic wallet information.

**Path Parameters:**
- `wallet_address` (string): Bitcoin wallet address

**Response:**
```json
{
  "wallet_address": "qSQ3S4dcDQcK5RZVqcJugkg897SQsNc",
  "transaction_count": 85,
  "total_received": 345555.29126536,
  "total_sent": 260.1943957,
  "net_flow": 345295.09686966,
  "incoming_count": 47,
  "outgoing_count": 38,
  "first_seen": "2024-01-01T03:03:56",
  "last_seen": "2024-01-09T10:07:45",
  "dominant_label": "normal"
}
```

---

#### GET /api/wallet/{wallet_address}/transactions

Get paginated transaction history for a wallet.

**Path Parameters:**
- `wallet_address` (string)

**Query Parameters:**
- `page` (integer, default: 1, min: 1): Page number
- `page_size` (integer, default: 50, min: 1, max: 200): Items per page

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "timestamp": "2024-01-03T22:12:27",
      "txid": "1fb5f581d38563b0363a22969e09e2ee3b0e735603e6ec75da497ff6111157dc",
      "input_wallet": "qSQ3S4dcDQcK5RZVqcJugkg897SQsNc",
      "output_wallet": "PPwWgCukntLge6k9M8GL8CQmAZR",
      "input_amount": 0.33569149,
      "output_amount": 0.33569141,
      "fee": 8e-08,
      "script_type": "P2WPKH",
      "src_ip": "2.138.52.179",
      "src_port": 35996,
      "dst_ip": "2.31.25.249",
      "dst_port": 27537,
      "transaction_size": 857,
      "block_height": 800000,
      "confirmation_count": 3,
      "wallet_label": "normal"
    }
  ],
  "total": 85,
  "page": 1,
  "page_size": 50,
  "total_pages": 2
}
```

---

#### GET /api/wallet/{wallet_address}/graph

Get transaction graph around a wallet.

**Path Parameters:**
- `wallet_address` (string)

**Query Parameters:**
- `depth` (integer, default: 2, min: 1, max: 3): Traversal depth
- `max_nodes` (integer, default: 500, min: 10, max: 2000): Maximum nodes

**Response:**
```json
{
  "nodes": [
    {
      "id": "qSQ3S4dcDQcK5RZVqcJugkg897SQsNc",
      "type": "wallet",
      "transaction_count": 85,
      "total_received": 345555.29,
      "total_sent": 260.19,
      "degree": 80,
      "in_degree": 44,
      "out_degree": 36,
      "clustering_coefficient": 0.0,
      "dominant_label": "normal"
    }
  ],
  "edges": [
    {
      "source": "qSQ3S4dcDQcK5RZVqcJugkg897SQsNc",
      "target": "PPwWgCukntLge6k9M8GL8CQmAZR",
      "txid": "1fb5f581d38563b0363a22969e09e2ee3b0e735603e6ec75da497ff6111157dc",
      "amount": 0.33569141,
      "timestamp": "2024-01-03T22:12:27"
    }
  ],
  "center_wallet": "qSQ3S4dcDQcK5RZVqcJugkg897SQsNc",
  "depth": 2,
  "stats": {
    "total_nodes": 310,
    "total_edges": 4021,
    "density": 0.042,
    "center_wallet": "qSQ3S4dcDQcK5RZVqcJugkg897SQsNc",
    "depth": 2
  }
}
```

---

#### GET /api/wallet/{wallet_address}/features

Get behavioral feature vector for a wallet.

**Path Parameters:**
- `wallet_address` (string)

**Response:**
```json
{
  "wallet_address": "qSQ3S4dcDQcK5RZVqcJugkg897SQsNc",
  "features": {
    "wallet_address": "qSQ3S4dcDQcK5RZVqcJugkg897SQsNc",
    "transaction_count": 85,
    "incoming_count": 47,
    "outgoing_count": 38,
    "total_received": 345555.29,
    "total_sent": 260.19,
    "average_transaction_amount": 4068.42,
    "maximum_transaction_amount": 186352.11,
    "transaction_frequency": 10.625,
    "active_days": 8,
    "average_time_between_transactions": 2.37,
    "transaction_burst_score": 1.049,
    "unique_counterparties": 74,
    "incoming_counterparties": 44,
    "outgoing_counterparties": 36,
    "incoming_outgoing_ratio": 1328.07,
    "rapid_transfer_ratio": 0.0,
    "multi_hop_connections": 12,
    "degree": 80,
    "in_degree": 44,
    "out_degree": 36,
    "clustering_coefficient": 0.0,
    "connected_component_size": 75,
    "dominant_label": "normal",
    "first_seen": "2024-01-01T03:03:56",
    "last_seen": "2024-01-09T10:07:45"
  },
  "feature_descriptions": {
    "transaction_count": "Total number of transactions involving this wallet",
    ...
  }
}
```

---

#### GET /api/wallet/{wallet_address}/anomaly

Get ML anomaly detection result for a wallet.

**Path Parameters:**
- `wallet_address` (string)

**Response:**
```json
{
  "wallet_address": "qSQ3S4dcDQcK5RZVqcJugkg897SQsNc",
  "is_anomaly": false,
  "anomaly_score": -0.0511,
  "threshold": 0.0,
  "model_version": "isolation_forest_v1_42",
  "model_trained_at": "2026-09-09T19:13:46.282996",
  "features_used": {...},
  "feature_descriptions": {...}
}
```

---

#### GET /api/wallet/{wallet_address}/risk

Get explainable risk score for a wallet.

**Path Parameters:**
- `wallet_address` (string)

**Response:**
```json
{
  "wallet": "qSQ3S4dcDQcK5RZVqcJugkg897SQsNc",
  "risk_score": 49,
  "risk_level": "MEDIUM",
  "reasons": [
    "ml_anomaly: ML model score within normal range (score: -0.051)",
    "rapid_movement: Extreme incoming/outgoing imbalance (1328:1)"
  ],
  "factor_breakdown": [
    {
      "factor": "ml_anomaly",
      "raw_score": 15.2,
      "weight": 0.25,
      "weighted_contribution": 3.8,
      "explanation": "ML model score within normal range (score: -0.051)",
      "feature_values": {"anomaly_score": -0.0511, "is_anomaly": false}
    },
    ...
  ]
}
```

**Risk Levels:**
- **LOW** (0-29): Routine monitoring
- **MEDIUM** (30-59): Elevated attention
- **HIGH** (60-79): Priority investigation
- **CRITICAL** (80-100): Immediate action required

> **Note:** Risk score represents INVESTIGATIVE PRIORITY, not proof of criminal activity.

---

#### GET /api/investigate/{wallet_address}

Complete investigation report combining all analyses.

**Path Parameters:**
- `wallet_address` (string)

**Query Parameters:**
- `graph_depth` (integer, default: 2, min: 1, max: 3): Graph traversal depth
- `graph_max_nodes` (integer, default: 500, min: 10, max: 2000): Maximum graph nodes
- `recent_tx_limit` (integer, default: 20, min: 1, max: 100): Recent transactions to return

**Response:**
```json
{
  "wallet": {
    "wallet_address": "qSQ3S4dcDQcK5RZVqcJugkg897SQsNc",
    "transaction_count": 85,
    "incoming_count": 47,
    "outgoing_count": 38,
    "total_received": 345555.29,
    "total_sent": 260.19,
    "net_flow": 345295.10,
    "first_seen": "2024-01-01T03:03:56",
    "last_seen": "2024-01-09T10:07:45",
    "dominant_label": "normal"
  },
  "statistics": {
    "total_transactions": 85,
    "total_received_btc": 345555.29,
    "total_sent_btc": 260.19,
    "net_flow_btc": 345295.10,
    "incoming_count": 47,
    "outgoing_count": 38,
    "active_days": 8
  },
  "features": { ... },
  "anomaly": {
    "is_anomaly": false,
    "anomaly_score": -0.0511,
    "threshold": 0.0,
    "model_version": "isolation_forest_v1_42",
    "model_trained_at": "2026-09-09T19:13:46.282996"
  },
  "risk": {
    "risk_score": 49,
    "risk_level": "MEDIUM",
    "reasons": [...],
    "factor_breakdown": [...]
  },
  "graph": {
    "center_wallet": "qSQ3S4dcDQcK5RZVqcJugkg897SQsNc",
    "depth": 2,
    "nodes": [...],
    "edges": [...],
    "stats": {...}
  },
  "recent_transactions": [...]
}
```

---

### Transaction Endpoints

#### GET /api/transaction/{txid}

Get transaction details.

**Path Parameters:**
- `txid` (string, 64 hex characters): Transaction ID

**Response:**
```json
{
  "id": 1,
  "timestamp": "2024-01-03T22:12:27",
  "txid": "1fb5f581d38563b0363a22969e09e2ee3b0e735603e6ec75da497ff6111157dc",
  "input_wallet": "qSQ3S4dcDQcK5RZVqcJugkg897SQsNc",
  "output_wallet": "PPwWgCukntLge6k9M8GL8CQmAZR",
  "input_amount": 0.33569149,
  "output_amount": 0.33569141,
  "fee": 8e-08,
  "script_type": "P2WPKH",
  "src_ip": "2.138.52.179",
  "src_port": 35996,
  "dst_ip": "2.31.25.249",
  "dst_port": 27537,
  "transaction_size": 857,
  "block_height": 800000,
  "confirmation_count": 3,
  "wallet_label": "normal"
}
```

---

### Search Endpoints

#### GET /api/search

Search wallets and transactions.

**Query Parameters:**
- `q` (string, min: 2, max: 100): Search query

**Response:**
```json
{
  "query": "qSQ3S",
  "wallets": [
    {
      "type": "wallet",
      "value": "qSQ3S4dcDQcK5RZVqcJugkg897SQsNc",
      "label": "normal"
    }
  ],
  "transactions": [],
  "total_wallets": 1,
  "total_transactions": 0
}
```

---

### ML Endpoints

#### POST /api/ml/train

Train the IsolationForest anomaly detection model.

**Query Parameters:**
- `contamination` (float, default: 0.1, min: 0.01, max: 0.5): Expected anomaly proportion
- `n_estimators` (integer, default: 200, min: 50, max: 1000): Number of trees
- `random_state` (integer, default: 42, min: 0): Random seed

**Response:**
```json
{
  "status": "success",
  "model_path": "/home/saurav-singh/sih-bitcoin-analyzer/models/wallet_anomaly_model.joblib",
  "config_path": "/home/saurav-singh/sih-bitcoin-analyzer/models/wallet_anomaly_feature_config.json",
  "training_samples": 330,
  "anomalies_detected": 33,
  "anomaly_rate": 0.1,
  "score_range": [-0.1919, 0.1277],
  "config": {...}
}
```

---

#### GET /api/ml/model-info

Get trained model metadata.

**Response:**
```json
{
  "model_version": "isolation_forest_v1_42",
  "trained_at": "2026-09-09T19:13:46.282996",
  "training_samples": 330,
  "contamination": 0.1,
  "n_estimators": 200,
  "features": [...],
  "model_path": "/home/saurav-singh/sih-bitcoin-analyzer/models/wallet_anomaly_model.joblib"
}
```

---

## Error Responses

All endpoints return standard HTTP error codes:

| Code | Description |
|------|-------------|
| 400 | Bad Request (invalid parameters) |
| 404 | Not Found (wallet/transaction/model) |
| 500 | Internal Server Error |

**Error Format:**
```json
{
  "detail": "Error description"
}
```

---

## Data Model

### Wallet

| Field | Type | Description |
|-------|------|-------------|
| wallet_address | string | Unique identifier |
| transaction_count | integer | Total transactions |
| incoming_count | integer | Incoming transactions |
| outgoing_count | integer | Outgoing transactions |
| total_received | float | Total BTC received |
| total_sent | float | Total BTC sent |
| net_flow | float | Received - Sent |
| first_seen | datetime | Earliest transaction |
| last_seen | datetime | Latest transaction |
| dominant_label | string | Behavioral label |

### Transaction

| Field | Type | Description |
|-------|------|-------------|
| txid | string | 64-char hex ID |
| timestamp | datetime | Transaction time |
| input_wallet | string | Sender address |
| output_wallet | string | Receiver address |
| input_amount | float | BTC sent |
| output_amount | float | BTC received |
| fee | float | Transaction fee |
| script_type | string | Script type (P2PKH, P2WPKH, etc.) |
| src_ip | string | Source IP |
| src_port | integer | Source port |
| dst_ip | string | Destination IP |
| dst_port | integer | Destination port |
| wallet_label | string | Behavioral label |

### Graph Node

| Field | Type | Description |
|-------|------|-------------|
| id | string | Wallet address |
| type | string | Always "wallet" |
| transaction_count | integer | |
| total_received | float | |
| total_sent | float | |
| degree | integer | Total connections |
| in_degree | integer | Incoming connections |
| out_degree | integer | Outgoing connections |
| clustering_coefficient | float | Local clustering |
| dominant_label | string | Behavioral label |

### Graph Edge

| Field | Type | Description |
|-------|------|-------------|
| source | string | Source wallet |
| target | string | Target wallet |
| txid | string | Transaction ID |
| amount | float | BTC amount |
| timestamp | datetime | Transaction time |

---

## Offline Operation

This system operates completely offline:
- All data stored locally in `data/` (SQLite + CSV)
- ML models saved to `models/`
- No external API calls
- No internet connectivity required

---

## Quick Start

```bash
# Start backend
cd sih-bitcoin-analyzer
source venv/bin/activate
uvicorn backend.main:app --reload --port 8000

# Train model
curl -X POST "http://localhost:8000/api/ml/train"

# Investigate a wallet
curl "http://localhost:8000/api/investigate/qSQ3S4dcDQcK5RZVqcJugkg897SQsNc"
```