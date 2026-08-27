"""
STORM CASES - Telegram Bot
Полный файл бота с обработкой всех команд
"""

import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
    LabeledPrice,
    PreCheckoutQuery,
    Message,
    CallbackQuery,
)
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

from database import Database
from config import (
    BOT_TOKEN,
    WEBAPP_URL,
    SUPPORT_BOT_URL,
    BOT_USERNAME,
    ADMIN_IDS,
    DONATION_OPTIONS,
    ECONOMY_SETTINGS,
)

# ==================== ИНИЦИАЛИЗАЦИЯ ====================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
db = Database()


# ==================== СОСТОЯНИЯ FSM ====================

class SupportStates(StatesGroup):
    waiting_for_message = State()


# ==================== КЛАВИАТУРЫ ====================

def get_main_keyboard(user_id: int) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()

    builder.button(text="🎮 Открыть STORM CASES", web_app=WebAppInfo(url=WEBAPP_URL))
    builder.button(text="⭐ Пополнить баланс", callback_data="show_donate")
    builder.button(text="📊 Статистика", callback_data="show_stats")
    builder.button(text="📞 Поддержка", callback_data="show_support")
    builder.button(text="❓ Помощь", callback_data="show_help")
    builder.adjust(1)

    return builder.as_markup()


def get_donate_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()

    for stars, option in sorted(DONATION_OPTIONS.items()):
        builder.button(
            text=f"{option['emoji']} {stars} звёзд = 💰 {option['coins']} монет",
            callback_data=f"donate_{stars}"
        )

    builder.button(text="🔙 Назад", callback_data="back_to_main")
    builder.adjust(1)

    return builder.as_markup()


def get_support_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()

    builder.button(text="💬 Написать сообщение", callback_data="support_message")
    builder.button(text="❓ Частые вопросы", callback_data="show_faq")
    builder.button(text="🔙 Назад", callback_data="back_to_main")
    builder.adjust(1)

    return builder.as_markup()


def get_back_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="🔙 Назад", callback_data="back_to_main")
    builder.adjust(1)
    return builder.as_markup()


# ==================== ОБРАБОТЧИКИ КОМАНД ====================

@dp.message(CommandStart())
async def cmd_start(message: Message):
    """Обработка команды /start"""
    user_id = message.from_user.id
    username = message.from_user.username or "User"
    first_name = message.from_user.first_name or "Гость"

    # Сохраняем пользователя
    db.add_user(user_id, username, first_name)
    db.update_last_seen(user_id)
    db.log_action(user_id, "start", "Запуск бота")

    # Проверяем бан
    if db.is_banned(user_id):
        await message.answer("⛔ Вы заблокированы в STORM CASES")
        return

    # Проверяем параметры команды
    args = message.text.split()
    if len(args) > 1:
        param = args[1]

        # Донат
        if param.startswith("donate_"):
            stars = param.replace("donate_", "")
            if stars.isdigit() and int(stars) in DONATION_OPTIONS:
                await process_donate_invoice(message, int(stars))
                return
            else:
                await message.answer("❌ Неверный пакет доната")
                return

        # Приглашение
        if param.startswith("invite_"):
            invite_code = param.replace("invite_", "")
            await process_invite(message, invite_code)
            return

    # Приветственное сообщение
    balance = db.get_balance(user_id)

    welcome_text = f"""
🎉 *Добро пожаловать в STORM CASES, {first_name}!*

💰 Ваш баланс: *{balance} монет*
🎁 Открывайте кейсы и получайте предметы!
📊 Торгуйте на рынке!

Выберите действие:
"""

    await message.answer(
        welcome_text,
        parse_mode="Markdown",
        reply_markup=get_main_keyboard(user_id)
    )


@dp.message(Command("balance"))
async def cmd_balance(message: Message):
    user_id = message.from_user.id
    balance = db.get_balance(user_id)

    await message.answer(
        f"💰 Ваш баланс: *{balance} монет*",
        parse_mode="Markdown"
    )


@dp.message(Command("help"))
async def cmd_help(message: Message):
    help_text = """
🎮 *STORM CASES - Помощь*

*Команды:*
/start - Главное меню
/balance - Баланс
/donate - Донат
/support - Поддержка
/stats - Статистика

*Донат:*
⭐ 10 звёзд = 500 монет
🌟 50 звёзд = 3000 монет
💫 100 звёзд = 10000 монет

*Приглашения:*
👥 За друга +100 монет
"""
    await message.answer(help_text, parse_mode="Markdown")


@dp.message(Command("donate"))
async def cmd_donate(message: Message):
    await message.answer(
        "⭐ *Пополнение баланса*\n\nВыберите пакет:",
        parse_mode="Markdown",
        reply_markup=get_donate_keyboard()
    )


@dp.message(Command("support"))
async def cmd_support(message: Message):
    await message.answer(
        "📞 *Поддержка*\n\nВыберите действие:",
        parse_mode="Markdown",
        reply_markup=get_support_keyboard()
    )


