"""
STORM CASES — Telegram Bot
Красивый и функциональный бот с поддержкой Telegram Stars и Mini App.
Без отображения баланса в меню — баланс живёт в Mini App.
"""

import asyncio
import logging
import json
from datetime import datetime

from aiogram.client.default import DefaultBotProperties
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import (
    Message, CallbackQuery, PreCheckoutQuery,
    InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo, LabeledPrice
)
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.enums import ParseMode

from database import Database
from config import BOT_TOKEN, WEBAPP_URL, DONATION_OPTIONS

# ==================== ЛОГИРОВАНИЕ ====================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== ИНИЦИАЛИЗАЦИЯ ====================
bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher()
db = Database()

# ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
def escape_html(text: str) -> str:
    """Экранирование HTML-символов"""
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def get_main_keyboard() -> InlineKeyboardMarkup:
    """Главное меню — две кнопки"""
    builder = InlineKeyboardBuilder()
    builder.button(
        text="🎮 Открыть STORM CASES",
        web_app=WebAppInfo(url=WEBAPP_URL)
    )
    builder.button(
        text="⭐ Пополнить баланс",
        callback_data="show_donate"
    )
    builder.adjust(1)
    return builder.as_markup()

def get_donate_keyboard() -> InlineKeyboardMarkup:
    """Клавиатура с пакетами доната"""
    builder = InlineKeyboardBuilder()
    for stars, option in sorted(DONATION_OPTIONS.items()):
        builder.button(
            text=f"{option['emoji']} {stars} звёзд = 💰 {option['coins']} монет",
            callback_data=f"donate_{stars}"
        )
    builder.button(text="🔙 Назад", callback_data="back_to_main")
    builder.adjust(1)
    return builder.as_markup()

# ==================== ОБРАБОТЧИКИ КОМАНД ====================

@dp.message(CommandStart())
async def cmd_start(message: Message):
    """Приветственное сообщение"""
    user = message.from_user
    user_id = user.id
    username = user.username or "Unknown"
    first_name = user.first_name or "Гость"

    # Сохраняем пользователя в БД
    db.add_user(user_id, username, first_name)

    # Проверяем параметры (donate_XX)
    args = message.text.split()
    if len(args) > 1:
        param = args[1]
        if param.startswith("donate_"):
            stars = param.replace("donate_", "")
            if stars.isdigit() and int(stars) in DONATION_OPTIONS:
                await process_donate_invoice(message, int(stars))
                return
        # Здесь можно обработать invite_XXX при необходимости

    # Красивое приветствие
    text = (
        f"⚡ <b>STORM CASES</b>\n\n"
        f"Привет, <b>{escape_html(first_name)}</b>! 👋\n"
        f"Добро пожаловать в мир кейсов и редких предметов.\n\n"
        f"Чтобы начать, нажми кнопку ниже 👇"
    )
    await message.answer(text, reply_markup=get_main_keyboard())

@dp.message(Command("donate"))
async def cmd_donate(message: Message):
    """Открыть меню доната"""
    text = (
        "⭐ <b>Пополнение баланса</b>\n\n"
        "Выбери один из пакетов:"
    )
    await message.answer(text, reply_markup=get_donate_keyboard())

@dp.message(Command("stats"))
async def cmd_stats(message: Message):
    """Статистика пользователя (если БД поддерживает)"""
    user_id = message.from_user.id
    stats = db.get_user_stats(user_id)
    if not stats:
        await message.answer("❌ <b>Пользователь не найден</b>")
        return

    text = (
        "📊 <b>Ваша статистика</b>\n\n"
        f"💰 Баланс: <b>{stats.get('balance', 0)}</b> монет\n"
        f"📦 Кейсов открыто: <b>{stats.get('total_cases_opened', 0)}</b>\n"
        f"🎁 Предметов получено: <b>{stats.get('total_items_received', 0)}</b>\n"
        f"💎 Пожертвовано: <b>{stats.get('total_donated', 0)}</b> звёзд\n"
        f"📅 Регистрация: <b>{stats.get('created_at', '')[:10]}</b>"
    )
    await message.answer(text)

