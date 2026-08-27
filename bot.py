import asyncio
import logging
import json
from datetime import datetime, timedelta
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo, LabeledPrice, PreCheckoutQuery
from aiogram.utils.keyboard import InlineKeyboardBuilder
from database import Database

# Токен бота
BOT_TOKEN = "8907615374:AAE3BqeX0A7Wd-ssUb-IU-YQO-HUXyfMmN8"

# URL вашего Mini App (замените на свой после деплоя)
WEBAPP_URL = "https://your-domain.com/webapp.html"

# Инициализация
logging.basicConfig(level=logging.INFO)
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
db = Database()

# Цены в Telegram Stars
DONATION_OPTIONS = {
    "stars_10": {"stars": 10, "coins": 500},
    "stars_50": {"stars": 50, "coins": 3000},
    "stars_100": {"stars": 100, "coins": 10000}
}

# ==================== КОМАНДЫ ====================

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    """Обработка команды /start"""
    user_id = message.from_user.id
    username = message.from_user.username or "User"
    first_name = message.from_user.first_name or "Гость"
    
    # Сохраняем пользователя в БД
    db.add_user(user_id, username, first_name)
    
    # Создаем клавиатуру
    keyboard = InlineKeyboardBuilder()
    
    # Кнопка для открытия Mini App
    keyboard.button(
        text="🎮 Открыть STORM CASES",
        web_app=WebAppInfo(url=WEBAPP_URL)
    )
    
    # Кнопка для пополнения баланса
    keyboard.button(
        text="⭐ Пополнить баланс",
        callback_data="show_donate"
    )
    
    # Кнопка поддержки
    keyboard.button(
        text="📞 Поддержка",
        callback_data="show_support"
    )
    
    keyboard.adjust(1)
    
    await message.answer(
        f"🎉 Добро пожаловать в STORM CASES, {first_name}!\n\n"
        f"💰 Ваш баланс: {db.get_balance(user_id)} монет\n"
        f"🎁 Открывайте кейсы, получайте предметы и торгуйте на рынке!\n\n"
        f"Выберите действие:",
        reply_markup=keyboard.as_markup()
    )

@dp.message(Command("balance"))
async def cmd_balance(message: types.Message):
    """Показать баланс"""
    user_id = message.from_user.id
    balance = db.get_balance(user_id)
    await message.answer(f"💰 Ваш баланс: {balance} монет")

@dp.message(Command("help"))
async def cmd_help(message: types.Message):
    """Помощь"""
    help_text = """
🎮 *STORM CASES - Помощь*

*Основные команды:*
/start - Главное меню
/balance - Проверить баланс
/donate - Пополнить баланс
/support - Связаться с поддержкой

*Как играть:*
1. Нажмите "Открыть STORM CASES"
2. Выберите кейс
3. Открывайте и получайте предметы
4. Продавайте предметы на рынке

*Донат:*
⭐ 10 звёзд = 500 монет
⭐ 50 звёзд = 3000 монет
⭐ 100 звёзд = 10000 монет
    """
    await message.answer(help_text, parse_mode="Markdown")

# ==================== CALLBACK HANDLERS ====================

@dp.callback_query(F.data == "show_donate")
async def show_donate_options(callback: types.CallbackQuery):
    """Показать варианты пополнения"""
    keyboard = InlineKeyboardBuilder()
    
    for key, option in DONATION_OPTIONS.items():
        keyboard.button(
            text=f"⭐ {option['stars']} звёзд = 💰 {option['coins']} монет",
            callback_data=f"donate_{key}"
        )
    
    keyboard.button(text="🔙 Назад", callback_data="back_to_main")
    keyboard.adjust(1)
    
    await callback.message.edit_text(
        "⭐ *Пополнение баланса*\n\n"
        "Выберите пакет для пополнения:",
        parse_mode="Markdown",
        reply_markup=keyboard.as_markup()
    )
    await callback.answer()

