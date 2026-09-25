from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from collections import defaultdict
import math

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from backend.database.connection import get_db
from backend.database.models import SolanaTransaction as Transaction, SolanaWallet as Wallet
from backend.services.graph_service import build_wallet_graph


@dataclass
class WalletFeatures:
    wallet_address: str
    
    transaction_count: int
    incoming_count: int
    outgoing_count: int
    total_received: float
    total_sent: float
    average_transaction_amount: float
    maximum_transaction_amount: float
    transaction_frequency: float
    
    active_days: int
    average_time_between_transactions: float
    transaction_burst_score: float
    
    unique_counterparties: int
    incoming_counterparties: int
    outgoing_counterparties: int
    
    incoming_outgoing_ratio: float
    rapid_transfer_ratio: float
    multi_hop_connections: int
    
    degree: int
    in_degree: int
    out_degree: int
    clustering_coefficient: float
    connected_component_size: int
    
    dominant_label: Optional[str]
    first_seen: Optional[str]
    last_seen: Optional[str]


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    if denominator == 0:
        return default
    return numerator / denominator


def extract_wallet_features(wallet_address: str) -> Dict[str, Any]:
    with get_db() as db:
        wallet = db.query(Wallet).filter(Wallet.wallet_address == wallet_address).first()
        if not wallet:
            raise ValueError(f"Wallet not found: {wallet_address}")

        transactions = db.query(Transaction).filter(
            or_(
                Transaction.fee_payer == wallet_address,
                Transaction.source_ata == wallet_address,
                Transaction.destination_ata == wallet_address,
                Transaction.authority == wallet_address
            )
        ).order_by(Transaction.timestamp).all()

        if not transactions:
            return _empty_features(wallet)

        incoming_txs = [tx for tx in transactions if tx.destination_ata == wallet_address]
        outgoing_txs = [tx for tx in transactions if tx.source_ata == wallet_address]

        amounts = [tx.amount_ui for tx in transactions]
        incoming_amounts = [tx.amount_ui for tx in incoming_txs]
        outgoing_amounts = [tx.amount_ui for tx in outgoing_txs]

        timestamps = [tx.timestamp for tx in transactions if tx.timestamp]

        counterparties_in = set(tx.source_ata for tx in incoming_txs)
        counterparties_out = set(tx.destination_ata for tx in outgoing_txs)
        all_counterparties = counterparties_in | counterparties_out

        rapid_transfer_txs = [tx for tx in transactions if tx.wallet_label == "rapid_transfer"]

        graph_response = build_wallet_graph(wallet_address, depth=1, max_nodes=200)
        node_info = {n["id"]: n for n in graph_response.nodes}
        center_node = node_info.get(wallet_address, {})

        active_days = 0
        avg_time_between = 0.0
        burst_score = 0.0

        if len(timestamps) >= 2:
            time_diffs = [(timestamps[i+1] - timestamps[i]).total_seconds() / 3600 for i in range(len(timestamps)-1)]
            avg_time_between = sum(time_diffs) / len(time_diffs) if time_diffs else 0.0
            
            min_ts = min(timestamps)
            max_ts = max(timestamps)
            active_days = max(1, (max_ts - min_ts).days)
            
            if avg_time_between > 0:
                expected_tx_per_day = 24 / avg_time_between if avg_time_between > 0 else 0
                actual_tx_per_day = len(transactions) / active_days
                burst_score = safe_divide(actual_tx_per_day, expected_tx_per_day, 1.0)
            else:
                burst_score = 1.0 if len(transactions) > 1 else 0.0

        multi_hop = 0
        if center_node:
            for edge in graph_response.edges:
                if edge["source"] == wallet_address:
                    target_node = node_info.get(edge["target"], {})
                    if target_node.get("out_degree", 0) > 0:
                        multi_hop += 1
                elif edge["target"] == wallet_address:
                    source_node = node_info.get(edge["source"], {})
                    if source_node.get("in_degree", 0) > 0:
                        multi_hop += 1

        features = WalletFeatures(
            wallet_address=wallet_address,
            
            transaction_count=len(transactions),
            incoming_count=len(incoming_txs),
            outgoing_count=len(outgoing_txs),
            total_received=sum(incoming_amounts),
            total_sent=sum(outgoing_amounts),
            average_transaction_amount=sum(amounts) / len(amounts) if amounts else 0.0,
            maximum_transaction_amount=max(amounts) if amounts else 0.0,
            transaction_frequency=safe_divide(len(transactions), active_days, 0.0),
            
            active_days=active_days,
            average_time_between_transactions=avg_time_between,
            transaction_burst_score=burst_score,
            
            unique_counterparties=len(all_counterparties),
            incoming_counterparties=len(counterparties_in),
            outgoing_counterparties=len(counterparties_out),
            
            incoming_outgoing_ratio=safe_divide(sum(incoming_amounts), sum(outgoing_amounts), 1e10),
            rapid_transfer_ratio=safe_divide(len(rapid_transfer_txs), len(transactions), 0.0),
            multi_hop_connections=multi_hop,
            
            degree=center_node.get("degree", 0),
            in_degree=center_node.get("in_degree", 0),
            out_degree=center_node.get("out_degree", 0),
            clustering_coefficient=center_node.get("clustering_coefficient", 0.0),
            connected_component_size=len(graph_response.nodes),
            
            dominant_label=wallet.dominant_label,
            first_seen=wallet.first_seen.isoformat() if wallet.first_seen else None,
            last_seen=wallet.last_seen.isoformat() if wallet.last_seen else None,
        )

    return asdict(features)


