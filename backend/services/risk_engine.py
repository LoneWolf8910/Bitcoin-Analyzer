from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import numpy as np

from backend.database.connection import get_db
from backend.database.models import Wallet, Transaction
from backend.services.feature_engineering import extract_wallet_features
from backend.ml.predict import predict_anomaly, load_model
from backend.services.graph_service import build_wallet_graph


RISK_WEIGHTS = {
    "ml_anomaly": 0.25,
    "transaction_behavior": 0.20,
    "graph_behavior": 0.15,
    "rapid_movement": 0.15,
    "frequency": 0.15,
    "counterparty_concentration": 0.10,
}

RISK_LEVELS = {
    (0, 29): "LOW",
    (30, 59): "MEDIUM",
    (60, 79): "HIGH",
    (80, 100): "CRITICAL",
}


@dataclass
class RiskFactor:
    name: str
    score: float
    weight: float
    contribution: float
    explanation: str
    feature_values: Dict[str, Any]


@dataclass
class RiskResult:
    wallet_address: str
    risk_score: int
    risk_level: str
    reasons: List[str]
    factor_breakdown: List[Dict[str, Any]]


def get_risk_level(score: int) -> str:
    for (low, high), level in RISK_LEVELS.items():
        if low <= score <= high:
            return level
    return "UNKNOWN"


def normalize_score(value: float, min_val: float, max_val: float, invert: bool = False) -> float:
    if max_val == min_val:
        return 0.5
    normalized = (value - min_val) / (max_val - min_val)
    normalized = max(0.0, min(1.0, normalized))
    return 1.0 - normalized if invert else normalized


def calculate_ml_anomaly_score(wallet_address: str) -> RiskFactor:
    try:
        result = predict_anomaly(wallet_address)
        anomaly_score = result.anomaly_score
        
        pipeline, config = load_model()
        feature_means = config.feature_means
        feature_stds = config.feature_stds
        
        if "anomaly_score" in feature_means:
            mean_score = feature_means["anomaly_score"]
            std_score = feature_stds.get("anomaly_score", 1.0)
        else:
            mean_score = 0.0
            std_score = 0.1
        
        z_score = (anomaly_score - mean_score) / max(std_score, 0.001)
        normalized = max(0.0, min(1.0, (z_score + 3) / 6))
        
        explanations = []
        if result.is_anomaly:
            explanations.append(f"ML model flagged as anomalous (score: {anomaly_score:.3f})")
        else:
            explanations.append(f"ML model score within normal range (score: {anomaly_score:.3f})")
        
        return RiskFactor(
            name="ml_anomaly",
            score=normalized * 100,
            weight=RISK_WEIGHTS["ml_anomaly"],
            contribution=normalized * 100 * RISK_WEIGHTS["ml_anomaly"],
            explanation="; ".join(explanations),
            feature_values={"anomaly_score": anomaly_score, "is_anomaly": result.is_anomaly},
        )
    except Exception as e:
        return RiskFactor(
            name="ml_anomaly",
            score=0.0,
            weight=RISK_WEIGHTS["ml_anomaly"],
            contribution=0.0,
            explanation=f"ML model unavailable: {e}",
            feature_values={},
        )


