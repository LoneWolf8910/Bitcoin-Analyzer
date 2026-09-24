# TxGuard

Offline AI-powered Bitcoin transaction analysis platform. Detect anomalies, assess risk, and visualize transaction graphs in air-gapped environments.

## Features

- **Offline-First Architecture** - Zero external dependencies during operation
- **AI/ML Anomaly Detection** - Isolation Forest + statistical profiling
- **Risk Scoring** - Multi-factor wallet risk assessment
- **Graph Visualization** - Interactive transaction flow graphs (Cytoscape.js)
- **PWA Support** - Installable, works offline after first load
- **Air-Gapped Ready** - Deploy frontend + backend locally, no internet required

## Tech Stack

**Backend:**
- Python 3.11+
- FastAPI
- Pydantic
- SQLite, Pandas/Polars, NetworkX, scikit-learn

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Cytoscape.js (graph visualization)
- Framer Motion (animations)
- Workbox (PWA/offline caching)

## Project Structure

```
txguard/
├── backend/          # FastAPI application
├── frontend/         # React + Vite + Tailwind (PWA)
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
# From project root
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python backend/main.py
```

Backend runs at **http://localhost:8000**

Health check: `curl http://localhost:8000/health`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

### Production Build (PWA)

```bash
cd frontend
npm run build
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (returns offline status, model info) |
| POST | `/investigate/{wallet_address}` | Analyze a wallet address |
| GET | `/search` | Search wallets/transactions |
| POST | `/ml/train` | Train anomaly detection model |
| GET | `/ml/model-info` | Get trained model metadata |

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

# Build for production (generates PWA assets)
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
- Service worker caches all frontend assets
- Works completely air-gapped after initial setup

## PWA Installation

1. Open the deployed URL in a modern browser
2. Browser will prompt "Add to Home Screen" / "Install App"
3. Once installed, the app works offline (frontend only)
4. For full functionality, run the backend locally

## License

MIT License