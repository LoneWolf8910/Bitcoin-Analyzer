# Offline Architecture - TxGuard

## Overview

This document describes how TxGuard operates completely offline, with no internet connectivity required during normal operation.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        OFFLINE ENVIRONMENT                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │   Browser    │    │  FastAPI     │    │   SQLite     │         │
│  │  (React)     │◄──►│  (Backend)   │◄──►│   Database   │         │
│  │  Port 5173   │    │  Port 8000   │    │  (Local)     │         │
│  └──────────────┘    └──────────────┘    └──────────────┘         │
│         │                   │                   │                  │
│         ▼                   ▼                   ▼                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │  Static      │    │  CSV Dataset │    │  ML Model    │         │
│  │  Assets      │    │  (Local)     │    │  (joblib)    │         │
│  │  (Built)     │    │              │    │              │         │
│  └──────────────┘    └──────────────┘    └──────────────┘         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Data Layer (All Local)

| Component | Location | Description |
|-----------|----------|-------------|
| SQLite Database | `data/bitcoin_intelligence.db` | 330 wallets, 12,000 transactions with full metadata |
| CSV Dataset | `data/bitcoin_transactions.csv` | Original synthetic dataset (12K rows) |
| ML Model | `models/wallet_anomaly_model.joblib` | Trained IsolationForest (200 trees) |
| Feature Config | `models/wallet_anomaly_feature_config.json` | Model metadata & feature stats |

### 2. Backend (FastAPI)

**Entry Point**: `backend/main.py`

**Dependencies (All Bundled/Python Standard Library)**:
- `fastapi`, `uvicorn` - Web framework
- `sqlalchemy` - ORM
- `pandas`, `numpy`, `scikit-learn` - ML & data processing
- `networkx` - Graph algorithms
- `pydantic` - Validation

**No External API Calls**: The backend makes zero HTTP requests to external services.

**Endpoints** (All Local):
| Endpoint | Purpose | Data Source |
|----------|---------|-------------|
| `GET /health` | Health check | In-memory |
| `GET /api/stats` | System statistics | SQLite |
| `GET /api/wallet/{addr}` | Wallet details | SQLite |
| `GET /api/wallet/{addr}/graph` | Transaction graph | SQLite + NetworkX |
| `GET /api/wallet/{addr}/features` | Behavioral features | SQLite |
| `GET /api/wallet/{addr}/anomaly` | ML anomaly score | Local ML model |
| `GET /api/wallet/{addr}/risk` | Risk score | Local computation |
| `GET /api/investigate/{addr}` | Full investigation | All above |
| `POST /api/ml/train` | Retrain model | Local CSV + SQLite |

### 3. Frontend (React + Vite)

**Entry Point**: `frontend/src/main.jsx`

**Build Output**: `frontend/dist/` (static assets)

**Dependencies (Bundled at Build Time)**:
- `react`, `react-dom` - UI framework
- `axios` - HTTP client (calls local FastAPI)
- `cytoscape`, `cytoscape-cose-bilkent` - Graph visualization

**No Runtime CDN Dependencies**: All JavaScript/CSS is bundled into `dist/assets/`.

**Vite Config**: Proxy `/api` to `http://localhost:8000` (dev only)

### 4. Data Flow (Offline)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 1. Generate │────►│ 2. Ingest   │────►│ 3. Query    │
│  Dataset    │     │  to SQLite  │     │  & Analyze  │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ CSV (local) │     │ SQLite DB   │     │ FastAPI +   │
│             │     │ (local)     │     │ React       │
└─────────────┘     └─────────────┘     └─────────────┘
                                                   │
                                    ┌──────────────┴──────────────┐
                                    ▼                             ▼
                              ┌───────────┐                 ┌───────────┐
                              │ ML Model  │                 │ Graph     │
                              │ (joblib)  │                 │ (NetworkX)│
                              └───────────┘                 └───────────┘
