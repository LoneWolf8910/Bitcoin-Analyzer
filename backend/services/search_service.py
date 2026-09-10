from typing import List, Optional, Tuple
from dataclasses import dataclass
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc

from backend.database.models import Transaction, Wallet


@dataclass
class WalletSummary:
    wallet_address: str
    dominant_label: Optional[str] = None


@dataclass
class TransactionSummary:
    txid: str
    wallet_label: str


def get_wallet(db: Session, wallet_address: str) -> Optional[Wallet]:
    return db.query(Wallet).filter(Wallet.wallet_address == wallet_address).first()


def get_wallet_transactions(
    db: Session,
    wallet_address: str,
    page: int = 1,
    page_size: int = 50
) -> Tuple[List[Transaction], int]:
    query = db.query(Transaction).filter(
        or_(
            Transaction.input_wallet == wallet_address,
            Transaction.output_wallet == wallet_address
        )
    ).order_by(desc(Transaction.timestamp))

    total = query.count()
    total_pages = (total + page_size - 1) // page_size

    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return items, total


def get_transaction(db: Session, txid: str) -> Optional[Transaction]:
    return db.query(Transaction).filter(Transaction.txid == txid).first()


def search_wallets(db: Session, query: str, limit: int = 20) -> List[WalletSummary]:
    search_term = f"%{query}%"
    wallets = db.query(Wallet).filter(
        Wallet.wallet_address.ilike(search_term)
    ).limit(limit).all()

    return [
        WalletSummary(wallet_address=w.wallet_address, dominant_label=w.dominant_label)
        for w in wallets
    ]


def search_transactions(db: Session, query: str, limit: int = 20) -> List[TransactionSummary]:
    search_term = f"%{query}%"
    transactions = db.query(Transaction).filter(
        Transaction.txid.ilike(search_term)
    ).limit(limit).all()

    return [
        TransactionSummary(txid=t.txid, wallet_label=t.wallet_label)
        for t in transactions
    ]


def search_all(db: Session, query: str, limit: int = 20) -> Tuple[List[WalletSummary], List[TransactionSummary]]:
    if not query or len(query.strip()) < 2:
        return [], []

    wallets = search_wallets(db, query.strip(), limit)
    transactions = search_transactions(db, query.strip(), limit)

    return wallets, transactions