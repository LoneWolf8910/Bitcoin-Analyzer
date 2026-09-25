from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Index, ForeignKey, UniqueConstraint, BigInteger
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class SolanaTransaction(Base):
    __tablename__ = "solana_transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    slot = Column(BigInteger, nullable=False, index=True)
    signature = Column(String(88), nullable=False, unique=True, index=True)
    blockhash = Column(String(44), nullable=False)
    fee_payer = Column(String(44), nullable=False, index=True)
    fee = Column(Integer, nullable=False)
    compute_units_consumed = Column(Integer, nullable=False)
    compute_unit_price = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, index=True)
    error = Column(String(100), nullable=True)
    program_id = Column(String(44), nullable=False, index=True)
    program_name = Column(String(50), nullable=False)
    token_mint = Column(String(44), nullable=False, index=True)
    token_symbol = Column(String(20), nullable=False, index=True)
    token_decimals = Column(Integer, nullable=False)
    source_ata = Column(String(44), nullable=False, index=True)
    destination_ata = Column(String(44), nullable=False, index=True)
    authority = Column(String(44), nullable=False, index=True)
    amount_raw = Column(BigInteger, nullable=False)
    amount_ui = Column(Float, nullable=False)
    instruction_type = Column(String(50), nullable=False)
    instruction_index = Column(Integer, nullable=False)
    gulfstream_status = Column(String(50), nullable=False, index=True)
    gulfstream_forwarded_at = Column(DateTime, nullable=True)
    gulfstream_leader_slot = Column(BigInteger, nullable=True)
    pre_balances = Column(String(500), nullable=False)
    post_balances = Column(String(500), nullable=False)
    wallet_label = Column(String(30), nullable=False, index=True)
    is_vote = Column(Integer, default=0)
    is_inner_instruction = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_sol_tx_wallet_time", "fee_payer", "timestamp"),
        Index("ix_sol_tx_token_time", "token_symbol", "timestamp"),
        Index("ix_sol_tx_gulfstream", "gulfstream_status", "slot"),
        Index("ix_sol_tx_program", "program_name", "timestamp"),
        Index("ix_sol_tx_amount", "amount_ui"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "slot": self.slot,
            "signature": self.signature,
            "blockhash": self.blockhash,
            "fee_payer": self.fee_payer,
            "fee": self.fee,
            "compute_units_consumed": self.compute_units_consumed,
            "compute_unit_price": self.compute_unit_price,
            "status": self.status,
            "error": self.error,
            "program_id": self.program_id,
            "program_name": self.program_name,
            "token_mint": self.token_mint,
            "token_symbol": self.token_symbol,
            "token_decimals": self.token_decimals,
            "source_ata": self.source_ata,
            "destination_ata": self.destination_ata,
            "authority": self.authority,
            "amount_raw": self.amount_raw,
            "amount_ui": self.amount_ui,
            "instruction_type": self.instruction_type,
            "instruction_index": self.instruction_index,
            "gulfstream_status": self.gulfstream_status,
            "gulfstream_forwarded_at": self.gulfstream_forwarded_at.isoformat() if self.gulfstream_forwarded_at else None,
            "gulfstream_leader_slot": self.gulfstream_leader_slot,
            "pre_balances": self.pre_balances,
            "post_balances": self.post_balances,
            "wallet_label": self.wallet_label,
            "is_vote": self.is_vote,
            "is_inner_instruction": self.is_inner_instruction,
        }


