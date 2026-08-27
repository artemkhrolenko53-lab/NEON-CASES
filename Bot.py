"""
STORM CASES - Telegram Bot
Полный файл бота с поддержкой API и Mini App
"""

import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

from aiogram.client.default import DefaultBotProperties
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command, CommandObject
from aiogram.types import (
    Message, CallbackQuery, PreCheckoutQuery,
    InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo, LabeledPrice
)
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.enums import ParseMode, ChatAction
from aiogram.exceptions import TelegramAPIError
from aiohttp import web
import aiohttp_cors

from database import Database
from config import (
    BOT_TOKEN, WEBAPP_URL, BOT_USERNAME,
    SUPPORT_BOT_URL, CHANNEL_URL, CHAT_URL,
    DONATION_OPTIONS, ADMIN_IDS, ECONOMY_SETTINGS,
    ITEMS_DATA, CASES_DATA, RARITY_SETTINGS,
    ACHIEVEMENTS, API_CONFIG,
    get_item_by_id, get_items_by_rarity, get_case_by_id,
    get_donation_option, is_admin, get_rarity_info,
    calculate_sell_price, calculate_donation_coins,
    get_daily_reward, get_achievement_by_id,
    validate_config
)

# ==================== ЛОГИРОВАНИЕ ====================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('bot.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# ==================== ИНИЦИАЛИЗАЦИЯ ====================
bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher()
db = Database()


# ==================== API ДЛЯ MINI APP ====================