```

## Startup Commands

### Prerequisites
- Python 3.11+ with venv
- Node.js 18+ with npm
- ~2GB disk space

### 1. Dataset Generation (One-time)
```bash
cd bitcoin-transaction-analyzer
source venv/bin/activate
python scripts/generate_dataset.py
```
Output: `data/bitcoin_transactions.csv` (12,000 synthetic transactions)

### 2. Dataset Ingestion (One-time)
```bash
cd bitcoin-transaction-analyzer
source venv/bin/activate
python scripts/ingest_dataset.py
```
Output: `data/bitcoin_intelligence.db` (SQLite with wallets + transactions)

### 3. ML Model Training (One-time, re-trainable)
```bash
cd bitcoin-transaction-analyzer
source venv/bin/activate
python -m backend.ml.train
```
Or via API:
```bash
curl -X POST "http://localhost:8000/api/ml/train?contamination=0.1&n_estimators=200"
```
Output: `models/wallet_anomaly_model.joblib` + config

### 4. Backend Startup
```bash
cd bitcoin-transaction-analyzer
source venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```
Access: `http://localhost:8000/docs` (Swagger UI)

### 5. Frontend Startup (Development)
```bash
cd bitcoin-transaction-analyzer/frontend
npm run dev
```
Access: `http://localhost:5173` (proxies `/api` to backend)

### 6. Frontend Build (Production)
```bash
cd bitcoin-transaction-analyzer/frontend
npm run build
```
Output: `frontend/dist/` - serve with any static file server

## Verification Commands

### Test Backend API
```bash
# Health check
curl http://localhost:8000/health
# {"status":"ok","offline":true}

# Full investigation
curl http://localhost:8000/api/investigate/qSQ3S4dcDQcK5RZVqcJugkg897SQsNc
```

### Run Offline Test Suite
```bash
cd bitcoin-transaction-analyzer
source venv/bin/activate
python scripts/offline_test.py
```
Expected: All 11 tests pass

## Network Isolation Verification

### What DOES NOT Happen
- ❌ No DNS lookups
- ❌ No HTTP requests to external APIs
- ❌ No blockchain explorer queries
- ❌ No CDN fetches (fonts, JS, CSS)
- ❌ No telemetry/analytics
- ❌ No cloud AI/ML inference
- ❌ No automatic updates

### What DOES Happen
- ✅ Local SQLite reads/writes
- ✅ Local CSV parsing
- ✅ Local ML inference (scikit-learn)
- ✅ Local graph computation (NetworkX)
- ✅ Local FastAPI ↔ React communication (localhost)
- ✅ Local static asset serving

## Security Considerations

1. **Air-Gapped Ready**: No outbound connections required
2. **Data Sovereignty**: All data stays on device
3. **Deterministic ML**: Fixed random seeds for reproducibility
3. **No Telemetry**: Zero usage tracking
4. **Signed Artifacts**: Model config includes training metadata

## Deployment Checklist

- [ ] Generate dataset: `python scripts/generate_dataset.py`
- [ ] Ingest to SQLite: `python scripts/ingest_dataset.py`
- [ ] Train ML model: `python -m backend.ml.train`
- [ ] Build frontend: `cd frontend && npm run build`
- [ ] Start backend: `uvicorn backend.main:app --port 8000`
- [ ] Verify offline test: `python scripts/offline_test.py`
- [ ] Disconnect network
- [ ] Verify all endpoints work

## Troubleshooting

| Issue | Resolution |
|-------|------------|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` in venv |
| `sqlite3.OperationalError` | Re-run ingestion script |
| `FileNotFoundError: model` | Run training: `python -m backend.ml.train` |
| Frontend shows blank | Check Vite proxy config, rebuild with `npm run build` |
| CORS errors | Backend allows `localhost:5173`, `localhost:3000` |

## File Inventory (Offline Required)

```
bitcoin-transaction-analyzer/
├── data/
│   ├── bitcoin_transactions.csv      (3.0 MB)  ← Source dataset
│   └── bitcoin_intelligence.db       (8.5 MB)  ← SQLite database
├── models/
│   ├── wallet_anomaly_model.joblib   (~1.5 MB) ← Trained ML model
│   └── wallet_anomaly_feature_config.json      ← Model config
├── backend/
│   └── *.py                          ← All Python source
├── frontend/
│   ├── dist/                         ← Built assets (production)
│   │   ├── index.html
│   │   └── assets/*.js, *.css
│   └── src/                          ← React source
├── scripts/
│   ├── generate_dataset.py
│   ├── ingest_dataset.py
│   └── offline_test.py               ← Verification script
├── requirements.txt                  ← Python deps
└── frontend/package.json             ← Node deps (for build only)
```

**Total Offline Footprint**: ~15 MB (excluding venv/node_modules)

---

**Last Verified**: All 63 backend tests pass + offline test suite passes
**Status**: ✅ Production-ready for air-gapped deployment