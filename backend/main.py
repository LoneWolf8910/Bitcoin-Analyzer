from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os
import time
from sqlalchemy import func

from backend.database.connection import init_db, get_db
from backend.services.data_ingestion import run_ingestion, get_stats
from backend.services.search_service import (
    get_wallet,
    get_wallet_transactions,
    get_transaction,
    search_all,
)
from backend.services.graph_service import get_wallet_graph
from backend.services.feature_engineering import extract_wallet_features, FEATURE_DESCRIPTIONS
from backend.services.blockchain_api import blockchain_api, BlockchainAPIError
from backend.ml.train import train_model
from backend.ml.predict import predict_anomaly, get_model_info
from backend.services.risk_engine import calculate_wallet_risk
from backend.schemas import (
    HealthResponse,
    IngestResponse,
    StatsResponse,
    WalletResponse,
    TransactionResponse,
    PaginatedTransactionsResponse,
    SearchResponse,
    SearchResult,
    ErrorResponse,
)

app = FastAPI(
    title="Solana Transaction Analyzer",
    description="Offline AI-powered Solana transaction analysis with Gulf Stream mempool visualization",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    init_db()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", offline=True)


@app.get("/")
async def root():
    return {"message": "Solana Transaction Analyzer API", "version": "0.1.0"}


@app.post("/api/ingest", response_model=IngestResponse)
async def trigger_ingestion(background_tasks: BackgroundTasks):
    def ingestion_task():
        from backend.database.connection import get_db
        with get_db() as db:
            from backend.database.models import SolanaTransaction
            existing = db.query(SolanaTransaction).count()
            if existing > 0:
                return
        run_ingestion()

    background_tasks.add_task(ingestion_task)
    return IngestResponse(
        message="Ingestion started in background",
        stats={}
    )


@app.get("/api/stats", response_model=StatsResponse)
async def get_statistics():
    with get_db() as db:
        stats = get_stats(db)
    return StatsResponse(**stats)


@app.get("/api/solana/wallet/{wallet_address}", response_model=WalletResponse)
async def get_solana_wallet_details(wallet_address: str):
    with get_db() as db:
        wallet = get_wallet(db, wallet_address)
        if not wallet:
            raise HTTPException(status_code=404, detail=f"Wallet not found: {wallet_address}")

        return WalletResponse(
            wallet_address=wallet.wallet_address,
            transaction_count=wallet.transaction_count,
            total_received=wallet.total_received_sol,
            total_sent=wallet.total_sent_sol,
            net_flow=wallet.net_flow_sol(),
            incoming_count=wallet.incoming_count,
            outgoing_count=wallet.outgoing_count,
            first_seen=wallet.first_seen.isoformat() if wallet.first_seen else None,
            last_seen=wallet.last_seen.isoformat() if wallet.last_seen else None,
            dominant_label=wallet.dominant_label,
        )


@app.get("/api/solana/wallet/{wallet_address}/transactions", response_model=PaginatedTransactionsResponse)
async def get_solana_wallet_transactions(
    wallet_address: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    token_symbol: str = Query(None),
    gulfstream_status: str = Query(None),
):
    with get_db() as db:
        wallet = get_wallet(db, wallet_address)
        if not wallet:
            raise HTTPException(status_code=404, detail=f"Wallet not found: {wallet_address}")

        transactions, total = get_wallet_transactions(db, wallet_address, page, page_size, token_symbol, gulfstream_status)

        items = [
            TransactionResponse(
                id=t.id,
                timestamp=t.timestamp.isoformat(),
                txid=t.txid,
                input_wallet=t.source_ata,
                output_wallet=t.destination_ata,
                input_amount=t.amount_ui,
                output_amount=t.amount_ui,
                fee=t.fee / 1e9,
                script_type=t.token_symbol,
                src_ip="",
                src_port=0,
                dst_ip="",
                dst_port=0,
                transaction_size=t.compute_units_consumed,
                block_height=t.slot,
                confirmation_count=1 if t.status == "success" else 0,
                wallet_label=t.wallet_label,
            )
            for t in transactions
        ]

        total_pages = (total + page_size - 1) // page_size

        return PaginatedTransactionsResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )


@app.get("/api/solana/wallet/{wallet_address}/gulfstream")
async def get_wallet_gulfstream_stats(wallet_address: str):
    with get_db() as db:
        wallet = get_wallet(db, wallet_address)
        if not wallet:
            raise HTTPException(status_code=404, detail=f"Wallet not found: {wallet_address}")

        from backend.database.models import SolanaTransaction
        gulfstream_stats = db.query(
            SolanaTransaction.gulfstream_status,
            func.count(SolanaTransaction.id)
        ).filter(
            SolanaTransaction.fee_payer == wallet_address
        ).group_by(SolanaTransaction.gulfstream_status).all()

        forwarded_txs = db.query(SolanaTransaction).filter(
            SolanaTransaction.fee_payer == wallet_address,
            SolanaTransaction.gulfstream_status.in_(["gulfstream_forwarded", "gulfstream_confirmed", "finalized"])
        ).all()

        avg_latency = 0
        if forwarded_txs:
            latencies = []
            for tx in forwarded_txs:
                if tx.gulfstream_forwarded_at:
                    latency = (tx.gulfstream_forwarded_at - tx.timestamp).total_seconds() * 1000
                    latencies.append(latency)
            avg_latency = sum(latencies) / len(latencies) if latencies else 0

        return {
            "wallet_address": wallet_address,
            "gulfstream_breakdown": {status: count for status, count in gulfstream_stats},
            "forwarded_count": wallet.gulfstream_forwarded_count,
            "dropped_count": wallet.gulfstream_dropped_count,
            "avg_forward_latency_ms": round(avg_latency, 2),
            "forward_rate": wallet.gulfstream_forwarded_count / wallet.transaction_count if wallet.transaction_count > 0 else 0,
        }


@app.get("/api/solana/tokens")
async def get_token_analytics():
    with get_db() as db:
        from backend.database.models import TokenAnalytics
        tokens = db.query(TokenAnalytics).order_by(TokenAnalytics.total_volume_ui.desc()).all()
        return [t.to_dict() for t in tokens]


@app.get("/api/solana/gulfstream/analytics")
async def get_gulfstream_analytics(
    limit: int = Query(100, ge=1, le=1000),
):
    with get_db() as db:
        from backend.database.models import GulfStreamAnalytics
        analytics = db.query(GulfStreamAnalytics).order_by(GulfStreamAnalytics.slot.desc()).limit(limit).all()
        return [a.to_dict() for a in analytics]


@app.get("/api/solana/gulfstream/leader-schedule")
async def get_leader_schedule_analytics():
    with get_db() as db:
        from backend.database.models import GulfStreamAnalytics, SolanaTransaction
        recent = db.query(GulfStreamAnalytics).order_by(GulfStreamAnalytics.slot.desc()).limit(500).all()

        slots = [a.slot for a in recent]
        forward_rates = [a.forward_rate() for a in recent]
        drop_rates = [a.drop_rate() for a in recent]
        latencies = [a.avg_forward_latency_ms for a in recent]
        efficiencies = [a.leader_schedule_efficiency for a in recent]

        total_tx = sum(a.total_transactions for a in recent)
        total_forwarded = sum(a.forwarded_count for a in recent)
        total_dropped = sum(a.dropped_count for a in recent)
        avg_latency = sum(latencies) / len(latencies) if latencies else 0
        avg_efficiency = sum(efficiencies) / len(efficiencies) if efficiencies else 0

        return {
            "slots_analyzed": len(recent),
            "total_transactions": total_tx,
            "total_forwarded": total_forwarded,
            "total_dropped": total_dropped,
            "overall_forward_rate": total_forwarded / total_tx if total_tx > 0 else 0,
            "overall_drop_rate": total_dropped / total_tx if total_tx > 0 else 0,
            "avg_forward_latency_ms": round(avg_latency, 2),
            "avg_leader_efficiency": round(avg_efficiency, 4),
            "slot_history": [
                {
                    "slot": s,
                    "forward_rate": fr,
                    "drop_rate": dr,
                    "latency_ms": l,
                    "efficiency": e,
                }
                for s, fr, dr, l, e in zip(slots, forward_rates, drop_rates, latencies, efficiencies)
            ],
        }


