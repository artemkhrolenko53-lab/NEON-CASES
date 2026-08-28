import os
from dotenv import load_dotenv

load_dotenv()

# Токен бота
BOT_TOKEN = os.getenv("8907615374:AAE9oS1KbtKtEuVCnNteDPQmg1ojGXaN2sk", "ВАШ_ТОКЕН_БОТА")

# Telegram ID владельца
OWNER_ID = 8601398572

# URL базы данных (SQLite по умолчанию)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///storm.db")

# Секретный ключ (заглушка)
SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")

# Названия серверов
SERVER_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']

# Стартовый баланс
START_BALANCE = 1000

# Множитель продажи
SELL_MULTIPLIER = 0.5

# Ссылка на Mini App (для удобства)
WEBAPP_URL = "https://artemkhrolenko53-lab.github.io/NEON-CASES/"
