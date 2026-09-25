import csv
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database.connection import get_db
from ..database.models import SolanaTransaction, SolanaWallet, GulfStreamAnalytics, TokenAnalytics

logger = logging.getLogger(__name__)

CSV_PATH = Path(__file__).parent.parent.parent / "data" / "solana_transactions.csv"
BATCH_SIZE = 1000

REQUIRED_FIELDS = [
    "timestamp", "slot", "signature", "blockhash",
    "fee_payer", "fee", "compute_units_consumed", "compute_unit_price",
    "status", "error",
    "program_id", "program_name",
    "token_mint", "token_symbol", "token_decimals",
    "source_ata", "destination_ata", "authority",
    "amount_raw", "amount_ui",
    "instruction_type", "instruction_index",
    "gulfstream_status", "gulfstream_forwarded_at", "gulfstream_leader_slot",
    "pre_balances", "post_balances",
    "wallet_label", "is_vote", "is_inner_instruction"
]

NUMERIC_FIELDS = {
    "slot": int, "fee": int, "compute_units_consumed": int, "compute_unit_price": int,
    "token_decimals": int, "amount_raw": int, "amount_ui": float,
    "instruction_index": int, "gulfstream_leader_slot": lambda x: int(x) if x else None,
    "is_vote": lambda x: 1 if str(x).lower() in ("true", "1", "yes") else 0,
    "is_inner_instruction": lambda x: 1 if str(x).lower() in ("true", "1", "yes") else 0,
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
                if field not in ["error", "gulfstream_forwarded_at", "gulfstream_leader_slot"]:
                    raise ValueError(f"Missing required field: {field}")

        parsed = {}
        for field, converter in NUMERIC_FIELDS.items():
            try:
                val = row[field]
                if val == "" and field in ["gulfstream_forwarded_at", "gulfstream_leader_slot"]:
                    parsed[field] = None
                else:
                    parsed[field] = converter(val)
            except ValueError:
                raise ValueError(f"Invalid {field}: {row[field]}")

        parsed["timestamp"] = datetime.fromisoformat(row["timestamp"])
        if row["gulfstream_forwarded_at"]:
            parsed["gulfstream_forwarded_at"] = datetime.fromisoformat(row["gulfstream_forwarded_at"])
        else:
            parsed["gulfstream_forwarded_at"] = None

        parsed["signature"] = row["signature"].strip()
        parsed["blockhash"] = row["blockhash"].strip()
        parsed["fee_payer"] = row["fee_payer"].strip()
        parsed["status"] = row["status"].strip()
        parsed["error"] = row["error"].strip() if row["error"] else None
        parsed["program_id"] = row["program_id"].strip()
        parsed["program_name"] = row["program_name"].strip()
        parsed["token_mint"] = row["token_mint"].strip()
        parsed["token_symbol"] = row["token_symbol"].strip()
        parsed["source_ata"] = row["source_ata"].strip()
        parsed["destination_ata"] = row["destination_ata"].strip()
        parsed["authority"] = row["authority"].strip()
        parsed["instruction_type"] = row["instruction_type"].strip()
        parsed["gulfstream_status"] = row["gulfstream_status"].strip()
        parsed["pre_balances"] = row["pre_balances"].strip()
        parsed["post_balances"] = row["post_balances"].strip()
        parsed["wallet_label"] = row["wallet_label"].strip()

        if len(parsed["signature"]) < 80 or len(parsed["signature"]) > 88:
            raise ValueError(f"Invalid signature length: {len(parsed['signature'])}")

        if parsed["fee"] < 0 or parsed["amount_ui"] < 0:
            raise ValueError("Negative values not allowed")

        return parsed

    except Exception as e:
        logger.warning(f"Row {row_num}: {e}")
        return None


def ingest_csv(db: Session, csv_path: Path, stats: IngestionStats) -> None:
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    existing_sigs = set(
        sig for (sig,) in db.query(SolanaTransaction.signature).all()
    )
    logger.info(f"Found {len(existing_sigs)} existing transactions")

    wallet_stats: Dict[str, Dict] = {}
    token_stats: Dict[str, Dict] = {}
    gulfstream_stats: Dict[int, Dict] = {}
    batch: List[SolanaTransaction] = []

    with open(csv_path, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row_num, row in enumerate(reader, start=1):
            stats.total_rows += 1

            parsed = parse_row(row, row_num)
            if parsed is None:
                stats.malformed += 1
                continue

            sig = parsed["signature"]
            if sig in existing_sigs:
                stats.duplicates += 1
                continue

            tx = SolanaTransaction(**parsed)
            batch.append(tx)
            existing_sigs.add(sig)

            fee_payer = parsed["fee_payer"]
            source_ata = parsed["source_ata"]
            dest_ata = parsed["destination_ata"]
            authority = parsed["authority"]
            token_mint = parsed["token_mint"]
            token_symbol = parsed["token_symbol"]
            amount_ui = parsed["amount_ui"]
            ts = parsed["timestamp"]
            slot = parsed["slot"]
            fee = parsed["fee"]
            compute_units = parsed["compute_units_consumed"]
            gulfstream_status = parsed["gulfstream_status"]
            gulfstream_forwarded_at = parsed["gulfstream_forwarded_at"]

            for w_addr in [fee_payer, source_ata, dest_ata, authority]:
                if w_addr not in wallet_stats:
                    wallet_stats[w_addr] = {
                        "total_received_sol": 0.0,
                        "total_sent_sol": 0.0,
                        "total_received_usd": 0.0,
                        "total_sent_usd": 0.0,
                        "incoming_count": 0,
                        "outgoing_count": 0,
                        "first_seen": ts,
                        "last_seen": ts,
                        "labels": [],
                        "counterparties": set(),
                        "tokens": set(),
                        "gulfstream_forwarded": 0,
                        "gulfstream_dropped": 0,
                        "total_compute": 0,
                        "total_fees": 0,
                        "tx_count": 0,
                    }
                ws = wallet_stats[w_addr]
                ws["first_seen"] = min(ws["first_seen"], ts)
                ws["last_seen"] = max(ws["last_seen"], ts)
                ws["labels"].append(parsed["wallet_label"])
                ws["tokens"].add(token_symbol)
                ws["tx_count"] += 1
                ws["total_compute"] += compute_units
                ws["total_fees"] += fee

            if parsed["fee_payer"] == source_ata or parsed["authority"] == source_ata:
                ws = wallet_stats[source_ata]
                ws["outgoing_count"] += 1
                if token_symbol == "SOL":
                    ws["total_sent_sol"] += amount_ui
                else:
                    ws["total_sent_usd"] += amount_ui
                ws["counterparties"].add(dest_ata)

            if parsed["fee_payer"] == dest_ata or parsed["authority"] == dest_ata:
                ws = wallet_stats[dest_ata]
                ws["incoming_count"] += 1
                if token_symbol == "SOL":
                    ws["total_received_sol"] += amount_ui
                else:
                    ws["total_received_usd"] += amount_ui
                ws["counterparties"].add(source_ata)

            if token_mint not in token_stats:
                token_stats[token_mint] = {
                    "token_symbol": token_symbol,
                    "token_decimals": parsed["token_decimals"],
                    "total_transfers": 0,
                    "total_volume_raw": 0,
                    "total_volume_ui": 0.0,
                    "unique_wallets": set(),
                    "unique_atas": set(),
                    "largest_transfer": 0.0,
                    "first_seen": ts,
                    "last_seen": ts,
                }
            tks = token_stats[token_mint]
            tks["total_transfers"] += 1
            tks["total_volume_raw"] += parsed["amount_raw"]
            tks["total_volume_ui"] += amount_ui
            tks["unique_wallets"].add(fee_payer)
            tks["unique_wallets"].add(authority)
            tks["unique_atas"].add(source_ata)
            tks["unique_atas"].add(dest_ata)
            tks["largest_transfer"] = max(tks["largest_transfer"], amount_ui)
            tks["first_seen"] = min(tks["first_seen"], ts)
            tks["last_seen"] = max(tks["last_seen"], ts)

            if slot not in gulfstream_stats:
                gulfstream_stats[slot] = {
                    "total_transactions": 0,
                    "forwarded_count": 0,
                    "confirmed_count": 0,
                    "dropped_count": 0,
                    "pending_count": 0,
                    "forward_latencies": [],
                }
            gs = gulfstream_stats[slot]
            gs["total_transactions"] += 1
            if gulfstream_status == "gulfstream_forwarded":
                gs["forwarded_count"] += 1
                if gulfstream_forwarded_at:
                    latency = (gulfstream_forwarded_at - ts).total_seconds() * 1000
                    gs["forward_latencies"].append(latency)
            elif gulfstream_status == "gulfstream_confirmed" or gulfstream_status == "finalized":
                gs["confirmed_count"] += 1
            elif gulfstream_status == "gulfstream_dropped":
                gs["dropped_count"] += 1
            elif gulfstream_status == "gulfstream_pending":
                gs["pending_count"] += 1

            if gulfstream_status in ["gulfstream_forwarded", "gulfstream_confirmed", "finalized"]:
                ws = wallet_stats[fee_payer]
                ws["gulfstream_forwarded"] += 1
            elif gulfstream_status == "gulfstream_dropped":
                ws = wallet_stats[fee_payer]
                ws["gulfstream_dropped"] += 1

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
    update_token_analytics(db, token_stats)
    update_gulfstream_analytics(db, gulfstream_stats)
    logger.info(f"Ingestion complete: {stats.to_dict()}")


def update_wallets(db: Session, wallet_stats: Dict[str, Dict]) -> None:
    existing = {
        w.wallet_address: w
        for w in db.query(SolanaWallet).filter(
            SolanaWallet.wallet_address.in_(wallet_stats.keys())
        ).all()
    }

    for addr, stats in wallet_stats.items():
        label = max(set(stats["labels"]), key=stats["labels"].count) if stats["labels"] else None
        if addr in existing:
            w = existing[addr]
            w.total_received_sol += stats["total_received_sol"]
            w.total_sent_sol += stats["total_sent_sol"]
            w.total_received_usd += stats["total_received_usd"]
            w.total_sent_usd += stats["total_sent_usd"]
            w.incoming_count += stats["incoming_count"]
            w.outgoing_count += stats["outgoing_count"]
            w.transaction_count = w.incoming_count + w.outgoing_count
            w.token_diversity = len(stats["tokens"])
            w.unique_counterparties = len(stats["counterparties"])
            w.first_seen = min(w.first_seen, stats["first_seen"]) if w.first_seen else stats["first_seen"]
            w.last_seen = max(w.last_seen, stats["last_seen"]) if w.last_seen else stats["last_seen"]
            w.dominant_label = label
            w.gulfstream_forwarded_count += stats["gulfstream_forwarded"]
            w.gulfstream_dropped_count += stats["gulfstream_dropped"]
            w.avg_compute_units = stats["total_compute"] / stats["tx_count"] if stats["tx_count"] > 0 else 0
            w.total_fees_paid += stats["total_fees"]
            w.updated_at = datetime.utcnow()
        else:
            w = SolanaWallet(
                wallet_address=addr,
                total_received_sol=stats["total_received_sol"],
                total_sent_sol=stats["total_sent_sol"],
                total_received_usd=stats["total_received_usd"],
                total_sent_usd=stats["total_sent_usd"],
                incoming_count=stats["incoming_count"],
                outgoing_count=stats["outgoing_count"],
                transaction_count=stats["incoming_count"] + stats["outgoing_count"],
                token_diversity=len(stats["tokens"]),
                unique_counterparties=len(stats["counterparties"]),
                first_seen=stats["first_seen"],
                last_seen=stats["last_seen"],
                dominant_label=label,
                gulfstream_forwarded_count=stats["gulfstream_forwarded"],
                gulfstream_dropped_count=stats["gulfstream_dropped"],
                avg_compute_units=stats["total_compute"] / stats["tx_count"] if stats["tx_count"] > 0 else 0,
                total_fees_paid=stats["total_fees"],
            )
            db.add(w)

    db.flush()
    logger.info(f"Updated/created {len(wallet_stats)} wallets")


def update_token_analytics(db: Session, token_stats: Dict[str, Dict]) -> None:
    existing = {
        t.token_mint: t
        for t in db.query(TokenAnalytics).filter(
            TokenAnalytics.token_mint.in_(token_stats.keys())
        ).all()
    }

    for mint, stats in token_stats.items():
        if mint in existing:
            t = existing[mint]
            t.total_transfers += stats["total_transfers"]
            t.total_volume_raw += stats["total_volume_raw"]
            t.total_volume_ui += stats["total_volume_ui"]
            t.unique_wallets = len(stats["unique_wallets"])
            t.unique_atas = len(stats["unique_atas"])
            t.avg_transfer_size = t.total_volume_ui / t.total_transfers if t.total_transfers > 0 else 0
            t.largest_transfer = max(t.largest_transfer, stats["largest_transfer"])
            t.first_seen = min(t.first_seen, stats["first_seen"]) if t.first_seen else stats["first_seen"]
            t.last_seen = max(t.last_seen, stats["last_seen"]) if t.last_seen else stats["last_seen"]
            t.updated_at = datetime.utcnow()
        else:
            t = TokenAnalytics(
                token_mint=mint,
                token_symbol=stats["token_symbol"],
                token_decimals=stats["token_decimals"],
                total_transfers=stats["total_transfers"],
                total_volume_raw=stats["total_volume_raw"],
                total_volume_ui=stats["total_volume_ui"],
                unique_wallets=len(stats["unique_wallets"]),
                unique_atas=len(stats["unique_atas"]),
                avg_transfer_size=stats["total_volume_ui"] / stats["total_transfers"] if stats["total_transfers"] > 0 else 0,
                largest_transfer=stats["largest_transfer"],
                first_seen=stats["first_seen"],
                last_seen=stats["last_seen"],
            )
            db.add(t)

    db.flush()
    logger.info(f"Updated/created {len(token_stats)} token analytics")


def update_gulfstream_analytics(db: Session, gulfstream_stats: Dict[int, Dict]) -> None:
    existing = {
        g.slot: g
        for g in db.query(GulfStreamAnalytics).filter(
            GulfStreamAnalytics.slot.in_(gulfstream_stats.keys())
        ).all()
    }

    for slot, stats in gulfstream_stats.items():
        avg_latency = sum(stats["forward_latencies"]) / len(stats["forward_latencies"]) if stats["forward_latencies"] else 0
        efficiency = stats["confirmed_count"] / stats["total_transactions"] if stats["total_transactions"] > 0 else 0

        if slot in existing:
            g = existing[slot]
            g.total_transactions += stats["total_transactions"]
            g.forwarded_count += stats["forwarded_count"]
            g.confirmed_count += stats["confirmed_count"]
            g.dropped_count += stats["dropped_count"]
            g.pending_count += stats["pending_count"]
            g.avg_forward_latency_ms = (g.avg_forward_latency_ms + avg_latency) / 2
            g.leader_schedule_efficiency = (g.leader_schedule_efficiency + efficiency) / 2
        else:
            g = GulfStreamAnalytics(
                slot=slot,
                total_transactions=stats["total_transactions"],
                forwarded_count=stats["forwarded_count"],
                confirmed_count=stats["confirmed_count"],
                dropped_count=stats["dropped_count"],
                pending_count=stats["pending_count"],
                avg_forward_latency_ms=avg_latency,
                leader_schedule_efficiency=efficiency,
            )
            db.add(g)

    db.flush()
    logger.info(f"Updated/created {len(gulfstream_stats)} Gulf Stream analytics")


def run_ingestion(csv_path: Optional[Path] = None) -> IngestionStats:
    stats = IngestionStats()
    path = csv_path or CSV_PATH

    with get_db() as db:
        ingest_csv(db, path, stats)

    return stats


def get_stats(db: Session) -> Dict:
    tx_count = db.query(func.count(SolanaTransaction.id)).scalar() or 0
    wallet_count = db.query(func.count(SolanaWallet.id)).scalar() or 0

    volume = db.query(
        func.sum(SolanaTransaction.amount_ui),
        func.min(SolanaTransaction.timestamp),
        func.max(SolanaTransaction.timestamp)
    ).first()

    total_volume = volume[0] or 0.0
    earliest = volume[1]
    latest = volume[2]

    gulfstream = db.query(
        func.sum(GulfStreamAnalytics.total_transactions),
        func.sum(GulfStreamAnalytics.forwarded_count),
        func.sum(GulfStreamAnalytics.dropped_count),
        func.avg(GulfStreamAnalytics.avg_forward_latency_ms)
    ).first()

    return {
        "transaction_count": tx_count,
        "wallet_count": wallet_count,
        "total_volume_ui": round(total_volume, 4),
        "earliest_timestamp": earliest.isoformat() if earliest else None,
        "latest_timestamp": latest.isoformat() if latest else None,
        "gulfstream_total": gulfstream[0] or 0,
        "gulfstream_forwarded": gulfstream[1] or 0,
        "gulfstream_dropped": gulfstream[2] or 0,
        "gulfstream_avg_latency_ms": round(gulfstream[3] or 0, 2),
    }