#!/usr/bin/env python3
"""
Dataset Ingestion Script
Ingests the synthetic Bitcoin transaction CSV into SQLite database.
"""

import os
import sys
import logging
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.database.connection import init_db, close_db
from backend.services.data_ingestion import run_ingestion, get_stats

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def main():
    print("=" * 60)
    print("BITCOIN TRANSACTION DATA INGESTION")
    print("=" * 60)

    print("\nInitializing database...")
    init_db()
    print("Database initialized.")

    print("\nStarting ingestion...")
    stats = run_ingestion()

    print("\n" + "=" * 60)
    print("INGESTION STATISTICS")
    print("=" * 60)
    print(f"Total CSV rows:      {stats.total_rows:,}")
    print(f"Inserted:            {stats.inserted:,}")
    print(f"Duplicates skipped:  {stats.duplicates:,}")
    print(f"Malformed rows:      {stats.malformed:,}")

    print("\nFetching database statistics...")
    from backend.database.connection import get_db
    with get_db() as db:
        db_stats = get_stats(db)

    print("\n" + "=" * 60)
    print("DATABASE STATISTICS")
    print("=" * 60)
    print(f"Transaction count:   {db_stats['transaction_count']:,}")
    print(f"Wallet count:        {db_stats['wallet_count']:,}")
    print(f"Total Volume (UI):   {db_stats['total_volume_ui']:,.4f}")
    print(f"Earliest timestamp:  {db_stats['earliest_timestamp']}")
    print(f"Latest timestamp:    {db_stats['latest_timestamp']}")

    close_db()
    print("\nDone!")


if __name__ == "__main__":
    main()