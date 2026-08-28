import asyncio
import logging
import json
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart
from aiogram.types import Message, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.client.default import DefaultBotProperties

# Токен возьмите из .env или прямо здесь (не забудьте убрать перед публикацией)
BOT_TOKEN = "ВАШ_ТОКЕН_БОТА"
WEBAPP_URL = "https://your-hosting.com/index.html"  # адрес вашего index.html

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

# Обработка данных, отправленных из Mini App
@dp.message(F.content_type == "web_app_data")
async def handle_web_app_data(message: Message):
    data = json.loads(message.web_app_data.data)
    # data содержит ваш JSON, отправленный через sendData()
    logging.info(f"Получены данные: {data}")

    # Пример: уведомляем пользователя
    await message.answer(f"✅ Данные получены: {data.get('type')}")

async def main():
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())