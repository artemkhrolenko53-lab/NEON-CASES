import asyncio
import json
import logging
import time
import random
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.client.default import DefaultBotProperties
from aiogram.exceptions import TelegramBadRequest

import config
import database as db

bot = Bot(token=config.BOT_TOKEN, default=DefaultBotProperties(parse_mode="HTML"))
dp = Dispatcher()

# Кэш для избежания дублирования
processed_actions = set()

# Инициализация БД
db.init_db()


# ---------- Вспомогательные функции ----------
def get_user(user_id):
    conn = db.get_conn()
    user = conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
    conn.close()
    return user


def create_user(user_id, nickname=None):
    conn = db.get_conn()
    cur = conn.cursor()
    # Проверяем, есть ли пользователь
    existing = cur.execute("SELECT user_id FROM users WHERE user_id = ?", (user_id,)).fetchone()
    if not existing:
        # Автоматически присваиваем ник, если не передан (например, "player{user_id}")
        if not nickname:
            nickname = f"player{user_id}"
        cur.execute("""
            INSERT INTO users (user_id, nickname, balance, inventory, stats)
            VALUES (?, ?, 1000, '[]', '{}')
        """, (user_id, nickname))
        conn.commit()
    conn.close()


def get_or_create_user(user_id, nickname=None):
    user = get_user(user_id)
    if not user:
        create_user(user_id, nickname)
        user = get_user(user_id)
    return user


def update_balance(user_id, delta):
    conn = db.get_conn()
    conn.execute("UPDATE users SET balance = balance + ? WHERE user_id = ?", (delta, user_id))
    conn.commit()
    conn.close()


def add_item_to_inventory(user_id, item_id, rarity):
    conn = db.get_conn()
    user = conn.execute("SELECT inventory FROM users WHERE user_id = ?", (user_id,)).fetchone()
    if user:
        inv = json.loads(user['inventory'])
        inv.append(
            {"uid": int(time.time() * 1000), "item_id": item_id, "rarity": rarity, "obtained_at": int(time.time())})
        conn.execute("UPDATE users SET inventory = ? WHERE user_id = ?", (json.dumps(inv), user_id))
        conn.commit()
    conn.close()


def log_action(server, admin_id, action, details):
    conn = db.get_conn()
    conn.execute("INSERT INTO logs (server, admin_id, action, details, timestamp) VALUES (?, ?, ?, ?, ?)",
                 (server, admin_id, action, details, int(time.time())))
    conn.commit()
    conn.close()


# ---------- Обработчики команд ----------
@dp.message(CommandStart())
async def start(message: Message):
    # Создаём пользователя при первом запуске
    nickname = message.from_user.full_name or f"player{message.from_user.id}"
    get_or_create_user(message.from_user.id, nickname)

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🎁 Открыть STORM CASES", web_app=WebAppInfo(url=config.https://artemkhrolenko53-lab.github.io/NEON-CASES/))]
    ])
    await message.answer(
        "Добро пожаловать в STORM CASES! Открывай кейсы, собирай коллекцию и торгуй на рынке.",
        reply_markup=keyboard
    )


@dp.message(Command("profile"))
async def profile(message: Message):
    user = get_or_create_user(message.from_user.id, message.from_user.full_name)
    inv = json.loads(user['inventory'])
    await message.answer(
        f"👤 <b>{user['nickname']}</b>\n"
        f"💰 Баланс: {user['balance']} монет\n"
        f"🎒 Предметов: {len(inv)}\n"
        f"📊 Открыто кейсов: {json.loads(user['stats']).get('openedCases', 0)}\n"
        f"🌐 Сервер: {user['server']}"
    )


@dp.message(Command("help"))
async def help_cmd(message: Message):
    await message.answer(
        "📖 Команды:\n"
        "/start - открыть игру\n"
        "/profile - мой профиль\n"
        "/help - помощь\n"
        "/donate - пополнить баланс\n"
        "/admin - панель администратора (только для админов)"
    )


@dp.message(Command("donate"))
async def donate(message: Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⭐ 10 звёзд = 500 монет", callback_data="donate_10")],
        [InlineKeyboardButton(text="⭐ 50 звёзд = 3000 монет", callback_data="donate_50")],
        [InlineKeyboardButton(text="⭐ 100 звёзд = 10000 монет", callback_data="donate_100")],
    ])
    await message.answer("Выберите пакет пополнения:", reply_markup=keyboard)


@dp.callback_query(lambda c: c.data and c.data.startswith("donate_"))
async def process_donate(callback: types.CallbackQuery):
    pack = callback.data
    amounts = {"donate_10": (10, 500), "donate_50": (50, 3000), "donate_100": (100, 10000)}
    stars, coins = amounts.get(pack, (0, 0))
    if stars:
        # Здесь должна быть интеграция с платёжным API Telegram Stars
        # Пока имитируем начисление
        update_balance(callback.from_user.id, coins)
        await callback.answer(f"✅ Начислено {coins} монет!", show_alert=True)
        await callback.message.edit_text(f"Получено {coins} монет! Спасибо за поддержку!")
    else:
        await callback.answer("Ошибка", show_alert=True)