async def handle_api_request(request):
    """Обработка API запросов от Mini App"""
    try:
        # Проверяем секретный ключ
        headers = request.headers
        api_key = headers.get('X-API-Key', '')

        if api_key != API_CONFIG.get('secret_key', ''):
            return web.json_response({'success': False, 'error': 'Invalid API key'}, status=401)

        data = await request.json()
        action = data.get('action')
        user_id = data.get('user_id')

        if not user_id:
            return web.json_response({'success': False, 'error': 'User ID required'}, status=400)

        # Проверяем, забанен ли пользователь
        if db.is_banned(user_id):
            return web.json_response({'success': False, 'error': 'User is banned'}, status=403)

        if action == 'get_user':
            user = db.get_user(user_id)
            if not user:
                user = db.add_user(user_id, 'Unknown', 'Guest')
                user = db.get_user(user_id)
            return web.json_response({'success': True, 'data': user})

        elif action == 'get_inventory':
            inventory = db.get_user_inventory(user_id)
            return web.json_response({'success': True, 'data': inventory})

        elif action == 'get_market':
            filters = data.get('filters', {})
            listings = db.get_market_listings(filters)
            return web.json_response({'success': True, 'data': listings})

        elif action == 'save_state':
            state_data = data.get('state')
            if db.save_user_state(user_id, state_data):
                return web.json_response({'success': True})
            return web.json_response({'success': False, 'error': 'Failed to save state'}, status=500)

        elif action == 'add_coins':
            amount = data.get('amount', 0)
            if amount <= 0:
                return web.json_response({'success': False, 'error': 'Invalid amount'}, status=400)
            new_balance = db.add_coins(user_id, amount)
            return web.json_response({'success': True, 'balance': new_balance})

        elif action == 'spend_coins':
            amount = data.get('amount', 0)
            if amount <= 0:
                return web.json_response({'success': False, 'error': 'Invalid amount'}, status=400)
            if db.spend_coins(user_id, amount):
                return web.json_response({'success': True, 'balance': db.get_balance(user_id)})
            return web.json_response({'success': False, 'error': 'Insufficient funds'}, status=400)

        elif action == 'open_case':
            case_id = data.get('case_id')
            case = get_case_by_id(case_id)
            if not case:
                return web.json_response({'success': False, 'error': 'Case not found'}, status=404)

            if db.spend_coins(user_id, case['price'], f"Открытие кейса: {case['name']}"):
                # Логика выпадения предмета
                import random
                rand = random.random() * 100
                cumulative = 0
                item = None

                for rarity, chance in case['probabilities'].items():
                    cumulative += chance
                    if rand <= cumulative:
                        items = get_items_by_rarity(rarity)
                        if items:
                            item = random.choice(items)
                            break

                if item:
                    db.add_item_to_inventory(user_id, item)
                    db.update_user_stats(user_id, cases_opened=1, items_received=1)

                    return web.json_response({
                        'success': True,
                        'item': item,
                        'balance': db.get_balance(user_id)
                    })

            return web.json_response({'success': False, 'error': 'Failed to open case'}, status=400)

        elif action == 'sell_item':
            item_id = data.get('item_id')
            quantity = data.get('quantity', 1)

            item = get_item_by_id(item_id)
            if not item:
                return web.json_response({'success': False, 'error': 'Item not found'}, status=404)

            sell_price = calculate_sell_price(item['price']) * quantity

            if db.remove_item_from_inventory(user_id, item_id, quantity):
                db.add_coins(user_id, sell_price, f"Продажа: {item['name']} x{quantity}")

                return web.json_response({
                    'success': True,
                    'price': sell_price,
                    'balance': db.get_balance(user_id)
                })

            return web.json_response({'success': False, 'error': 'Item not in inventory'}, status=400)

        elif action == 'create_listing':
            item_id = data.get('item_id')
            price = data.get('price')

            item = get_item_by_id(item_id)
            if not item:
                return web.json_response({'success': False, 'error': 'Item not found'}, status=404)

            if price < ECONOMY_SETTINGS['min_sell_price'] or price > ECONOMY_SETTINGS['max_sell_price']:
                return web.json_response({'success': False, 'error': 'Invalid price'}, status=400)

            if db.remove_item_from_inventory(user_id, item_id):
                listing_id = db.add_market_listing(user_id, item, price)
                if listing_id:
                    return web.json_response({'success': True, 'listing_id': listing_id})

            return web.json_response({'success': False, 'error': 'Failed to create listing'}, status=400)

        elif action == 'buy_listing':
            listing_id = data.get('listing_id')

            if db.buy_market_listing(listing_id, user_id):
                return web.json_response({
                    'success': True,
                    'balance': db.get_balance(user_id)
                })

            return web.json_response({'success': False, 'error': 'Failed to buy listing'}, status=400)

        elif action == 'claim_daily':
            user = db.get_user(user_id)
            if not user:
                return web.json_response({'success': False, 'error': 'User not found'}, status=404)

            last_claim = user.get('last_daily_claim')
            if last_claim:
                last_claim_time = datetime.fromisoformat(last_claim)
                if datetime.now() - last_claim_time < timedelta(hours=24):
                    return web.json_response({'success': False, 'error': 'Already claimed'}, status=400)

            streak = user.get('daily_streak', 0)
            reward = get_daily_reward(streak)

            db.add_coins(user_id, reward, "Ежедневная награда")
            db.update_user(user_id,
                           last_daily_claim=datetime.now(),
                           daily_streak=streak + 1)

            return web.json_response({
                'success': True,
                'reward': reward,
                'streak': streak + 1,
                'balance': db.get_balance(user_id)
            })

        elif action == 'use_promo':
            code = data.get('code')
            success, message = db.use_promo_code(user_id, code)

            if success:
                return web.json_response({
                    'success': True,
                    'message': message,
                    'balance': db.get_balance(user_id)
                })

            return web.json_response({'success': False, 'error': message}, status=400)

        elif action == 'create_ticket':
            subject = data.get('subject', '')
            message = data.get('message', '')
            ticket_type = data.get('ticket_type', 'general')

            ticket_id = db.create_support_ticket(user_id, subject, message, ticket_type)

            if ticket_id:
                # Уведомляем админов
                for admin_id in ADMIN_IDS:
                    try:
                        await bot.send_message(
                            admin_id,
                            f"📞 <b>Новое обращение #{ticket_id}</b>\n\n"
                            f"От: {user_id}\n"
                            f"Тип: {ticket_type}\n"
                            f"Тема: {subject}\n"
                            f"Сообщение: {message}"
                        )
                    except:
                        pass

                return web.json_response({'success': True, 'ticket_id': ticket_id})

            return web.json_response({'success': False, 'error': 'Failed to create ticket'}, status=400)

        else:
            return web.json_response({'success': False, 'error': 'Unknown action'}, status=400)

    except json.JSONDecodeError:
        return web.json_response({'success': False, 'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"API Error: {e}", exc_info=True)
        return web.json_response({'success': False, 'error': str(e)}, status=500)


# ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

def escape_html(text: str) -> str:
    """Экранирование HTML-символов"""
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def get_main_keyboard() -> InlineKeyboardMarkup:
    """Главное меню"""
    builder = InlineKeyboardBuilder()
    builder.button(
        text="🎮 Открыть STORM CASES",
        web_app=WebAppInfo(url=WEBAPP_URL)
    )
    builder.button(
        text="⭐ Пополнить баланс",
        callback_data="show_donate"
    )
    builder.button(
        text="📊 Рынок",
        web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=market")
    )
    builder.button(
        text="🎒 Инвентарь",
        web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=inventory")
    )
    builder.button(
        text="📞 Поддержка",
        url=SUPPORT_BOT_URL
    )
    if CHANNEL_URL:
        builder.button(
            text="📢 Канал",
            url=CHANNEL_URL
        )
    builder.adjust(1)
    return builder.as_markup()


def get_donate_keyboard() -> InlineKeyboardMarkup:
    """Клавиатура с пакетами доната"""
    builder = InlineKeyboardBuilder()

    for stars, option in sorted(DONATION_OPTIONS.items()):
        coins = calculate_donation_coins(stars)
        bonus_text = f" (+{option['bonus']}%)" if option.get('bonus', 0) > 0 else ""

        builder.button(
            text=f"{option['emoji']} {stars} ⭐ = 💰 {coins}{bonus_text}",
            callback_data=f"donate_{stars}"
        )

    builder.button(text="🔙 Назад", callback_data="back_to_main")
    builder.adjust(1)
    return builder.as_markup()


def get_admin_keyboard() -> InlineKeyboardMarkup:
    """Клавиатура администратора"""
    builder = InlineKeyboardBuilder()
    builder.button(text="📊 Статистика", callback_data="admin_stats")
    builder.button(text="👥 Пользователи", callback_data="admin_users")
    builder.button(text="📦 Рынок", callback_data="admin_market")
    builder.button(text="🎫 Тикеты", callback_data="admin_tickets")
    builder.button(text="🎁 Промокоды", callback_data="admin_promos")
    builder.button(text="🔙 Назад", callback_data="back_to_main")
    builder.adjust(2)
    return builder.as_markup()


# ==================== ОБРАБОТЧИКИ КОМАНД ====================

@dp.message(CommandStart())
async def cmd_start(message: Message, command: CommandObject = None):
    """Приветственное сообщение"""
    user = message.from_user
    user_id = user.id
    username = user.username or "Unknown"
    first_name = user.first_name or "Гость"
    last_name = user.last_name

    # Сохраняем пользователя
    db.add_user(user_id, username, first_name, last_name)
    db.update_last_seen(user_id)

    # Проверяем, не забанен ли пользователь
    if db.is_banned(user_id):
        await message.answer("⛔ <b>Вы заблокированы</b>")
        return

    # Проверяем параметры
    args = command.args if command else None
    if args:
        if args.startswith("donate_"):
            stars = args.replace("donate_", "")
            if stars.isdigit() and int(stars) in DONATION_OPTIONS:
                await process_donate_invoice(message, int(stars))
                return
        elif args.startswith("invite_"):
            await process_invite(message, args)
            return
        elif args.startswith("promo_"):
            promo_code = args.replace("promo_", "")
            success, msg = db.use_promo_code(user_id, promo_code)
            if success:
                await message.answer(f"✅ <b>Промокод активирован!</b>\n\n{msg}")
            else:
                await message.answer(f"❌ {msg}")
            return

    # Приветственное сообщение
    text = (
        f"⚡ <b>STORM CASES</b>\n\n"
        f"Привет, <b>{escape_html(first_name)}</b>! 👋\n"
        f"Добро пожаловать в мир кейсов и редких предметов.\n\n"
        f"🎮 Открывай кейсы\n"
        f"📊 Торгуй на рынке\n"
        f"💰 Зарабатывай монеты\n"
        f"🎁 Получай ежедневные награды\n\n"
        f"Чтобы начать, нажми кнопку ниже 👇"
    )

    await message.answer(text, reply_markup=get_main_keyboard())


@dp.message(Command("donate"))
async def cmd_donate(message: Message):
    """Открыть меню доната"""
    text = (
        "⭐ <b>Пополнение баланса</b>\n\n"
        "Выбери один из пакетов:\n\n"
    )

    for stars, option in sorted(DONATION_OPTIONS.items()):
        coins = calculate_donation_coins(stars)
        bonus_text = f" (+{option['bonus']}% бонус)" if option.get('bonus', 0) > 0 else ""
        text += f"{option['emoji']} {stars} ⭐ = 💰 {coins}{bonus_text}\n"

    await message.answer(text, reply_markup=get_donate_keyboard())


@dp.message(Command("stats"))
async def cmd_stats(message: Message):
    """Статистика пользователя"""
    user_id = message.from_user.id
    stats = db.get_user_stats(user_id)

    if not stats:
        await message.answer("❌ <b>Пользователь не найден</b>")
        return

    text = (
        "📊 <b>Ваша статистика</b>\n\n"
        f"💰 Баланс: <b>{stats['balance']}</b> монет\n"
        f"📦 Кейсов открыто: <b>{stats['total_cases_opened']}</b>\n"
        f"🎁 Предметов получено: <b>{stats['total_items_received']}</b>\n"
        f"💎 Пожертвовано: <b>{stats['total_donated']}</b> звёзд\n"
        f"📈 Заработано: <b>{stats['total_earned']}</b> монет\n"
        f"📉 Потрачено: <b>{stats['total_spent']}</b> монет\n"
        f"🔥 Стрик: <b>{stats['daily_streak']}</b> дней\n"
        f"📅 Регистрация: <b>{stats['created_at'][:10] if stats['created_at'] else 'Н/Д'}</b>"
    )

    await message.answer(text, reply_markup=get_main_keyboard())


@dp.message(Command("inventory"))
async def cmd_inventory(message: Message):
    """Показать инвентарь"""
    user_id = message.from_user.id
    inventory = db.get_user_inventory(user_id)

    if not inventory:
        await message.answer("🎒 <b>Инвентарь пуст</b>\n\nОткрывайте кейсы, чтобы получить предметы!")
        return

    text = "🎒 <b>Ваш инвентарь</b>\n\n"

    # Группируем предметы
    items_dict = {}
    for item in inventory:
        if item['item_id'] not in items_dict:
            items_dict[item['item_id']] = item
        else:
            items_dict[item['item_id']]['quantity'] += 1

    # Сортируем по редкости
    rarity_order = {'legendary': 0, 'epic': 1, 'rare': 2, 'common': 3}
    sorted_items = sorted(items_dict.values(),
                          key=lambda x: (rarity_order.get(x['item_rarity'], 3), -x['item_price']))

    for item in sorted_items[:20]:  # Показываем первые 20
        rarity_emoji = {
            'legendary': '💛',
            'epic': '💜',
            'rare': '💙',
            'common': '🤍',
        }.get(item['item_rarity'], '')

        qty_text = f" x{item['quantity']}" if item['quantity'] > 1 else ""
        text += f"{rarity_emoji} {item['item_icon']} <b>{item['item_name']}</b>{qty_text} - 💰 {item['item_price']}\n"

    if len(sorted_items) > 20:
        text += f"\n... и ещё {len(sorted_items) - 20} предметов"

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🎮 Открыть в Mini App", web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=inventory"))]
    ])

    await message.answer(text, reply_markup=keyboard)


