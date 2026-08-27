// ==================== STORM CASES - УПРАВЛЕНИЕ СОСТОЯНИЕМ ====================

// ===== ОСНОВНОЕ СОСТОЯНИЕ =====
let state = {
    balance: CONFIG.startBalance,
    inventory: [],
    sound: true,
    notifications: true,
    soundVolume: 100,
    market: [],
    userName: 'Гость',
    userId: 'guest',
    stats: {
        casesOpened: 0,
        itemsReceived: 0,
        totalSpent: 0,
        totalEarned: 0,
        bestDrop: null,
    },
};

// ===== ТЕКУЩИЕ ПЕРЕМЕННЫЕ =====
let currentCase = null;
let pendingSellItemId = null;
let isOpening = false;

// ===== ФУНКЦИИ ОБНОВЛЕНИЯ =====
function updateBalance() {
    const balanceElement = document.getElementById('balance');
    if (balanceElement) balanceElement.textContent = state.balance;
}
// ===== ФУНКЦИИ ПОЛУЧЕНИЯ ДАННЫХ =====
function getItemById(itemId) {
    return ITEMS.find(item => item.id === itemId);
}

function getItemsByRarity(rarities) {
    return ITEMS.filter(item => rarities.includes(item.rarity));
}

function groupInventory() {
    const groups = {};
    state.inventory.forEach(item => {
        if (!groups[item.id]) {
            groups[item.id] = { ...item, qty: 0 };
        }
        groups[item.id].qty++;
    });
    return groups;
}

// ===== ФУНКЦИИ ИЗМЕНЕНИЯ СОСТОЯНИЯ =====
function addBalance(amount) {
    state.balance += amount;
    state.stats.totalEarned += amount;
    updateBalance();
    save();
}

function spendBalance(amount) {
    if (state.balance < amount) return false;
    state.balance -= amount;
    state.stats.totalSpent += amount;
    updateBalance();
    save();
    return true;
}

function addItemToInventory(item) {
    const itemId = item.id || item.item_id;
    const existing = state.inventory.find(i =>
        (i.id === itemId) || (i.item_id === itemId)
    );

    if (existing) {
        existing.qty = (existing.qty || 1) + 1;
    } else {
        state.inventory.push({ ...item, qty: 1, id: itemId });
    }
    state.stats.itemsReceived++;

    if (!state.stats.bestDrop || item.price > state.stats.bestDrop.price) {
        state.stats.bestDrop = { ...item };
    }

    save();
}
    // Обновляем лучший дроп
    if (!state.stats.bestDrop || item.price > state.stats.bestDrop.price) {
        state.stats.bestDrop = { ...item };
    }

    save();
}

function removeItemFromInventory(itemId) {
    const index = state.inventory.findIndex(i => i.id === itemId);
    if (index === -1) return null;

    const item = state.inventory[index];
    if (item.qty > 1) {
        item.qty--;
    } else {
        state.inventory.splice(index, 1);
    }

    save();
    return item;
}
function incrementCasesOpened() {
    state.stats.casesOpened++;
    save();
}