@app.get("/api/solana/wallet/{wallet_address}/token-holdings")
async def get_wallet_token_holdings(wallet_address: str):
    with get_db() as db:
        wallet = get_wallet(db, wallet_address)
        if not wallet:
            raise HTTPException(status_code=404, detail=f"Wallet not found: {wallet_address}")

        from backend.database.models import SolanaTransaction
        holdings = db.query(
            SolanaTransaction.token_symbol,
            SolanaTransaction.token_mint,
            func.sum(SolanaTransaction.amount_ui).label("total_amount"),
            func.count(SolanaTransaction.id).label("transfer_count"),
        ).filter(
            (SolanaTransaction.source_ata == wallet_address) | (SolanaTransaction.destination_ata == wallet_address)
        ).group_by(
            SolanaTransaction.token_symbol, SolanaTransaction.token_mint
        ).all()

        return {
            "wallet_address": wallet_address,
            "holdings": [
                {
                    "token_symbol": h.token_symbol,
                    "token_mint": h.token_mint,
                    "total_amount": round(h.total_amount, 4),
                    "transfer_count": h.transfer_count,
                }
                for h in holdings
            ],
        }


@app.get("/api/solana/transaction/{signature}", response_model=TransactionResponse)
async def get_solana_transaction_details(signature: str):
    with get_db() as db:
        transaction = get_transaction(db, signature)
        if not transaction:
            raise HTTPException(status_code=404, detail=f"Transaction not found: {signature}")

        return TransactionResponse(
            id=transaction.id,
            timestamp=transaction.timestamp.isoformat(),
            txid=transaction.txid,
            input_wallet=transaction.source_ata,
            output_wallet=transaction.destination_ata,
            input_amount=transaction.amount_ui,
            output_amount=transaction.amount_ui,
            fee=transaction.fee / 1e9,
            script_type=transaction.token_symbol,
            src_ip="",
            src_port=0,
            dst_ip="",
            dst_port=0,
            transaction_size=transaction.compute_units_consumed,
            block_height=transaction.slot,
            confirmation_count=1 if transaction.status == "success" else 0,
            wallet_label=transaction.wallet_label,
        )


@app.get("/api/search", response_model=SearchResponse)
async def search(q: str = Query(..., min_length=2, max_length=100)):
    query = q.strip()
    if len(query) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")

    with get_db() as db:
        wallets, transactions = search_all(db, query, limit=20)

    wallet_results = [
        SearchResult(type="wallet", value=w.wallet_address, label=w.dominant_label)
        for w in wallets
    ]
    tx_results = [
        SearchResult(type="transaction", value=t.txid, label=t.wallet_label)
        for t in transactions
    ]

    return SearchResponse(
        query=query,
        wallets=wallet_results,
        transactions=tx_results,
        total_wallets=len(wallet_results),
        total_transactions=len(tx_results),
    )