@dp.message(Command("market"))
async def cmd_market(message: Message):
    """Показать рынок"""
    listings = db.get_market_listings({'status': 'active'})

    if not listings:
        await message.answer("📊 <b>Рынок пуст</b>\n\nСтаньте первым продавцом!")
        return

    text = "📊 <b>Рынок</b>\n\n"

    for listing in listings[:10]:  # Показываем первые 10
        rarity_emoji = {
            'legendary': '💛',
            'epic': '💜',
            'rare': '💙',
            'common': '🤍',
        }.get(listing['item_rarity'], '')

        text += f"{rarity_emoji} {listing['item_icon']} <b>{listing['item_name']}</b>\n"
        text += f"   💰 {listing['price']} | 👤 {listing['first_name']}\n\n"

    if len(listings) > 10:
        text += f"... и ещё {len(listings) - 10} предложений"

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📊 Открыть рынок", web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=market"))]
    ])

    await message.answer(text, reply_markup=keyboard)


@dp.message(Command("help"))
async def cmd_help(message: Message):
    """Справка"""
    text = (
        "❓ <b>Помощь по STORM CASES</b>\n\n"
        "Основные команды:\n"
        "/start – главное меню\n"
        "/donate – пополнение баланса\n"
        "/stats – ваша статистика\n"
        "/inventory – ваш инвентарь\n"
        "/market – рынок предметов\n"
        "/help – эта справка\n\n"
        "<b>Как играть:</b>\n"
        "1. Откройте Mini App\n"
        "2. Выберите кейс\n"
        "3. Откройте его и получите предмет\n"
        "4. Продавайте предметы на рынке\n"
        "5. Зарабатывайте монеты!"
    )

    await message.answer(text, reply_markup=get_main_keyboard())


