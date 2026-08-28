import asyncio
import logging
import json
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton, LabeledPrice, PreCheckoutQuery
from aiogram.client.default import DefaultBotProperties
import config
from database import SessionLocal
import payments

bot = Bot(token=config.BOT_TOKEN, default=DefaultBotProperties(parse_mode="HTML"))
dp = Dispatcher()

@dp.message(CommandStart())
async def start(message: Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🎁 Открыть STORM CASES", web_app=WebAppInfo(url=config.WEBAPP_URL))]
    ])
    await message.answer("Добро пожаловать в STORM CASES!", reply_markup=keyboard)

@dp.message(Command("donate"))
async def donate(message: Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⭐ 10 звёзд = 500 монет", callback_data="pay_10")],
        [InlineKeyboardButton(text="⭐ 50 звёзд = 3000 монет", callback_data="pay_50")],
        [InlineKeyboardButton(text="⭐ 100 звёзд = 10000 монет", callback_data="pay_100")],
    ])
    await message.answer("Выберите пакет:", reply_markup=keyboard)

@dp.callback_query(lambda c: c.data and c.data.startswith("pay_"))
async def process_payment(callback: types.CallbackQuery):
    stars = int(callback.data.split("_")[1])
    prices = {10: 500, 50: 3000, 100: 10000}
    await bot.send_invoice(
        chat_id=callback.from_user.id,
        title="Пополнение баланса",
        description=f"{prices[stars]} монет за {stars} звёзд",
        payload=f"donate_{stars}",
        provider_token="",  # Для звёзд не нужен
        currency="XTR",
        prices=[LabeledPrice(label="Монеты", amount=stars)],
    )
    await callback.answer()

@dp.pre_checkout_query()
async def pre_checkout(query: PreCheckoutQuery):
    await query.answer(ok=True)

@dp.message(F.successful_payment)
async def successful_payment(message: Message):
    payload = message.successful_payment.invoice_payload
    stars = int(payload.split("_")[1])
    coins = {10: 500, 50: 3000, 100: 10000}[stars]
    db = SessionLocal()
    try:
        user = db.query(__import__('models').models.User).filter_by(telegram_id=message.from_user.id).first()
        if user:
            user.balance += coins
            db.commit()
    finally:
        db.close()
    await message.answer(f"✅ Начислено {coins} монет!")

@dp.message(F.content_type == "web_app_data")
async def handle_web_app_data(message: Message):
    data = json.loads(message.web_app_data.data)
    logging.info(f"Данные: {data}")

async def main():
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())