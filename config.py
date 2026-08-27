"""
STORM CASES - Configuration
Полный файл конфигурации бота
Замените значения на свои при подключении
"""

import os
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

# ==================== НАСТРОЙКИ БОТА ====================

# Токен бота (получите у @BotFather)
BOT_TOKEN = os.getenv('BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')

# URL Mini App (замените на свой)
WEBAPP_URL = os.getenv('WEBAPP_URL', 'https://yourusername.github.io/your-repo/')

# Username бота без @
BOT_USERNAME = os.getenv('BOT_USERNAME', 'your_bot_username')

# URL поддержки
SUPPORT_BOT_URL = os.getenv('SUPPORT_BOT_URL', 'https://t.me/your_support_bot')

# URL канала (опционально)
CHANNEL_URL = os.getenv('CHANNEL_URL', 'https://t.me/your_channel')

# URL чата для общения игроков (опционально)
CHAT_URL = os.getenv('CHAT_URL', 'https://t.me/your_chat')

# ID администраторов
# ==================== ВЛАДЕЛЕЦ И АДМИНИСТРАТОРЫ ====================

# ID владельца (уровень 5) — ваш Telegram ID
OWNER_ID = int(os.getenv('OWNER_ID', '0'))

# Словарь администраторов: user_id -> уровень (1-4)
ADMINS = {
    # Пример:
    # 123456789: 4,  # главный админ
    # 987654321: 3,
    # 555555555: 2,
}

# Или можно оставить список для совместимости, но лучше словарь
ADMIN_IDS = [OWNER_ID] + list(ADMINS.keys())
# ==================== НАСТРОЙКИ БАЗЫ ДАННЫХ ====================

DATABASE_PATH = os.getenv('DATABASE_PATH', 'storm_cases.db')

# Настройки подключения (если используете PostgreSQL)
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', '5432')),
    'name': os.getenv('DB_NAME', 'storm_cases'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
}

# ==================== НАСТРОЙКИ API ====================

API_CONFIG = {
    'host': os.getenv('API_HOST', '0.0.0.0'),
    'port': int(os.getenv('API_PORT', '8080')),
    'debug': os.getenv('API_DEBUG', 'False').lower() == 'true',
    'secret_key': os.getenv('API_SECRET_KEY', 'your-secret-key-here'),
    'allowed_origins': [
        WEBAPP_URL,
        'https://web.telegram.org',
        'https://telegram.org',
    ],
}

# ==================== НАСТРОЙКИ ДОНАТА ====================

DONATION_OPTIONS: Dict[int, Dict[str, Any]] = {
    10: {
        "stars": 10,
        "coins": 500,
        "emoji": "⭐",
        "description": "Базовый пакет",
        "bonus": 0,
        "popular": False,
    },
    50: {
        "stars": 50,
        "coins": 3000,
        "emoji": "🌟",
        "description": "Стандартный пакет",
        "bonus": 10,  # +10% бонус
        "popular": True,
    },
    100: {
        "stars": 100,
        "coins": 10000,
        "emoji": "💫",
        "description": "Премиум пакет",
        "bonus": 20,  # +20% бонус
        "popular": False,
    },
    500: {
        "stars": 500,
        "coins": 60000,
        "emoji": "👑",
        "description": "Королевский пакет",
        "bonus": 30,  # +30% бонус
        "popular": False,
    },
    1000: {
        "stars": 1000,
        "coins": 150000,
        "emoji": "🚀",
        "description": "Легендарный пакет",
        "bonus": 50,  # +50% бонус
        "popular": False,
    },
}

# ==================== НАСТРОЙКИ ЭКОНОМИКИ ====================

ECONOMY_SETTINGS = {
    "start_balance": 500,  # Начальный баланс
    "daily_reward": 200,  # Ежедневная награда
    "invite_reward": 100,  # Награда за приглашение
    "sell_multiplier": 0.6,  # Множитель продажи (60% от цены)
    "max_invites_per_day": 5,  # Максимум приглашений в день
    "min_sell_price": 1,  # Минимальная цена продажи
    "max_sell_price": 1000000,  # Максимальная цена продажи
    "market_fee": 0,  # Комиссия рынка (0 = без комиссии, 0.05 = 5%)
    "referral_bonus": 50,  # Бонус рефереру
    "daily_reward_streak": True,  # Включить систему стриков
    "daily_reward_multiplier": 1.5,  # Множитель за стрик
    "max_daily_reward": 1000,  # Максимальная ежедневная награда
}

