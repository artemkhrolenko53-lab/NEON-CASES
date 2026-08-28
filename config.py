import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "ВАШ_ТОКЕН")
OWNER_ID = 8601398572
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///storm.db")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")
WEBAPP_URL = "https://artemkhrolenko53-lab.github.io/NEON-CASES/"
SERVER_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']
START_BALANCE = 1000
SELL_MULTIPLIER = 0.5