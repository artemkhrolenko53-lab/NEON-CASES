from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional, List
import json
import time
import random
from datetime import datetime
from urllib.parse import parse_qs

import config
from models import User, MarketListing, ChatMessage, Ticket, Log, Admin, ServerSettings
from database import init_db, get_db

init_db()

app = FastAPI(title="STORM CASES API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Игровые данные ----------
RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic']
RARITY_LABELS = {'common': 'Обычный', 'rare': 'Редкий', 'epic': 'Эпический', 'legendary': 'Легендарный', 'mythic': 'Мифический'}

ITEMS_DATA = { ... }  # аналог из index.html или импорт из общего файла (для краткости опустим, можно взять из предыдущего полного кода main.py)

CASES_DATA = [ ... ]  # аналогично

def generate_uid():
    return int(time.time() * 1000) + random.randint(1, 999)

def get_random_item_by_rarity(rarity):
    items = ITEMS_DATA.get(rarity, [])
    return random.choice(items) if items else None

def roll_case_item(case_data):
    chances = case_data['chances']
    roll = random.random()
    cumulative = 0
    for rarity in RARITIES:
        cumulative += chances.get(rarity, 0)
        if roll <= cumulative:
            return get_random_item_by_rarity(rarity)
    return get_random_item_by_rarity('common')

def parse_telegram_init_data(init_data: str) -> dict:
    data = parse_qs(init_data)
    user_str = data.get('user', ['{}'])[0]
    try:
        return json.loads(user_str)
    except:
        return {}

def get_telegram_user(request: Request) -> dict:
    init_data = request.headers.get('X-Telegram-Init-Data', '')
    if not init_data:
        raise HTTPException(status_code=401, detail="Не авторизован")
    user = parse_telegram_init_data(init_data)
    if not user or 'id' not in user:
        raise HTTPException(status_code=401, detail="Неверные данные")
    return user

def get_current_user(request: Request, db: Session) -> User:
    tg_user = get_telegram_user(request)
    telegram_id = tg_user['id']
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        nickname = tg_user.get('first_name', f'player{telegram_id}')
        server_settings = db.query(ServerSettings).filter(ServerSettings.server_name == 'Alpha').first()
        start_balance = server_settings.start_balance if server_settings else 1000
        user = User(
            telegram_id=telegram_id,
            nickname=nickname,
            balance=start_balance,
            inventory="[]",
            stats="{}",
            warnings="[]",
            server="Alpha",
            created_at=int(time.time())
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

# ---------- Эндпоинты ----------
@app.post("/api/register")
async def register(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    return {"success": True, "user": user.to_dict()}

@app.get("/api/state")
async def get_state(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if user.is_banned:
        raise HTTPException(status_code=403, detail=f"Вы забанены: {user.ban_reason or 'нет причины'}")
    market = db.query(MarketListing).filter(MarketListing.server == user.server).all()
    chat = db.query(ChatMessage).filter(ChatMessage.server == user.server, ChatMessage.is_private == False).order_by(ChatMessage.timestamp.desc()).limit(100).all()
    private_chat = db.query(ChatMessage).filter(
        ChatMessage.server == user.server,
        ChatMessage.is_private == True,
        (ChatMessage.sender_id == user.telegram_id) | (ChatMessage.recipient_id == user.telegram_id)
    ).order_by(ChatMessage.timestamp.desc()).limit(100).all()
    tickets = db.query(Ticket).filter(Ticket.user_id == user.telegram_id).all()
    server_settings = db.query(ServerSettings).filter(ServerSettings.server_name == user.server).first()
    return {
        "user": user.to_dict(),
        "market": [m.to_dict() for m in market],
        "chat": [c.to_dict() for c in chat],
        "private_chat": [c.to_dict() for c in private_chat],
        "tickets": [t.to_dict() for t in tickets],
        "server_settings": server_settings.to_dict() if server_settings else None,
        "cases": CASES_DATA,
        "items": ITEMS_DATA,
        "rarities": RARITIES,
        "rarity_labels": RARITY_LABELS
    }

@app.get("/api/servers")
async def get_servers(db: Session = Depends(get_db)):
    servers = db.query(ServerSettings).all()
    return {"servers": [s.to_dict() for s in servers]}

@app.post("/api/action")
async def perform_action(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if user.is_banned:
        raise HTTPException(status_code=403, detail=f"Вы забанены: {user.ban_reason or 'нет причины'}")
    data = await request.json()
    action = data.get("type")

    if action == "open_case":
        case_id = data.get("case_id")
        case_data = next((c for c in CASES_DATA if c['id'] == case_id), None)
        if not case_data:
            raise HTTPException(status_code=404, detail="Кейс не найден")
        if user.balance < case_data['price']:
            raise HTTPException(status_code=400, detail="Недостаточно средств")
        user.balance -= case_data['price']
        item = roll_case_item(case_data)
        if not item:
            raise HTTPException(status_code=500, detail="Ошибка генерации")
        inv = json.loads(user.inventory)
        new_item = {"uid": generate_uid(), "item_id": item['id'], "rarity": item['rarity'], "obtained_at": int(time.time())}
        inv.append(new_item)
        user.inventory = json.dumps(inv)
        stats = json.loads(user.stats)
        stats['openedCases'] = stats.get('openedCases', 0) + 1
        stats['itemsObtained'] = stats.get('itemsObtained', 0) + 1
        stats['spent'] = stats.get('spent', 0) + case_data['price']
        user.stats = json.dumps(stats)
        db.commit()
        return {"success": True, "new_balance": user.balance, "item": item, "inventory": inv}

    elif action == "sell_item":
        uid = data.get("uid")
        inv = json.loads(user.inventory)
        for i, item in enumerate(inv):
            if item['uid'] == uid:
                del inv[i]
                price = int(estimate_price(item['rarity']) * 0.5)
                user.balance += price
                user.inventory = json.dumps(inv)
                stats = json.loads(user.stats)
                stats['earned'] = stats.get('earned', 0) + price
                user.stats = json.dumps(stats)
                db.commit()
                return {"success": True, "new_balance": user.balance, "price": price, "inventory": inv}
        raise HTTPException(status_code=404, detail="Предмет не найден")

    elif action == "list_market":
        uid = data.get("uid")
        price = data.get("price")
        if price < 1:
            raise HTTPException(status_code=400, detail="Неверная цена")
        inv = json.loads(user.inventory)
        for i, item in enumerate(inv):
            if item['uid'] == uid:
                del inv[i]
                listing = MarketListing(
                    uid=generate_uid(),
                    server=user.server,
                    item_id=item['item_id'],
                    rarity=item['rarity'],
                    price=price,
                    seller_id=user.telegram_id,
                    seller_nick=user.nickname,
                    listed_at=int(time.time())
                )
                db.add(listing)
                user.inventory = json.dumps(inv)
                db.commit()
                return {"success": True, "inventory": inv}
        raise HTTPException(status_code=404, detail="Предмет не найден")

    elif action == "buy_market":
        listing_uid = data.get("listing_uid")
        listing = db.query(MarketListing).filter(MarketListing.uid == listing_uid).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Лот не найден")
        if user.balance < listing.price:
            raise HTTPException(status_code=400, detail="Недостаточно средств")
        user.balance -= listing.price
        inv = json.loads(user.inventory)
        inv.append({"uid": generate_uid(), "item_id": listing.item_id, "rarity": listing.rarity, "obtained_at": int(time.time())})
        user.inventory = json.dumps(inv)
        seller = db.query(User).filter(User.telegram_id == listing.seller_id).first()
        if seller:
            seller.balance += listing.price
            seller_stats = json.loads(seller.stats)
            seller_stats['earned'] = seller_stats.get('earned', 0) + listing.price
            seller.stats = json.dumps(seller_stats)
        db.delete(listing)
        db.commit()
        return {"success": True, "new_balance": user.balance, "inventory": inv}

    elif action == "cancel_listing":
        listing_uid = data.get("listing_uid")
        listing = db.query(MarketListing).filter(MarketListing.uid == listing_uid, MarketListing.seller_id == user.telegram_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Лот не найден")
        inv = json.loads(user.inventory)
        inv.append({"uid": generate_uid(), "item_id": listing.item_id, "rarity": listing.rarity, "obtained_at": int(time.time())})
        user.inventory = json.dumps(inv)
        db.delete(listing)
        db.commit()
        return {"success": True, "inventory": inv}

    elif action == "send_chat":
        text = data.get("text", "").strip()
        if not text:
            raise HTTPException(status_code=400, detail="Пустое сообщение")
        is_private = data.get("is_private", False)
        recipient_id = data.get("recipient_id")
        message = ChatMessage(
            server=user.server,
            sender_id=user.telegram_id,
            sender_nick=user.nickname,
            text=text,
            recipient_id=recipient_id,
            is_private=is_private,
            timestamp=int(time.time())
        )
        db.add(message)
        db.commit()
        return {"success": True, "message": message.to_dict()}

    elif action == "create_ticket":
        subject = data.get("subject", "Без темы")
        message_text = data.get("message", "")
        if not message_text:
            raise HTTPException(status_code=400, detail="Пустое сообщение")
        ticket = Ticket(user_id=user.telegram_id, server=user.server, subject=subject, message=message_text, status="open", created_at=int(time.time()))
        db.add(ticket)
        db.commit()
        return {"success": True, "ticket_id": ticket.id}

    elif action == "change_server":
        new_server = data.get("server")
        if new_server not in config.SERVER_NAMES:
            raise HTTPException(status_code=400, detail="Неверный сервер")
        server_settings = db.query(ServerSettings).filter(ServerSettings.server_name == new_server).first()
        if not server_settings or not server_settings.is_online:
            raise HTTPException(status_code=400, detail="Сервер отключён")
        user.server = new_server
        db.commit()
        return {"success": True, "server": new_server}

    elif action == "update_settings":
        if "sound_enabled" in data:
            user.sound_enabled = data["sound_enabled"]
        if "notifications_enabled" in data:
            user.notifications_enabled = data["notifications_enabled"]
        db.commit()
        return {"success": True, "sound_enabled": user.sound_enabled, "notifications_enabled": user.notifications_enabled}

    elif action == "craft":
        recipe_id = data.get("recipe_id")
        # Поиск рецепта (можно вынести в общий список)
        recipes = {
            'craft_rare': {'resultRarity': 'rare', 'cost': {'common': 5}},
            'craft_legendary': {'resultRarity': 'legendary', 'cost': {'epic': 3}},
            'craft_mythic': {'resultRarity': 'mythic', 'cost': {'legendary': 3}},
        }
        recipe = recipes.get(recipe_id)
        if not recipe:
            raise HTTPException(status_code=404, detail="Рецепт не найден")
        inv = json.loads(user.inventory)
        # Проверка наличия предметов
        for rarity, count in recipe['cost'].items():
            have = sum(1 for i in inv if i['rarity'] == rarity)
            if have < count:
                raise HTTPException(status_code=400, detail="Недостаточно предметов")
        # Удаляем предметы
        new_inv = []
        to_remove = dict(recipe['cost'])
        for item in inv:
            r = item['rarity']
            if r in to_remove and to_remove[r] > 0:
                to_remove[r] -= 1
            else:
                new_inv.append(item)
        # Создаём новый предмет
        new_item = get_random_item_by_rarity(recipe['resultRarity'])
        if not new_item:
            raise HTTPException(status_code=500, detail="Ошибка генерации")
        new_inv.append({"uid": generate_uid(), "item_id": new_item['id'], "rarity": new_item['rarity'], "obtained_at": int(time.time())})
        user.inventory = json.dumps(new_inv)
        db.commit()
        return {"success": True, "inventory": new_inv, "item": new_item}

    raise HTTPException(status_code=400, detail="Неизвестное действие")

def estimate_price(rarity):
    base = {'common': 50, 'rare': 150, 'epic': 400, 'legendary': 1000, 'mythic': 3000}
    return base.get(rarity, 50)