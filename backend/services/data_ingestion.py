import csv
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database.connection import get_db
from ..database.models import Transaction, Wallet

logger = logging.getLogger(__name__)

CSV_PATH = Path(__file__).parent.parent.parent / "data" / "bitcoin_transactions.csv"
BATCH_SIZE = 1000

REQUIRED_FIELDS = [
    "timestamp", "txid", "input_wallet", "output_wallet",
    "input_amount", "output_amount", "fee", "script_type",
    "src_ip", "src_port", "dst_ip", "dst_port",
    "transaction_size", "block_height", "confirmation_count",
    "wallet_label"
]

NUMERIC_FIELDS = {
    "input_amount": float, "output_amount": float, "fee": float,
    "src_port": int, "dst_port": int, "transaction_size": int,
    "block_height": int, "confirmation_count": int
}


class IngestionStats:
    def __init__(self):
        self.total_rows = 0
        self.inserted = 0
        self.duplicates = 0
        self.malformed = 0
        self.errors = []

    def to_dict(self):
        return {
            "total_rows": self.total_rows,
            "inserted": self.inserted,
            "duplicates": self.duplicates,
            "malformed": self.malformed,
            "errors": self.errors[:10],
        }


def parse_row(row: Dict[str, str], row_num: int) -> Optional[Dict]:
    try:
        for field in REQUIRED_FIELDS:
            if field not in row or row[field] == "":
                raise ValueError(f"Missing required field: {field}")

        parsed = {}
        for field, converter in NUMERIC_FIELDS.items():
            try:
                parsed[field] = converter(row[field])
            except ValueError:
                raise ValueError(f"Invalid {field}: {row[field]}")

        parsed["timestamp"] = datetime.fromisoformat(row["timestamp"])
        parsed["txid"] = row["txid"].strip()
        parsed["input_wallet"] = row["input_wallet"].strip()
        parsed["output_wallet"] = row["output_wallet"].strip()
        parsed["script_type"] = row["script_type"].strip()
        parsed["src_ip"] = row["src_ip"].strip()
        parsed["dst_ip"] = row["dst_ip"].strip()
        parsed["wallet_label"] = row["wallet_label"].strip()

        if parsed["txid"] == "" or len(parsed["txid"]) != 64:
            raise ValueError(f"Invalid txid length: {len(parsed['txid'])}")

        if parsed["input_amount"] < 0 or parsed["output_amount"] < 0 or parsed["fee"] < 0:
            raise ValueError("Negative amounts not allowed")

        return parsed

    except Exception as e:
        logger.warning(f"Row {row_num}: {e}")
        return None


def ingest_csv(db: Session, csv_path: Path, stats: IngestionStats) -> None:
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    existing_txids = set(
        txid for (txid,) in db.query(Transaction.txid).all()
    )
    logger.info(f"Found {len(existing_txids)} existing transactions")

    wallet_stats: Dict[str, Dict] = {}
    batch: List[Transaction] = []

    with open(csv_path, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row_num, row in enumerate(reader, start=1):
            stats.total_rows += 1

            parsed = parse_row(row, row_num)
            if parsed is None:
                stats.malformed += 1
                continue

            txid = parsed["txid"]
            if txid in existing_txids:
                stats.duplicates += 1
                continue

            tx = Transaction(**parsed)
            batch.append(tx)
            existing_txids.add(txid)

            in_w = parsed["input_wallet"]
            out_w = parsed["output_wallet"]
            amt = parsed["output_amount"]
            ts = parsed["timestamp"]

            for w_addr, is_outgoing in [(in_w, True), (out_w, False)]:
                if w_addr not in wallet_stats:
                    wallet_stats[w_addr] = {
                        "total_received": 0.0,
                        "total_sent": 0.0,
                        "incoming_count": 0,
                        "outgoing_count": 0,
                        "first_seen": ts,
                        "last_seen": ts,
                        "labels": [],
                    }
                ws = wallet_stats[w_addr]
                if is_outgoing:
                    ws["total_sent"] += amt
                    ws["outgoing_count"] += 1
                else:
                    ws["total_received"] += amt
                    ws["incoming_count"] += 1
                ws["first_seen"] = min(ws["first_seen"], ts)
                ws["last_seen"] = max(ws["last_seen"], ts)
                ws["labels"].append(parsed["wallet_label"])

            if len(batch) >= BATCH_SIZE:
                db.bulk_save_objects(batch)
                db.flush()
                stats.inserted += len(batch)
                batch.clear()
                logger.debug(f"Flushed batch at row {row_num}")

        if batch:
            db.bulk_save_objects(batch)
            db.flush()
            stats.inserted += len(batch)

    update_wallets(db, wallet_stats)
    logger.info(f"Ingestion complete: {stats.to_dict()}")


def update_wallets(db: Session, wallet_stats: Dict[str, Dict]) -> None:
    existing = {
        w.wallet_address: w
        for w in db.query(Wallet).filter(
            Wallet.wallet_address.in_(wallet_stats.keys())
        ).all()
    }

    for addr, stats in wallet_stats.items():
        if addr in existing:
            w = existing[addr]
            w.total_received += stats["total_received"]
            w.total_sent += stats["total_sent"]
            w.incoming_count += stats["incoming_count"]
            w.outgoing_count += stats["outgoing_count"]
            w.first_seen = min(w.first_seen, stats["first_seen"]) if w.first_seen else stats["first_seen"]
            w.last_seen = max(w.last_seen, stats["last_seen"]) if w.last_seen else stats["last_seen"]
            w.transaction_count = w.incoming_count + w.outgoing_count
            w.dominant_label = max(set(stats["labels"]), key=stats["labels"].count) if stats["labels"] else None
            w.updated_at = datetime.utcnow()
        else:
            label = max(set(stats["labels"]), key=stats["labels"].count) if stats["labels"] else None
            w = Wallet(
                wallet_address=addr,
                total_received=stats["total_received"],
                total_sent=stats["total_sent"],
                incoming_count=stats["incoming_count"],
                outgoing_count=stats["outgoing_count"],
                transaction_count=stats["incoming_count"] + stats["outgoing_count"],
                first_seen=stats["first_seen"],
                last_seen=stats["last_seen"],
                dominant_label=label,
            )
            db.add(w)

    db.flush()
    logger.info(f"Updated/created {len(wallet_stats)} wallets")


def run_ingestion(csv_path: Optional[Path] = None) -> IngestionStats:
    stats = IngestionStats()
    path = csv_path or CSV_PATH

    with get_db() as db:
        ingest_csv(db, path, stats)

    return stats


def get_stats(db: Session) -> Dict:
    tx_count = db.query(func.count(Transaction.id)).scalar() or 0
    wallet_count = db.query(func.count(Wallet.id)).scalar() or 0

    volume = db.query(
        func.sum(Transaction.output_amount),
        func.min(Transaction.timestamp),
        func.max(Transaction.timestamp)
    ).first()

    total_volume = volume[0] or 0.0
    earliest = volume[1]
    latest = volume[2]

    return {
        "transaction_count": tx_count,
        "wallet_count": wallet_count,
        "total_btc_volume": round(total_volume, 8),
        "earliest_timestamp": earliest.isoformat() if earliest else None,
        "latest_timestamp": latest.isoformat() if latest else None,
    }