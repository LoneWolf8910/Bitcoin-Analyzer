from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os
import time

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
    title="Bitcoin Transaction Analyzer",
    description="Offline AI-powered Bitcoin transaction analysis",
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
    return {"message": "Bitcoin Transaction Analyzer API", "version": "0.1.0"}


@app.post("/api/ingest", response_model=IngestResponse)
async def trigger_ingestion(background_tasks: BackgroundTasks):
    def ingestion_task():
        from backend.database.connection import get_db
        with get_db() as db:
            from backend.database.models import Transaction
            existing = db.query(Transaction).count()
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


@app.get("/api/wallet/{wallet_address}", response_model=WalletResponse)
async def get_wallet_details(wallet_address: str, source: str = Query("auto", regex="^(auto|local|blockchain)$")):
    if source in ("auto", "local"):
        with get_db() as db:
            wallet = get_wallet(db, wallet_address)
            if wallet:
                return WalletResponse(
                    wallet_address=wallet.wallet_address,
                    transaction_count=wallet.transaction_count,
                    total_received=wallet.total_received,
                    total_sent=wallet.total_sent,
                    net_flow=wallet.net_flow(),
                    incoming_count=wallet.incoming_count,
                    outgoing_count=wallet.outgoing_count,
                    first_seen=wallet.first_seen.isoformat() if wallet.first_seen else None,
                    last_seen=wallet.last_seen.isoformat() if wallet.last_seen else None,
                    dominant_label=wallet.dominant_label,
                )
            if source == "local":
                raise HTTPException(status_code=404, detail=f"Wallet not found in local database: {wallet_address}")

    if source in ("auto", "blockchain"):
        try:
            addr_info = await blockchain_api.get_address_info(wallet_address)
            if addr_info:
                chain_stats = addr_info.get("chain_stats", {})
                mempool_stats = addr_info.get("mempool_stats", {})
                total_received = (chain_stats.get("funded_txo_sum", 0) + mempool_stats.get("funded_txo_sum", 0)) / 1e8
                total_sent = (chain_stats.get("spent_txo_sum", 0) + mempool_stats.get("spent_txo_sum", 0)) / 1e8
                tx_count = chain_stats.get("tx_count", 0) + mempool_stats.get("tx_count", 0)

                return WalletResponse(
                    wallet_address=wallet_address,
                    transaction_count=tx_count,
                    total_received=total_received,
                    total_sent=total_sent,
                    net_flow=total_received - total_sent,
                    incoming_count=0,
                    outgoing_count=0,
                    first_seen=None,
                    last_seen=None,
                    dominant_label="normal",
                )
        except BlockchainAPIError as e:
            if source == "blockchain":
                raise HTTPException(status_code=502, detail=f"Blockchain API error: {str(e)}")

    raise HTTPException(status_code=404, detail=f"Wallet not found: {wallet_address}")


