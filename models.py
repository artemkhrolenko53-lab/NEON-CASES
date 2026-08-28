from sqlalchemy import create_engine, Column, Integer, String, Boolean, Text, Float, BigInteger
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    telegram_id = Column(BigInteger, unique=True, nullable=False, index=True)
    nickname = Column(String, unique=True, nullable=False)
    balance = Column(Integer, default=1000)
    inventory = Column(Text, default="[]")
    stats = Column(Text, default="{}")
    warnings = Column(Text, default="[]")
    is_muted = Column(Boolean, default=False)
    mute_until = Column(BigInteger, default=0)
    is_banned = Column(Boolean, default=False)
    ban_reason = Column(String, nullable=True)
    server = Column(String, default="Alpha")
    sound_enabled = Column(Boolean, default=True)
    notifications_enabled = Column(Boolean, default=True)
    created_at = Column(BigInteger)

class MarketListing(Base):
    __tablename__ = "market_listings"
    id = Column(Integer, primary_key=True, autoincrement=True)
    uid = Column(BigInteger, unique=True, nullable=False)
    server = Column(String, nullable=False)
    item_id = Column(String, nullable=False)
    rarity = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    seller_id = Column(BigInteger, nullable=False)
    seller_nick = Column(String, nullable=False)
    listed_at = Column(BigInteger)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, autoincrement=True)
    server = Column(String, nullable=False)
    sender_id = Column(BigInteger, nullable=False)
    sender_nick = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    recipient_id = Column(BigInteger, nullable=True)
    is_private = Column(Boolean, default=False)
    timestamp = Column(BigInteger)

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, nullable=False)
    server = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String, default="open")
    created_at = Column(BigInteger)

class Log(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    server = Column(String, nullable=False)
    admin_id = Column(BigInteger, nullable=True)
    admin_nick = Column(String, nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(BigInteger)

class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, autoincrement=True)
    server = Column(String, nullable=False)
    user_id = Column(BigInteger, nullable=False)
    level = Column(Integer, default=1)

class ServerSettings(Base):
    __tablename__ = "server_settings"
    id = Column(Integer, primary_key=True, autoincrement=True)
    server_name = Column(String, unique=True, nullable=False)
    online = Column(Integer, default=50)
    is_online = Column(Boolean, default=True)
    start_balance = Column(Integer, default=1000)
    sell_multiplier = Column(Float, default=0.5)

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, nullable=False)
    amount = Column(Integer, nullable=False)
    stars = Column(Integer, nullable=False)
    status = Column(String, default="pending")  # pending, completed, failed
    created_at = Column(BigInteger)