@dp.message(Command("stats"))
async def cmd_stats(message: Message):
    user_id = message.from_user.id
    stats = db.get_user_stats(user_id)

    if not stats:
        await message.answer("❌ Пользователь не найден")
        return

    stats_text = f"""
📊 *Ваша статистика*

💰 Баланс: *{stats['balance']} монет*
📦 Кейсов открыто: *{stats['total_cases_opened']}*
🎁 Предметов: *{stats['total_items_received']}*
💎 Всего пожертвовано: *{stats['total_donated']} звёзд*
📅 Регистрация: *{stats['created_at'][:10]}*
"""
    await message.answer(stats_text, parse_mode="Markdown")


# ==================== CALLBACK HANDLERS ====================

@dp.callback_query(F.data == "show_donate")
async def cb_show_donate(callback: CallbackQuery):
    await callback.message.edit_text(
        "⭐ *Пополнение баланса*\n\nВыберите пакет:",
        parse_mode="Markdown",
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
    await callback.answer("Создаю счёт...")


@dp.callback_query(F.data == "show_stats")
async def cb_show_stats(callback: CallbackQuery):
    user_id = callback.from_user.id
    stats = db.get_user_stats(user_id)

    stats_text = f"""
📊 *Ваша статистика*

💰 Баланс: *{stats['balance']} монет*
📦 Кейсов: *{stats['total_cases_opened']}*
🎁 Предметов: *{stats['total_items_received']}*
"""

    await callback.message.edit_text(
        stats_text,
        parse_mode="Markdown",
        reply_markup=get_back_keyboard()
    )
    await callback.answer()


@dp.callback_query(F.data == "show_support")
async def cb_show_support(callback: CallbackQuery):
    await callback.message.edit_text(
        "📞 *Поддержка STORM CASES*\n\nВыберите действие:",
        parse_mode="Markdown",
        reply_markup=get_support_keyboard()
    )
    await callback.answer()


@dp.callback_query(F.data == "support_message")
async def cb_support_message(callback: CallbackQuery, state: FSMContext):
    await callback.message.edit_text(
        "✍️ Опишите вашу проблему.\nМы ответим в ближайшее время.",
        reply_markup=get_back_keyboard()
    )
    await state.set_state(SupportStates.waiting_for_message)
    await callback.answer()


@dp.callback_query(F.data == "show_faq")
async def cb_show_faq(callback: CallbackQuery):
    faq_text = """
❓ *Частые вопросы*

*Как открыть кейс?*
Нажмите "Открыть STORM CASES"

*Как получить монеты?*
- Открывайте кейсы
- Продавайте предметы
- Пополняйте баланс

*Как пригласить друга?*
Нажмите "Пригласить" в Mini App
"""
    await callback.message.edit_text(
        faq_text,
        parse_mode="Markdown",
        reply_markup=get_back_keyboard()
    )
    await callback.answer()


@dp.callback_query(F.data == "show_help")
async def cb_show_help(callback: CallbackQuery):
    help_text = """
🎮 *STORM CASES*

Открывайте кейсы, получайте предметы,
торгуйте на рынке и приглашайте друзей!
"""
    await callback.message.edit_text(
        help_text,
        parse_mode="Markdown",
        reply_markup=get_back_keyboard()
    )
    await callback.answer()


@dp.callback_query(F.data == "back_to_main")
async def cb_back_to_main(callback: CallbackQuery):
    user_id = callback.from_user.id
    balance = db.get_balance(user_id)

    await callback.message.edit_text(
        f"🎉 *STORM CASES*\n\n💰 Баланс: *{balance} монет*\nВыберите действие:",
        parse_mode="Markdown",
        reply_markup=get_main_keyboard(user_id)
    )
    await callback.answer()


# ==================== ПЛАТЕЖИ ====================

async def process_donate_invoice(message: Message, stars: int):
    option = DONATION_OPTIONS.get(stars)

    if not option:
        await message.answer("❌ Неверный пакет")
        return

    prices = [LabeledPrice(
        label=f"{option['stars']} Telegram Stars",
        amount=option['stars']
    )]

    await bot.send_invoice(
        chat_id=message.chat.id,
        title="Пополнение STORM CASES",
        description=f"Покупка {option['coins']} монет за {option['stars']} звёзд",
        provider_token="",
        currency="XTR",
        prices=prices,
        payload=f"donate_{stars}_{message.from_user.id}",
        start_parameter=f"donate_{stars}",
    )


@dp.pre_checkout_query()
async def process_pre_checkout(pre_checkout_query: PreCheckoutQuery):
    await bot.answer_pre_checkout_query(pre_checkout_query.id, ok=True)


@dp.message(F.successful_payment)
async def process_successful_payment(message: Message):
    payment_info = message.successful_payment
    payload = payment_info.invoice_payload

    parts = payload.split("_")

    if len(parts) >= 3 and parts[0] == "donate":
        stars = int(parts[1])
        user_id = int(parts[2])

        if stars in DONATION_OPTIONS:
            coins = DONATION_OPTIONS[stars]["coins"]
            new_balance = db.add_coins(user_id, coins)

            builder = InlineKeyboardBuilder()
            builder.button(text="🎮 Открыть STORM CASES", web_app=WebAppInfo(url=WEBAPP_URL))
            builder.adjust(1)

            await message.answer(
                f"✅ *Оплата успешна!*\n\n"
                f"Получено: 💰 *{coins} монет*\n"
                f"Баланс: 💰 *{new_balance} монет*\n\n"
                f"Спасибо! 🎉",
                parse_mode="Markdown",
                reply_markup=builder.as_markup()
            )

            logger.info(f"Пользователь {user_id} пополнил на {coins} монет")
    else:
        await message.answer("✅ Оплата получена!")


# ==================== ПРИГЛАШЕНИЯ ====================

async def process_invite(message: Message, invite_code: str):
    user_id = message.from_user.id

    # Проверяем не сам ли это пользователь
    # Здесь должна быть проверка кода в БД

    await message.answer(
        f"🎉 Добро пожаловать в STORM CASES!\n"
        f"Вам начислено 💰 *100 монет*!",
        parse_mode="Markdown",
        reply_markup=get_main_keyboard(user_id)
    )

    logger.info(f"Пользователь {user_id} использовал код {invite_code}")


# ==================== ПОДДЕРЖКА ====================

@dp.message(SupportStates.waiting_for_message)
async def process_support_message(message: Message, state: FSMContext):
    user_id = message.from_user.id
    support_message = message.text

    db.create_support_ticket(user_id, "general", support_message)

    await message.answer(
        "✅ Обращение отправлено!\nМы ответим в ближайшее время.",
        reply_markup=get_main_keyboard(user_id)
    )

    await state.clear()
    logger.info(f"Пользователь {user_id}: {support_message}")


# ==================== АДМИН-КОМАНДЫ ====================

@dp.message(Command("admin"))
async def cmd_admin(message: Message):
    user_id = message.from_user.id

    if user_id not in ADMIN_IDS:
        await message.answer("⛔ Недостаточно прав")
        return

    admin_text = f"""
🛠 *Админ-панель*

Пользователей: {db.get_total_users()}
На рынке: {db.get_total_market_listings()} предложений
Открытых тикетов: {len(db.get_support_tickets('open'))}

*Команды:*
/give [user_id] [amount] - выдать монеты
/ban [user_id] - забанить
/unban [user_id] - разбанить
/logs - последние логи
"""
    await message.answer(admin_text, parse_mode="Markdown")


@dp.message(Command("give"))
async def cmd_give(message: Message):
    user_id = message.from_user.id

    if user_id not in ADMIN_IDS:
        await message.answer("⛔ Недостаточно прав")
        return

    parts = message.text.split()
    if len(parts) != 3:
        await message.answer("Использование: /give [user_id] [amount]")
        return

    try:
        target_id = int(parts[1])
        amount = int(parts[2])
    except ValueError:
        await message.answer("❌ Неверные числа")
        return

    new_balance = db.add_coins(target_id, amount)
    await message.answer(f"✅ Выдано 💰 {amount} монет пользователю {target_id}\nНовый баланс: {new_balance}")


@dp.message(Command("ban"))
async def cmd_ban(message: Message):
    user_id = message.from_user.id

    if user_id not in ADMIN_IDS:
        await message.answer("⛔ Недостаточно прав")
        return

    parts = message.text.split()
    if len(parts) < 2:
        await message.answer("Использование: /ban [user_id]")
        return

    try:
        target_id = int(parts[1])
    except ValueError:
        await message.answer("❌ Неверный ID")
        return

    db.ban_user(target_id)
    await message.answer(f"✅ Пользователь {target_id} забанен")


@dp.message(Command("unban"))
async def cmd_unban(message: Message):
    user_id = message.from_user.id

    if user_id not in ADMIN_IDS:
        await message.answer("⛔ Недостаточно прав")
        return

    parts = message.text.split()
    if len(parts) < 2:
        await message.answer("Использование: /unban [user_id]")
        return

    try:
        target_id = int(parts[1])
    except ValueError:
        await message.answer("❌ Неверный ID")
        return

    db.unban_user(target_id)
    await message.answer(f"✅ Пользователь {target_id} разбанен")


@dp.message(Command("logs"))
async def cmd_logs(message: Message):
    user_id = message.from_user.id

    if user_id not in ADMIN_IDS:
        await message.answer("⛔ Недостаточно прав")
        return

    logs = db.get_logs(20)

    if not logs:
        await message.answer("Логи пусты")
        return

    log_text = "📋 *Последние логи:*\n\n"
    for log in logs[:10]:
        log_text += f"• {log['created_at'][:19]} - {log['action']}\n"

    await message.answer(log_text, parse_mode="Markdown")


# ==================== ЗАПУСК ====================

async def main():
    logger.info("🤖 Запуск STORM CASES бота...")

    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Бот остановлен")
    except Exception as e:
        logger.error(f"Ошибка: {e}")