# ==================== НАСТРОЙКИ ПРЕДМЕТОВ ====================

ITEMS_DATA = [
    # ===== COMMON =====
    {"id": 1, "name": "Glock-18", "type": "Пистолет", "rarity": "common", "price": 30, "icon": "🔫"},
    {"id": 2, "name": "P250", "type": "Пистолет", "rarity": "common", "price": 45, "icon": "🔫"},
    {"id": 3, "name": "MP9", "type": "ПП", "rarity": "common", "price": 60, "icon": "🔫"},
    {"id": 4, "name": "Nova", "type": "Дробовик", "rarity": "common", "price": 75, "icon": "🔫"},
    {"id": 5, "name": "UMP-45", "type": "ПП", "rarity": "common", "price": 90, "icon": "🔫"},
    {"id": 6, "name": "Tec-9", "type": "Пистолет", "rarity": "common", "price": 55, "icon": "🔫"},
    {"id": 7, "name": "MAG-7", "type": "Дробовик", "rarity": "common", "price": 85, "icon": "🔫"},
    {"id": 8, "name": "MP7", "type": "ПП", "rarity": "common", "price": 70, "icon": "🔫"},
    {"id": 9, "name": "Sawed-Off", "type": "Дробовик", "rarity": "common", "price": 65, "icon": "🔫"},
    {"id": 10, "name": "MAC-10", "type": "ПП", "rarity": "common", "price": 50, "icon": "🔫"},

    # ===== RARE =====
    {"id": 11, "name": "AK-47", "type": "Винтовка", "rarity": "rare", "price": 180, "icon": "🔫"},
    {"id": 12, "name": "M4A4", "type": "Винтовка", "rarity": "rare", "price": 220, "icon": "🔫"},
    {"id": 13, "name": "Desert Eagle", "type": "Пистолет", "rarity": "rare", "price": 250, "icon": "🔫"},
    {"id": 14, "name": "FAMAS", "type": "Винтовка", "rarity": "rare", "price": 200, "icon": "🔫"},
    {"id": 15, "name": "SSG 08", "type": "Снайперская", "rarity": "rare", "price": 280, "icon": "🔫"},
    {"id": 16, "name": "Sport Gloves", "type": "Перчатки", "rarity": "rare", "price": 150, "icon": "🧤"},
    {"id": 17, "name": "P90", "type": "ПП", "rarity": "rare", "price": 210, "icon": "🔫"},
    {"id": 18, "name": "Galil AR", "type": "Винтовка", "rarity": "rare", "price": 190, "icon": "🔫"},

    # ===== EPIC =====
    {"id": 19, "name": "AWP", "type": "Снайперская", "rarity": "epic", "price": 450, "icon": "🔫"},
    {"id": 20, "name": "M4A1-S", "type": "Винтовка", "rarity": "epic", "price": 500, "icon": "🔫"},
    {"id": 21, "name": "Butterfly Knife", "type": "Нож", "rarity": "epic", "price": 600, "icon": "🗡️"},
    {"id": 22, "name": "USP-S", "type": "Пистолет", "rarity": "epic", "price": 400, "icon": "🔫"},
    {"id": 23, "name": "Specialist Gloves", "type": "Перчатки", "rarity": "epic", "price": 550, "icon": "🧤"},
    {"id": 24, "name": "SCAR-20", "type": "Снайперская", "rarity": "epic", "price": 480, "icon": "🔫"},

    # ===== LEGENDARY =====
    {"id": 25, "name": "Karambit", "type": "Нож", "rarity": "legendary", "price": 1200, "icon": "🗡️"},
    {"id": 26, "name": "Dragon Lore", "type": "Снайперская", "rarity": "legendary", "price": 2500, "icon": "🔫"},
    {"id": 27, "name": "Pandora Gloves", "type": "Перчатки", "rarity": "legendary", "price": 1800, "icon": "🧤"},
    {"id": 28, "name": "Gut Knife", "type": "Нож", "rarity": "legendary", "price": 1100, "icon": "🗡️"},
    {"id": 29, "name": "Moto Gloves", "type": "Перчатки", "rarity": "legendary", "price": 1600, "icon": "🧤"},
    {"id": 30, "name": "Howl", "type": "Винтовка", "rarity": "legendary", "price": 3000, "icon": "🔫"},
]

