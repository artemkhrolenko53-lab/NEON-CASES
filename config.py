import os
from dotenv import load_dotenv

load_dotenv()

# Токен бота (нужен для проверки initData и отправки сообщений)
BOT_TOKEN = os.getenv("8907615374:AAE3BqeX0A7Wd-ssUb-IU-YQO-HUXyfMmN8", "ВАШ_ТОКЕН_БОТА")

# Telegram ID владельца (имеет полный доступ)
OWNER_ID = 8601398572

# URL базы данных
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///storm.db")

# Ссылка на ваш Mini App
WEBAPP_URL = "https://artemkhrolenko53-lab.github.io/NEON-CASES/"  # ← СЮДА ВСТАВЬТЕ ССЫЛКУ

# Секретный ключ (пока заглушка)
SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")

# Названия серверов
SERVER_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']

# Стартовый баланс
START_BALANCE = 1000

# Множитель продажи
SELL_MULTIPLIER = 0.5
