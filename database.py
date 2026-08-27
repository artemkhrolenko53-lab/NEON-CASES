import sqlite3
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict

class Database:
    def __init__(self, db_path: str = "storm_cases.db"):
        """Инициализация базы данных"""
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Получить соединение с БД"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_database(self):
        """Создание таблиц если они не существуют"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Таблица пользователей
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id INTEGER PRIMARY KEY,
                    username TEXT,
                    first_name TEXT,
                    balance INTEGER DEFAULT 500,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Таблица предметов пользователей
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    item_id INTEGER,
                    item_name TEXT,
                    item_type TEXT,
                    item_rarity TEXT,
                    item_icon TEXT,
                    item_price INTEGER,
                    quantity INTEGER DEFAULT 1,
                    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            """)
            
            # Таблица рыночных предложений
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS market_listings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    seller_id INTEGER,
                    item_id INTEGER,
                    item_name TEXT,
                    item_type TEXT,
                    item_rarity TEXT,
                    item_icon TEXT,
                    price INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (seller_id) REFERENCES users (user_id)
                )
            """)
            
            # Таблица предложений поддержки
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS support_tickets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    ticket_type TEXT,
                    message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status TEXT DEFAULT 'open',
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            """)
            
            conn.commit()
    
    # ==================== МЕТОДЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ====================
    
    def add_user(self, user_id: int, username: str, first_name: str) -> bool:
        """Добавить нового пользователя"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR IGNORE INTO users (user_id, username, first_name)
                VALUES (?, ?, ?)
            """, (user_id, username, first_name))
            conn.commit()
            return cursor.rowcount > 0
    
    def get_user(self, user_id: int) -> Optional[Dict]:
        """Получить информацию о пользователе"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def update_last_seen(self, user_id: int):
        """Обновить время последнего визита"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE users SET last_seen = CURRENT_TIMESTAMP
                WHERE user_id = ?
            """, (user_id,))
            conn.commit()
    
    def get_balance(self, user_id: int) -> int:
        """Получить баланс пользователя"""
        user = self.get_user(user_id)
        return user['balance'] if user else 0
    
    def add_coins(self, user_id: int, amount: int) -> int:
        """Добавить монеты пользователю"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE users SET balance = balance + ?
                WHERE user_id = ?
            """, (amount, user_id))
            conn.commit()
            return self.get_balance(user_id)
    
    def spend_coins(self, user_id: int, amount: int) -> bool:
        """Потратить монеты пользователя"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE users SET balance = balance - ?
                WHERE user_id = ? AND balance >= ?
            """, (amount, user_id, amount))
            conn.commit()
            return cursor.rowcount > 0
    
    # ==================== МЕТОДЫ ДЛЯ ПРЕДМЕТОВ ====================
    
    def add_item_to_inventory(self, user_id: int, item: Dict) -> bool:
        """Добавить предмет в инвентарь"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Проверяем есть ли уже такой предмет
            cursor.execute("""
                SELECT id, quantity FROM user_items
                WHERE user_id = ? AND item_id = ?
            """, (user_id, item['id']))
            
            existing = cursor.fetchone()
            
            if existing:
                # Увеличиваем количество
                cursor.execute("""
                    UPDATE user_items SET quantity = quantity + 1
                    WHERE id = ?
                """, (existing['id'],))
            else:
                # Добавляем новый предмет
                cursor.execute("""
                    INSERT INTO user_items 
                    (user_id, item_id, item_name, item_type, item_rarity, item_icon, item_price)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (user_id, item['id'], item['name'], item['type'], 
                      item['rarity'], item['icon'], item['price']))
            
            conn.commit()
            return True
    
    def remove_item_from_inventory(self, user_id: int, item_id: int, quantity: int = 1) -> bool:
        """Удалить предмет из инвентаря"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Проверяем количество
            cursor.execute("""
                SELECT id, quantity FROM user_items
                WHERE user_id = ? AND item_id = ?
            """, (user_id, item_id))
            
            item = cursor.fetchone()
            
            if not item:
                return False
            
            if item['quantity'] > quantity:
                # Уменьшаем количество
                cursor.execute("""
                    UPDATE user_items SET quantity = quantity - ?
                    WHERE id = ?
                """, (quantity, item['id']))
            else:
                # Удаляем предмет полностью
                cursor.execute("""
                    DELETE FROM user_items WHERE id = ?
                """, (item['id'],))
            
            conn.commit()
            return True
    
    def get_user_inventory(self, user_id: int) -> List[Dict]:
        """Получить инвентарь пользователя"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM user_items
                WHERE user_id = ?
                ORDER BY item_rarity, item_price DESC
            """, (user_id,))
            return [dict(row) for row in cursor.fetchall()]
    
    # ==================== МЕТОДЫ ДЛЯ РЫНКА ====================
    
    def add_market_listing(self, seller_id: int, item: Dict, price: int) -> bool:
        """Добавить предложение на рынок"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO market_listings 
                (seller_id, item_id, item_name, item_type, item_rarity, item_icon, price)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (seller_id, item['id'], item['name'], item['type'],
                  item['rarity'], item['icon'], price))
            conn.commit()
            return True
    
    def get_market_listings(self, limit: int = 50) -> List[Dict]:
        """Получить предложения с рынка"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT m.*, u.username as seller_name
                FROM market_listings m
                JOIN users u ON m.seller_id = u.user_id
                WHERE m.status = 'active'
                ORDER BY m.created_at DESC
                LIMIT ?
            """, (limit,))
            return [dict(row) for row in cursor.fetchall()]
    
    def remove_market_listing(self, listing_id: int) -> bool:
        """Удалить предложение с рынка"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                DELETE FROM market_listings WHERE id = ?
            """, (listing_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    # ==================== МЕТОДЫ ДЛЯ ПОДДЕРЖКИ ====================
    
    def create_support_ticket(self, user_id: int, ticket_type: str, message: str) -> bool:
        """Создать обращение в поддержку"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO support_tickets (user_id, ticket_type, message)
                VALUES (?, ?, ?)
            """, (user_id, ticket_type, message))
            conn.commit()
            return True
    
    def can_create_ticket(self, user_id: int) -> bool:
        """Проверить может ли пользователь создать обращение (раз в 24 часа)"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT created_at FROM support_tickets
                WHERE user_id = ? AND created_at > datetime('now', '-1 day')
                ORDER BY created_at DESC
                LIMIT 1
            """, (user_id,))
            return cursor.fetchone() is None
    
    def get_user_tickets(self, user_id: int) -> List[Dict]:
        """Получить обращения пользователя"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM support_tickets
                WHERE user_id = ?
                ORDER BY created_at DESC
            """, (user_id,))
            return [dict(row) for row in cursor.fetchall()]
