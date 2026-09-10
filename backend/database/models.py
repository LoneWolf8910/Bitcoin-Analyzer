from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Index, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    txid = Column(String(64), nullable=False, unique=True, index=True)
    input_wallet = Column(String(50), nullable=False, index=True)
    output_wallet = Column(String(50), nullable=False, index=True)
    input_amount = Column(Float, nullable=False)
    output_amount = Column(Float, nullable=False)
    fee = Column(Float, nullable=False)
    script_type = Column(String(20), nullable=False)
    src_ip = Column(String(45), nullable=False)
    src_port = Column(Integer, nullable=False)
    dst_ip = Column(String(45), nullable=False)
    dst_port = Column(Integer, nullable=False)
    transaction_size = Column(Integer, nullable=False)
    block_height = Column(Integer, nullable=False, index=True)
    confirmation_count = Column(Integer, nullable=False)
    wallet_label = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_transactions_wallet_time", "input_wallet", "timestamp"),
        Index("ix_transactions_output_wallet_time", "output_wallet", "timestamp"),
        Index("ix_transactions_fee", "fee"),
        Index("ix_transactions_amount", "output_amount"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "txid": self.txid,
            "input_wallet": self.input_wallet,
            "output_wallet": self.output_wallet,
            "input_amount": self.input_amount,
            "output_amount": self.output_amount,
            "fee": self.fee,
            "script_type": self.script_type,
            "src_ip": self.src_ip,
            "src_port": self.src_port,
            "dst_ip": self.dst_ip,
            "dst_port": self.dst_port,
            "transaction_size": self.transaction_size,
            "block_height": self.block_height,
            "confirmation_count": self.confirmation_count,
            "wallet_label": self.wallet_label,
        }


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    wallet_address = Column(String(50), nullable=False, unique=True, index=True)
    total_received = Column(Float, default=0.0)
    total_sent = Column(Float, default=0.0)
    transaction_count = Column(Integer, default=0)
    incoming_count = Column(Integer, default=0)
    outgoing_count = Column(Integer, default=0)
    first_seen = Column(DateTime, nullable=True)
    last_seen = Column(DateTime, nullable=True)
    dominant_label = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_wallets_volume", "total_received", "total_sent"),
        Index("ix_wallets_activity", "transaction_count"),
    )

    def net_flow(self) -> float:
        return self.total_received - self.total_sent

    def to_dict(self):
        return {
            "id": self.id,
            "wallet_address": self.wallet_address,
            "total_received": self.total_received,
            "total_sent": self.total_sent,
            "net_flow": self.net_flow(),
            "transaction_count": self.transaction_count,
            "incoming_count": self.incoming_count,
            "outgoing_count": self.outgoing_count,
            "first_seen": self.first_seen.isoformat() if self.first_seen else None,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
            "dominant_label": self.dominant_label,
        }