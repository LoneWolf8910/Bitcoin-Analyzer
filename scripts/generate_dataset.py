#!/usr/bin/env python3
"""
Synthetic Bitcoin Transaction Dataset Generator
Deterministic generation using fixed random seed for reproducibility.
"""

import random
import hashlib
import ipaddress
import csv
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
import os


SEED = 42
NUM_TRANSACTIONS = 12000
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "bitcoin_transactions.csv")

SCRIPT_TYPES = [
    "P2PKH", "P2SH", "P2WPKH", "P2WSH", "P2TR",
    "P2PK", "MULTISIG", "OP_RETURN"
]

WALLET_BEHAVIOR_LABELS = [
    "normal", "anomalous", "high_activity", "rapid_transfer"
]

WALLET_CLUSTERS = {
    "exchange_cluster": {"count": 15, "label": "normal"},
    "mixer_cluster": {"count": 12, "label": "anomalous"},
    "merchant_cluster": {"count": 20, "label": "normal"},
    "whale_cluster": {"count": 8, "label": "high_activity"},
    "rapid_mover_cluster": {"count": 10, "label": "rapid_transfer"},
    "normal_user_cluster": {"count": 200, "label": "normal"},
    "darknet_cluster": {"count": 15, "label": "anomalous"},
}

IP_RANGES = {
    "tor_exit": ["185.220.101.0/24", "193.23.244.0/24", "194.165.16.0/24"],
    "datacenter": ["52.0.0.0/8", "34.0.0.0/8", "35.0.0.0/8"],
    "residential": ["1.0.0.0/8", "2.0.0.0/8", "5.0.0.0/8"],
    "vpn": ["45.0.0.0/8", "103.0.0.0/8", "185.0.0.0/8"],
}


def set_seed(seed: int = SEED):
    random.seed(seed)


def generate_wallet_address() -> str:
    chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    return "".join(random.choice(chars) for _ in range(random.randint(26, 35)))


def generate_txid() -> str:
    return hashlib.sha256(str(random.getrandbits(256)).encode()).hexdigest()[:64]


def generate_ip_from_range(cidr: str) -> str:
    network = ipaddress.IPv4Network(cidr)
    return str(network[random.randint(1, network.num_addresses - 2)])


def generate_ip(category: str = None) -> str:
    if category and category in IP_RANGES:
        return generate_ip_from_range(random.choice(IP_RANGES[category]))
    all_ranges = [r for ranges in IP_RANGES.values() for r in ranges]
    return generate_ip_from_range(random.choice(all_ranges))


def generate_port() -> int:
    common_ports = [8333, 8332, 18333, 18332, 38333, 8080, 443, 80, 9050, 9051]
    if random.random() < 0.7:
        return random.choice(common_ports)
    return random.randint(1024, 65535)


def generate_amount(log_min: float = -6, log_max: float = 4) -> float:
    return round(10 ** random.uniform(log_min, log_max), 8)


def generate_fee(amount: float) -> float:
    fee_rate = random.uniform(0.00001, 0.0005)
    return round(amount * fee_rate, 8)


def generate_transaction_size() -> int:
    base = random.randint(150, 300)
    inputs = random.randint(1, 10)
    outputs = random.randint(1, 5)
    return base + inputs * 148 + outputs * 34


class WalletPool:
    def __init__(self):
        self.wallets: Dict[str, Dict[str, Any]] = {}
        self.cluster_assignments: Dict[str, str] = {}
        self._initialize_wallets()

    def _initialize_wallets(self):
        wallet_id = 0
        for cluster_name, config in WALLET_CLUSTERS.items():
            for _ in range(config["count"]):
                addr = generate_wallet_address()
                self.wallets[addr] = {
                    "cluster": cluster_name,
                    "label": config["label"],
                    "tx_count": 0,
                    "total_volume": 0.0,
                    "first_seen": None,
                    "last_seen": None,
                }
                self.cluster_assignments[addr] = cluster_name
                wallet_id += 1

        for _ in range(50):
            addr = generate_wallet_address()
            self.wallets[addr] = {
                "cluster": "singleton",
                "label": random.choice(WALLET_BEHAVIOR_LABELS),
                "tx_count": 0,
                "total_volume": 0.0,
                "first_seen": None,
                "last_seen": None,
            }
            self.cluster_assignments[addr] = "singleton"

    def get_wallet(self, label: str = None) -> str:
        if label:
            candidates = [w for w, d in self.wallets.items() if d["label"] == label]
            if candidates:
                return random.choice(candidates)
        return random.choice(list(self.wallets.keys()))

    def update_wallet(self, addr: str, timestamp: datetime, amount: float):
        if addr in self.wallets:
            w = self.wallets[addr]
            w["tx_count"] += 1
            w["total_volume"] += amount
            if w["first_seen"] is None or timestamp < w["first_seen"]:
                w["first_seen"] = timestamp
            if w["last_seen"] is None or timestamp > w["last_seen"]:
                w["last_seen"] = timestamp


