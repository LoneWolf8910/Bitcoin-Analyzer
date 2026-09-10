import os
from contextlib import contextmanager
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from .models import Base

DATABASE_PATH = os.getenv("DATABASE_PATH", "./data/bitcoin_intelligence.db")
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            echo=False,
        )
        _setup_engine_events(_engine)
    return _engine


def _setup_engine_events(engine):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA cache_size=10000")
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.close()


def get_session_factory():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal


def init_db():
    Base.metadata.create_all(bind=get_engine())


def close_db():
    global _engine, _SessionLocal
    if _engine:
        _engine.dispose()
        _engine = None
        _SessionLocal = None


def set_test_engine(test_engine):
    global _engine, _SessionLocal
    _engine = test_engine
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    _setup_engine_events(test_engine)


@contextmanager
def get_db() -> Session:
    session_factory = get_session_factory()
    db = session_factory()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()