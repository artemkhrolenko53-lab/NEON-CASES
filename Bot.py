import asyncio
import logging
import json
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart
from aiogram.types import Message, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.client.default import DefaultBotProperties

# Токен бота (замените!)
BOT_TOKEN = "1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
# Ссылка на Mini App
WEBAPP_URL = "https://artemkhrolenko53-lab.github.io/NEON-CASES/"

bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode="HTML"))
dp = Dispatcher()

@dp.message(CommandStart())
async def start(message: Message):
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🎁 Открыть STORM CASES", web_app=WebAppInfo(url=WEBAPP_URL))]
        ]
    )
    await message.answer("Добро пожаловать в STORM CASES!", reply_markup=keyboard)

@dp.message(F.content_type == "web_app_data")
async def handle_web_app_data(message: Message):
    data = json.loads(message.web_app_data.data)
    logging.info(f"Получены данные: {data}")
    await message.answer(f"✅ Данные получены: {data.get('type')}")

async def main():
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())