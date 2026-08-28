import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
OWNER_ID = 8601398572  # ваш Telegram ID
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://your-hosting.com/index.html")