def calculate_transaction_behavior(features: Dict[str, Any], stats: Dict[str, float]) -> RiskFactor:
    score = 0.0
    explanations = []
    feature_vals = {}
    
    tx_count = features.get("transaction_count", 0)
    mean_tx = stats.get("transaction_count_mean", 71)
    std_tx = stats.get("transaction_count_std", 29)
    if std_tx > 0:
        z = (tx_count - mean_tx) / std_tx
        tx_score = max(0.0, min(1.0, (z + 3) / 6))
        score += tx_score * 30
        feature_vals["transaction_count"] = tx_count
        feature_vals["transaction_count_z"] = round(z, 2)
        if z > 2:
            explanations.append(f"Unusually high transaction count ({tx_count}, z={z:.1f})")
        elif z < -2:
            explanations.append(f"Unusually low transaction count ({tx_count}, z={z:.1f})")
    
    total_received = features.get("total_received", 0.0)
    mean_recv = stats.get("total_received_mean", 256163)
    std_recv = stats.get("total_received_std", 340901)
    if std_recv > 0 and total_received > 0:
        z = (total_received - mean_recv) / std_recv
        recv_score = max(0.0, min(1.0, (z + 3) / 6))
        score += recv_score * 25
        feature_vals["total_received"] = total_received
        feature_vals["total_received_z"] = round(z, 2)
        if z > 2:
            explanations.append(f"Unusually high volume received ({total_received:.2f} BTC, z={z:.1f})")
    
    total_sent = features.get("total_sent", 0.0)
    mean_sent = stats.get("total_sent_mean", 256163)
    std_sent = stats.get("total_sent_std", 642487)
    if std_sent > 0 and total_sent > 0:
        z = (total_sent - mean_sent) / std_sent
        sent_score = max(0.0, min(1.0, (z + 3) / 6))
        score += sent_score * 25
        feature_vals["total_sent"] = total_sent
        feature_vals["total_sent_z"] = round(z, 2)
        if z > 2:
            explanations.append(f"Unusually high volume sent ({total_sent:.2f} BTC, z={z:.1f})")
    
    max_tx_amt = features.get("maximum_transaction_amount", 0.0)
    mean_max = stats.get("maximum_transaction_amount_mean", 255134)
    std_max = stats.get("maximum_transaction_amount_std", 285771)
    if std_max > 0 and max_tx_amt > 0:
        z = (max_tx_amt - mean_max) / std_max
        max_score = max(0.0, min(1.0, (z + 3) / 6))
        score += max_score * 20
        feature_vals["maximum_transaction_amount"] = max_tx_amt
        feature_vals["maximum_transaction_amount_z"] = round(z, 2)
        if z > 2:
            explanations.append(f"Contains unusually large single transaction ({max_tx_amt:.2f} BTC, z={z:.1f})")
    
    return RiskFactor(
        name="transaction_behavior",
        score=min(100.0, score),
        weight=RISK_WEIGHTS["transaction_behavior"],
        contribution=min(100.0, score) * RISK_WEIGHTS["transaction_behavior"],
        explanation="; ".join(explanations) if explanations else "Transaction behavior within normal ranges",
        feature_values=feature_vals,
    )


def calculate_graph_behavior(features: Dict[str, Any], stats: Dict[str, float]) -> RiskFactor:
    score = 0.0
    explanations = []
    feature_vals = {}
    
    degree = features.get("degree", 0)
    mean_deg = stats.get("degree_mean", 57)
    std_deg = stats.get("degree_std", 13)
    if std_deg > 0:
        z = (degree - mean_deg) / std_deg
        deg_score = max(0.0, min(1.0, (z + 3) / 6))
        score += deg_score * 40
        feature_vals["degree"] = degree
        feature_vals["degree_z"] = round(z, 2)
        if z > 2:
            explanations.append(f"Unusually high graph connectivity (degree={degree}, z={z:.1f})")
    
    cc_size = features.get("connected_component_size", 1)
    mean_cc = stats.get("connected_component_size_mean", 55)
    std_cc = stats.get("connected_component_size_std", 15)
    if std_cc > 0:
        z = (cc_size - mean_cc) / std_cc
        cc_score = max(0.0, min(1.0, (z + 3) / 6))
        score += cc_score * 30
        feature_vals["connected_component_size"] = cc_size
        feature_vals["connected_component_size_z"] = round(z, 2)
        if z > 2:
            explanations.append(f"Part of unusually large connected component ({cc_size}, z={z:.1f})")
    
    clustering = features.get("clustering_coefficient", 0.0)
    feature_vals["clustering_coefficient"] = clustering
    if clustering > 0.5:
        explanations.append(f"High local clustering coefficient ({clustering:.3f})")
        score += min(1.0, clustering) * 30
    else:
        score += 0
    
    return RiskFactor(
        name="graph_behavior",
        score=min(100.0, score),
        weight=RISK_WEIGHTS["graph_behavior"],
        contribution=min(100.0, score) * RISK_WEIGHTS["graph_behavior"],
        explanation="; ".join(explanations) if explanations else "Graph behavior within normal ranges",
        feature_values=feature_vals,
    )


