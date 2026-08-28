from sqlalchemy import create_engine, Column, Integer, String, Boolean, Text, Float, BigInteger
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    telegram_id = Column(BigInteger, unique=True, nullable=False, index=True)
    nickname = Column(String, unique=True, nullable=False)
    balance = Column(Integer, default=1000)
    inventory = Column(Text, default="[]")      # JSON список
    stats = Column(Text, default="{}")          # JSON статистика
    warnings = Column(Text, default="[]")       # JSON предупреждения
    is_muted = Column(Boolean, default=False)
    mute_until = Column(BigInteger, default=0)
    is_banned = Column(Boolean, default=False)
    ban_reason = Column(String, nullable=True)
    server = Column(String, default="Alpha")
    sound_enabled = Column(Boolean, default=True)
    notifications_enabled = Column(Boolean, default=True)
    created_at = Column(BigInteger)

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "telegram_id": self.telegram_id,
            "nickname": self.nickname,
            "balance": self.balance,
            "inventory": json.loads(self.inventory) if self.inventory else [],
            "stats": json.loads(self.stats) if self.stats else {},
            "warnings": json.loads(self.warnings) if self.warnings else [],
            "is_muted": self.is_muted,
            "mute_until": self.mute_until,
            "is_banned": self.is_banned,
            "ban_reason": self.ban_reason,
            "server": self.server,
            "sound_enabled": self.sound_enabled,
            "notifications_enabled": self.notifications_enabled,
            "created_at": self.created_at
        }

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

    def to_dict(self):
        return {
            "uid": self.uid,
            "item_id": self.item_id,
            "rarity": self.rarity,
            "price": self.price,
            "seller_id": self.seller_id,
            "seller_nick": self.seller_nick,
            "listed_at": self.listed_at
        }

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

    def to_dict(self):
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "sender_nick": self.sender_nick,
            "text": self.text,
            "recipient_id": self.recipient_id,
            "is_private": self.is_private,
            "timestamp": self.timestamp
        }

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, nullable=False)
    server = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String, default="open")
    created_at = Column(BigInteger)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "server": self.server,
            "subject": self.subject,
            "message": self.message,
            "status": self.status,
            "created_at": self.created_at
        }

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

    def to_dict(self):
        return {
            "server": self.server,
            "user_id": self.user_id,
            "level": self.level
        }

class ServerSettings(Base):
    __tablename__ = "server_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    server_name = Column(String, unique=True, nullable=False)
    online = Column(Integer, default=50)
    is_online = Column(Boolean, default=True)
    start_balance = Column(Integer, default=1000)
    sell_multiplier = Column(Float, default=0.5)

    def to_dict(self):
        return {
            "server_name": self.server_name,
            "online": self.online,
            "is_online": self.is_online,
            "start_balance": self.start_balance,
            "sell_multiplier": self.sell_multiplier
        }