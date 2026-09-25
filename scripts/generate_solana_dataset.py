#!/usr/bin/env python3
"""
Solana Transaction Dataset Generator with Gulf Stream Mempool Simulation
Generates synthetic Solana transaction data including SPL token transfers,
Gulf Stream forwarding, and wallet analytics.
"""

import csv
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path
import base58
import base64
import struct

random.seed(42)

SOLANA_TOKENS = {
    "SOL": {"mint": "So11111111111111111111111111111111111111112", "decimals": 9, "symbol": "SOL"},
    "USDC": {"mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "decimals": 6, "symbol": "USDC"},
    "USDT": {"mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", "decimals": 6, "symbol": "USDT"},
    "JUP": {"mint": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", "decimals": 6, "symbol": "JUP"},
    "BONK": {"mint": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xnnQ7AeKPWs3V6K", "decimals": 5, "symbol": "BONK"},
    "WIF": {"mint": "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", "decimals": 6, "symbol": "WIF"},
    "RAY": {"mint": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iNW2Q6U6K4gY", "decimals": 6, "symbol": "RAY"},
    "ORCA": {"mint": "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeAku1ke1A", "decimals": 6, "symbol": "ORCA"},
    "PYTH": {"mint": "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3", "decimals": 6, "symbol": "PYTH"},
    "JTO": {"mint": "JTOtBmhY3CqN6gGvZ4Nz9F5J7wN8YzX3K2Q1W4E5R6T7", "decimals": 6, "symbol": "JTO"},
}

GULF_STREAM_STATUSES = [
    "gulfstream_pending",
    "gulfstream_forwarded", 
    "gulfstream_confirmed",
    "gulfstream_dropped",
    "leader_scheduled",
    "leader_executing",
    "finalized",
]

WALLET_LABELS = [
    "normal", "defi_user", "arbitrage_bot", "market_maker", 
    "whale", "nft_trader", "validator", "bridge_user", "memecoin_sniper"
]

PROGRAM_IDS = {
    "system": "11111111111111111111111111111111",
    "spl_token": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "spl_token_2022": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
    "associated_token": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
    "jupiter_v6": "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    "raydium_amm": "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    "orca_whirlpool": "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
    "metaplex": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
}

SIGNATURE_PREFIXES = ["2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H"]

def generate_solana_address():
    """Generate a valid-looking Solana base58 address (32 bytes)"""
    return base58.b58encode(random.randbytes(32)).decode()

def generate_signature():
    """Generate a Solana transaction signature (64 bytes base58)"""
    return base58.b58encode(random.randbytes(64)).decode()

def generate_blockhash():
    """Generate a recent blockhash"""
    return base58.b58encode(random.randbytes(32)).decode()

def get_random_token():
    return random.choice(list(SOLANA_TOKENS.values()))

def generate_wallet_address():
    return generate_solana_address()

def generate_ata_address(owner, mint):
    """Simulate Associated Token Account derivation"""
    return generate_solana_address()

def simulate_gulf_stream_forwarding(tx_time, slot):
    """Simulate Gulf Stream transaction forwarding behavior"""
    forwarded = random.random() < 0.75
    if not forwarded:
        return "gulfstream_pending", None, None
    
    forward_time = tx_time + timedelta(milliseconds=random.randint(10, 100))
    leader_slots = random.randint(1, 4)
    
    statuses = ["gulfstream_forwarded", "leader_scheduled", "leader_executing", "finalized"]
    weights = [0.4, 0.3, 0.2, 0.1]
    
    if random.random() < 0.05:
        return "gulfstream_dropped", None, None
    
    status = random.choices(statuses, weights=weights)[0]
    scheduled_slot = slot + leader_slots if status != "gulfstream_dropped" else None
    
    return status, forward_time, scheduled_slot

def generate_solana_transactions(num_rows=50000):
    """Generate synthetic Solana transactions with Gulf Stream simulation"""
    
    wallets = [generate_wallet_address() for _ in range(2000)]
    wallet_balances = {w: {token["mint"]: 0 for token in SOLANA_TOKENS.values()} for w in wallets}
    for w in wallets:
        wallet_balances[w]["So11111111111111111111111111111111111111112"] = random.uniform(0.1, 10000)
    
    start_time = datetime(2024, 1, 1)
    current_slot = 250000000
    
    output_path = Path(__file__).parent.parent / "data" / "solana_transactions.csv"
    output_path.parent.mkdir(exist_ok=True)
    
    fieldnames = [
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
    
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for i in range(num_rows):
            if i % 5000 == 0:
                print(f"Generated {i}/{num_rows} transactions...")
            
            tx_time = start_time + timedelta(seconds=random.randint(0, 86400*7))
            slot = current_slot + i // 50
            signature = generate_signature()
            blockhash = generate_blockhash()
            fee_payer = random.choice(wallets)
            fee = random.randint(5000, 50000)
            compute_units = random.randint(20000, 1400000)
            compute_unit_price = random.randint(1, 1000000)
            
            status = "success" if random.random() > 0.02 else "failed"
            error = None if status == "success" else random.choice([
                "InsufficientFunds", "BlockhashNotFound", "InstructionError",
                "AccountNotFound", "ProgramError", "InvalidAccountData"
            ])
            
            program_name = random.choice(list(PROGRAM_IDS.keys()))
            program_id = PROGRAM_IDS[program_name]
            
            token = get_random_token()
            token_mint = token["mint"]
            token_symbol = token["symbol"]
            token_decimals = token["decimals"]
            
            source_wallet = random.choice(wallets)
            dest_wallet = random.choice(wallets)
            while dest_wallet == source_wallet:
                dest_wallet = random.choice(wallets)
            
            source_ata = generate_ata_address(source_wallet, token_mint)
            destination_ata = generate_ata_address(dest_wallet, token_mint)
            authority = source_wallet if random.random() > 0.1 else random.choice(wallets)
            
            if token_symbol == "SOL":
                amount_raw = random.randint(1000000, 1000000000000)
            elif token_symbol in ["USDC", "USDT"]:
                amount_raw = random.randint(100000, 10000000000)
            else:
                amount_raw = random.randint(1000, 1000000000000)
            
            amount_ui = amount_raw / (10 ** token_decimals)
            
            instruction_types = ["transfer", "transfer_checked", "approve", "revoke", "close_account", "sync_native", "initialize_account", "create_associated_token_account"]
            instruction_type = random.choice(instruction_types)
            instruction_index = random.randint(0, 4)
            
            gulfstream_status, forwarded_at, leader_slot = simulate_gulf_stream_forwarding(tx_time, slot)
            
            pre_balance = wallet_balances[source_wallet].get(token_mint, 0)
            post_balance = max(0, pre_balance - amount_ui)
            wallet_balances[source_wallet][token_mint] = post_balance
            
            dest_pre = wallet_balances[dest_wallet].get(token_mint, 0)
            wallet_balances[dest_wallet][token_mint] = dest_pre + amount_ui
            
            pre_balances = f"{source_wallet}:{pre_balance:.6f},{dest_wallet}:{dest_pre:.6f}"
            post_balances = f"{source_wallet}:{post_balance:.6f},{dest_wallet}:{wallet_balances[dest_wallet][token_mint]:.6f}"
            
            wallet_label = random.choices(WALLET_LABELS, weights=[0.3, 0.15, 0.1, 0.1, 0.05, 0.1, 0.05, 0.1, 0.05])[0]
            is_vote = random.random() < 0.001
            is_inner = random.random() < 0.15
            
            writer.writerow({
                "timestamp": tx_time.isoformat(),
                "slot": slot,
                "signature": signature,
                "blockhash": blockhash,
                "fee_payer": fee_payer,
                "fee": fee,
                "compute_units_consumed": compute_units,
                "compute_unit_price": compute_unit_price,
                "status": status,
                "error": error or "",
                "program_id": program_id,
                "program_name": program_name,
                "token_mint": token_mint,
                "token_symbol": token_symbol,
                "token_decimals": token_decimals,
                "source_ata": source_ata,
                "destination_ata": destination_ata,
                "authority": authority,
                "amount_raw": amount_raw,
                "amount_ui": amount_ui,
                "instruction_type": instruction_type,
                "instruction_index": instruction_index,
                "gulfstream_status": gulfstream_status,
                "gulfstream_forwarded_at": forwarded_at.isoformat() if forwarded_at else "",
                "gulfstream_leader_slot": leader_slot or "",
                "pre_balances": pre_balances,
                "post_balances": post_balances,
                "wallet_label": wallet_label,
                "is_vote": is_vote,
                "is_inner_instruction": is_inner,
            })
    
    print(f"Generated {num_rows} transactions to {output_path}")
    return output_path

if __name__ == "__main__":
    generate_solana_transactions(50000)