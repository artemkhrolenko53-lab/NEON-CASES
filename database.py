from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import config
from models import Base, ServerSettings

# Создание движка БД
if config.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        config.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(config.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Создание таблиц и начальных серверов."""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        for server_name in config.SERVER_NAMES:
            existing = db.query(ServerSettings).filter(ServerSettings.server_name == server_name).first()
            if not existing:
                server = ServerSettings(
                    server_name=server_name,
                    online=50,
                    is_online=True,
                    start_balance=config.START_BALANCE,
                    sell_multiplier=config.SELL_MULTIPLIER
                )
                db.add(server)
        db.commit()
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()