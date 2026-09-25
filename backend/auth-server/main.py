from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional
import sqlite3
import bcrypt
import jwt
import uuid
from datetime import datetime, timedelta
import os

app = FastAPI(title="TxGuard Auth Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET = os.getenv("JWT_SECRET", "txguard-demo-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_HOURS = 8
DB_PATH = os.path.join(os.path.dirname(__file__), "txguard_auth.db")

security = HTTPBearer()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'analyst',
            created_at INTEGER NOT NULL,
            last_login INTEGER
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
    conn.commit()
    conn.close()

def seed_demo_users():
    conn = get_db()
    demo_users = [
        ("admin", "admin@txguard.demo", "txguard2024", "Admin Investigator", "administrator"),
        ("analyst", "analyst@txguard.demo", "analyst2024", "Senior Analyst", "analyst"),
        ("viewer", "viewer@txguard.demo", "viewer2024", "Read-Only Viewer", "viewer"),
        ("demo", "demo@txguard.local", "demo1234", "Demo User", "analyst"),
    ]
    for user_id, email, password, name, role in demo_users:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if not existing:
            password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            conn.execute(
                "INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (user_id, email, password_hash, name, role, int(datetime.now().timestamp() * 1000))
            )
    conn.commit()
    conn.close()

init_db()
seed_demo_users()

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "analyst"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    user: dict
    token: str
    expiresIn: str

class UserResponse(BaseModel):
    user: dict

def create_token(user_data: dict) -> str:
    payload = {
        **user_data,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRES_HOURS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

@app.post("/api/auth/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (request.email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=409, detail="Email already registered")

    user_id = str(uuid.uuid4())
    password_hash = bcrypt.hashpw(request.password.encode(), bcrypt.gensalt()).decode()
    now = int(datetime.now().timestamp() * 1000)

    conn.execute(
        "INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, request.email, password_hash, request.name, request.role, now)
    )
    conn.commit()
    conn.close()

    token = create_token({"id": user_id, "email": request.email, "name": request.name, "role": request.role})
    return AuthResponse(
        user={"id": user_id, "email": request.email, "name": request.name, "role": request.role},
        token=token,
        expiresIn=f"{JWT_EXPIRES_HOURS}h"
    )

@app.post("/api/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (request.email,)).fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not bcrypt.checkpw(request.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    conn = get_db()
    conn.execute("UPDATE users SET last_login = ? WHERE id = ?", (int(datetime.now().timestamp() * 1000), user["id"]))
    conn.commit()
    conn.close()

    token = create_token({"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]})
    return AuthResponse(
        user={"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]},
        token=token,
        expiresIn=f"{JWT_EXPIRES_HOURS}h"
    )

@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(payload: dict = Depends(verify_token)):
    conn = get_db()
    user = conn.execute("SELECT id, email, name, role, created_at, last_login FROM users WHERE id = ?", (payload["id"],)).fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(user=dict(user))

@app.post("/api/auth/refresh", response_model=AuthResponse)
async def refresh(payload: dict = Depends(verify_token)):
    token = create_token({"id": payload["id"], "email": payload["email"], "name": payload["name"], "role": payload["role"]})
    return AuthResponse(
        user={"id": payload["id"], "email": payload["email"], "name": payload["name"], "role": payload["role"]},
        token=token,
        expiresIn=f"{JWT_EXPIRES_HOURS}h"
    )

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "auth-server", "timestamp": int(datetime.now().timestamp() * 1000)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)