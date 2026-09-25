from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class HealthResponse(BaseModel):
    status: str
    offline: bool


class IngestResponse(BaseModel):
    message: str
    stats: dict


class StatsResponse(BaseModel):
    transaction_count: int
    wallet_count: int
    total_volume_ui: float
    earliest_timestamp: Optional[str]
    latest_timestamp: Optional[str]
    gulfstream_total: int = 0
    gulfstream_forwarded: int = 0
    gulfstream_dropped: int = 0
    gulfstream_avg_latency_ms: float = 0.0


class WalletResponse(BaseModel):
    wallet_address: str
    transaction_count: int
    total_received: float
    total_sent: float
    net_flow: float
    incoming_count: int
    outgoing_count: int
    first_seen: Optional[str]
    last_seen: Optional[str]
    dominant_label: Optional[str]


class TransactionResponse(BaseModel):
    id: int
    timestamp: str
    txid: str
    input_wallet: str
    output_wallet: str
    input_amount: float
    output_amount: float
    fee: float
    script_type: str
    src_ip: str
    src_port: int
    dst_ip: str
    dst_port: int
    transaction_size: int
    block_height: int
    confirmation_count: int
    wallet_label: str


class PaginatedTransactionsResponse(BaseModel):
    items: List[TransactionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class SearchResult(BaseModel):
    type: str
    value: str
    label: Optional[str] = None


class SearchResponse(BaseModel):
    query: str
    wallets: List[SearchResult]
    transactions: List[SearchResult]
    total_wallets: int
    total_transactions: int


class ErrorResponse(BaseModel):
    detail: str