@dp.message(Command("admin"))
async def cmd_admin(message: Message):
    """Админ-панель"""
    user_id = message.from_user.id

    if not is_admin(user_id):
        await message.answer("⛔ <b>У вас нет доступа к админ-панели</b>")
        return

    await message.answer("🔐 <b>Админ-панель</b>", reply_markup=get_admin_keyboard())


@dp.message(Command("promo"))
async def cmd_promo(message: Message, command: CommandObject = None):
    """Создать промокод (для админов)"""
    user_id = message.from_user.id

    if not is_admin(user_id):
        await message.answer("⛔ <b>У вас нет доступа</b>")
        return

    if not command.args:
        await message.answer(
            "Использование: /promo КОД ТИП КОЛИЧЕСТВО [МАКС_ИСПОЛЬЗОВАНИЙ]\n"
            "Пример: /promo WELCOME coins 1000 100"
        )
        return

    parts = command.args.split()
    if len(parts) < 3:
        await message.answer("❌ Неверный формат. Используйте: /promo КОД ТИП КОЛИЧЕСТВО [МАКС_ИСПОЛЬЗОВАНИЙ]")
        return

    code = parts[0]
    reward_type = parts[1]
    reward_amount = int(parts[2])
    max_uses = int(parts[3]) if len(parts) > 3 else 1

    promo_id = db.create_promo_code(
        code=code,
        reward_type=reward_type,
        reward_amount=reward_amount,
        max_uses=max_uses,
        created_by=user_id
    )

    if promo_id:
        await message.answer(
            f"✅ <b>Промокод создан!</b>\n\n"
            f"Код: <code>{code}</code>\n"
            f"Награда: {reward_amount} {reward_type}\n"
            f"Использований: {max_uses}"
        )
    else:
        await message.answer("❌ Ошибка создания промокода")


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