# ==================== НАСТРОЙКИ КЕЙСОВ ====================

CASES_DATA = [
    {
        "id": 0,
        "name": "Обычный кейс",
        "price": 80,
        "icon": "📦",
        "probabilities": {"common": 85, "rare": 15},
        "description": "Базовый кейс с обычными и редкими предметами",
        "color": "#ffffff",
    },
    {
        "id": 1,
        "name": "Редкий кейс",
        "price": 280,
        "icon": "🎁",
        "probabilities": {"rare": 80, "epic": 20},
        "description": "Улучшенный кейс с редкими и эпическими предметами",
        "color": "#4a9eff",
    },
    {
        "id": 2,
        "name": "Легендарный кейс",
        "price": 650,
        "icon": "💎",
        "probabilities": {"epic": 85, "legendary": 15},
        "description": "Премиум кейс с эпическими и легендарными предметами",
        "color": "#ffd700",
    },
    {
        "id": 3,
        "name": "Ножевой кейс",
        "price": 1000,
        "icon": "🗡️",
        "probabilities": {"rare": 50, "epic": 35, "legendary": 15},
        "description": "Специальный кейс с ножами и редкими предметами",
        "color": "#a855f7",
    },
    {
        "id": 4,
        "name": "Премиум кейс",
        "price": 1500,
        "icon": "👑",
        "probabilities": {"epic": 60, "legendary": 40},
        "description": "Элитный кейс с лучшими предметами",
        "color": "#ffd700",
    },
]

# ==================== НАСТРОЙКИ РЕДКОСТЕЙ ====================

RARITY_SETTINGS = {
    "common": {
        "name": "Обычный",
        "color": "#ffffff",
        "glow": "0 0 20px rgba(255,255,255,0.5)",
        "weight": 1,
    },
    "rare": {
        "name": "Редкий",
        "color": "#4a9eff",
        "glow": "0 0 30px rgba(74,158,255,0.7)",
        "weight": 2,
    },
    "epic": {
        "name": "Эпический",
        "color": "#a855f7",
        "glow": "0 0 40px rgba(168,85,247,0.8)",
        "weight": 3,
    },
    "legendary": {
        "name": "Легендарный",
        "color": "#ffd700",
        "glow": "0 0 50px rgba(255,215,0,0.9)",
        "weight": 4,
    },
}

# ==================== НАСТРОЙКИ ЛОГИРОВАНИЯ ====================

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        },
        "detailed": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(module)s - %(funcName)s - %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "level": "INFO",
        },
        "file": {
            "class": "logging.FileHandler",
            "filename": "bot.log",
            "formatter": "detailed",
            "level": "DEBUG",
        },
    },
    "loggers": {
        "": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": True,
        },
    },
}

# ==================== НАСТРОЙКИ УВЕДОМЛЕНИЙ ====================

NOTIFICATION_SETTINGS = {
    "daily_reward": True,
    "new_item": True,
    "market_sale": True,
    "market_purchase": True,
    "level_up": True,
    "achievement": True,
}

# ==================== НАСТРОЙКИ ДОСТИЖЕНИЙ ====================

ACHIEVEMENTS = [
    {
        "id": "first_case",
        "name": "Первый кейс",
        "description": "Откройте первый кейс",
        "icon": "📦",
        "reward": 50,
    },
    {
        "id": "case_master",
        "name": "Мастер кейсов",
        "description": "Откройте 100 кейсов",
        "icon": "🎯",
        "reward": 500,
    },
    {
        "id": "legendary_drop",
        "name": "Легендарный дроп",
        "description": "Получите легендарный предмет",
        "icon": "💎",
        "reward": 1000,
    },
    {
        "id": "market_tycoon",
        "name": "Рыночный магнат",
        "description": "Продайте предметов на 10000 монет",
        "icon": "💰",
        "reward": 2000,
    },
    {
        "id": "collector",
        "name": "Коллекционер",
        "description": "Соберите 50 предметов",
        "icon": "🎒",
        "reward": 1500,
    },
]


