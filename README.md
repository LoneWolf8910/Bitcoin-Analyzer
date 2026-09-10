# Bitcoin Transaction Analyzer

Offline AI-powered monitoring & analysis of Bitcoin transaction traffic for **Smart India Hackathon 2026 (PS 26146)**.

## Problem Statement

Build a complete offline system that:
- Ingests bulk Bitcoin transaction/network metadata (CSV/JSON/XML)
- Correlates network-layer (IP/port/timing) with blockchain-layer (wallet/TXID/amount) data
- Applies AI/ML to detect anomalies, cluster entities, and generate prioritized investigative leads

## Tech Stack

**Backend:**
- Python 3.11+
- FastAPI
- Pydantic
- SQLite (initial), Pandas/Polars, NetworkX, scikit-learn

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Cytoscape.js (graph visualization)

## Project Structure

```
sih-bitcoin-analyzer/
├── backend/          # FastAPI application
├── frontend/         # React + Vite + Tailwind
├── data/             # Local datasets (CSV/JSON/XML)
├── models/           # Trained ML models
├── scripts/          # Utility scripts
├── docs/             # Documentation
└── tests/            # Test files
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm/pnpm/yarn

### Backend Setup

```bash
cd sih-bitcoin-analyzer
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python backend/main.py
```

Backend runs at **http://localhost:8000**

Health check: `curl http://localhost:8000/health`

### Frontend Setup

```bash
cd sih-bitcoin-analyzer/frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (returns offline status) |
| GET | `/` | Root endpoint |

## Development

### Backend Commands
```bash
# Run with auto-reload
uvicorn backend.main:app --reload --port 8000

# Run tests
pytest tests/

# Lint
ruff check backend/
black backend/
mypy backend/
```

### Frontend Commands
```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Offline-First Design

- No external API calls during normal operation
- All data stored locally in `data/`
- Models stored locally in `models/`
- Works completely air-gapped after initial setup

## License

MIT License - Built for SIH 2026