@dp.callback_query(F.data == "admin_stats")
async def cb_admin_stats(callback: CallbackQuery):
    """Статистика для админов"""
    if not is_admin(callback.from_user.id):
        await callback.answer("⛔ Нет доступа", show_alert=True)
        return

    total_users = db.get_total_users()
    total_listings = db.get_total_market_listings()

    text = (
        "📊 <b>Статистика бота</b>\n\n"
        f"👥 Пользователей: <b>{total_users}</b>\n"
        f"📦 Предложений на рынке: <b>{total_listings}</b>\n"
    )

    await callback.message.edit_text(text, reply_markup=get_admin_keyboard())
    await callback.answer()


@dp.callback_query(F.data == "admin_tickets")
async def cb_admin_tickets(callback: CallbackQuery):
    """Показать тикеты"""
    if not is_admin(callback.from_user.id):
        await callback.answer("⛔ Нет доступа", show_alert=True)
        return

    tickets = db.get_support_tickets('open')

    if not tickets:
        text = "📞 <b>Нет открытых тикетов</b>"
    else:
        text = f"📞 <b>Открытые тикеты ({len(tickets)})</b>\n\n"
        for ticket in tickets[:5]:
            text += f"#{ticket['id']} - {ticket['subject']}\n"
            text += f"От: {ticket['first_name']} ({ticket['user_id']})\n\n"

    await callback.message.edit_text(text, reply_markup=get_admin_keyboard())
    await callback.answer()


