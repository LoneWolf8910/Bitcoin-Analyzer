from typing import List, Optional, Tuple
from dataclasses import dataclass
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc

from backend.database.models import SolanaTransaction, SolanaWallet


@dataclass
class WalletSummary:
    wallet_address: str
    dominant_label: Optional[str] = None


@dataclass
class TransactionSummary:
    txid: str
    wallet_label: str


def get_wallet(db: Session, wallet_address: str) -> Optional[SolanaWallet]:
    return db.query(SolanaWallet).filter(SolanaWallet.wallet_address == wallet_address).first()


def get_wallet_transactions(
    db: Session,
    wallet_address: str,
    page: int = 1,
    page_size: int = 50,
    token_symbol: Optional[str] = None,
    gulfstream_status: Optional[str] = None,
) -> Tuple[List[SolanaTransaction], int]:
    query = db.query(SolanaTransaction).filter(
        or_(
            SolanaTransaction.fee_payer == wallet_address,
            SolanaTransaction.source_ata == wallet_address,
            SolanaTransaction.destination_ata == wallet_address,
            SolanaTransaction.authority == wallet_address,
        )
    ).order_by(desc(SolanaTransaction.timestamp))

    if token_symbol:
        query = query.filter(SolanaTransaction.token_symbol == token_symbol)
    if gulfstream_status:
        query = query.filter(SolanaTransaction.gulfstream_status == gulfstream_status)

    total = query.count()

    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return items, total


def get_transaction(db: Session, txid: str) -> Optional[SolanaTransaction]:
    return db.query(SolanaTransaction).filter(SolanaTransaction.signature == txid).first()


def search_wallets(db: Session, query: str, limit: int = 20) -> List[WalletSummary]:
    search_term = f"%{query}%"
    wallets = db.query(SolanaWallet).filter(
        SolanaWallet.wallet_address.ilike(search_term)
    ).limit(limit).all()

    return [
        WalletSummary(wallet_address=w.wallet_address, dominant_label=w.dominant_label)
        for w in wallets
    ]


def search_transactions(db: Session, query: str, limit: int = 20) -> List[TransactionSummary]:
    search_term = f"%{query}%"
    transactions = db.query(SolanaTransaction).filter(
        SolanaTransaction.signature.ilike(search_term)
    ).limit(limit).all()

    return [
        TransactionSummary(txid=t.signature, wallet_label=t.wallet_label)
        for t in transactions
    ]


def search_all(db: Session, query: str, limit: int = 20) -> Tuple[List[WalletSummary], List[TransactionSummary]]:
    if not query or len(query.strip()) < 2:
        return [], []

    wallets = search_wallets(db, query.strip(), limit)
    transactions = search_transactions(db, query.strip(), limit)

    return wallets, transactions