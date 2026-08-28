from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json
import time
import random
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

RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic']
RARITY_LABELS = {'common': 'Обычный', 'rare': 'Редкий', 'epic': 'Эпический', 'legendary': 'Легендарный', 'mythic': 'Мифический'}

ITEMS_DATA = {
    'common': [{'id': 'c1', 'name': 'Потрёпанный нож', 'icon': '🔪'}, {'id': 'c2', 'name': 'Старый пистолет', 'icon': '🔫'}],
    'rare': [{'id': 'r1', 'name': 'Штурмовая винтовка', 'icon': '🔫'}, {'id': 'r2', 'name': 'Тактический нож', 'icon': '🗡️'}],
    'epic': [{'id': 'e1', 'name': 'Снайперская винтовка', 'icon': '🎯'}, {'id': 'e2', 'name': 'Золотой пистолет', 'icon': '🔫'}],
    'legendary': [{'id': 'l1', 'name': 'Драконий клинок', 'icon': '🐉'}, {'id': 'l2', 'name': 'Титан-пушка', 'icon': '💥'}],
    'mythic': [{'id': 'm1', 'name': 'Клинок Вселенной', 'icon': '🌌'}, {'id': 'm2', 'name': 'Венец Богов', 'icon': '✨'}],
}

CASES_DATA = [
    {'id': 'case_common', 'name': 'Обычный кейс', 'icon': '📦', 'price': 80, 'chances': {'common': 0.80, 'rare': 0.15, 'epic': 0.04, 'legendary': 0.01, 'mythic': 0}},
    {'id': 'case_rare', 'name': 'Редкий кейс', 'icon': '🎁', 'price': 280, 'chances': {'common': 0.50, 'rare': 0.35, 'epic': 0.10, 'legendary': 0.05, 'mythic': 0}},
    {'id': 'case_legendary', 'name': 'Легендарный кейс', 'icon': '💎', 'price': 650, 'chances': {'common': 0, 'rare': 0.30, 'epic': 0.40, 'legendary': 0.25, 'mythic': 0.05}},
    {'id': 'case_knife', 'name': 'Ножевой кейс', 'icon': '🔪', 'price': 1000, 'chances': {'common': 0.20, 'rare': 0.30, 'epic': 0.30, 'legendary': 0.20, 'mythic': 0}},
    {'id': 'case_premium', 'name': 'Премиум кейс', 'icon': '🌟', 'price': 1500, 'chances': {'common': 0, 'rare': 0.20, 'epic': 0.35, 'legendary': 0.35, 'mythic': 0.10}},
    {'id': 'case_mythic', 'name': 'Мифический кейс', 'icon': '🌌', 'price': 3000, 'chances': {'common': 0, 'rare': 0, 'epic': 0.20, 'legendary': 0.50, 'mythic': 0.30}},
]

def generate_uid():
    return int(time.time() * 1000) + random.randint(1, 999)

def get_random_item(rarity):
    items = ITEMS_DATA.get(rarity, [])
    return random.choice(items) if items else None

def roll_case(case_data):
    roll = random.random()
    cumulative = 0
    for rarity in RARITIES:
        cumulative += case_data['chances'].get(rarity, 0)
        if roll <= cumulative:
            return get_random_item(rarity)
    return get_random_item('common')

def parse_init_data(init_data: str) -> dict:
    data = parse_qs(init_data)
    user_str = data.get('user', ['{}'])[0]
    try:
        return json.loads(user_str)
    except:
        return {}

def get_tg_user(request: Request) -> dict:
    init_data = request.headers.get('X-Telegram-Init-Data', '')
    if not init_data:
        raise HTTPException(status_code=401, detail="Не авторизован")
    user = parse_init_data(init_data)
    if not user or 'id' not in user:
        raise HTTPException(status_code=401, detail="Неверные данные")
    return user

def get_current_user(request: Request, db: Session) -> User:
    tg_user = get_tg_user(request)
    telegram_id = tg_user['id']
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        nickname = tg_user.get('first_name', f'player{telegram_id}')
        user = User(telegram_id=telegram_id, nickname=nickname, balance=1000, inventory="[]", stats="{}", warnings="[]", server="Alpha", created_at=int(time.time()))
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@app.post("/api/register")
async def register(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    return {"success": True, "user": {"id": user.id, "nickname": user.nickname, "balance": user.balance, "inventory": json.loads(user.inventory)}}

@app.get("/api/state")
async def get_state(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    return {
        "user": {"id": user.id, "nickname": user.nickname, "balance": user.balance, "inventory": json.loads(user.inventory), "stats": json.loads(user.stats), "warnings": json.loads(user.warnings), "server": user.server},
        "market": [],
        "chat": [],
        "private_chat": [],
        "tickets": [],
        "cases": CASES_DATA,
        "items": ITEMS_DATA,
        "rarities": RARITIES,
        "rarity_labels": RARITY_LABELS
    }

@app.post("/api/action")
async def perform_action(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
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
        item = roll_case(case_data)
        if not item:
            raise HTTPException(status_code=500, detail="Ошибка генерации")
        inv = json.loads(user.inventory)
        inv.append({"uid": generate_uid(), "item_id": item['id'], "rarity": item['rarity'], "obtained_at": int(time.time())})
        user.inventory = json.dumps(inv)
        stats = json.loads(user.stats)
        stats['openedCases'] = stats.get('openedCases', 0) + 1
        stats['itemsObtained'] = stats.get('itemsObtained', 0) + 1
        user.stats = json.dumps(stats)
        db.commit()
        return {"success": True, "new_balance": user.balance, "item": item, "inventory": inv}

    elif action == "sell_item":
        uid = data.get("uid")
        inv = json.loads(user.inventory)
        for i, item in enumerate(inv):
            if item['uid'] == uid:
                del inv[i]
                price = int({'common': 50, 'rare': 150, 'epic': 400, 'legendary': 1000, 'mythic': 3000}.get(item['rarity'], 50) * 0.5)
                user.balance += price
                user.inventory = json.dumps(inv)
                db.commit()
                return {"success": True, "new_balance": user.balance, "price": price, "inventory": inv}
        raise HTTPException(status_code=404, detail="Предмет не найден")

    elif action == "send_chat":
        text = data.get("text", "").strip()
        if not text:
            raise HTTPException(status_code=400, detail="Пустое сообщение")
        return {"success": True}

    elif action == "create_ticket":
        return {"success": True, "ticket_id": int(time.time())}

    raise HTTPException(status_code=400, detail="Неизвестное действие")

@app.get("/api/servers")
async def get_servers(db: Session = Depends(get_db)):
    servers = db.query(ServerSettings).all()
    return {"servers": [{"server_name": s.server_name, "online": s.online, "is_online": s.is_online, "start_balance": s.start_balance, "sell_multiplier": s.sell_multiplier} for s in servers]}

@app.get("/api/health")
async def health():
    return {"status": "ok"}