import os
import time
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)


@dataclass
class BlockchainTransaction:
    txid: str
    timestamp: datetime
    input_amount: float
    output_amount: float
    fee: float
    input_wallet: str
    output_wallet: str
    block_height: int
    confirmation_count: int
    script_type: str
    src_ip: Optional[str] = None
    src_port: Optional[int] = None
    dst_ip: Optional[str] = None
    dst_port: Optional[int] = None
    transaction_size: int = 0
    wallet_label: str = "normal"


@dataclass
class BlockchainWallet:
    wallet_address: str
    transaction_count: int
    total_received: float
    total_sent: float
    incoming_count: int
    outgoing_count: int
    first_seen: Optional[datetime]
    last_seen: Optional[datetime]
    dominant_label: str


class BlockchainAPIError(Exception):
    pass


class BlockchainAPI:
    def __init__(
        self,
        base_url: str = "https://mempool.space/api",
        timeout: int = 30,
        max_retries: int = 3,
    ):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(timeout),
            limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
        )

    async def close(self):
        await self.client.aclose()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError, httpx.HTTPStatusError)),
    )
    async def _get(self, endpoint: str) -> Any:
        url = f"{self.base_url}{endpoint}"
        logger.debug(f"Fetching {url}")
        response = await self.client.get(url)
        response.raise_for_status()
        return response.json()

    async def get_address_info(self, address: str) -> Optional[Dict[str, Any]]:
        try:
            data = await self._get(f"/address/{address}")
            return data
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise BlockchainAPIError(f"Failed to fetch address {address}: {e}")

    async def get_address_transactions(self, address: str, limit: int = 50) -> List[Dict[str, Any]]:
        try:
            data = await self._get(f"/address/{address}/txs")
            return data[:limit]
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return []
            raise BlockchainAPIError(f"Failed to fetch transactions for {address}: {e}")

    async def get_transaction(self, txid: str) -> Optional[Dict[str, Any]]:
        try:
            data = await self._get(f"/tx/{txid}")
            return data
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise BlockchainAPIError(f"Failed to fetch transaction {txid}: {e}")

    async def get_transaction_outspends(self, txid: str) -> List[Dict[str, Any]]:
        try:
            data = await self._get(f"/tx/{txid}/outspends")
            return data
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return []
            raise BlockchainAPIError(f"Failed to fetch outspends for {txid}: {e}")

    def _parse_blockstream_address(self, data: Dict[str, Any], address: str) -> BlockchainWallet:
        chain_stats = data.get("chain_stats", {})
        mempool_stats = data.get("mempool_stats", {})

        total_received = (chain_stats.get("funded_txo_sum", 0) + mempool_stats.get("funded_txo_sum", 0)) / 1e8
        total_sent = (chain_stats.get("spent_txo_sum", 0) + mempool_stats.get("spent_txo_sum", 0)) / 1e8
        tx_count = chain_stats.get("tx_count", 0) + mempool_stats.get("tx_count", 0)

        return BlockchainWallet(
            wallet_address=address,
            transaction_count=tx_count,
            total_received=total_received,
            total_sent=total_sent,
            incoming_count=0,
            outgoing_count=0,
            first_seen=None,
            last_seen=None,
            dominant_label="normal",
        )

    def _parse_blockstream_tx(self, tx: Dict[str, Any], target_address: str) -> List[BlockchainTransaction]:
        results = []
        txid = tx.get("txid", "")
        timestamp = datetime.fromtimestamp(tx.get("status", {}).get("block_time", time.time()))
        block_height = tx.get("status", {}).get("block_height", 0)
        confirmed = tx.get("status", {}).get("confirmed", False)
        confirmation_count = 1 if confirmed else 0

        vin_total = 0
        vout_total = 0
        fee = tx.get("fee", 0) / 1e8

        for vin in tx.get("vin", []):
            prevout = vin.get("prevout", {})
            vin_total += prevout.get("value", 0)

        for vout in tx.get("vout", []):
            vout_total += vout.get("value", 0)

        input_wallets = set()
        output_wallets = set()

        for vin in tx.get("vin", []):
            prevout = vin.get("prevout", {})
            scriptpubkey_address = prevout.get("scriptpubkey_address")
            if scriptpubkey_address:
                input_wallets.add(scriptpubkey_address)

        for vout in tx.get("vout", []):
            scriptpubkey_address = vout.get("scriptpubkey_address")
            if scriptpubkey_address:
                output_wallets.add(scriptpubkey_address)

        is_sender = target_address in input_wallets
        is_receiver = target_address in output_wallets

        if is_sender:
            for out_addr in output_wallets:
                vout_for_addr = next((v for v in tx.get("vout", []) if v.get("scriptpubkey_address") == out_addr), None)
                amount = vout_for_addr.get("value", 0) / 1e8 if vout_for_addr else 0
                results.append(BlockchainTransaction(
                    txid=txid,
                    timestamp=timestamp,
                    input_amount=0,
                    output_amount=amount,
                    fee=fee,
                    input_wallet=target_address,
                    output_wallet=out_addr,
                    block_height=block_height,
                    confirmation_count=confirmation_count,
                    script_type="unknown",
                ))

        if is_receiver:
            for in_addr in input_wallets:
                results.append(BlockchainTransaction(
                    txid=txid,
                    timestamp=timestamp,
                    input_amount=0,
                    output_amount=0,
                    fee=fee,
                    input_wallet=in_addr,
                    output_wallet=target_address,
                    block_height=block_height,
                    confirmation_count=confirmation_count,
                    script_type="unknown",
                ))

        return results


blockchain_api = BlockchainAPI()


async def get_blockchain_api() -> BlockchainAPI:
    return blockchain_api


async def close_blockchain_api():
    await blockchain_api.close()