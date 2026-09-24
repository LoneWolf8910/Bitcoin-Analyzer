#!/usr/bin/env python3
"""
Offline Test Script for Bitcoin Transaction Analyzer

This script verifies that the application can operate completely offline.
Run this test after disconnecting from the internet to confirm offline capability.
"""

import os
import sys
import sqlite3
import subprocess
import json
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent

def test_data_files_exist():
    """Verify all required data files exist locally."""
    print("Testing data files...")
    
    required_files = [
        PROJECT_ROOT / "data" / "bitcoin_transactions.csv",
        PROJECT_ROOT / "data" / "bitcoin_intelligence.db",
    ]
    
    for f in required_files:
        if not f.exists():
            print(f"  ❌ MISSING: {f}")
            return False
        print(f"  ✓ Found: {f.relative_to(PROJECT_ROOT)} ({f.stat().st_size:,} bytes)")
    return True


def test_sqlite_database():
    """Verify SQLite database is accessible and has data."""
    print("\nTesting SQLite database...")
    
    db_path = PROJECT_ROOT / "data" / "bitcoin_intelligence.db"
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"  ✓ Tables: {tables}")
        
        # Check data counts
        for table in ['transactions', 'wallets']:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"  ✓ {table}: {count:,} rows")
        
        conn.close()
        return True
    except Exception as e:
        print(f"  ❌ Database error: {e}")
        return False


def test_csv_dataset():
    """Verify CSV dataset is readable."""
    print("\nTesting CSV dataset...")
    
    csv_path = PROJECT_ROOT / "data" / "bitcoin_transactions.csv"
    try:
        import csv
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            print(f"  ✓ CSV rows: {len(rows):,}")
            print(f"  ✓ Columns: {list(reader.fieldnames)}")
        return True
    except Exception as e:
        print(f"  ❌ CSV error: {e}")
        return False


def test_backend_imports():
    """Test that backend imports work without network."""
    print("\nTesting backend imports...")
    
    try:
        # Change to project root for imports
        sys.path.insert(0, str(PROJECT_ROOT))
        
        from backend.main import app
        from backend.database.connection import get_db, init_db
        from backend.database.models import Transaction, Wallet
        from backend.services.graph_service import get_wallet_graph
        from backend.services.feature_engineering import extract_wallet_features
        from backend.services.risk_engine import calculate_wallet_risk
        from backend.ml.train import train_model
        from backend.ml.predict import predict_anomaly
        
        print("  ✓ All backend modules import successfully")
        return True
    except Exception as e:
        print(f"  ❌ Import error: {e}")
        return False


def test_ml_model_training():
    """Test ML model training works offline."""
    print("\nTesting ML model training...")
    
    try:
        from backend.ml.train import train_model
        
        # Train with minimal params for quick test
        result = train_model(contamination=0.1, n_estimators=10, random_state=42)
        
        if result.get("status") == "success":
            print(f"  ✓ Model trained: {result['training_samples']} samples, {result['anomalies_detected']} anomalies")
            
            # Verify model files created
            model_path = PROJECT_ROOT / "models" / "wallet_anomaly_model.joblib"
            config_path = PROJECT_ROOT / "models" / "wallet_anomaly_feature_config.json"
            
            if model_path.exists() and config_path.exists():
                print(f"  ✓ Model saved to {model_path.relative_to(PROJECT_ROOT)}")
                print(f"  ✓ Config saved to {config_path.relative_to(PROJECT_ROOT)}")
                return True
            else:
                print(f"  ❌ Model files not created")
                return False
        else:
            print(f"  ❌ Training failed: {result}")
            return False
    except Exception as e:
        print(f"  ❌ Training error: {e}")
        return False


def test_ml_prediction():
    """Test ML prediction works offline."""
    print("\nTesting ML prediction...")
    
    try:
        from backend.ml.predict import predict_anomaly
        from backend.database.connection import get_db
        from backend.database.models import Wallet
        
        # Get a wallet address from DB
        with get_db() as db:
            wallet = db.query(Wallet).filter(Wallet.transaction_count > 0).first()
            if not wallet:
                print("  ❌ No wallet found in database")
                return False
            wallet_address = wallet.wallet_address
        
        result = predict_anomaly(wallet_address)
        
        print(f"  ✓ Prediction for {wallet_address[:16]}...")
        print(f"    is_anomaly: {result.is_anomaly}")
        print(f"    anomaly_score: {result.anomaly_score:.4f}")
        return True
    except Exception as e:
        print(f"  ❌ Prediction error: {e}")
        return False


def test_graph_generation():
    """Test graph generation works offline."""
    print("\nTesting graph generation...")
    
    try:
        from backend.services.graph_service import get_wallet_graph
        from backend.database.connection import get_db
        from backend.database.models import Wallet
        
        with get_db() as db:
            wallet = db.query(Wallet).filter(Wallet.transaction_count > 0).first()
            if not wallet:
                print("  ❌ No wallet found in database")
                return False
            wallet_address = wallet.wallet_address
        
        result = get_wallet_graph(wallet_address, depth=1, max_nodes=100)
        
        print(f"  ✓ Graph generated: {len(result['nodes'])} nodes, {len(result['edges'])} edges")
        return True
    except Exception as e:
        print(f"  ❌ Graph error: {e}")
        return False


