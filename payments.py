import time
from sqlalchemy.orm import Session
from models import Payment, User
import config

DONATE_PACKS = {
    'donate_10': {'stars': 10, 'coins': 500},
    'donate_50': {'stars': 50, 'coins': 3000},
    'donate_100': {'stars': 100, 'coins': 10000},
}

def create_payment(db: Session, user_id: int, pack_id: str):
    pack = DONATE_PACKS.get(pack_id)
    if not pack:
        return None
    payment = Payment(
        user_id=user_id,
        amount=pack['coins'],
        stars=pack['stars'],
        status='pending',
        created_at=int(time.time())
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

def complete_payment(db: Session, payment_id: int):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment or payment.status != 'pending':
        return False
    payment.status = 'completed'
    user = db.query(User).filter(User.telegram_id == payment.user_id).first()
    if user:
        user.balance += payment.amount
    db.commit()
    return True