@app.post("/api/ml/train")
async def train_anomaly_model(
    contamination: float = Query(0.1, ge=0.01, le=0.5),
    n_estimators: int = Query(200, ge=50, le=1000),
    random_state: int = Query(42, ge=0),
):
    try:
        results = train_model(
            contamination=contamination,
            n_estimators=n_estimators,
            random_state=random_state,
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/model-info")
async def get_ml_model_info():
    try:
        return get_model_info()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model not trained yet. Call POST /api/ml/train first.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/wallet/{wallet_address}/anomaly")
async def get_wallet_anomaly(wallet_address: str):
    with get_db() as db:
        wallet = get_wallet(db, wallet_address)
        if not wallet:
            raise HTTPException(status_code=404, detail=f"Wallet not found: {wallet_address}")

    try:
        result = predict_anomaly(wallet_address)
        return {
            "wallet_address": result.wallet_address,
            "is_anomaly": result.is_anomaly,
            "anomaly_score": result.anomaly_score,
            "threshold": result.threshold,
            "model_version": result.model_version,
            "model_trained_at": result.model_trained_at,
            "features_used": result.features_used,
            "feature_descriptions": result.feature_descriptions,
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model not trained yet. Call POST /api/ml/train first.")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/wallet/{wallet_address}/risk")
async def get_wallet_risk(wallet_address: str):
    with get_db() as db:
        wallet = get_wallet(db, wallet_address)
        if not wallet:
            raise HTTPException(status_code=404, detail=f"Wallet not found: {wallet_address}")

    try:
        result = calculate_wallet_risk(wallet_address)
        return {
            "wallet": result["wallet_address"],
            "risk_score": result["risk_score"],
            "risk_level": result["risk_level"],
            "reasons": result["reasons"],
            "factor_breakdown": result["factor_breakdown"],
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/investigate/{wallet_address}")
async def investigate_wallet(
    wallet_address: str,
    graph_depth: int = Query(2, ge=1, le=3),
    graph_max_nodes: int = Query(500, ge=10, le=2000),
    recent_tx_limit: int = Query(20, ge=1, le=100)
):
    with get_db() as db:
        wallet = get_wallet(db, wallet_address)
        if not wallet:
            raise HTTPException(status_code=404, detail=f"Wallet not found: {wallet_address}")

        wallet_info = {
            "wallet_address": wallet.wallet_address,
            "transaction_count": wallet.transaction_count,
            "incoming_count": wallet.incoming_count,
            "outgoing_count": wallet.outgoing_count,
            "total_received": wallet.total_received_sol,
            "total_sent": wallet.total_sent_sol,
            "net_flow": wallet.net_flow_sol(),
            "first_seen": wallet.first_seen.isoformat() if wallet.first_seen else None,
            "last_seen": wallet.last_seen.isoformat() if wallet.last_seen else None,
            "dominant_label": wallet.dominant_label,
        }

        statistics = {
            "total_transactions": wallet.transaction_count,
            "total_received_sol": wallet.total_received_sol,
            "total_sent_sol": wallet.total_sent_sol,
            "net_flow_sol": wallet.net_flow_sol(),
            "incoming_count": wallet.incoming_count,
            "outgoing_count": wallet.outgoing_count,
            "token_diversity": wallet.token_diversity,
            "unique_counterparties": wallet.unique_counterparties,
        }

        recent_txs, _ = get_wallet_transactions(db, wallet_address, page=1, page_size=recent_tx_limit)
        recent_transactions = [
            {
                "id": t.id,
                "timestamp": t.timestamp.isoformat(),
                "txid": t.signature,
                "input_wallet": t.source_ata,
                "output_wallet": t.destination_ata,
                "input_amount": t.amount_ui,
                "output_amount": t.amount_ui,
                "fee": t.fee / 1e9,
                "script_type": t.token_symbol,
                "src_ip": "",
                "src_port": 0,
                "dst_ip": "",
                "dst_port": 0,
                "transaction_size": t.compute_units_consumed,
                "block_height": t.slot,
                "confirmation_count": 1 if t.status == "success" else 0,
                "wallet_label": t.wallet_label,
            }
            for t in recent_txs
        ]

    features = extract_wallet_features(wallet_address)

    anomaly_result = {}
    try:
        anomaly = predict_anomaly(wallet_address)
        anomaly_result = {
            "is_anomaly": anomaly.is_anomaly,
            "anomaly_score": anomaly.anomaly_score,
            "threshold": anomaly.threshold,
            "model_version": anomaly.model_version,
            "model_trained_at": anomaly.model_trained_at,
        }
    except FileNotFoundError:
        anomaly_result = {"error": "Model not trained yet"}
    except Exception as e:
        anomaly_result = {"error": str(e)}

    risk_result = calculate_wallet_risk(wallet_address)
    risk = {
        "risk_score": risk_result["risk_score"],
        "risk_level": risk_result["risk_level"],
        "reasons": risk_result["reasons"],
        "factor_breakdown": risk_result["factor_breakdown"],
    }

    graph_result = get_wallet_graph(wallet_address, depth=graph_depth, max_nodes=graph_max_nodes)
    graph = {
        "center_wallet": graph_result["center_wallet"],
        "depth": graph_result["depth"],
        "nodes": graph_result["nodes"],
        "edges": graph_result["edges"],
        "stats": graph_result["stats"],
    }

    gulfstream = {}
    with get_db() as db:
        from backend.database.models import SolanaTransaction, SolanaWallet
        wallet_db = db.query(SolanaWallet).filter(SolanaWallet.wallet_address == wallet_address).first()
        gulfstream_stats = db.query(
            SolanaTransaction.gulfstream_status,
            func.count(SolanaTransaction.id)
        ).filter(
            SolanaTransaction.fee_payer == wallet_address
        ).group_by(SolanaTransaction.gulfstream_status).all()
        gulfstream = {
            "breakdown": {status: count for status, count in gulfstream_stats},
            "forwarded_count": wallet_db.gulfstream_forwarded_count if wallet_db else 0,
            "dropped_count": wallet_db.gulfstream_dropped_count if wallet_db else 0,
        }

    return {
        "wallet": wallet_info,
        "statistics": statistics,
        "features": features,
        "anomaly": anomaly_result,
        "risk": risk,
        "graph": graph,
        "recent_transactions": recent_transactions,
        "gulfstream": gulfstream,
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)