def test_feature_extraction():
    """Test feature extraction works offline."""
    print("\nTesting feature extraction...")
    
    try:
        from backend.services.feature_engineering import extract_wallet_features
        from backend.database.connection import get_db
        from backend.database.models import Wallet
        
        with get_db() as db:
            wallet = db.query(Wallet).filter(Wallet.transaction_count > 0).first()
            if not wallet:
                print("  ❌ No wallet found in database")
                return False
            wallet_address = wallet.wallet_address
        
        features = extract_wallet_features(wallet_address)
        
        print(f"  ✓ Features extracted: {len(features)} features")
        print(f"    Sample: transaction_count={features.get('transaction_count')}, "
              f"risk_level={features.get('dominant_label')}")
        return True
    except Exception as e:
        print(f"  ❌ Feature extraction error: {e}")
        return False


def test_risk_calculation():
    """Test risk calculation works offline."""
    print("\nTesting risk calculation...")
    
    try:
        from backend.services.risk_engine import calculate_wallet_risk
        from backend.database.connection import get_db
        from backend.database.models import Wallet
        
        with get_db() as db:
            wallet = db.query(Wallet).filter(Wallet.transaction_count > 0).first()
            if not wallet:
                print("  ❌ No wallet found in database")
                return False
            wallet_address = wallet.wallet_address
        
        result = calculate_wallet_risk(wallet_address)
        
        print(f"  ✓ Risk calculated: score={result['risk_score']}, level={result['risk_level']}")
        print(f"    Reasons: {len(result['reasons'])} factors")
        return True
    except Exception as e:
        print(f"  ❌ Risk calculation error: {e}")
        return False


def test_api_endpoints():
    """Test FastAPI endpoints work offline."""
    print("\nTesting API endpoints (via TestClient)...")
    
    try:
        from fastapi.testclient import TestClient
        from backend.main import app
        
        client = TestClient(app)
        
        # Test health
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["offline"] == True
        print("  ✓ /health")
        
        # Test stats
        resp = client.get("/api/stats")
        assert resp.status_code == 200
        print(f"  ✓ /api/stats: {resp.json()['transaction_count']:,} transactions")
        
        # Test wallet
        from backend.database.connection import get_db
        from backend.database.models import Wallet
        with get_db() as db:
            wallet = db.query(Wallet).filter(Wallet.transaction_count > 0).first()
            wallet_address = wallet.wallet_address
        
        resp = client.get(f"/api/wallet/{wallet_address}")
        assert resp.status_code == 200
        print(f"  ✓ /api/wallet/{{address}}")
        
        # Test graph
        resp = client.get(f"/api/wallet/{wallet_address}/graph?depth=1")
        assert resp.status_code == 200
        data = resp.json()
        print(f"  ✓ /api/wallet/{{address}}/graph: {len(data['nodes'])} nodes")
        
        # Test features
        resp = client.get(f"/api/wallet/{wallet_address}/features")
        assert resp.status_code == 200
        print(f"  ✓ /api/wallet/{{address}}/features")
        
        # Test risk
        resp = client.get(f"/api/wallet/{wallet_address}/risk")
        assert resp.status_code == 200
        print(f"  ✓ /api/wallet/{{address}}/risk: {resp.json()['risk_level']}")
        
        # Test investigate
        resp = client.get(f"/api/investigate/{wallet_address}")
        assert resp.status_code == 200
        print(f"  ✓ /api/investigate/{{address}}")
        
        return True
    except Exception as e:
        print(f"  ❌ API test error: {e}")
        return False


def test_frontend_build():
    """Test frontend builds without network."""
    print("\nTesting frontend build...")
    
    frontend_dir = PROJECT_ROOT / "frontend"
    try:
        # Check if node_modules exists
        if not (frontend_dir / "node_modules").exists():
            print("  ⚠️  node_modules not found, skipping build test")
            return True
        
        # Run build
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd=frontend_dir,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode == 0:
            dist_dir = frontend_dir / "dist"
            if dist_dir.exists():
                files = list(dist_dir.rglob("*"))
                total_size = sum(f.stat().st_size for f in files if f.is_file())
                print(f"  ✓ Frontend built: {len(files)} files, {total_size:,} bytes")
                return True
            else:
                print("  ❌ dist directory not created")
                return False
        else:
            print(f"  ❌ Build failed: {result.stderr[:500]}")
            return False
    except subprocess.TimeoutExpired:
        print("  ❌ Build timed out")
        return False
    except Exception as e:
        print(f"  ❌ Build error: {e}")
        return False


def run_all_tests():
    """Run all offline tests."""
    print("=" * 60)
    print("Bitcoin Transaction Analyzer - Offline Capability Test")
    print("=" * 60)
    
    tests = [
        ("Data Files", test_data_files_exist),
        ("SQLite Database", test_sqlite_database),
        ("CSV Dataset", test_csv_dataset),
        ("Backend Imports", test_backend_imports),
        ("ML Model Training", test_ml_model_training),
        ("ML Prediction", test_ml_prediction),
        ("Graph Generation", test_graph_generation),
        ("Feature Extraction", test_feature_extraction),
        ("Risk Calculation", test_risk_calculation),
        ("API Endpoints", test_api_endpoints),
        ("Frontend Build", test_frontend_build),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"  ❌ {name} crashed: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {name}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED - Application is fully offline-capable!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed - Review offline dependencies")
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())