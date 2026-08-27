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
    const balanceElements = document.querySelectorAll('#balance, #balance-display');
    balanceElements.forEach(el => {
        if (el) el.textContent = state.balance;
    });
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
        const key = item.id || item.item_id;
        if (!groups[key]) {
            groups[key] = { ...item, qty: 0, id: key };
        }
        groups[key].qty++;
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

function removeItemFromInventory(itemId) {
    const index = state.inventory.findIndex(i =>
        (i.id === itemId) || (i.item_id === itemId)
    );
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

// Экспорт функций
window.updateBalance = updateBalance;
window.addBalance = addBalance;
window.spendBalance = spendBalance;
window.addItemToInventory = addItemToInventory;
window.removeItemFromInventory = removeItemFromInventory;