def _empty_features(wallet: Wallet) -> Dict[str, Any]:
    return asdict(WalletFeatures(
        wallet_address=wallet.wallet_address,
        transaction_count=0,
        incoming_count=0,
        outgoing_count=0,
        total_received=0.0,
        total_sent=0.0,
        average_transaction_amount=0.0,
        maximum_transaction_amount=0.0,
        transaction_frequency=0.0,
        active_days=0,
        average_time_between_transactions=0.0,
        transaction_burst_score=0.0,
        unique_counterparties=0,
        incoming_counterparties=0,
        outgoing_counterparties=0,
        incoming_outgoing_ratio=0.0,
        rapid_transfer_ratio=0.0,
        multi_hop_connections=0,
        degree=0,
        in_degree=0,
        out_degree=0,
        clustering_coefficient=0.0,
        connected_component_size=1,
        dominant_label=wallet.dominant_label,
        first_seen=wallet.first_seen.isoformat() if wallet.first_seen else None,
        last_seen=wallet.last_seen.isoformat() if wallet.last_seen else None,
    ))


FEATURE_DESCRIPTIONS = {
    "wallet_address": "Unique wallet identifier",
    
    "transaction_count": "Total number of transactions involving this wallet",
    "incoming_count": "Number of incoming transactions (wallet as recipient)",
    "outgoing_count": "Number of outgoing transactions (wallet as sender)",
    "total_received": "Total BTC received across all incoming transactions",
    "total_sent": "Total BTC sent across all outgoing transactions",
    "average_transaction_amount": "Mean transaction amount in BTC",
    "maximum_transaction_amount": "Largest single transaction amount in BTC",
    "transaction_frequency": "Average transactions per active day",
    
    "active_days": "Number of days between first and last transaction (min 1)",
    "average_time_between_transactions": "Mean time gap between consecutive transactions in hours",
    "transaction_burst_score": "Ratio of actual to expected transaction frequency (higher = bursty)",
    
    "unique_counterparties": "Total distinct wallets transacted with",
    "incoming_counterparties": "Distinct wallets that sent to this wallet",
    "outgoing_counterparties": "Distinct wallets this wallet sent to",
    
    "incoming_outgoing_ratio": "Total received / total sent (inf if sent=0)",
    "rapid_transfer_ratio": "Fraction of transactions labeled 'rapid_transfer'",
    "multi_hop_connections": "Counterparties that have their own connections (depth-2)",
    
    "degree": "Total connections in transaction graph (depth-1)",
    "in_degree": "Incoming connections in transaction graph",
    "out_degree": "Outgoing connections in transaction graph",
    "clustering_coefficient": "Local clustering coefficient from graph",
    "connected_component_size": "Size of connected component in depth-1 graph",
    
    "dominant_label": "Most common behavioral label for this wallet",
    "first_seen": "Timestamp of earliest transaction",
    "last_seen": "Timestamp of latest transaction",
}