def calculate_rapid_movement(features: Dict[str, Any], stats: Dict[str, float]) -> RiskFactor:
    score = 0.0
    explanations = []
    feature_vals = {}
    
    rapid_ratio = features.get("rapid_transfer_ratio", 0.0)
    feature_vals["rapid_transfer_ratio"] = rapid_ratio
    if rapid_ratio > 0.5:
        explanations.append(f"High rapid transfer ratio ({rapid_ratio:.1%} of transactions)")
        score += rapid_ratio * 60
    elif rapid_ratio > 0.1:
        explanations.append(f"Moderate rapid transfer ratio ({rapid_ratio:.1%})")
        score += rapid_ratio * 40
    else:
        explanations.append("No rapid transfer pattern detected")
    
    multi_hop = features.get("multi_hop_connections", 0)
    mean_mh = stats.get("multi_hop_connections_mean", 6.6)
    std_mh = stats.get("multi_hop_connections_std", 8.5)
    if std_mh > 0 and multi_hop > 0:
        z = (multi_hop - mean_mh) / std_mh
        mh_score = max(0.0, min(1.0, (z + 3) / 6))
        score += mh_score * 40
        feature_vals["multi_hop_connections"] = multi_hop
        feature_vals["multi_hop_connections_z"] = round(z, 2)
        if z > 2:
            explanations.append(f"High multi-hop connection count ({multi_hop}, z={z:.1f})")
    
    in_out_ratio = features.get("incoming_outgoing_ratio", 0.0)
    feature_vals["incoming_outgoing_ratio"] = in_out_ratio
    if in_out_ratio == float('inf'):
        explanations.append("Wallet only receives, never sends (potential sink)")
        score += 50
    elif in_out_ratio > 1000:
        explanations.append(f"Extreme incoming/outgoing imbalance ({in_out_ratio:.0f}:1)")
        score += 40
    elif in_out_ratio > 100:
        explanations.append(f"High incoming/outgoing imbalance ({in_out_ratio:.0f}:1)")
        score += 20
    elif in_out_ratio > 0 and in_out_ratio < 0.01:
        explanations.append(f"Extreme outgoing bias (ratio: {in_out_ratio:.4f})")
        score += 30
    
    return RiskFactor(
        name="rapid_movement",
        score=min(100.0, score),
        weight=RISK_WEIGHTS["rapid_movement"],
        contribution=min(100.0, score) * RISK_WEIGHTS["rapid_movement"],
        explanation="; ".join(explanations),
        feature_values=feature_vals,
    )


def calculate_frequency(features: Dict[str, Any], stats: Dict[str, float]) -> RiskFactor:
    score = 0.0
    explanations = []
    feature_vals = {}
    
    freq = features.get("transaction_frequency", 0.0)
    mean_freq = stats.get("transaction_frequency_mean", 9.07)
    std_freq = stats.get("transaction_frequency_std", 3.61)
    if std_freq > 0:
        z = (freq - mean_freq) / std_freq
        freq_score = max(0.0, min(1.0, (z + 3) / 6))
        score += freq_score * 50
        feature_vals["transaction_frequency"] = freq
        feature_vals["transaction_frequency_z"] = round(z, 2)
        if z > 2:
            explanations.append(f"Unusually high transaction frequency ({freq:.1f} tx/day, z={z:.1f})")
        elif z < -2:
            explanations.append(f"Unusually low transaction frequency ({freq:.1f} tx/day, z={z:.1f})")
    
    burst = features.get("transaction_burst_score", 1.0)
    mean_burst = stats.get("transaction_burst_score_mean", 1.06)
    std_burst = stats.get("transaction_burst_score_std", 0.038)
    if std_burst > 0:
        z = (burst - mean_burst) / std_burst
        burst_score = max(0.0, min(1.0, (z + 3) / 6))
        score += burst_score * 50
        feature_vals["transaction_burst_score"] = burst
        feature_vals["transaction_burst_score_z"] = round(z, 2)
        if z > 2:
            explanations.append(f"Highly bursty transaction pattern (burst_score={burst:.3f}, z={z:.1f})")
    
    avg_time = features.get("average_time_between_transactions", 0.0)
    feature_vals["average_time_between_transactions"] = avg_time
    if 0 < avg_time < 0.5:
        explanations.append(f"Very short intervals between transactions ({avg_time:.2f} hours)")
        score += 30
    
    return RiskFactor(
        name="frequency",
        score=min(100.0, score),
        weight=RISK_WEIGHTS["frequency"],
        contribution=min(100.0, score) * RISK_WEIGHTS["frequency"],
        explanation="; ".join(explanations) if explanations else "Transaction frequency within normal ranges",
        feature_values=feature_vals,
    )