@app.get("/api/wallet/{wallet_address}/transactions", response_model=PaginatedTransactionsResponse)
async def get_wallet_transactions_endpoint(
    wallet_address: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200)
):
    with get_db() as db:
        wallet = get_wallet(db, wallet_address)
        if not wallet:
            raise HTTPException(status_code=404, detail=f"Wallet not found: {wallet_address}")

        transactions, total = get_wallet_transactions(db, wallet_address, page, page_size)

        items = [
            TransactionResponse(
                id=t.id,
                timestamp=t.timestamp.isoformat(),
                txid=t.txid,
                input_wallet=t.input_wallet,
                output_wallet=t.output_wallet,
                input_amount=t.input_amount,
                output_amount=t.output_amount,
                fee=t.fee,
                script_type=t.script_type,
                src_ip=t.src_ip,
                src_port=t.src_port,
                dst_ip=t.dst_ip,
                dst_port=t.dst_port,
                transaction_size=t.transaction_size,
                block_height=t.block_height,
                confirmation_count=t.confirmation_count,
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


@app.get("/api/wallet/{wallet_address}/graph")
async def get_wallet_graph_endpoint(
    wallet_address: str,
    depth: int = Query(2, ge=1, le=3),
    max_nodes: int = Query(500, ge=10, le=2000)
):
    with get_db() as db:
        wallet = get_wallet(db, wallet_address)
        if not wallet:
            raise HTTPException(status_code=404, detail=f"Wallet not found: {wallet_address}")

    try:
        graph_data = get_wallet_graph(wallet_address, depth=depth, max_nodes=max_nodes)
        return graph_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/wallet/{wallet_address}/features")
async def get_wallet_features(wallet_address: str):
    with get_db() as db:
        wallet = get_wallet(db, wallet_address)
        if not wallet:
            raise HTTPException(status_code=404, detail=f"Wallet not found: {wallet_address}")

    try:
        features = extract_wallet_features(wallet_address)
        return {
            "wallet_address": wallet_address,
            "features": features,
            "feature_descriptions": FEATURE_DESCRIPTIONS,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/transaction/{txid}", response_model=TransactionResponse)
async def get_transaction_details(txid: str):
    if len(txid) != 64:
        raise HTTPException(status_code=400, detail="Invalid TXID format (must be 64 hex characters)")

    with get_db() as db:
        transaction = get_transaction(db, txid)
        if not transaction:
            raise HTTPException(status_code=404, detail=f"Transaction not found: {txid}")

        return TransactionResponse(
            id=transaction.id,
            timestamp=transaction.timestamp.isoformat(),
            txid=transaction.txid,
            input_wallet=transaction.input_wallet,
            output_wallet=transaction.output_wallet,
            input_amount=transaction.input_amount,
            output_amount=transaction.output_amount,
            fee=transaction.fee,
            script_type=transaction.script_type,
            src_ip=transaction.src_ip,
            src_port=transaction.src_port,
            dst_ip=transaction.dst_ip,
            dst_port=transaction.dst_port,
            transaction_size=transaction.transaction_size,
            block_height=transaction.block_height,
            confirmation_count=transaction.confirmation_count,
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


@app.post("/api/wallet/{wallet_address}/sync")
async def sync_wallet_from_blockchain(wallet_address: str):
    try:
        addr_info = await blockchain_api.get_address_info(wallet_address)
        if not addr_info:
            raise HTTPException(status_code=404, detail=f"Wallet not found on blockchain: {wallet_address}")

        txs = await blockchain_api.get_address_transactions(wallet_address, limit=200)

        with get_db() as db:
            from backend.database.models import Wallet, Transaction
            from datetime import datetime
            from sqlalchemy.exc import IntegrityError

            wallet = db.query(Wallet).filter(Wallet.wallet_address == wallet_address).first()
            if not wallet:
                wallet = Wallet(wallet_address=wallet_address)
                db.add(wallet)

            chain_stats = addr_info.get("chain_stats", {})
            mempool_stats = addr_info.get("mempool_stats", {})
            wallet.total_received = (chain_stats.get("funded_txo_sum", 0) + mempool_stats.get("funded_txo_sum", 0)) / 1e8
            wallet.total_sent = (chain_stats.get("spent_txo_sum", 0) + mempool_stats.get("spent_txo_sum", 0)) / 1e8
            wallet.transaction_count = chain_stats.get("tx_count", 0) + mempool_stats.get("tx_count", 0)
            wallet.dominant_label = "normal"

            synced_count = 0
            for tx_data in txs:
                txid = tx_data.get("txid")
                timestamp = datetime.fromtimestamp(tx_data.get("status", {}).get("block_time", time.time()))
                fee = tx_data.get("fee", 0) / 1e8
                block_height = tx_data.get("status", {}).get("block_height", 0)
                confirmed = tx_data.get("status", {}).get("confirmed", False)
                confirmation_count = 1 if confirmed else 0

                input_wallets = set()
                output_wallets = set()

                for vin in tx_data.get("vin", []):
                    prevout = vin.get("prevout", {})
                    scriptpubkey_address = prevout.get("scriptpubkey_address")
                    if scriptpubkey_address:
                        input_wallets.add(scriptpubkey_address)

                for vout in tx_data.get("vout", []):
                    scriptpubkey_address = vout.get("scriptpubkey_address")
                    if scriptpubkey_address:
                        output_wallets.add(scriptpubkey_address)

                for out_addr in output_wallets:
                    if out_addr == wallet_address:
                        continue
                    vout_for_addr = next((v for v in tx_data.get("vout", []) if v.get("scriptpubkey_address") == out_addr), None)
                    amount = vout_for_addr.get("value", 0) / 1e8 if vout_for_addr else 0

                    tx = Transaction(
                        timestamp=timestamp,
                        txid=f"{txid}:{out_addr}",
                        input_wallet=wallet_address,
                        output_wallet=out_addr,
                        input_amount=0,
                        output_amount=amount,
                        fee=fee,
                        script_type="unknown",
                        src_ip="0.0.0.0",
                        src_port=0,
                        dst_ip="0.0.0.0",
                        dst_port=0,
                        transaction_size=0,
                        block_height=block_height,
                        confirmation_count=confirmation_count,
                        wallet_label="normal",
                    )
                    db.add(tx)
                    try:
                        db.commit()
                        synced_count += 1
                    except IntegrityError:
                        db.rollback()

            db.commit()

        return {"status": "synced", "wallet": wallet_address, "transactions_synced": synced_count}
    except BlockchainAPIError as e:
        raise HTTPException(status_code=502, detail=f"Blockchain API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


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
            "total_received": wallet.total_received,
            "total_sent": wallet.total_sent,
            "net_flow": wallet.net_flow(),
            "first_seen": wallet.first_seen.isoformat() if wallet.first_seen else None,
            "last_seen": wallet.last_seen.isoformat() if wallet.last_seen else None,
            "dominant_label": wallet.dominant_label,
        }

        statistics = {
            "total_transactions": wallet.transaction_count,
            "total_received_btc": wallet.total_received,
            "total_sent_btc": wallet.total_sent,
            "net_flow_btc": wallet.net_flow(),
            "incoming_count": wallet.incoming_count,
            "outgoing_count": wallet.outgoing_count,
            "active_days": (wallet.last_seen - wallet.first_seen).days if wallet.first_seen and wallet.last_seen else 0,
        }

        recent_txs, _ = get_wallet_transactions(db, wallet_address, page=1, page_size=recent_tx_limit)
        recent_transactions = [
            {
                "id": t.id,
                "timestamp": t.timestamp.isoformat(),
                "txid": t.txid,
                "input_wallet": t.input_wallet,
                "output_wallet": t.output_wallet,
                "input_amount": t.input_amount,
                "output_amount": t.output_amount,
                "fee": t.fee,
                "script_type": t.script_type,
                "src_ip": t.src_ip,
                "src_port": t.src_port,
                "dst_ip": t.dst_ip,
                "dst_port": t.dst_port,
                "transaction_size": t.transaction_size,
                "block_height": t.block_height,
                "confirmation_count": t.confirmation_count,
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

    return {
        "wallet": wallet_info,
        "statistics": statistics,
        "features": features,
        "anomaly": anomaly_result,
        "risk": risk,
        "graph": graph,
        "recent_transactions": recent_transactions,
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)