# ==================== ФУНКЦИИ ПОМОЩНИКИ ====================

def get_item_by_id(item_id: int) -> Optional[Dict[str, Any]]:
    """Получить предмет по ID"""
    for item in ITEMS_DATA:
        if item["id"] == item_id:
            return item
    return None


def get_items_by_rarity(rarity: str) -> List[Dict[str, Any]]:
    """Получить предметы по редкости"""
    return [item for item in ITEMS_DATA if item["rarity"] == rarity]


def get_case_by_id(case_id: int) -> Optional[Dict[str, Any]]:
    """Получить кейс по ID"""
    for case in CASES_DATA:
        if case["id"] == case_id:
            return case
    return None


def get_donation_option(stars: int) -> Optional[Dict[str, Any]]:
    """Получить опцию доната по количеству звёзд"""
    return DONATION_OPTIONS.get(stars)


def is_admin(user_id: int) -> bool:
    """Проверить, является ли пользователь админом"""
    return user_id in ADMIN_IDS


def get_rarity_info(rarity: str) -> Dict[str, Any]:
    """Получить информацию о редкости"""
    return RARITY_SETTINGS.get(rarity, RARITY_SETTINGS["common"])


def calculate_sell_price(item_price: int) -> int:
    """Рассчитать цену продажи предмета"""
    return int(item_price * ECONOMY_SETTINGS["sell_multiplier"])


def calculate_donation_coins(stars: int) -> int:
    """Рассчитать количество монет за донат с учетом бонуса"""
    option = DONATION_OPTIONS.get(stars)
    if not option:
        return 0

    base_coins = option["coins"]
    bonus = option.get("bonus", 0)

    if bonus > 0:
        return base_coins + int(base_coins * bonus / 100)

    return base_coins


def get_daily_reward(streak: int = 0) -> int:
    """Рассчитать ежедневную награду с учетом стрика"""
    base_reward = ECONOMY_SETTINGS["daily_reward"]

    if ECONOMY_SETTINGS["daily_reward_streak"] and streak > 0:
        multiplier = min(
            ECONOMY_SETTINGS["daily_reward_multiplier"] ** streak,
            ECONOMY_SETTINGS["max_daily_reward"] / base_reward
        )
        return int(base_reward * multiplier)

    return base_reward


def get_achievement_by_id(achievement_id: str) -> Optional[Dict[str, Any]]:
    """Получить достижение по ID"""
    for achievement in ACHIEVEMENTS:
        if achievement["id"] == achievement_id:
            return achievement
    return None


# ==================== ВАЛИДАЦИЯ КОНФИГУРАЦИИ ====================

def validate_config() -> bool:
    """Проверить корректность конфигурации"""
    errors = []

    if BOT_TOKEN == 'YOUR_BOT_TOKEN_HERE':
        errors.append("BOT_TOKEN не настроен")

    if WEBAPP_URL == 'https://yourusername.github.io/your-repo/':
        errors.append("WEBAPP_URL не настроен")

    if BOT_USERNAME == 'your_bot_username':
        errors.append("BOT_USERNAME не настроен")

    if not ADMIN_IDS or ADMIN_IDS[0] == 0:
        errors.append("ADMIN_IDS не настроены")

    if errors:
        logger.error("Ошибки конфигурации:")
        for error in errors:
            logger.error(f"  - {error}")
        return False

    logger.info("✅ Конфигурация корректна")
    return True


# ==================== ЛОГГЕР ====================

import logging

logger = logging.getLogger(__name__)

# Проверяем конфигурацию при импорте
if __name__ == "__main__":
    validate_config()

# ID владельца (уровень 5)
OWNER_ID = int(os.getenv('OWNER_ID', '8601398572'))

# Администраторы (уровень 1-4)
ADMINS = {
    # 123456789: 4,  # пример
}

# Для обратной совместимости
ADMIN_IDS = [OWNER_ID] + list(ADMINS.keys())

def get_admin_level(user_id: int) -> int:
    if user_id == OWNER_ID:
        return 5
    return ADMINS.get(user_id, 0)

def is_admin(user_id: int) -> bool:
    return get_admin_level(user_id) >= 1

def is_owner(user_id: int) -> bool:
    return user_id == OWNER_ID