"""
STORM CASES - Database
Модуль для работы с базой данных SQLite
"""

import sqlite3
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)


class Database:
    """Класс для работы с базой данных"""

    def __init__(self, db_path: str = "storm_cases.db"):
        """Инициализация базы данных"""
        self.db_path = db_path
        self.init_database()
        logger.info(f"База данных подключена: {db_path}")

    def get_connection(self) -> sqlite3.Connection:
        """Получить соединение с БД"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def init_database(self):
        """Создание всех таблиц"""
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
                    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_banned INTEGER DEFAULT 0,
                    ban_reason TEXT,
                    total_donated INTEGER DEFAULT 0,
                    total_cases_opened INTEGER DEFAULT 0,
                    total_items_received INTEGER DEFAULT 0
                )
            """)

            # Таблица предметов пользователей
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    item_id INTEGER NOT NULL,
                    item_name TEXT NOT NULL,
                    item_type TEXT,
                    item_rarity TEXT,
                    item_icon TEXT,
                    item_price INTEGER,
                    quantity INTEGER DEFAULT 1,
                    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
                )
            """)

            # Таблица рыночных предложений
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS market_listings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    seller_id INTEGER NOT NULL,
                    item_id INTEGER NOT NULL,
                    item_name TEXT NOT NULL,
                    item_type TEXT,
                    item_rarity TEXT,
                    item_icon TEXT,
                    price INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status TEXT DEFAULT 'active',
                    FOREIGN KEY (seller_id) REFERENCES users (user_id) ON DELETE CASCADE
                )
            """)

            # Таблица обращений в поддержку
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS support_tickets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    ticket_type TEXT DEFAULT 'general',
                    message TEXT NOT NULL,
                    status TEXT DEFAULT 'open',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    resolved_at TIMESTAMP,
                    admin_reply TEXT,
                    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
                )
            """)

            # Таблица приглашений
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS invites (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    inviter_id INTEGER NOT NULL,
                    invited_id INTEGER NOT NULL,
                    invite_code TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    reward_given INTEGER DEFAULT 0,
                    FOREIGN KEY (inviter_id) REFERENCES users (user_id) ON DELETE CASCADE,
                    FOREIGN KEY (invited_id) REFERENCES users (user_id) ON DELETE CASCADE
                )
            """)

            # Таблица транзакций
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    type TEXT NOT NULL,
                    amount INTEGER NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
                )
            """)

            # Таблица логов
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    action TEXT NOT NULL,
                    details TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            conn.commit()
            logger.info("Таблицы созданы")

    # ==================== МЕТОДЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ====================

    def add_user(self, user_id: int, username: str, first_name: str) -> bool:
        """Добавить нового пользователя"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR IGNORE INTO users (user_id, username, first_name)
                    VALUES (?, ?, ?)
                """, (user_id, username, first_name))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Ошибка добавления пользователя: {e}")
            return False

    def get_user(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Получить информацию о пользователе"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
                row = cursor.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Ошибка получения пользователя: {e}")
            return None

    def get_balance(self, user_id: int) -> int:
        """Получить баланс пользователя"""
        user = self.get_user(user_id)
        return user['balance'] if user else 0

    def add_coins(self, user_id: int, amount: int) -> int:
        """Добавить монеты пользователю"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE users SET balance = balance + ?
                    WHERE user_id = ?
                """, (amount, user_id))
                conn.commit()

                # Логируем транзакцию
                self.log_transaction(user_id, 'add_coins', amount, 'Пополнение баланса')

                return self.get_balance(user_id)
        except Exception as e:
            logger.error(f"Ошибка добавления монет: {e}")
            return self.get_balance(user_id)

    def spend_coins(self, user_id: int, amount: int) -> bool:
        """Потратить монеты пользователя"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE users SET balance = balance - ?
                    WHERE user_id = ? AND balance >= ?
                """, (amount, user_id, amount))
                conn.commit()

                if cursor.rowcount > 0:
                    self.log_transaction(user_id, 'spend_coins', amount, 'Списание монет')
                    return True
                return False
        except Exception as e:
            logger.error(f"Ошибка списания монет: {e}")
            return False

    def update_last_seen(self, user_id: int):
        """Обновить время последнего визита"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE users SET last_seen = CURRENT_TIMESTAMP
                    WHERE user_id = ?
                """, (user_id,))
                conn.commit()
        except Exception as e:
            logger.error(f"Ошибка обновления last_seen: {e}")

    def update_user_stats(self, user_id: int, cases_opened: int = 0, items_received: int = 0):
        """Обновить статистику пользователя"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE users SET 
                        total_cases_opened = total_cases_opened + ?,
                        total_items_received = total_items_received + ?
                    WHERE user_id = ?
                """, (cases_opened, items_received, user_id))
                conn.commit()
        except Exception as e:
            logger.error(f"Ошибка обновления статистики: {e}")

    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        """Получить статистику пользователя"""
        user = self.get_user(user_id)
        if not user:
            return {}

        return {
            'balance': user['balance'],
            'total_donated': user['total_donated'],
            'total_cases_opened': user['total_cases_opened'],
            'total_items_received': user['total_items_received'],
            'created_at': user['created_at'],
        }

    # ==================== МЕТОДЫ ДЛЯ ПРЕДМЕТОВ ====================

    def add_item_to_inventory(self, user_id: int, item: Dict[str, Any]) -> bool:
        """Добавить предмет в инвентарь"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()

                # Проверяем есть ли уже такой предмет
                cursor.execute("""
                    SELECT id, quantity FROM user_items
                    WHERE user_id = ? AND item_id = ?
                """, (user_id, item.get('id', 0)))

                existing = cursor.fetchone()

                if existing:
                    cursor.execute("""
                        UPDATE user_items SET quantity = quantity + 1
                        WHERE id = ?
                    """, (existing['id'],))
                else:
                    cursor.execute("""
                        INSERT INTO user_items 
                        (user_id, item_id, item_name, item_type, item_rarity, item_icon, item_price)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        user_id,
                        item.get('id', 0),
                        item.get('name', 'Unknown'),
                        item.get('type', 'Unknown'),
                        item.get('rarity', 'common'),
                        item.get('icon', '📦'),
                        item.get('price', 0),
                    ))

                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Ошибка добавления предмета: {e}")
            return False

    def remove_item_from_inventory(self, user_id: int, item_id: int, quantity: int = 1) -> bool:
        """Удалить предмет из инвентаря"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()

                cursor.execute("""
                    SELECT id, quantity FROM user_items
                    WHERE user_id = ? AND item_id = ?
                """, (user_id, item_id))

                existing = cursor.fetchone()

                if not existing:
                    return False

                if existing['quantity'] > quantity:
                    cursor.execute("""
                        UPDATE user_items SET quantity = quantity - ?
                        WHERE id = ?
                    """, (quantity, existing['id']))
                else:
                    cursor.execute("""
                        DELETE FROM user_items WHERE id = ?
                    """, (existing['id'],))

                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Ошибка удаления предмета: {e}")
            return False

    def get_user_inventory(self, user_id: int) -> List[Dict[str, Any]]:
        """Получить инвентарь пользователя"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM user_items
                    WHERE user_id = ?
                    ORDER BY 
                        CASE item_rarity
                            WHEN 'legendary' THEN 0
                            WHEN 'epic' THEN 1
                            WHEN 'rare' THEN 2
                            WHEN 'common' THEN 3
                        END,
                        item_price DESC
                """, (user_id,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"Ошибка получения инвентаря: {e}")
            return []

    def get_user_items_count(self, user_id: int) -> int:
        """Получить количество предметов пользователя"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT COALESCE(SUM(quantity), 0) as total
                    FROM user_items WHERE user_id = ?
                """, (user_id,))
                row = cursor.fetchone()
                return row['total'] if row else 0
        except Exception as e:
            logger.error(f"Ошибка получения количества предметов: {e}")
            return 0

    # ==================== МЕТОДЫ ДЛЯ РЫНКА ====================

    def add_market_listing(self, seller_id: int, item: Dict[str, Any], price: int) -> bool:
        """Добавить предложение на рынок"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO market_listings 
                    (seller_id, item_id, item_name, item_type, item_rarity, item_icon, price)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    seller_id,
                    item.get('id', 0),
                    item.get('name', 'Unknown'),
                    item.get('type', 'Unknown'),
                    item.get('rarity', 'common'),
                    item.get('icon', '📦'),
                    price,
                ))
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Ошибка добавления на рынок: {e}")
            return False

    def get_market_listings(self, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Получить предложения с рынка"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()

                query = """
                    SELECT ml.*, u.username, u.first_name
                    FROM market_listings ml
                    JOIN users u ON ml.seller_id = u.user_id
                    WHERE ml.status = 'active'
                """

                params = []

                if filters:
                    if filters.get('rarity'):
                        query += " AND ml.item_rarity = ?"
                        params.append(filters['rarity'])

                    if filters.get('search'):
                        query += " AND ml.item_name LIKE ?"
                        params.append(f"%{filters['search']}%")

                    if filters.get('seller_id'):
                        query += " AND ml.seller_id = ?"
                        params.append(filters['seller_id'])

                query += " ORDER BY ml.created_at DESC"

                cursor.execute(query, params)
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"Ошибка получения рынка: {e}")
            return []

    def remove_market_listing(self, listing_id: int) -> bool:
        """Удалить предложение с рынка"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE market_listings SET status = 'removed'
                    WHERE id = ?
                """, (listing_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Ошибка удаления с рынка: {e}")
            return False

    # ==================== МЕТОДЫ ДЛЯ ПОДДЕРЖКИ ====================

    def create_support_ticket(self, user_id: int, ticket_type: str, message: str) -> bool:
        """Создать обращение в поддержку"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO support_tickets (user_id, ticket_type, message)
                    VALUES (?, ?, ?)
                """, (user_id, ticket_type, message))
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Ошибка создания обращения: {e}")
            return False

    def get_support_tickets(self, status: str = 'open') -> List[Dict[str, Any]]:
        """Получить обращения в поддержку"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT st.*, u.username, u.first_name
                    FROM support_tickets st
                    JOIN users u ON st.user_id = u.user_id
                    WHERE st.status = ?
                    ORDER BY st.created_at DESC
                """, (status,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"Ошибка получения обращений: {e}")
            return []

    def resolve_support_ticket(self, ticket_id: int, admin_reply: str) -> bool:
        """Закрыть обращение"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE support_tickets 
                    SET status = 'resolved', 
                        admin_reply = ?,
                        resolved_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (admin_reply, ticket_id))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Ошибка закрытия обращения: {e}")
            return False

    # ==================== МЕТОДЫ ДЛЯ ТРАНЗАКЦИЙ ====================

    def log_transaction(self, user_id: int, trans_type: str, amount: int, description: str = ""):
        """Записать транзакцию"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO transactions (user_id, type, amount, description)
                    VALUES (?, ?, ?, ?)
                """, (user_id, trans_type, amount, description))
                conn.commit()
        except Exception as e:
            logger.error(f"Ошибка записи транзакции: {e}")

    def get_user_transactions(self, user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """Получить транзакции пользователя"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM transactions
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                    LIMIT ?
                """, (user_id, limit))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"Ошибка получения транзакций: {e}")
            return []

    # ==================== МЕТОДЫ ДЛЯ ЛОГОВ ====================

    def log_action(self, user_id: int, action: str, details: str = ""):
        """Записать действие в лог"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO logs (user_id, action, details)
                    VALUES (?, ?, ?)
                """, (user_id, action, details))
                conn.commit()
        except Exception as e:
            logger.error(f"Ошибка записи лога: {e}")

    def get_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Получить логи"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM logs
                    ORDER BY created_at DESC
                    LIMIT ?
                """, (limit,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"Ошибка получения логов: {e}")
            return []

    # ==================== МЕТОДЫ ДЛЯ БАНОВ ====================

    def ban_user(self, user_id: int, reason: str = "") -> bool:
        """Забанить пользователя"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE users SET is_banned = 1, ban_reason = ?
                    WHERE user_id = ?
                """, (reason, user_id))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Ошибка бана: {e}")
            return False

    def unban_user(self, user_id: int) -> bool:
        """Разбанить пользователя"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE users SET is_banned = 0, ban_reason = NULL
                    WHERE user_id = ?
                """, (user_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Ошибка разбана: {e}")
            return False

    def is_banned(self, user_id: int) -> bool:
        """Проверить забанен ли пользователь"""
        user = self.get_user(user_id)
        return user['is_banned'] == 1 if user else False

    # ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

    def get_total_users(self) -> int:
        """Получить общее количество пользователей"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) as total FROM users")
                row = cursor.fetchone()
                return row['total'] if row else 0
        except Exception as e:
            logger.error(f"Ошибка получения количества пользователей: {e}")
            return 0

    def get_total_market_listings(self) -> int:
        """Получить общее количество предложений на рынке"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) as total FROM market_listings WHERE status = 'active'")
                row = cursor.fetchone()
                return row['total'] if row else 0
        except Exception as e:
            logger.error(f"Ошибка получения количества предложений: {e}")
            return 0

    def close(self):
        """Закрыть соединение с БД"""
        # SQLite не требует явного закрытия
        pass