class SolanaWallet(Base):
    __tablename__ = "solana_wallets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    wallet_address = Column(String(44), nullable=False, unique=True, index=True)
    total_received_sol = Column(Float, default=0.0)
    total_sent_sol = Column(Float, default=0.0)
    total_received_usd = Column(Float, default=0.0)
    total_sent_usd = Column(Float, default=0.0)
    transaction_count = Column(Integer, default=0)
    incoming_count = Column(Integer, default=0)
    outgoing_count = Column(Integer, default=0)
    token_diversity = Column(Integer, default=0)
    unique_counterparties = Column(Integer, default=0)
    first_seen = Column(DateTime, nullable=True)
    last_seen = Column(DateTime, nullable=True)
    dominant_label = Column(String(30), nullable=True)
    gulfstream_forwarded_count = Column(Integer, default=0)
    gulfstream_dropped_count = Column(Integer, default=0)
    avg_compute_units = Column(Float, default=0.0)
    total_fees_paid = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_sol_wallets_volume", "total_received_sol", "total_sent_sol"),
        Index("ix_sol_wallets_activity", "transaction_count"),
        Index("ix_sol_wallets_gulfstream", "gulfstream_forwarded_count"),
    )

    def net_flow_sol(self) -> float:
        return self.total_received_sol - self.total_sent_sol

    def net_flow_usd(self) -> float:
        return self.total_received_usd - self.total_sent_usd

    def to_dict(self):
        return {
            "id": self.id,
            "wallet_address": self.wallet_address,
            "total_received_sol": self.total_received_sol,
            "total_sent_sol": self.total_sent_sol,
            "total_received_usd": self.total_received_usd,
            "total_sent_usd": self.total_sent_usd,
            "net_flow_sol": self.net_flow_sol(),
            "net_flow_usd": self.net_flow_usd(),
            "transaction_count": self.transaction_count,
            "incoming_count": self.incoming_count,
            "outgoing_count": self.outgoing_count,
            "token_diversity": self.token_diversity,
            "unique_counterparties": self.unique_counterparties,
            "first_seen": self.first_seen.isoformat() if self.first_seen else None,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
            "dominant_label": self.dominant_label,
            "gulfstream_forwarded_count": self.gulfstream_forwarded_count,
            "gulfstream_dropped_count": self.gulfstream_dropped_count,
            "avg_compute_units": self.avg_compute_units,
            "total_fees_paid": self.total_fees_paid,
        }


class GulfStreamAnalytics(Base):
    __tablename__ = "gulfstream_analytics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    slot = Column(BigInteger, nullable=False, index=True)
    total_transactions = Column(Integer, default=0)
    forwarded_count = Column(Integer, default=0)
    confirmed_count = Column(Integer, default=0)
    dropped_count = Column(Integer, default=0)
    pending_count = Column(Integer, default=0)
    avg_forward_latency_ms = Column(Float, default=0.0)
    leader_schedule_efficiency = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    def forward_rate(self) -> float:
        return self.forwarded_count / self.total_transactions if self.total_transactions > 0 else 0.0

    def drop_rate(self) -> float:
        return self.dropped_count / self.total_transactions if self.total_transactions > 0 else 0.0

    def to_dict(self):
        return {
            "id": self.id,
            "slot": self.slot,
            "total_transactions": self.total_transactions,
            "forwarded_count": self.forwarded_count,
            "confirmed_count": self.confirmed_count,
            "dropped_count": self.dropped_count,
            "pending_count": self.pending_count,
            "avg_forward_latency_ms": self.avg_forward_latency_ms,
            "leader_schedule_efficiency": self.leader_schedule_efficiency,
            "forward_rate": self.forward_rate(),
            "drop_rate": self.drop_rate(),
        }


class TokenAnalytics(Base):
    __tablename__ = "token_analytics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    token_mint = Column(String(44), nullable=False, unique=True, index=True)
    token_symbol = Column(String(20), nullable=False)
    token_decimals = Column(Integer, nullable=False)
    total_transfers = Column(Integer, default=0)
    total_volume_raw = Column(BigInteger, default=0)
    total_volume_ui = Column(Float, default=0.0)
    unique_wallets = Column(Integer, default=0)
    unique_atas = Column(Integer, default=0)
    avg_transfer_size = Column(Float, default=0.0)
    largest_transfer = Column(Float, default=0.0)
    first_seen = Column(DateTime, nullable=True)
    last_seen = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "token_mint": self.token_mint,
            "token_symbol": self.token_symbol,
            "token_decimals": self.token_decimals,
            "total_transfers": self.total_transfers,
            "total_volume_ui": self.total_volume_ui,
            "unique_wallets": self.unique_wallets,
            "unique_atas": self.unique_atas,
            "avg_transfer_size": self.avg_transfer_size,
            "largest_transfer": self.largest_transfer,
            "first_seen": self.first_seen.isoformat() if self.first_seen else None,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
        }