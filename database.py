"""
STORM CASES - Database
Расширенный модуль для работы с базой данных SQLite
"""

import sqlite3
import json
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
        logger.info(f"✅ База данных подключена: {db_path}")

    def get_connection(self) -> sqlite3.Connection:
        """Получить соединение с БД"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA journal_mode = WAL")
        conn.execute("PRAGMA synchronous = NORMAL")
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
                    last_name TEXT,
                    balance INTEGER DEFAULT 500,
                    total_donated INTEGER DEFAULT 0,
                    total_cases_opened INTEGER DEFAULT 0,
                    total_items_received INTEGER DEFAULT 0,
                    total_spent INTEGER DEFAULT 0,
                    total_earned INTEGER DEFAULT 0,
                    daily_streak INTEGER DEFAULT 0,
                    last_daily_claim TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_banned INTEGER DEFAULT 0,
                    ban_reason TEXT,
                    is_premium INTEGER DEFAULT 0,
                    premium_until TIMESTAMP,
                    settings TEXT DEFAULT '{}',
                    stats TEXT DEFAULT '{}'
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
                    is_listed INTEGER DEFAULT 0,
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
                    expires_at TIMESTAMP,
                    status TEXT DEFAULT 'active',
                    buyer_id INTEGER,
                    sold_at TIMESTAMP,
                    FOREIGN KEY (seller_id) REFERENCES users (user_id) ON DELETE CASCADE,
                    FOREIGN KEY (buyer_id) REFERENCES users (user_id) ON DELETE SET NULL
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

            # Таблица достижений
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS achievements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    achievement_id TEXT NOT NULL,
                    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
                    UNIQUE(user_id, achievement_id)
                )
            """)

            # Таблица поддержки
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS support_tickets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    ticket_type TEXT DEFAULT 'general',
                    subject TEXT,
                    message TEXT NOT NULL,
                    status TEXT DEFAULT 'open',
                    priority TEXT DEFAULT 'normal',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    resolved_at TIMESTAMP,
                    admin_reply TEXT,
                    admin_id INTEGER,
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
                    ip_address TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Таблица кейсов (история открытий)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS case_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    case_id INTEGER NOT NULL,
                    item_id INTEGER,
                    item_name TEXT,
                    item_rarity TEXT,
                    item_price INTEGER,
                    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
                )
            """)

            # Таблица ежедневных наград
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS daily_rewards (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    reward_amount INTEGER,
                    streak_count INTEGER,
                    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
                )
            """)

            # Таблица промокодов
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS promo_codes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT UNIQUE NOT NULL,
                    reward_type TEXT NOT NULL,
                    reward_amount INTEGER NOT NULL,
                    max_uses INTEGER DEFAULT 1,
                    uses_count INTEGER DEFAULT 0,
                    expires_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_active INTEGER DEFAULT 1,
                    created_by INTEGER,
                    FOREIGN KEY (created_by) REFERENCES users (user_id) ON DELETE SET NULL
                )
            """)

            # Таблица использованных промокодов
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS promo_uses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    promo_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (promo_id) REFERENCES promo_codes (id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
                    UNIQUE(promo_id, user_id)
                )
            """)

            # Таблица уровней
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_levels (
                    user_id INTEGER PRIMARY KEY,
                    level INTEGER DEFAULT 1,
                    experience INTEGER DEFAULT 0,
                    total_experience INTEGER DEFAULT 0,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
                )
            """)

            # Таблица уведомлений
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    type TEXT NOT NULL,
                    title TEXT,
                    message TEXT NOT NULL,
                    is_read INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
                )
            """)

            # Индексы для оптимизации
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_items_user ON user_items(user_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_market_status ON market_listings(status)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_logs_user ON logs(user_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_case_history_user ON case_history(user_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_invites_inviter ON invites(inviter_id)")

            conn.commit()
            logger.info("✅ Таблицы созданы")

    # ==================== МЕТОДЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ====================

    def add_user(self, user_id: int, username: str, first_name: str, last_name: str = None) -> bool:
        """Добавить нового пользователя"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR IGNORE INTO users (user_id, username, first_name, last_name)
                    VALUES (?, ?, ?, ?)
                """, (user_id, username, first_name, last_name))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"❌ Ошибка добавления пользователя: {e}")
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
            logger.error(f"❌ Ошибка получения пользователя: {e}")
            return None

    def update_user(self, user_id: int, **kwargs) -> bool:
        """Обновить данные пользователя"""
        try:
            if not kwargs:
                return False

            set_clause = ", ".join([f"{key} = ?" for key in kwargs.keys()])
            values = list(kwargs.values()) + [user_id]

            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(f"""
                    UPDATE users SET {set_clause}
                    WHERE user_id = ?
                """, values)
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"❌ Ошибка обновления пользователя: {e}")
            return False

    def get_balance(self, user_id: int) -> int:
        """Получить баланс пользователя"""
        user = self.get_user(user_id)
        return user['balance'] if user else 0

    def add_coins(self, user_id: int, amount: int, description: str = "Пополнение баланса") -> int:
        """Добавить монеты пользователю"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE users SET balance = balance + ?
                    WHERE user_id = ?
                """, (amount, user_id))

                cursor.execute("""
                    INSERT INTO transactions (user_id, type, amount, description)
                    VALUES (?, 'add_coins', ?, ?)
                """, (user_id, amount, description))

                conn.commit()
                return self.get_balance(user_id)
        except Exception as e:
            logger.error(f"❌ Ошибка добавления монет: {e}")
            return self.get_balance(user_id)

    def spend_coins(self, user_id: int, amount: int, description: str = "Списание монет") -> bool:
        """Потратить монеты пользователя"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE users SET balance = balance - ?
                    WHERE user_id = ? AND balance >= ?
                """, (amount, user_id, amount))

                if cursor.rowcount > 0:
                    cursor.execute("""
                        INSERT INTO transactions (user_id, type, amount, description)
                        VALUES (?, 'spend_coins', ?, ?)
                    """, (user_id, amount, description))
                    conn.commit()
                    return True
                return False
        except Exception as e:
            logger.error(f"❌ Ошибка списания монет: {e}")
            return False

    def update_last_seen(self, user_id: int):
        """Обновить время последнего визита"""
        self.update_user(user_id, last_seen=datetime.now())

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
            'total_spent': user['total_spent'],
            'total_earned': user['total_earned'],
            'daily_streak': user['daily_streak'],
            'created_at': user['created_at'],
            'last_seen': user['last_seen'],
            'is_premium': user['is_premium'],
        }

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
            logger.error(f"❌ Ошибка обновления статистики: {e}")

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
            logger.error(f"❌ Ошибка бана: {e}")
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
            logger.error(f"❌ Ошибка разбана: {e}")
            return False

    def is_banned(self, user_id: int) -> bool:
        """Проверить забанен ли пользователь"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT is_banned FROM users WHERE user_id = ?", (user_id,))
                row = cursor.fetchone()
                return row['is_banned'] == 1 if row else False
        except Exception as e:
            logger.error(f"❌ Ошибка проверки бана: {e}")
            return False

    def get_banned_users(self) -> List[Dict[str, Any]]:
        """Получить список забаненных пользователей"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT user_id, username, first_name, ban_reason
                    FROM users WHERE is_banned = 1
                    ORDER BY last_seen DESC
                """)
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"❌ Ошибка получения забаненных: {e}")
            return []

    # ==================== МЕТОДЫ ДЛЯ ПРЕДМЕТОВ ====================

    def add_item_to_inventory(self, user_id: int, item: Dict[str, Any]) -> bool:
        """Добавить предмет в инвентарь"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()

                # Проверяем есть ли уже такой предмет
                cursor.execute("""
                    SELECT id, quantity FROM user_items
                    WHERE user_id = ? AND item_id = ? AND is_listed = 0
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

                # Обновляем статистику
                cursor.execute("""
                    UPDATE users SET total_items_received = total_items_received + 1
                    WHERE user_id = ?
                """, (user_id,))

                conn.commit()
                return True
        except Exception as e:
            logger.error(f"❌ Ошибка добавления предмета: {e}")
            return False

    def remove_item_from_inventory(self, user_id: int, item_id: int, quantity: int = 1) -> bool:
        """Удалить предмет из инвентаря"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()

                cursor.execute("""
                    SELECT id, quantity FROM user_items
                    WHERE user_id = ? AND item_id = ? AND is_listed = 0
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
            logger.error(f"❌ Ошибка удаления предмета: {e}")
            return False

    def get_user_inventory(self, user_id: int) -> List[Dict[str, Any]]:
        """Получить инвентарь пользователя"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM user_items
                    WHERE user_id = ? AND is_listed = 0
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
            logger.error(f"❌ Ошибка получения инвентаря: {e}")
            return []

    def get_user_items_count(self, user_id: int) -> int:
        """Получить количество предметов пользователя"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT COALESCE(SUM(quantity), 0) as total
                    FROM user_items WHERE user_id = ? AND is_listed = 0
                """, (user_id,))
                row = cursor.fetchone()
                return row['total'] if row else 0
        except Exception as e:
            logger.error(f"❌ Ошибка подсчета предметов: {e}")
            return 0

    def get_inventory_value(self, user_id: int) -> int:
        """Получить стоимость инвентаря"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT COALESCE(SUM(item_price * quantity), 0) as total
                    FROM user_items WHERE user_id = ? AND is_listed = 0
                """, (user_id,))
                row = cursor.fetchone()
                return row['total'] if row else 0
        except Exception as e:
            logger.error(f"❌ Ошибка подсчета стоимости: {e}")
            return 0

    # ==================== МЕТОДЫ ДЛЯ РЫНКА ====================

    def add_market_listing(self, seller_id: int, item: Dict[str, Any], price: int, duration_hours: int = 72) -> \
    Optional[int]:
        """Добавить предложение на рынок"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()

                expires_at = datetime.now() + timedelta(hours=duration_hours)

                cursor.execute("""
                    INSERT INTO market_listings 
                    (seller_id, item_id, item_name, item_type, item_rarity, item_icon, price, expires_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    seller_id,
                    item.get('id', 0),
                    item.get('name', 'Unknown'),
                    item.get('type', 'Unknown'),
                    item.get('rarity', 'common'),
                    item.get('icon', '📦'),
                    price,
                    expires_at,
                ))

                listing_id = cursor.lastrowid
                conn.commit()
                return listing_id
        except Exception as e:
            logger.error(f"❌ Ошибка добавления на рынок: {e}")
            return None

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
                    AND (ml.expires_at IS NULL OR ml.expires_at > CURRENT_TIMESTAMP)
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

                    if filters.get('min_price'):
                        query += " AND ml.price >= ?"
                        params.append(filters['min_price'])

                    if filters.get('max_price'):
                        query += " AND ml.price <= ?"
                        params.append(filters['max_price'])

                query += " ORDER BY ml.created_at DESC"

                cursor.execute(query, params)
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"❌ Ошибка получения рынка: {e}")
            return []

    def buy_market_listing(self, listing_id: int, buyer_id: int) -> bool:
        """Купить предмет с рынка"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()

                cursor.execute("""
                    SELECT * FROM market_listings
                    WHERE id = ? AND status = 'active'
                """, (listing_id,))

                listing = cursor.fetchone()
                if not listing:
                    return False

                cursor.execute("""
                    SELECT balance FROM users WHERE user_id = ?
                """, (buyer_id,))

                buyer = cursor.fetchone()
                if not buyer or buyer['balance'] < listing['price']:
                    return False

                cursor.execute("""
                    UPDATE users SET balance = balance - ?
                    WHERE user_id = ?
                """, (listing['price'], buyer_id))

                cursor.execute("""
                    UPDATE users SET balance = balance + ?
                    WHERE user_id = ?
                """, (listing['price'], listing['seller_id']))

                cursor.execute("""
                    INSERT INTO user_items 
                    (user_id, item_id, item_name, item_type, item_rarity, item_icon, item_price)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    buyer_id,
                    listing['item_id'],
                    listing['item_name'],
                    listing['item_type'],
                    listing['item_rarity'],
                    listing['item_icon'],
                    listing['price'],
                ))

                cursor.execute("""
                    UPDATE market_listings 
                    SET status = 'sold', buyer_id = ?, sold_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (buyer_id, listing_id))

                cursor.execute("""
                    INSERT INTO transactions (user_id, type, amount, description)
                    VALUES (?, 'buy_item', ?, ?)
                """, (buyer_id, listing['price'], f"Покупка: {listing['item_name']}"))

                cursor.execute("""
                    INSERT INTO transactions (user_id, type, amount, description)
                    VALUES (?, 'sell_item', ?, ?)
                """, (listing['seller_id'], listing['price'], f"Продажа: {listing['item_name']}"))

                conn.commit()
                return True
        except Exception as e:
            logger.error(f"❌ Ошибка покупки: {e}")
            return False

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
            logger.error(f"❌ Ошибка удаления с рынка: {e}")
            return False

    def get_user_listings(self, user_id: int) -> List[Dict[str, Any]]:
        """Получить предложения пользователя"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM market_listings
                    WHERE seller_id = ? AND status = 'active'
                    ORDER BY created_at DESC
                """, (user_id,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"❌ Ошибка получения предложений: {e}")
            return []

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
            logger.error(f"❌ Ошибка записи транзакции: {e}")

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
            logger.error(f"❌ Ошибка получения транзакций: {e}")
            return []

    # ==================== МЕТОДЫ ДЛЯ ДОСТИЖЕНИЙ ====================

    def add_achievement(self, user_id: int, achievement_id: str) -> bool:
        """Добавить достижение пользователю"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR IGNORE INTO achievements (user_id, achievement_id)
                    VALUES (?, ?)
                """, (user_id, achievement_id))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"❌ Ошибка добавления достижения: {e}")
            return False

    def get_user_achievements(self, user_id: int) -> List[Dict[str, Any]]:
        """Получить достижения пользователя"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM achievements
                    WHERE user_id = ?
                    ORDER BY achieved_at DESC
                """, (user_id,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"❌ Ошибка получения достижений: {e}")
            return []

    def has_achievement(self, user_id: int, achievement_id: str) -> bool:
        """Проверить есть ли достижение"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id FROM achievements
                    WHERE user_id = ? AND achievement_id = ?
                """, (user_id, achievement_id))
                return cursor.fetchone() is not None
        except Exception as e:
            logger.error(f"❌ Ошибка проверки достижения: {e}")
            return False

    # ==================== МЕТОДЫ ДЛЯ ПОДДЕРЖКИ ====================

    def create_support_ticket(self, user_id: int, subject: str, message: str, ticket_type: str = 'general') -> Optional[
        int]:
        """Создать обращение в поддержку"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO support_tickets (user_id, ticket_type, subject, message)
                    VALUES (?, ?, ?, ?)
                """, (user_id, ticket_type, subject, message))
                ticket_id = cursor.lastrowid
                conn.commit()
                return ticket_id
        except Exception as e:
            logger.error(f"❌ Ошибка создания обращения: {e}")
            return None

    def get_support_tickets(self, status: str = 'open', user_id: int = None) -> List[Dict[str, Any]]:
        """Получить обращения в поддержку"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT st.*, u.username, u.first_name
                    FROM support_tickets st
                    JOIN users u ON st.user_id = u.user_id
                    WHERE st.status = ?
                """
                params = [status]
                if user_id:
                    query += " AND st.user_id = ?"
                    params.append(user_id)
                query += " ORDER BY st.created_at DESC"
                cursor.execute(query, params)
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"❌ Ошибка получения обращений: {e}")
            return []

    def resolve_support_ticket(self, ticket_id: int, admin_reply: str, admin_id: int) -> bool:
        """Закрыть обращение"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE support_tickets 
                    SET status = 'resolved', admin_reply = ?, admin_id = ?, resolved_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (admin_reply, admin_id, ticket_id))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"❌ Ошибка закрытия обращения: {e}")
            return False

    # ==================== МЕТОДЫ ДЛЯ ПРОМОКОДОВ ====================

    def create_promo_code(self, code: str, reward_type: str, reward_amount: int, max_uses: int = 1,
                          expires_at: datetime = None, created_by: int = None) -> Optional[int]:
        """Создать промокод"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO promo_codes (code, reward_type, reward_amount, max_uses, expires_at, created_by)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (code, reward_type, reward_amount, max_uses, expires_at, created_by))
                promo_id = cursor.lastrowid
                conn.commit()
                return promo_id
        except Exception as e:
            logger.error(f"❌ Ошибка создания промокода: {e}")
            return None

    def use_promo_code(self, user_id: int, code: str) -> Tuple[bool, str]:
        """Использовать промокод"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM promo_codes
                    WHERE code = ? AND is_active = 1
                    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
                """, (code,))
                promo = cursor.fetchone()
                if not promo:
                    return False, "Промокод не найден или истек"
                if promo['uses_count'] >= promo['max_uses']:
                    return False, "Промокод уже использован"
                cursor.execute("""
                    SELECT id FROM promo_uses
                    WHERE promo_id = ? AND user_id = ?
                """, (promo['id'], user_id))
                if cursor.fetchone():
                    return False, "Вы уже использовали этот промокод"
                if promo['reward_type'] == 'coins':
                    cursor.execute("""
                        UPDATE users SET balance = balance + ?
                        WHERE user_id = ?
                    """, (promo['reward_amount'], user_id))
                    cursor.execute("""
                        INSERT INTO transactions (user_id, type, amount, description)
                        VALUES (?, 'promo_code', ?, ?)
                    """, (user_id, promo['reward_amount'], f"Промокод: {code}"))
                cursor.execute("""
                    INSERT INTO promo_uses (promo_id, user_id)
                    VALUES (?, ?)
                """, (promo['id'], user_id))
                cursor.execute("""
                    UPDATE promo_codes SET uses_count = uses_count + 1
                    WHERE id = ?
                """, (promo['id'],))
                conn.commit()
                return True, f"Награда: {promo['reward_amount']} монет"
        except Exception as e:
            logger.error(f"❌ Ошибка использования промокода: {e}")
            return False, "Ошибка использования промокода"

    # ==================== МЕТОДЫ ДЛЯ УРОВНЕЙ ====================

    def get_user_level(self, user_id: int) -> Dict[str, Any]:
        """Получить уровень пользователя"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM user_levels WHERE user_id = ?
                """, (user_id,))
                row = cursor.fetchone()
                if row:
                    return dict(row)
                return {'user_id': user_id, 'level': 1, 'experience': 0, 'total_experience': 0}
        except Exception as e:
            logger.error(f"❌ Ошибка получения уровня: {e}")
            return {'user_id': user_id, 'level': 1, 'experience': 0, 'total_experience': 0}

    def add_experience(self, user_id: int, exp: int) -> Dict[str, Any]:
        """Добавить опыт пользователю"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR IGNORE INTO user_levels (user_id)
                    VALUES (?)
                """, (user_id,))
                cursor.execute("""
                    UPDATE user_levels SET 
                        experience = experience + ?,
                        total_experience = total_experience + ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ?
                """, (exp, exp, user_id))
                conn.commit()
                return self.get_user_level(user_id)
        except Exception as e:
            logger.error(f"❌ Ошибка добавления опыта: {e}")
            return self.get_user_level(user_id)

    # ==================== МЕТОДЫ ДЛЯ УВЕДОМЛЕНИЙ ====================

    def add_notification(self, user_id: int, notif_type: str, title: str, message: str) -> Optional[int]:
        """Добавить уведомление"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO notifications (user_id, type, title, message)
                    VALUES (?, ?, ?, ?)
                """, (user_id, notif_type, title, message))
                notif_id = cursor.lastrowid
                conn.commit()
                return notif_id
        except Exception as e:
            logger.error(f"❌ Ошибка добавления уведомления: {e}")
            return None

    def get_user_notifications(self, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        """Получить уведомления пользователя"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM notifications
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                    LIMIT ?
                """, (user_id, limit))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"❌ Ошибка получения уведомлений: {e}")
            return []

    def mark_notification_read(self, notification_id: int) -> bool:
        """Отметить уведомление как прочитанное"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE notifications SET is_read = 1
                    WHERE id = ?
                """, (notification_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"❌ Ошибка отметки уведомления: {e}")
            return False

    # ==================== МЕТОДЫ ДЛЯ ЛОГОВ ====================

    def log_action(self, user_id: int, action: str, details: str = "", ip_address: str = None):
        """Записать действие в лог"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO logs (user_id, action, details, ip_address)
                    VALUES (?, ?, ?, ?)
                """, (user_id, action, details, ip_address))
                conn.commit()
        except Exception as e:
            logger.error(f"❌ Ошибка записи лога: {e}")

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
            logger.error(f"❌ Ошибка получения логов: {e}")
            return []

    # ==================== МЕТОДЫ ДЛЯ ПРИГЛАШЕНИЙ ====================

    def add_invite(self, inviter_id: int, invited_id: int, invite_code: str) -> bool:
        """Добавить приглашение"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO invites (inviter_id, invited_id, invite_code)
                    VALUES (?, ?, ?)
                """, (inviter_id, invited_id, invite_code))
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"❌ Ошибка добавления приглашения: {e}")
            return False

    def get_user_invites(self, user_id: int) -> List[Dict[str, Any]]:
        """Получить приглашения пользователя"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT i.*, u.username, u.first_name
                    FROM invites i
                    JOIN users u ON i.invited_id = u.user_id
                    WHERE i.inviter_id = ?
                    ORDER BY i.created_at DESC
                """, (user_id,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"❌ Ошибка получения приглашений: {e}")
            return []

    def get_invites_count(self, user_id: int) -> int:
        """Получить количество приглашений"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT COUNT(*) as total FROM invites
                    WHERE inviter_id = ?
                """, (user_id,))
                row = cursor.fetchone()
                return row['total'] if row else 0
        except Exception as e:
            logger.error(f"❌ Ошибка подсчета приглашений: {e}")
            return 0

    # ==================== МЕТОДЫ ДЛЯ ИСТОРИИ КЕЙСОВ ====================

    def add_case_history(self, user_id: int, case_id: int, item: Dict[str, Any]) -> bool:
        """Добавить запись в историю кейсов"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO case_history (user_id, case_id, item_id, item_name, item_rarity, item_price)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (user_id, case_id, item.get('id'), item.get('name'), item.get('rarity'), item.get('price')))
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"❌ Ошибка добавления истории: {e}")
            return False

    def get_case_history(self, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        """Получить историю кейсов"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM case_history
                    WHERE user_id = ?
                    ORDER BY opened_at DESC
                    LIMIT ?
                """, (user_id, limit))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"❌ Ошибка получения истории: {e}")
            return []

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
            logger.error(f"❌ Ошибка подсчета пользователей: {e}")
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
            logger.error(f"❌ Ошибка подсчета предложений: {e}")
            return 0

    def get_total_items(self) -> int:
        """Получить общее количество предметов"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COALESCE(SUM(quantity), 0) as total FROM user_items")
                row = cursor.fetchone()
                return row['total'] if row else 0
        except Exception as e:
            logger.error(f"❌ Ошибка подсчета предметов: {e}")
            return 0

    def save_user_state(self, user_id: int, state_data: Dict[str, Any]) -> bool:
        """Сохранить состояние пользователя из Mini App"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE users 
                    SET balance = ?,
                        total_cases_opened = ?,
                        total_items_received = ?,
                        total_spent = ?,
                        total_earned = ?,
                        settings = ?,
                        stats = ?
                    WHERE user_id = ?
                """, (
                    state_data.get('balance', 0),
                    state_data.get('stats', {}).get('casesOpened', 0),
                    state_data.get('stats', {}).get('itemsReceived', 0),
                    state_data.get('stats', {}).get('totalSpent', 0),
                    state_data.get('stats', {}).get('totalEarned', 0),
                    json.dumps(state_data.get('settings', {})),
                    json.dumps(state_data.get('stats', {})),
                    user_id,
                ))

                inventory = state_data.get('inventory', [])
                if inventory:
                    cursor.execute("DELETE FROM user_items WHERE user_id = ?", (user_id,))
                    for item in inventory:
                        cursor.execute("""
                            INSERT INTO user_items 
                            (user_id, item_id, item_name, item_type, item_rarity, item_icon, item_price, quantity)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            user_id,
                            item.get('id', 0),
                            item.get('name', 'Unknown'),
                            item.get('type', 'Unknown'),
                            item.get('rarity', 'common'),
                            item.get('icon', '📦'),
                            item.get('price', 0),
                            item.get('qty', 1),
                        ))

                conn.commit()
                return True
        except Exception as e:
            logger.error(f"❌ Ошибка сохранения состояния: {e}")
            return False

    def close(self):
        """Закрыть соединение с БД"""
        pass