def calculate_counterparty_concentration(features: Dict[str, Any], stats: Dict[str, float]) -> RiskFactor:
    score = 0.0
    explanations = []
    feature_vals = {}
    
    unique_cps = features.get("unique_counterparties", 0)
    mean_cps = stats.get("unique_counterparties_mean", 54)
    std_cps = stats.get("unique_counterparties_std", 15)
    if std_cps > 0:
        z = (unique_cps - mean_cps) / std_cps
        cps_score = max(0.0, min(1.0, (z + 3) / 6))
        score += cps_score * 50
        feature_vals["unique_counterparties"] = unique_cps
        feature_vals["unique_counterparties_z"] = round(z, 2)
        if z > 2:
            explanations.append(f"Unusually high number of counterparties ({unique_cps}, z={z:.1f})")
        elif z < -2:
            explanations.append(f"Unusually low number of counterparties ({unique_cps}, z={z:.1f})")
    
    in_cps = features.get("incoming_counterparties", 0)
    out_cps = features.get("outgoing_counterparties", 0)
    feature_vals["incoming_counterparties"] = in_cps
    feature_vals["outgoing_counterparties"] = out_cps
    
    if in_cps > 0 and out_cps > 0:
        ratio = max(in_cps, out_cps) / min(in_cps, out_cps)
        feature_vals["counterparty_ratio"] = ratio
        if ratio > 10:
            explanations.append(f"Highly asymmetric counterparty distribution ({ratio:.1f}:1)")
            score += min(50.0, ratio * 5)
    
    return RiskFactor(
        name="counterparty_concentration",
        score=min(100.0, score),
        weight=RISK_WEIGHTS["counterparty_concentration"],
        contribution=min(100.0, score) * RISK_WEIGHTS["counterparty_concentration"],
        explanation="; ".join(explanations) if explanations else "Counterparty distribution within normal ranges",
        feature_values=feature_vals,
    )


def get_training_stats() -> Dict[str, float]:
    try:
        _, config = load_model()
        stats = {}
        for feat, mean in config.feature_means.items():
            stats[f"{feat}_mean"] = mean
        for feat, std in config.feature_stds.items():
            stats[f"{feat}_std"] = std
        return stats
    except Exception:
        return {
            "transaction_count_mean": 71, "transaction_count_std": 29,
            "total_received_mean": 256163, "total_received_std": 340901,
            "total_sent_mean": 256163, "total_sent_std": 642487,
            "maximum_transaction_amount_mean": 255134, "maximum_transaction_amount_std": 285771,
            "degree_mean": 57, "degree_std": 13,
            "connected_component_size_mean": 55, "connected_component_size_std": 15,
            "multi_hop_connections_mean": 6.6, "multi_hop_connections_std": 8.5,
            "transaction_frequency_mean": 9.07, "transaction_frequency_std": 3.61,
            "transaction_burst_score_mean": 1.06, "transaction_burst_score_std": 0.038,
            "unique_counterparties_mean": 54, "unique_counterparties_std": 15,
        }


def calculate_wallet_risk(wallet_address: str) -> Dict[str, Any]:
    with get_db() as db:
        wallet = db.query(Wallet).filter(Wallet.wallet_address == wallet_address).first()
        if not wallet:
            raise ValueError(f"Wallet not found: {wallet_address}")

    features = extract_wallet_features(wallet_address)
    stats = get_training_stats()

    factors = [
        calculate_ml_anomaly_score(wallet_address),
        calculate_transaction_behavior(features, stats),
        calculate_graph_behavior(features, stats),
        calculate_rapid_movement(features, stats),
        calculate_frequency(features, stats),
        calculate_counterparty_concentration(features, stats),
    ]

    total_score = sum(f.contribution for f in factors)
    risk_score = int(round(total_score))
    risk_level = get_risk_level(risk_score)

    all_reasons = []
    for f in factors:
        if f.explanation and f.contribution > 0.5:
            all_reasons.append(f"{f.name}: {f.explanation}")

    factor_breakdown = []
    for f in factors:
        factor_breakdown.append({
            "factor": f.name,
            "raw_score": round(f.score, 1),
            "weight": f.weight,
            "weighted_contribution": round(f.contribution, 1),
            "explanation": f.explanation,
            "feature_values": f.feature_values,
        })

    return {
        "wallet_address": wallet_address,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "reasons": all_reasons,
        "factor_breakdown": factor_breakdown,
    }


if __name__ == "__main__":
    import sys
    import json
    if len(sys.argv) > 1:
        result = calculate_wallet_risk(sys.argv[1])
        print(json.dumps(asdict(result), indent=2))