@dp.message(Command("admin"))
async def admin_panel(message: Message):
    user_id = message.from_user.id
    user = get_or_create_user(user_id, message.from_user.full_name)
    # Проверяем права
    server = user['server']
    conn = db.get_conn()
    admin = conn.execute("SELECT level FROM admins WHERE server = ? AND user_id = ?", (server, user_id)).fetchone()
    conn.close()

    if user_id == config.OWNER_ID:
        level = 5
    elif admin:
        level = admin['level']
    else:
        await message.answer("⛔ У вас нет доступа к админ-панели.")
        return

    # Показываем простую статистику
    conn = db.get_conn()
    total_users = conn.execute("SELECT COUNT(*) as cnt FROM users WHERE server = ?", (server,)).fetchone()['cnt']
    open_tickets = \
    conn.execute("SELECT COUNT(*) as cnt FROM tickets WHERE server = ? AND status = 'open'", (server,)).fetchone()[
        'cnt']
    conn.close()

    text = (
        f"🛠 <b>Админ-панель</b>\n"
        f"Сервер: {server}\n"
        f"Уровень: {level}\n"
        f"Игроков на сервере: {total_users}\n"
        f"Открытых тикетов: {open_tickets}\n\n"
        f"Доступные команды:\n"
        f"/admin_give <ник> <сумма> — выдать монеты\n"
        f"/admin_ban <ник> <причина> — забанить\n"
        f"/admin_unban <ник> — разбанить\n"
        f"/admin_mute <ник> <минут> — замутить\n"
        f"/admin_unmute <ник> — размутить\n"
        f"/admin_logs — последние логи\n"
        f"/admin_tickets — список тикетов"
    )
    await message.answer(text)


@dp.message(Command("admin_give"))
async def admin_give(message: Message):
    if not is_admin(message.from_user.id):
        await message.answer("⛔ Нет прав")
        return
    args = message.text.split()
    if len(args) < 3:
        await message.answer("Использование: /admin_give <ник> <сумма>")
        return
    nick = args[1]
    try:
        amount = int(args[2])
    except:
        await message.answer("Сумма должна быть числом")
        return
    conn = db.get_conn()
    user = conn.execute("SELECT user_id FROM users WHERE nickname = ?", (nick,)).fetchone()
    if user:
        conn.execute("UPDATE users SET balance = balance + ? WHERE user_id = ?", (amount, user['user_id']))
        conn.commit()
        conn.close()
        await message.answer(f"✅ Выдано {amount} монет игроку {nick}")
        log_action("admin_give", message.from_user.id, f"Выдано {amount} монет игроку {nick}")
    else:
        conn.close()
        await message.answer("❌ Игрок не найден")


# Другие admin-команды (ban, unban, mute, unmute, logs, tickets) реализуются аналогично.

def is_admin(user_id):
    if user_id == config.OWNER_ID:
        return True
    conn = db.get_conn()
    admin = conn.execute("SELECT level FROM admins WHERE user_id = ?", (user_id,)).fetchone()
    conn.close()
    return admin is not None


# ---------- Обработка данных из Mini App ----------
@dp.message(F.content_type == "web_app_data")
async def handle_web_app_data(message: Message):
    user_id = message.from_user.id
    user = get_or_create_user(user_id, message.from_user.full_name)
    try:
        data = json.loads(message.web_app_data.data)
    except:
        await message.answer("Ошибка данных")
        return

    action_type = data.get("type")
    server = data.get("server", user['server'])
    # Обновляем сервер пользователя, если он пришёл из Mini App
    if server != user['server']:
        conn = db.get_conn()
        conn.execute("UPDATE users SET server = ? WHERE user_id = ?", (server, user_id))
        conn.commit()
        conn.close()

    # Логирование в бот (можно в консоль)
    logging.info(f"WebApp data from {user['nickname']}: {data}")

    # Обработка основных действий
    if action_type == "case_open":
        item_name = data.get("item")
        rarity = data.get("rarity")
        case_name = data.get("case")
        price = 0  # Цена должна вычитаться на клиенте, но можно проверить
        # Обновляем статистику
        add_item_to_inventory(user_id, data.get("item_id", item_name), rarity)
        conn = db.get_conn()
        conn.execute("UPDATE users SET balance = balance - ? WHERE user_id = ?", (price, user_id))
        # Обновляем статистику
        stats = json.loads(user['stats'])
        stats['openedCases'] = stats.get('openedCases', 0) + 1
        stats['itemsObtained'] = stats.get('itemsObtained', 0) + 1
        conn.execute("UPDATE users SET stats = ? WHERE user_id = ?", (json.dumps(stats), user_id))
        conn.commit()
        conn.close()
        await message.answer(f"🎉 Вы открыли {case_name} и получили {rarity} предмет: {item_name}")

    elif action_type == "sell":
        item_name = data.get("item")
        price = data.get("price", 0)
        update_balance(user_id, price)
        await message.answer(f"💰 Продано: {item_name} за {price} монет")

    elif action_type == "market_list":
        # Добавляем на рынок (в Mini App это уже сделано, но можно синхронизировать)
        pass

    elif action_type == "market_buy":
        # Покупка уже обработана на клиенте, можно проверить баланс
        pass

    elif action_type == "chat":
        text = data.get("text")
        # Сохраняем сообщение в БД
        conn = db.get_conn()
        conn.execute("""
            INSERT INTO chat_messages (server, sender_id, sender_nick, text, recipient_id, is_private, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (server, user_id, user['nickname'], text, data.get("recipient_id"), 1 if data.get("private") else 0,
              int(time.time())))
        conn.commit()
        conn.close()

    elif action_type == "ticket":
        subject = data.get("subject")
        msg = data.get("message")
        conn = db.get_conn()
        conn.execute("INSERT INTO tickets (user_id, server, subject, message, created_at) VALUES (?, ?, ?, ?, ?)",
                     (user_id, server, subject, msg, int(time.time())))
        conn.commit()
        conn.close()
        await message.answer(f"📩 Тикет отправлен! Тема: {subject}")

    else:
        await message.answer("Данные получены")


# ---------- Запуск ----------
async def main():
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