# ==================== ПЛАТЕЖИ ====================

async def process_donate_invoice(message: Message, stars: int):
    """Создание инвойса для оплаты через Telegram Stars"""
    option = DONATION_OPTIONS.get(stars)
    if not option:
        await message.answer("❌ <b>Неверный пакет</b>")
        return

    coins = calculate_donation_coins(stars)

    prices = [LabeledPrice(
        label=f"{stars} Telegram Stars",
        amount=stars
    )]

    try:
        await bot.send_invoice(
            chat_id=message.chat.id,
            title="Пополнение STORM CASES",
            description=f"Покупка {coins} монет за {stars} звёзд",
            provider_token="",  # для Telegram Stars
            currency="XTR",
            prices=prices,
            payload=f"donate_{stars}_{message.from_user.id}",
            start_parameter=f"donate_{stars}",
            photo_url="https://img.icons8.com/color/512/treasure-chest.png",
            photo_width=512,
            photo_height=512
        )
    except Exception as e:
        logger.error(f"Ошибка создания инвойса: {e}")
        await message.answer("❌ Ошибка создания платежа. Попробуйте позже.")


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
            coins = calculate_donation_coins(stars)

            db.add_coins(user_id, coins, f"Пополнение: {stars} звёзд")
            db.update_user(user_id, total_donated=db.get_user(user_id)['total_donated'] + stars)

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

            logger.info(f"✅ Пользователь {user_id} пополнил баланс на {coins} монет")


# ==================== ОБРАБОТКА ПРИГЛАШЕНИЙ ====================

async def process_invite(message: Message, invite_code: str):
    """Обработка приглашений"""
    user_id = message.from_user.id
    inviter_id = invite_code.replace("invite_", "")

    if not inviter_id.isdigit():
        return

    inviter_id = int(inviter_id)

    if inviter_id == user_id:
        await message.answer("❌ Нельзя пригласить самого себя")
        return

    # Проверяем, не приглашал ли уже
    if db.get_user(inviter_id):
        reward = ECONOMY_SETTINGS['invite_reward']
        db.add_coins(inviter_id, reward, "Награда за приглашение")

        try:
            await bot.send_message(
                inviter_id,
                f"🎉 <b>У вас новый реферал!</b>\n\n"
                f"Награда: 💰 {reward} монет"
            )
        except:
            pass

        await message.answer(
            f"✅ <b>Вы присоединились по приглашению!</b>\n\n"
            f"Ваш друг получил 💰 {reward} монет"
        )


# ==================== ЗАПУСК БОТА ====================

async def start_api_server():
    """Запуск API сервера"""
    app = web.Application()

    # Добавляем CORS
    cors = aiohttp_cors.setup(app, defaults={
        "*": aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
        )
    })

    # Маршруты
    app.router.add_post('/api', handle_api_request)
    app.router.add_get('/health', lambda request: web.json_response({'status': 'ok'}))

    # Применяем CORS ко всем маршрутам
    for route in list(app.router.routes()):
        cors.add(route)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, API_CONFIG['host'], API_CONFIG['port'])
    await site.start()

    logger.info(f"🌐 API сервер запущен на http://{API_CONFIG['host']}:{API_CONFIG['port']}")


async def main():
    """Запуск бота и API сервера"""
    logger.info("🤖 Запуск STORM CASES бота...")

    # Проверяем конфигурацию
    if not validate_config():
        logger.error("❌ Ошибка конфигурации. Исправьте ошибки и перезапустите бота.")
        return

    # Запускаем API сервер
    await start_api_server()

    # Запускаем бота
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Бот остановлен")
    except Exception as e:
        logger.error(f"❌ Ошибка запуска: {e}", exc_info=True)