@dp.message(Command("help"))
async def cmd_help(message: Message):
    """Справка"""
    text = (
        "❓ <b>Помощь по STORM CASES</b>\n\n"
        "Используй кнопки ниже, чтобы начать игру.\n\n"
        "Основные команды:\n"
        "/start – главное меню\n"
        "/donate – пополнение баланса\n"
        "/stats – твоя статистика\n"
        "/help – эта справка"
    )
    await message.answer(text)

# ==================== CALLBACK-ОБРАБОТЧИКИ ====================

@dp.callback_query(F.data == "show_donate")
async def cb_show_donate(callback: CallbackQuery):
    """Показ меню доната"""
    text = (
        "⭐ <b>Пополнение баланса</b>\n\n"
        "Выбери пакет:"
    )
    await callback.message.edit_text(text, reply_markup=get_donate_keyboard())
    await callback.answer()

@dp.callback_query(F.data.startswith("donate_"))
async def cb_donate(callback: CallbackQuery):
    """Создание инвойса"""
    stars = callback.data.replace("donate_", "")
    if not stars.isdigit() or int(stars) not in DONATION_OPTIONS:
        await callback.answer("❌ Неверный пакет", show_alert=True)
        return

    await process_donate_invoice(callback.message, int(stars))
    await callback.answer()

@dp.callback_query(F.data == "back_to_main")
async def cb_back_to_main(callback: CallbackQuery):
    """Возврат в главное меню"""
    text = "🎮 <b>STORM CASES</b>\n\nВыбери действие:"
    await callback.message.edit_text(text, reply_markup=get_main_keyboard())
    await callback.answer()

# ==================== ПЛАТЕЖИ ====================

async def process_donate_invoice(message: Message, stars: int):
    """Создание инвойса для оплаты через Telegram Stars"""
    option = DONATION_OPTIONS.get(stars)
    if not option:
        await message.answer("❌ <b>Неверный пакет</b>")
        return

    prices = [LabeledPrice(
        label=f"{option['stars']} Telegram Stars",
        amount=option['stars']
    )]

    await bot.send_invoice(
        chat_id=message.chat.id,
        title="Пополнение STORM CASES",
        description=f"Покупка {option['coins']} монет за {option['stars']} звёзд",
        provider_token="",      # для Telegram Stars
        currency="XTR",
        prices=prices,
        payload=f"donate_{stars}_{message.from_user.id}",
        start_parameter=f"donate_{stars}"
    )

@dp.pre_checkout_query()
async def pre_checkout_handler(pre_checkout_query: PreCheckoutQuery):
    """Подтверждение pre-checkout"""
    await bot.answer_pre_checkout_query(pre_checkout_query.id, ok=True)

@dp.message(F.successful_payment)
async def successful_payment_handler(message: Message):
    """Обработка успешной оплаты"""
    payload = message.successful_payment.invoice_payload
    parts = payload.split("_")
    if len(parts) >= 3 and parts[0] == "donate":
        stars = int(parts[1])
        user_id = int(parts[2])
        if stars in DONATION_OPTIONS:
            coins = DONATION_OPTIONS[stars]["coins"]
            db.add_coins(user_id, coins)

            # Кнопка для возврата в Mini App
            kb = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🎮 Открыть STORM CASES", web_app=WebAppInfo(url=WEBAPP_URL))]
            ])

            text = (
                "✅ <b>Оплата успешна!</b>\n\n"
                f"Получено: <b>{coins} монет</b>\n"
                f"Спасибо за поддержку! 🎉"
            )
            await message.answer(text, reply_markup=kb)
            logger.info(f"Пользователь {user_id} пополнил баланс на {coins} монет")

# ==================== ЗАПУСК ====================

async def main():
    """Запуск бота"""
    logger.info("🤖 Запуск STORM CASES бота...")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Бот остановлен")
    except Exception as e:
        logger.error(f"Ошибка запуска: {e}")
