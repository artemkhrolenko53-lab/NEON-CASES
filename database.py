import sqlite3
import json
import time

DB_PATH = "storm.db"

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            nickname TEXT UNIQUE,
            balance INTEGER DEFAULT 0,
            inventory TEXT DEFAULT '[]',   -- JSON список предметов
            stats TEXT DEFAULT '{}',
            warnings TEXT DEFAULT '[]',
            is_muted INTEGER DEFAULT 0,
            mute_until INTEGER DEFAULT 0,
            is_banned INTEGER DEFAULT 0,
            ban_reason TEXT DEFAULT NULL,
            server TEXT DEFAULT 'Alpha',
            sound_enabled INTEGER DEFAULT 1,
            notifications_enabled INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS market (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            server TEXT,
            item_id TEXT,
            rarity TEXT,
            price INTEGER,
            seller_id INTEGER,
            seller_nick TEXT,
            listed_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            server TEXT,
            sender_id INTEGER,
            sender_nick TEXT,
            text TEXT,
            recipient_id INTEGER,
            is_private INTEGER DEFAULT 0,
            timestamp INTEGER
        );

        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            server TEXT,
            subject TEXT,
            message TEXT,
            status TEXT DEFAULT 'open',
            created_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            server TEXT,
            admin_id INTEGER,
            action TEXT,
            details TEXT,
            timestamp INTEGER
        );

        CREATE TABLE IF NOT EXISTS admins (
            server TEXT,
            user_id INTEGER,
            level INTEGER,
            PRIMARY KEY (server, user_id)
        );
    """)
    conn.commit()
    conn.close()