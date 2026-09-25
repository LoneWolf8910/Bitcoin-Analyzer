import networkx as nx
from typing import Dict, List, Set, Optional, Any
from dataclasses import dataclass, asdict
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database.connection import get_db
from backend.database.models import SolanaTransaction, SolanaWallet


@dataclass
class GraphNode:
    id: str
    type: str
    transaction_count: int
    total_received: float
    total_sent: float
    degree: int
    in_degree: int
    out_degree: int
    dominant_label: Optional[str] = None


@dataclass
class GraphEdge:
    source: str
    target: str
    txid: str
    amount: float
    timestamp: str


@dataclass
class WalletGraphResponse:
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    center_wallet: str
    depth: int
    stats: Dict[str, Any]


def build_wallet_graph(
    center_wallet: str,
    depth: int = 2,
    max_nodes: int = 500
) -> WalletGraphResponse:
    G = nx.DiGraph()

    with get_db() as db:
        center = db.query(SolanaWallet).filter(SolanaWallet.wallet_address == center_wallet).first()
        if not center:
            raise ValueError(f"Wallet not found: {center_wallet}")

        visited: Set[str] = {center_wallet}
        current_level: Set[str] = {center_wallet}
        edges_to_add: List[Dict] = []

        for current_depth in range(depth):
            next_level: Set[str] = set()

            for wallet_addr in current_level:
                transactions = db.query(SolanaTransaction).filter(
                    (SolanaTransaction.fee_payer == wallet_addr) | 
                    (SolanaTransaction.source_ata == wallet_addr) |
                    (SolanaTransaction.destination_ata == wallet_addr) |
                    (SolanaTransaction.authority == wallet_addr)
                ).all()

                for tx in transactions:
                    source = tx.source_ata
                    target = tx.destination_ata

                    edges_to_add.append({
                        "source": source,
                        "target": target,
                        "txid": tx.signature,
                        "amount": tx.amount_ui,
                        "timestamp": tx.timestamp.isoformat() if tx.timestamp else None,
                    })

                    if source not in visited:
                        next_level.add(source)
                    if target not in visited:
                        next_level.add(target)

            visited.update(next_level)
            current_level = next_level

            if len(visited) >= max_nodes:
                break

        wallet_stats = {}
        wallets = db.query(SolanaWallet).filter(SolanaWallet.wallet_address.in_(visited)).all()
        for w in wallets:
            wallet_stats[w.wallet_address] = {
                "transaction_count": w.transaction_count,
                "total_received": w.total_received_sol,
                "total_sent": w.total_sent_sol,
                "dominant_label": w.dominant_label,
            }

        for addr in visited:
            if addr not in wallet_stats:
                tx_count = db.query(func.count(SolanaTransaction.id)).filter(
                    (SolanaTransaction.fee_payer == addr) | 
                    (SolanaTransaction.source_ata == addr) |
                    (SolanaTransaction.destination_ata == addr) |
                    (SolanaTransaction.authority == addr)
                ).scalar() or 0

                received = db.query(func.sum(SolanaTransaction.amount_ui)).filter(
                    SolanaTransaction.destination_ata == addr
                ).scalar() or 0.0

                sent = db.query(func.sum(SolanaTransaction.amount_ui)).filter(
                    SolanaTransaction.source_ata == addr
                ).scalar() or 0.0

                wallet_stats[addr] = {
                    "transaction_count": tx_count,
                    "total_received": received,
                    "total_sent": sent,
                    "dominant_label": None,
                }

        for edge_data in edges_to_add:
            if len(G.nodes()) >= max_nodes:
                break
            G.add_edge(
                edge_data["source"],
                edge_data["target"],
                txid=edge_data["txid"],
                amount=edge_data["amount"],
                timestamp=edge_data["timestamp"],
            )

        for node_id in G.nodes():
            stats = wallet_stats.get(node_id, {})
            G.nodes[node_id].update({
                "type": "wallet",
                "transaction_count": stats.get("transaction_count", 0),
                "total_received": stats.get("total_received", 0.0),
                "total_sent": stats.get("total_sent", 0.0),
                "dominant_label": stats.get("dominant_label"),
            })

        clustering = nx.clustering(G.to_undirected()) if len(G.nodes()) > 1 else {}
        
        nodes_list = []
        for node_id, attrs in G.nodes(data=True):
            degree = G.degree(node_id)
            in_deg = G.in_degree(node_id)
            out_deg = G.out_degree(node_id)
            cluster_coeff = clustering.get(node_id, 0.0)

            nodes_list.append({
                "id": node_id,
                "type": attrs.get("type", "wallet"),
                "transaction_count": attrs.get("transaction_count", 0),
                "total_received": attrs.get("total_received", 0.0),
                "total_sent": attrs.get("total_sent", 0.0),
                "degree": degree,
                "in_degree": in_deg,
                "out_degree": out_deg,
                "clustering_coefficient": cluster_coeff,
                "dominant_label": attrs.get("dominant_label"),
            })

        edges_list = []
        for source, target, attrs in G.edges(data=True):
            edges_list.append({
                "source": source,
                "target": target,
                "txid": attrs.get("txid"),
                "amount": attrs.get("amount", 0.0),
                "timestamp": attrs.get("timestamp"),
            })

        stats = {
            "total_nodes": len(nodes_list),
            "total_edges": len(edges_list),
            "density": nx.density(G) if len(G.nodes()) > 1 else 0,
            "center_wallet": center_wallet,
            "depth": depth,
        }

        return WalletGraphResponse(
            nodes=nodes_list,
            edges=edges_list,
            center_wallet=center_wallet,
            depth=depth,
            stats=stats,
        )


def get_wallet_graph(
    wallet_address: str,
    depth: int = 2,
    max_nodes: int = 500
) -> Dict[str, Any]:
    response = build_wallet_graph(wallet_address, depth, max_nodes)
    return {
        "nodes": response.nodes,
        "edges": response.edges,
        "center_wallet": response.center_wallet,
        "depth": response.depth,
        "stats": response.stats,
    }