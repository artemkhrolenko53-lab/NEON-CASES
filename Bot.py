"""
STORM CASES - Telegram Bot
Исправленная версия: без поддержки, с корректным донатом и синхронизацией баланса
"""

import asyncio
import logging
import json

from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import (
    Message,
    CallbackQuery,
    PreCheckoutQuery,
    LabeledPrice,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
)
from aiogram.utils.keyboard import InlineKeyboardBuilder

from database import Database
from config import BOT_TOKEN, WEBAPP_URL, DONATION_OPTIONS

# ==================== ИНИЦИАЛИЗАЦИЯ ====================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
db = Database()


# ==================== КЛАВИАТУРЫ ====================
def get_main_keyboard(user_id: int) -> InlineKeyboardMarkup:
    """Главное меню (без поддержки и помощи)"""
    builder = InlineKeyboardBuilder()
    builder.button(text="🎮 Открыть STORM CASES", web_app=WebAppInfo(url=WEBAPP_URL))
    builder.button(text="⭐ Пополнить баланс", callback_data="show_donate")
    builder.button(text="💰 Баланс", callback_data="show_balance")
    builder.adjust(1)
    return builder.as_markup()


def get_donate_keyboard() -> InlineKeyboardMarkup:
    """Клавиатура доната"""
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
    """Обработка /start с параметрами donate_ и invite_"""
    user_id = message.from_user.id
    username = message.from_user.username or "User"
    first_name = message.from_user.first_name or "Гость"

    db.add_user(user_id, username, first_name)

    # Проверяем параметры
    args = message.text.split()
    if len(args) > 1:
        param = args[1]

        # Донат
        if param.startswith("donate_"):
            stars = param.replace("donate_", "")
            if stars.isdigit() and int(stars) in DONATION_OPTIONS:
                await process_donate_invoice(message, int(stars))
                return

        # Приглашение (заглушка, можно раскомментировать)
        # if param.startswith("invite_"):
        #     invite_code = param.replace("invite_", "")
        #     await process_invite(message, invite_code)
        #     return

    balance = db.get_balance(user_id)
    await message.answer(
        f"🎉 Добро пожаловать, {first_name}!\n\n"
        f"💰 Ваш баланс: {balance} монет\n"
        f"Выберите действие:",
        reply_markup=get_main_keyboard(user_id)
    )


@dp.message(Command("balance"))
async def cmd_balance(message: Message):
    """Показать баланс"""
    user_id = message.from_user.id
    balance = db.get_balance(user_id)
    await message.answer(f"💰 Ваш баланс: {balance} монет")


# ==================== CALLBACK HANDLERS ====================
@dp.callback_query(F.data == "show_balance")
async def cb_show_balance(callback: CallbackQuery):
    balance = db.get_balance(callback.from_user.id)
    await callback.message.answer(f"💰 Ваш баланс: {balance} монет")
    await callback.answer()


@dp.callback_query(F.data == "show_donate")
async def cb_show_donate(callback: CallbackQuery):
    await callback.message.edit_text(
        "⭐ Пополнение баланса\n\nВыберите пакет:",
        reply_markup=get_donate_keyboard()
    )
    await callback.answer()


@dp.callback_query(F.data.startswith("donate_"))
async def cb_donate(callback: CallbackQuery):
    stars = callback.data.replace("donate_", "")
    if not stars.isdigit() or int(stars) not in DONATION_OPTIONS:
        await callback.answer("❌ Неверный пакет", show_alert=True)
        return

    await process_donate_invoice(callback.message, int(stars))
    await callback.answer()


@dp.callback_query(F.data == "back_to_main")
async def cb_back_to_main(callback: CallbackQuery):
    balance = db.get_balance(callback.from_user.id)
    await callback.message.edit_text(
        f"🎉 STORM CASES\n\n💰 Баланс: {balance} монет\nВыберите действие:",
        reply_markup=get_main_keyboard(callback.from_user.id)
    )
    await callback.answer()


# ==================== ПЛАТЕЖИ ====================
async def process_donate_invoice(message: Message, stars: int):
    """Создание инвойса"""
    option = DONATION_OPTIONS.get(stars)
    if not option:
        await message.answer("❌ Неверный пакет")
        return

    prices = [LabeledPrice(label=f"{option['stars']} Telegram Stars", amount=option['stars'])]

    await bot.send_invoice(
        chat_id=message.chat.id,
        title="Пополнение STORM CASES",
        description=f"Покупка {option['coins']} монет за {option['stars']} звёзд",
        provider_token="",  # Для Telegram Stars
        currency="XTR",
        prices=prices,
        payload=f"donate_{stars}_{message.from_user.id}",
        start_parameter=f"donate_{stars}"
    )


@dp.pre_checkout_query()
async def pre_checkout(pre_checkout_query: PreCheckoutQuery):
    await bot.answer_pre_checkout_query(pre_checkout_query.id, ok=True)


@dp.message(F.successful_payment)
async def successful_payment(message: Message):
    """Обработка успешной оплаты"""
    payload = message.successful_payment.invoice_payload
    parts = payload.split("_")

    if len(parts) >= 3 and parts[0] == "donate":
        stars = int(parts[1])
        user_id = int(parts[2])

        if stars in DONATION_OPTIONS:
            coins = DONATION_OPTIONS[stars]["coins"]
            new_balance = db.add_coins(user_id, coins)

            await message.answer(
                f"✅ Оплата успешна!\n\n"
                f"Получено: 💰 {coins} монет\n"
                f"Новый баланс: 💰 {new_balance} монет",
                reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="🎮 Открыть STORM CASES", web_app=WebAppInfo(url=WEBAPP_URL))]
                ])
            )

            logger.info(f"Пользователь {user_id} пополнил на {coins} монет")


# ==================== СИНХРОНИЗАЦИЯ С MINI APP ====================
@dp.message(F.web_app_data)
async def handle_web_app_data(message: Message):
    """
    Получаем данные от Mini App (через sendData).
    Пример: {"action": "sync_balance", "balance": 12345}
    """
    user_id = message.from_user.id
    try:
        data = json.loads(message.web_app_data.data)
        action = data.get('action')

        if action == 'sync_balance':
            # Обновляем баланс в БД (не перезаписываем, а синхронизируем с локальным)
            new_balance = data.get('balance', 0)
            # Метод set_balance должен быть добавлен в database.py
            # Если его нет, просто логируем
            if hasattr(db, 'set_balance'):
                db.set_balance(user_id, new_balance)
                logger.info(f"Синхронизация баланса для {user_id}: {new_balance}")
                await message.answer("✅ Баланс синхронизирован")
            else:
                logger.warning("Метод set_balance отсутствует в database.py")
                await message.answer("⚠️ Синхронизация недоступна, обновите database.py")
        else:
            await message.answer("Неизвестное действие")
    except Exception as e:
        logger.error(f"Ошибка обработки web_app_data: {e}")
        await message.answer("Ошибка данных")


# ==================== ЗАПУСК ====================
async def main():
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Бот остановлен")
    except Exception as e:
        logger.error(f"Ошибка: {e}")
