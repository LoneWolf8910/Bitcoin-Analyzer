# Bitcoin Transaction Dataset Schema

This document describes the structure and semantics of the synthetic Bitcoin transaction dataset.

## Overview

- **File**: `data/bitcoin_transactions.csv`
- **Format**: CSV with header
- **Encoding**: UTF-8
- **Rows**: ~12,000 transactions
- **Generation**: Deterministic (seed = 42)
- **Purpose**: Offline prototype for anomaly detection, entity clustering, and investigative lead generation

---

## Field Definitions

### Blockchain Layer Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `timestamp` | ISO 8601 datetime | Transaction broadcast time (UTC) | `2024-01-15T14:32:17` |
| `txid` | string (64 hex chars) | Transaction ID (SHA256 hash) | `a1b2c3d4e5f6...` |
| `input_wallet` | string (26-35 chars) | Sender wallet address (Base58/Bech32) | `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` |
| `output_wallet` | string (26-35 chars) | Receiver wallet address | `3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy` |
| `input_amount` | float (BTC) | Total input value including fee | `0.50012345` |
| `output_amount` | float (BTC) | Value sent to output wallet | `0.50000000` |
| `fee` | float (BTC) | Miner fee paid | `0.00012345` |
| `script_type` | enum | Output script type | `P2PKH`, `P2SH`, `P2WPKH`, `P2WSH`, `P2TR`, `P2PK`, `MULTISIG`, `OP_RETURN` |

### Network Layer Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `src_ip` | IPv4 address | Source IP observed relaying transaction | `185.220.101.42` |
| `src_port` | integer (1-65535) | Source port | `8333` |
| `dst_ip` | IPv4 address | Destination IP (peer/node) | `52.12.34.56` |
| `dst_port` | integer (1-65535) | Destination port | `8333` |

### Derived / Metadata Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `transaction_size` | integer (bytes) | Serialized transaction size | `226` |
| `block_height` | integer | Block height where confirmed | `800042` |
| `confirmation_count` | integer | Number of confirmations | `142` |

### Behavioral Label (Ground Truth for Evaluation)

| Field | Type | Description | Values |
|-------|------|-------------|--------|
| `wallet_label` | enum | Behavioral category of the **input wallet** for this transaction | `normal`, `anomalous`, `high_activity`, `rapid_transfer` |

> **Note**: `wallet_label` reflects the *input wallet's* behavioral cluster. This is synthetic ground truth for model evaluation only. In production, labels would be unknown.

---

## Behavioral Categories

| Label | Description | Typical Characteristics |
|-------|-------------|------------------------|
| `normal` | Standard user/merchant behavior | Residential/datacenter IPs, typical amounts (0.001-1 BTC), moderate frequency |
| `anomalous` | Suspicious patterns | Tor/VPN IPs, structuring (near 0.01 BTC), round-trip, high fees, mixer-like |
| `high_activity` | High-volume entities (exchanges, whales) | Datacenter IPs, large amounts (1-100+ BTC), high frequency |
| `rapid_transfer` | Fast multi-hop chains | Tor/VPN IPs, rapid successive txs (seconds apart), chain length 3-6 hops |

---

## Wallet Clusters (Synthetic Construction)

The dataset contains pre-defined wallet clusters to enable graph-based analysis:

| Cluster | Wallet Count | Label | Purpose |
|---------|-------------|-------|---------|
| `exchange_cluster` | 15 | normal | Centralized exchange hot wallets |
| `merchant_cluster` | 20 | normal | Payment processor / merchant wallets |
| `normal_user_cluster` | 200 | normal | Regular retail users |
| `whale_cluster` | 8 | high_activity | Large holders / institutional |
| `rapid_mover_cluster` | 10 | rapid_transfer | Peel chains / rapid movers |
| `mixer_cluster` | 12 | anomalous | CoinJoin / mixer participants |
| `darknet_cluster` | 15 | anomalous | Darknet market associated |
| `singleton` | 50 | mixed | One-off wallets |

Wallets repeat across transactions to form a transaction graph. Each wallet belongs to exactly one cluster.

---

## Data Consistency Rules

1. **Amount Conservation**: `input_amount = output_amount + fee` (within floating-point precision)
2. **Temporal Ordering**: Timestamps strictly increase across the dataset
3. **Block Height Monotonicity**: `block_height` increases every ~10 transactions
4. **Wallet Reuse**: Input/output wallets drawn from fixed pool (~330 wallets)
4. **IP Categories**: IPs sampled from realistic ranges (Tor, VPN, datacenter, residential)
5. **Port Realism**: 70% Bitcoin standard ports (8333, 18333, etc.), 30% ephemeral

---

## Anomalous Patterns Embedded

| Pattern | Description | Detection Signal |
|---------|-------------|-----------------|
| **Structuring** | Many txs ~0.01 BTC to avoid reporting | Amount clustering near threshold |
| **Peel Chain** | Large input → small output + large change, repeated | Rapid multi-hop, decreasing amounts |
| **Mixer-like** | High fees, Tor IPs, many inputs/outputs | Fee anomaly, IP category, graph structure |
| **Round-trip** | Funds return to same wallet | input_wallet == output_wallet |
| **Large Transfer** | Unusually large amounts (>10 BTC) | Amount outlier |
| **Rapid Succession** | Multiple txs within seconds from same wallet | Temporal clustering |

---

## Usage Notes

### For Training/Testing Split
```python
import pandas as pd
df = pd.read_csv("data/bitcoin_transactions.csv")
# Temporal split recommended (first 80% train, last 20% test)
split_idx = int(len(df) * 0.8)
train = df.iloc[:split_idx]
test = df.iloc[split_idx:]
```

### Graph Construction
- Nodes: Unique `input_wallet` ∪ `output_wallet`
- Edges: Directed from `input_wallet` → `output_wallet` per transaction
- Edge attributes: `amount`, `timestamp`, `txid`, `fee`

### Network Correlation
- Join on `src_ip`/`dst_ip` with external network captures
- Cluster by IP co-occurrence with wallet activity

---

## Generation Script

Source: `scripts/generate_dataset.py`

Key parameters:
- `SEED = 42` (deterministic)
- `NUM_TRANSACTIONS = 12000`
- `WALLET_CLUSTERS` configuration (modify for different distributions)

Run:
```bash
cd bitcoin-transaction-analyzer
python scripts/generate_dataset.py
```

---

## License

Generated for evaluation purposes. Synthetic data only — no real blockchain data included.