class TransactionGenerator:
    def __init__(self, wallet_pool: WalletPool, start_time: datetime):
        self.wallet_pool = wallet_pool
        self.current_time = start_time
        self.tx_counter = 0
        self.pending_hops: List[Tuple[str, datetime, int]] = []

    def generate_block_height(self) -> int:
        return 800000 + self.tx_counter // 10

    def generate_confirmations(self) -> int:
        if self.tx_counter < 100:
            return random.randint(1, 6)
        return random.randint(6, 1000)

    def _generate_normal_tx(self) -> Dict[str, Any]:
        input_wallet = self.wallet_pool.get_wallet("normal")
        output_wallet = self.wallet_pool.get_wallet("normal")
        amount = generate_amount(-4, 2)
        fee = generate_fee(amount)
        return self._build_tx(input_wallet, output_wallet, amount, fee, "normal")

    def _generate_high_volume_tx(self) -> Dict[str, Any]:
        input_wallet = self.wallet_pool.get_wallet("high_activity")
        output_wallet = self.wallet_pool.get_wallet("normal")
        amount = generate_amount(1, 5)
        fee = generate_fee(amount) * 2
        return self._build_tx(input_wallet, output_wallet, amount, fee, "high_activity")

    def _generate_rapid_transfer_tx(self) -> Dict[str, Any]:
        input_wallet = self.wallet_pool.get_wallet("rapid_transfer")
        if self.pending_hops and random.random() < 0.6:
            output_wallet, hop_time, hops_left = self.pending_hops.pop(0)
            if hops_left > 1:
                next_wallet = self.wallet_pool.get_wallet("rapid_transfer")
                self.pending_hops.append((next_wallet, hop_time + timedelta(seconds=random.randint(1, 30)), hops_left - 1))
        else:
            output_wallet = self.wallet_pool.get_wallet("rapid_transfer")
            hops = random.randint(3, 6)
            for i in range(1, hops):
                next_w = self.wallet_pool.get_wallet("rapid_transfer")
                self.pending_hops.append((next_w, self.current_time + timedelta(seconds=random.randint(1, 30) * i), hops - i))
        amount = generate_amount(-3, 1)
        fee = generate_fee(amount)
        return self._build_tx(input_wallet, output_wallet, amount, fee, "rapid_transfer")

    def _generate_anomalous_tx(self) -> Dict[str, Any]:
        pattern = random.choice(["mixer", "structuring", "large_transfer", "round_trip"])
        
        if pattern == "mixer":
            input_wallet = self.wallet_pool.get_wallet("anomalous")
            output_wallet = self.wallet_pool.get_wallet("anomalous")
            amount = generate_amount(-2, 2)
            fee = generate_fee(amount) * random.uniform(5, 20)
        
        elif pattern == "structuring":
            input_wallet = self.wallet_pool.get_wallet("anomalous")
            output_wallet = self.wallet_pool.get_wallet("normal")
            amount = round(random.uniform(0.009, 0.011), 8)
            fee = generate_fee(amount)
        
        elif pattern == "large_transfer":
            input_wallet = self.wallet_pool.get_wallet("anomalous")
            output_wallet = self.wallet_pool.get_wallet("normal")
            amount = generate_amount(3, 6)
            fee = generate_fee(amount) * random.uniform(0.1, 0.5)
        
        else:  # round_trip
            input_wallet = self.wallet_pool.get_wallet("anomalous")
            output_wallet = input_wallet
            amount = generate_amount(-1, 3)
            fee = generate_fee(amount) * 3

        return self._build_tx(input_wallet, output_wallet, amount, fee, "anomalous")

    def _build_tx(self, input_wallet: str, output_wallet: str, amount: float, fee: float, behavior: str) -> Dict[str, Any]:
        self.current_time += timedelta(seconds=random.randint(1, 120))
        
        input_amount = amount + fee
        output_amount = amount
        
        if behavior == "rapid_transfer":
            ip_category = "tor_exit" if random.random() < 0.4 else "vpn"
        elif behavior == "anomalous":
            ip_category = random.choice(["tor_exit", "vpn", "datacenter"])
        elif behavior == "high_activity":
            ip_category = "datacenter"
        else:
            ip_category = random.choice(["residential", "datacenter", "vpn"])

        tx = {
            "timestamp": self.current_time.isoformat(),
            "txid": generate_txid(),
            "input_wallet": input_wallet,
            "output_wallet": output_wallet,
            "input_amount": round(input_amount, 8),
            "output_amount": round(output_amount, 8),
            "fee": round(fee, 8),
            "script_type": random.choice(SCRIPT_TYPES),
            "src_ip": generate_ip(ip_category),
            "src_port": generate_port(),
            "dst_ip": generate_ip(ip_category),
            "dst_port": generate_port(),
            "transaction_size": generate_transaction_size(),
            "block_height": self.generate_block_height(),
            "confirmation_count": self.generate_confirmations(),
            "wallet_label": behavior,
        }
        
        self.wallet_pool.update_wallet(input_wallet, self.current_time, input_amount)
        self.wallet_pool.update_wallet(output_wallet, self.current_time, output_amount)
        
        self.tx_counter += 1
        return tx

    def generate_batch(self, count: int) -> List[Dict[str, Any]]:
        transactions = []
        for _ in range(count):
            r = random.random()
            if r < 0.55:
                tx = self._generate_normal_tx()
            elif r < 0.70:
                tx = self._generate_high_volume_tx()
            elif r < 0.85:
                tx = self._generate_rapid_transfer_tx()
            else:
                tx = self._generate_anomalous_tx()
            transactions.append(tx)
        return transactions


