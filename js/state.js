// ==================== STORM CASES - УПРАВЛЕНИЕ СОСТОЯНИЕМ ====================

// ===== ОСНОВНОЕ СОСТОЯНИЕ =====
let state = {
    balance: CONFIG.startBalance,
    inventory: [],
    sound: true,
    music: false,
    notifications: true,
    language: 'ru',
    graphicsQuality: 'medium',
    soundVolume: 100,
    musicVolume: 100,
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
let musicPlayer = null;
let isOpening = false;

// ===== ФУНКЦИИ ОБНОВЛЕНИЯ =====
function updateBalance() {
    document.getElementById('balance').textContent = state.balance;
}

function updateStats() {
    // Обновление статистики (если есть элементы для отображения)
}

// ===== ФУНКЦИИ ПОЛУЧЕНИЯ ДАННЫХ =====
function getItemById(itemId) {
    return ITEMS.find(item => item.id === itemId);
}

function getItemsByRarity(rarities) {
    return ITEMS.filter(item => rarities.includes(item.rarity));
}

function getInventoryItems() {
    return state.inventory.map(itemId => getItemById(itemId)).filter(Boolean);
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
    const existing = state.inventory.find(i => i.id === item.id);
    if (existing) {
        existing.qty++;
    } else {
        state.inventory.push({ ...item, qty: 1 });
    }
    state.stats.itemsReceived++;

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

// ===== ФУНКЦИИ СБРОСА =====
function resetState() {
    state = {
        balance: CONFIG.startBalance,
        inventory: [],
        sound: true,
        music: false,
        notifications: true,
        language: 'ru',
        graphicsQuality: 'medium',
        soundVolume: 100,
        musicVolume: 100,
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
    save();
}

// ===== ФУНКЦИИ ДЛЯ РЫНКА =====
function addMarketListing(item, price) {
    state.market.push({
        item: { ...item, qty: 1 },
        seller: state.userName,
        price: price,
        id: Date.now(),
    });
    save();
}

function removeMarketListing(index) {
    if (index >= 0 && index < state.market.length) {
        state.market.splice(index, 1);
        save();
    }
}