@dp.callback_query(F.data.startswith("donate_"))
async def process_donate(callback: types.CallbackQuery):
    """Обработка доната"""
    option_key = callback.data.replace("donate_", "")
    
    if option_key not in DONATION_OPTIONS:
        await callback.answer("❌ Ошибка: неверный пакет", show_alert=True)
        return
    
    option = DONATION_OPTIONS[option_key]
    stars = option["stars"]
    coins = option["coins"]
    
    # Создаем инвойс для оплаты
    prices = [LabeledPrice(label=f"{stars} Telegram Stars", amount=stars)]
    
    await bot.send_invoice(
        chat_id=callback.from_user.id,
        title=f"Пополнение STORM CASES",
        description=f"Покупка {coins} монет за {stars} звёзд",
        provider_token="",  # Пустой для Telegram Stars
        currency="XTR",  # Валюта Telegram Stars
        prices=prices,
        payload=f"donate_{option_key}_{callback.from_user.id}",
        start_parameter=f"donate_{option_key}"
    )
    
    await callback.answer("Создаю счёт...")

@dp.pre_checkout_query()
async def process_pre_checkout(pre_checkout_query: PreCheckoutQuery):
    """Обработка pre-checkout"""
    await bot.answer_pre_checkout_query(pre_checkout_query.id, ok=True)

@dp.message(F.successful_payment)
async def process_successful_payment(message: types.Message):
    """Обработка успешной оплаты"""
    payment_info = message.successful_payment
    payload = payment_info.invoice_payload
    
    # Парсим payload
    parts = payload.split("_")
    if len(parts) >= 3 and parts[0] == "donate":
        option_key = parts[1]
        user_id = int(parts[2])
        
        if option_key in DONATION_OPTIONS:
            coins = DONATION_OPTIONS[option_key]["coins"]
            
            # Добавляем монеты пользователю
            db.add_coins(user_id, coins)
            
            # Отправляем подтверждение
            keyboard = InlineKeyboardBuilder()
            keyboard.button(
                text="🎮 Открыть STORM CASES",
                web_app=WebAppInfo(url=WEBAPP_URL)
            )
            keyboard.adjust(1)
            
            await message.answer(
                f"✅ Оплата успешна!\n\n"
                f"Получено: 💰 {coins} монет\n"
                f"Новый баланс: 💰 {db.get_balance(user_id)} монет\n\n"
                f"Спасибо за поддержку! 🎉",
                reply_markup=keyboard.as_markup()
            )
        else:
            await message.answer("❌ Ошибка: неверный пакет")
    else:
        await message.answer("✅ Оплата получена!")

@dp.callback_query(F.data == "show_support")
async def show_support(callback: types.CallbackQuery):
    """Показать информацию о поддержке"""
    keyboard = InlineKeyboardBuilder()
    keyboard.button(
        text="💬 Написать в поддержку",
        url="https://t.me/your_support_bot"  # Замените на ссылку вашего бота поддержки
    )
    keyboard.button(text="🔙 Назад", callback_data="back_to_main")
    keyboard.adjust(1)
    
    await callback.message.edit_text(
        "📞 *Поддержка STORM CASES*\n\n"
        "Если у вас возникли вопросы или проблемы, "
        "нажмите кнопку ниже, чтобы связаться с нашей командой поддержки.\n\n"
        "⏰ Время работы: 24/7\n"
        "⚡ Среднее время ответа: 5-10 минут",
        parse_mode="Markdown",
        reply_markup=keyboard.as_markup()
    )
    await callback.answer()

@dp.callback_query(F.data == "back_to_main")
async def back_to_main(callback: types.CallbackQuery):
    """Возврат в главное меню"""
    keyboard = InlineKeyboardBuilder()
    keyboard.button(
        text="🎮 Открыть STORM CASES",
        web_app=WebAppInfo(url=WEBAPP_URL)
    )
    keyboard.button(
        text="⭐ Пополнить баланс",
        callback_data="show_donate"
    )
    keyboard.button(
        text="📞 Поддержка",
        callback_data="show_support"
    )
    keyboard.adjust(1)
    
    await callback.message.edit_text(
        f"🎉 STORM CASES\n\n"
        f"💰 Ваш баланс: {db.get_balance(callback.from_user.id)} монет\n"
        f"Выберите действие:",
        reply_markup=keyboard.as_markup()
    )
    await callback.answer()

# ==================== ЗАПУСК ====================

async def main():
    """Запуск бота"""
    logging.info("Starting STORM CASES bot...")
    
    # Запускаем polling
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
