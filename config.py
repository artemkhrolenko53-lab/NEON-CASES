"""
STORM CASES - Configuration
Файл конфигурации бота
"""

import os
from typing import Dict, Any
from dataclasses import dataclass, field

# ==================== ОСНОВНЫЕ НАСТРОЙКИ ====================

# Токен бота (замените на свой)
BOT_TOKEN = "8907615374:AAE3BqeX0A7Wd-ssUb-IU-YQO-HUXyfMmN8"

# URL Mini App
WEBAPP_URL = "https://artemkhrolenko53-lab.github.io/NEON-CASES/"

# URL поддержки
SUPPORT_BOT_URL = "https://t.me/your_support_bot"

# Username бота (без @)
BOT_USERNAME = "storm_cases_bot"

# ID администраторов (добавьте свои Telegram ID)
ADMIN_IDS = [
    123456789,  # Главный админ
    # Добавьте дополнительные ID
]

# ==================== НАСТРОЙКИ БАЗЫ ДАННЫХ ====================

DATABASE_PATH = "storm_cases.db"

# ==================== НАСТРОЙКИ ДОНАТА ====================

DONATION_OPTIONS = {
    10: {
        "stars": 10,
        "coins": 500,
        "emoji": "⭐",
        "description": "Базовый пакет",
    },
    50: {
        "stars": 50,
        "coins": 3000,
        "emoji": "🌟",
        "description": "Стандартный пакет",
    },
    100: {
        "stars": 100,
        "coins": 10000,
        "emoji": "💫",
        "description": "Премиум пакет",
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
}

# ==================== НАСТРОЙКИ ПРЕДМЕТОВ ====================

ITEMS_DATA = [
    # Common
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

    # Rare
    {"id": 11, "name": "AK-47", "type": "Винтовка", "rarity": "rare", "price": 180, "icon": "🔫"},
    {"id": 12, "name": "M4A4", "type": "Винтовка", "rarity": "rare", "price": 220, "icon": "🔫"},
    {"id": 13, "name": "Desert Eagle", "type": "Пистолет", "rarity": "rare", "price": 250, "icon": "🔫"},
    {"id": 14, "name": "FAMAS", "type": "Винтовка", "rarity": "rare", "price": 200, "icon": "🔫"},
    {"id": 15, "name": "SSG 08", "type": "Снайперская", "rarity": "rare", "price": 280, "icon": "🔫"},
    {"id": 16, "name": "Sport Gloves", "type": "Перчатки", "rarity": "rare", "price": 150, "icon": "🧤"},
    {"id": 17, "name": "P90", "type": "ПП", "rarity": "rare", "price": 210, "icon": "🔫"},
    {"id": 18, "name": "Galil AR", "type": "Винтовка", "rarity": "rare", "price": 190, "icon": "🔫"},

    # Epic
    {"id": 19, "name": "AWP", "type": "Снайперская", "rarity": "epic", "price": 450, "icon": "🔫"},
    {"id": 20, "name": "M4A1-S", "type": "Винтовка", "rarity": "epic", "price": 500, "icon": "🔫"},
    {"id": 21, "name": "Butterfly Knife", "type": "Нож", "rarity": "epic", "price": 600, "icon": "🗡️"},
    {"id": 22, "name": "USP-S", "type": "Пистолет", "rarity": "epic", "price": 400, "icon": "🔫"},
    {"id": 23, "name": "Specialist Gloves", "type": "Перчатки", "rarity": "epic", "price": 550, "icon": "🧤"},
    {"id": 24, "name": "SCAR-20", "type": "Снайперская", "rarity": "epic", "price": 480, "icon": "🔫"},

    # Legendary
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
    },
    {
        "id": 1,
        "name": "Редкий кейс",
        "price": 280,
        "icon": "🎁",
        "probabilities": {"rare": 80, "epic": 20},
    },
    {
        "id": 2,
        "name": "Легендарный кейс",
        "price": 650,
        "icon": "💎",
        "probabilities": {"epic": 85, "legendary": 15},
    },
]

# ==================== НАСТРОЙКИ ЛОГИРОВАНИЯ ====================

LOGGING_CONFIG = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file": "bot.log",
}


# ==================== ФУНКЦИИ ПОМОЩНИКИ ====================

def get_item_by_id(item_id: int) -> Dict[str, Any]:
    """Получить предмет по ID"""
    for item in ITEMS_DATA:
        if item["id"] == item_id:
            return item
    return None


def get_items_by_rarity(rarity: str) -> list:
    """Получить предметы по редкости"""
    return [item for item in ITEMS_DATA if item["rarity"] == rarity]


def get_case_by_id(case_id: int) -> Dict[str, Any]:
    """Получить кейс по ID"""
    for case in CASES_DATA:
        if case["id"] == case_id:
            return case
    return None


def is_admin(user_id: int) -> bool:
    """Проверить является ли пользователь админом"""
    return user_id in ADMIN_IDS


def get_donation_option(stars: int) -> Dict[str, Any]:
    """Получить опцию доната по количеству звёзд"""
    return DONATION_OPTIONS.get(stars)