def write_csv(transactions: List[Dict[str, Any]], path: str):
    fieldnames = [
        "timestamp", "txid", "input_wallet", "output_wallet",
        "input_amount", "output_amount", "fee", "script_type",
        "src_ip", "src_port", "dst_ip", "dst_port",
        "transaction_size", "block_height", "confirmation_count",
        "wallet_label"
    ]
    
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(transactions)


def verify_dataset(path: str) -> Dict[str, Any]:
    with open(path, "r") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    unique_wallets = set()
    unique_txids = set()
    malformed = 0
    
    for row in rows:
        unique_wallets.add(row["input_wallet"])
        unique_wallets.add(row["output_wallet"])
        unique_txids.add(row["txid"])
        
        try:
            float(row["input_amount"])
            float(row["output_amount"])
            float(row["fee"])
            int(row["src_port"])
            int(row["dst_port"])
            int(row["transaction_size"])
            int(row["block_height"])
            int(row["confirmation_count"])
            datetime.fromisoformat(row["timestamp"])
            ipaddress.IPv4Address(row["src_ip"])
            ipaddress.IPv4Address(row["dst_ip"])
        except (ValueError, KeyError):
            malformed += 1
    
    return {
        "total_rows": len(rows),
        "unique_wallets": len(unique_wallets),
        "unique_txids": len(unique_txids),
        "malformed_records": malformed,
    }


def print_samples(transactions: List[Dict[str, Any]], n: int = 5):
    print(f"\n{'='*80}")
    print(f"SAMPLE RECORDS (first {n})")
    print(f"{'='*80}")
    for i, tx in enumerate(transactions[:n]):
        print(f"\n--- Record {i+1} ---")
        for k, v in tx.items():
            print(f"  {k}: {v}")


def main():
    print("Initializing deterministic generator with seed:", SEED)
    set_seed(SEED)
    
    print("Creating wallet pool...")
    wallet_pool = WalletPool()
    print(f"  Total wallets: {len(wallet_pool.wallets)}")
    for cluster, config in WALLET_CLUSTERS.items():
        count = sum(1 for w in wallet_pool.wallets.values() if w["cluster"] == cluster)
        print(f"  {cluster}: {count} wallets ({config['label']})")
    
    start_time = datetime(2024, 1, 1, 0, 0, 0)
    generator = TransactionGenerator(wallet_pool, start_time)
    
    print(f"\nGenerating {NUM_TRANSACTIONS} transactions...")
    transactions = generator.generate_batch(NUM_TRANSACTIONS)
    
    print(f"Writing to {OUTPUT_PATH}...")
    write_csv(transactions, OUTPUT_PATH)
    
    print("\nVerifying dataset...")
    stats = verify_dataset(OUTPUT_PATH)
    
    print(f"\n{'='*80}")
    print("DATASET STATISTICS")
    print(f"{'='*80}")
    print(f"Total rows:           {stats['total_rows']:,}")
    print(f"Unique wallets:       {stats['unique_wallets']:,}")
    print(f"Unique transactions:  {stats['unique_txids']:,}")
    print(f"Malformed records:    {stats['malformed_records']}")
    
    label_counts = {}
    for tx in transactions:
        label_counts[tx["wallet_label"]] = label_counts.get(tx["wallet_label"], 0) + 1
    
    print("\nBehavioral label distribution:")
    for label, count in sorted(label_counts.items()):
        print(f"  {label}: {count:,} ({count/len(transactions)*100:.1f}%)")
    
    print_samples(transactions, 5)
    
    print(f"\n{'='*80}")
    print("Dataset generation complete!")
    print(f"Output: {OUTPUT_PATH}")
    print(f"{'='*80}")


if __name__ == "__main__":
    main()