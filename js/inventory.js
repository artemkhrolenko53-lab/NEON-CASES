// ==================== STORM CASES - ИНВЕНТАРЬ ====================

// ===== ОТОБРАЖЕНИЕ ИНВЕНТАРЯ =====
function renderInventory() {
    const container = document.getElementById('inventory-list');

    if (!container) {
        console.error('❌ Контейнер инвентаря не найден');
        return;
    }

    container.innerHTML = '';

    if (!state.inventory || state.inventory.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">🎒</div>
                <p class="text-xl font-bold text-gray-300">Инвентарь пуст</p>
                <p class="text-sm text-gray-500 mt-2">Открывайте кейсы, чтобы получить предметы!</p>
                <button onclick="switchTab('cases')" class="mt-4 bg-blue-500/20 text-blue-300 px-6 py-3 rounded-xl font-bold hover:bg-blue-500/30 transition">
                    🎮 Открыть кейсы
                </button>
            </div>
        `;
        return;
    }

    // Группировка предметов
    const groups = {};
    state.inventory.forEach(item => {
        const key = item.id || item.item_id;
        if (!groups[key]) {
            groups[key] = { ...item, qty: 0, id: key };
        }
        groups[key].qty++;
    });

    const items = Object.values(groups);

    // Сортировка
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    items.sort((a, b) => {
        if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
            return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        }
        return b.price - a.price;
    });

    // Шапка с статистикой
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const headerDiv = document.createElement('div');
    headerDiv.className = 'glass p-4 mb-4';
    headerDiv.innerHTML = `
        <div class="flex justify-between items-center mb-3">
            <div>
                <p class="text-sm text-gray-400">Предметов</p>
                <p class="text-2xl font-bold text-white">${state.inventory.length}</p>
            </div>
            <div class="text-right">
                <p class="text-sm text-gray-400">Общая стоимость</p>
                <p class="text-2xl font-bold text-yellow-300">💰 ${totalValue}</p>
            </div>
        </div>
        <div class="flex gap-2">
            <button onclick="sellAllItems()" class="flex-1 bg-red-500/20 text-red-300 py-2 rounded-lg text-sm font-bold hover:bg-red-500/30 transition">
                💰 Продать всё
            </button>
        </div>
    `;
    container.appendChild(headerDiv);

    // Фильтры по редкости
    const filterDiv = document.createElement('div');
    filterDiv.className = 'flex gap-2 mb-4 overflow-x-auto';
    filterDiv.innerHTML = `
        <button onclick="filterInventory('all')" class="filter-btn active px-4 py-2 rounded-lg text-sm font-bold bg-white/10 text-white whitespace-nowrap">
            Все (${items.length})
        </button>
        <button onclick="filterInventory('legendary')" class="filter-btn px-4 py-2 rounded-lg text-sm font-bold bg-yellow-500/10 text-yellow-400 whitespace-nowrap">
            Легендарные
        </button>
        <button onclick="filterInventory('epic')" class="filter-btn px-4 py-2 rounded-lg text-sm font-bold bg-purple-500/10 text-purple-400 whitespace-nowrap">
            Эпические
        </button>
        <button onclick="filterInventory('rare')" class="filter-btn px-4 py-2 rounded-lg text-sm font-bold bg-blue-500/10 text-blue-400 whitespace-nowrap">
            Редкие
        </button>
        <button onclick="filterInventory('common')" class="filter-btn px-4 py-2 rounded-lg text-sm font-bold bg-gray-500/10 text-gray-400 whitespace-nowrap">
            Обычные
        </button>
    `;
    container.appendChild(filterDiv);

    // Контейнер для предметов
    const itemsContainer = document.createElement('div');
    itemsContainer.id = 'inventory-items-container';
    container.appendChild(itemsContainer);

    // Отображаем предметы
    displayInventoryItems(items, itemsContainer);
}

// ===== ОТОБРАЖЕНИЕ ПРЕДМЕТОВ С ФИЛЬТРОМ =====
function displayInventoryItems(items, container) {
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-4xl mb-2">🔍</p>
                <p class="text-gray-400">Нет предметов этой редкости</p>
            </div>
        `;
        return;
    }

    items.forEach(item => {
        const div = createInventoryItemCard(item);
        container.appendChild(div);
    });
}

// ===== СОЗДАНИЕ КАРТОЧКИ ПРЕДМЕТА =====
function createInventoryItemCard(item) {
    const div = document.createElement('div');
    div.className = 'glass p-4 mb-3 relative overflow-hidden';

    // Градиентная рамка по редкости
    const rarityStyles = {
        legendary: {
            border: '2px solid #ffd700',
            glow: 'box-shadow: 0 0 20px rgba(255,215,0,0.3)',
            bg: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.02))',
            textColor: 'text-yellow-400',
            badge: 'bg-yellow-500/20 text-yellow-300',
        },
        epic: {
            border: '2px solid #a855f7',
            glow: 'box-shadow: 0 0 15px rgba(168,85,247,0.3)',
            bg: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(168,85,247,0.02))',
            textColor: 'text-purple-400',
            badge: 'bg-purple-500/20 text-purple-300',
        },
        rare: {
            border: '2px solid #4a9eff',
            glow: 'box-shadow: 0 0 15px rgba(74,158,255,0.3)',
            bg: 'linear-gradient(135deg, rgba(74,158,255,0.1), rgba(74,158,255,0.02))',
            textColor: 'text-blue-400',
            badge: 'bg-blue-500/20 text-blue-300',
        },
        common: {
            border: '1px solid rgba(255,255,255,0.2)',
            glow: 'none',
            bg: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            textColor: 'text-white',
            badge: 'bg-gray-500/20 text-gray-300',
        },
    };

    const style = rarityStyles[item.rarity] || rarityStyles.common;
    div.style.cssText = `
        border: ${style.border};
        ${style.glow};
        background: ${style.bg};
    `;

    // Бейдж редкости
    const rarityNames = {
        legendary: 'Легендарный',
        epic: 'Эпический',
        rare: 'Редкий',
        common: 'Обычный',
    };

    div.innerHTML = `
        <div class="flex items-center gap-4">
            <div class="relative">
                <span class="text-5xl">${item.icon}</span>
                ${item.qty > 1 ? `
                    <span class="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        x${item.qty}
                    </span>
                ` : ''}
            </div>
            
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <p class="font-bold ${style.textColor}">${item.name}</p>
                    <span class="text-xs px-2 py-1 rounded-full ${style.badge}">
                        ${rarityNames[item.rarity] || item.rarity}
                    </span>
                </div>
                <p class="text-xs text-gray-400">${item.type}</p>
                <p class="text-sm font-bold text-yellow-300 mt-1">💰 ${item.price}</p>
            </div>
        </div>
        
        <div class="flex gap-2 mt-3">
            <button onclick="sellItem(${item.id})" class="flex-1 bg-red-500/20 text-red-300 py-2 rounded-lg text-sm font-bold hover:bg-red-500/30 transition">
                💰 Продать
            </button>
            <button onclick="openSellModal(${item.id})" class="flex-1 bg-yellow-500/20 text-yellow-300 py-2 rounded-lg text-sm font-bold hover:bg-yellow-500/30 transition">
                📊 Выставить
            </button>
        </div>
    `;

    return div;
}

// ===== ФИЛЬТРАЦИЯ ИНВЕНТАРЯ =====
let currentFilter = 'all';

function filterInventory(filter) {
    currentFilter = filter;

    // Обновляем активную кнопку
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-white/10', 'text-white');
        btn.classList.add('bg-white/5', 'text-gray-400');
    });

    const activeBtn = event.target;
    if (activeBtn) {
        activeBtn.classList.add('active', 'bg-white/10', 'text-white');
        activeBtn.classList.remove('bg-white/5', 'text-gray-400');
    }

    // Получаем все предметы
    const groups = {};
    state.inventory.forEach(item => {
        const key = item.id || item.item_id;
        if (!groups[key]) {
            groups[key] = { ...item, qty: 0, id: key };
        }
        groups[key].qty++;
    });

    let items = Object.values(groups);

    // Применяем фильтр
    if (filter !== 'all') {
        items = items.filter(item => item.rarity === filter);
    }

    // Сортировка
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    items.sort((a, b) => {
        if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
            return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        }
        return b.price - a.price;
    });

    // Обновляем контейнер
    const container = document.getElementById('inventory-items-container');
    if (container) {
        displayInventoryItems(items, container);
    }
}

// ===== ПРОДАЖА ПРЕДМЕТА =====
function sellItem(itemId) {
    console.log('💰 Продажа предмета с ID:', itemId);

    const index = state.inventory.findIndex(i =>
        (i.id === itemId) || (i.item_id === itemId)
    );

    if (index === -1) {
        showToast('Предмет не найден в инвентаре', 'error');
        return;
    }

    const item = state.inventory[index];
    const sellPrice = Math.floor(item.price * CONFIG.sellMultiplier);

    // Модальное окно подтверждения
    const confirmHTML = `
        <div class="text-center space-y-4">
            <div class="text-6xl">${item.icon}</div>
            <h3 class="font-bold text-xl">Продать ${item.name}?</h3>
            <p class="text-gray-400">Вы получите:</p>
            <p class="text-3xl font-bold text-yellow-300">💰 ${sellPrice}</p>
            <div class="flex gap-2">
                <button onclick="confirmSellItem(${itemId})" class="flex-1 bg-red-500/20 text-red-300 py-3 rounded-lg font-bold hover:bg-red-500/30 transition">
                    Да, продать
                </button>
                <button onclick="closeModal()" class="flex-1 bg-gray-500/20 text-gray-300 py-3 rounded-lg font-bold hover:bg-gray-500/30 transition">
                    Отмена
                </button>
            </div>
        </div>
    `;

    showModal(confirmHTML);
}

// ===== ПОДТВЕРЖДЕНИЕ ПРОДАЖИ =====
function confirmSellItem(itemId) {
    const index = state.inventory.findIndex(i =>
        (i.id === itemId) || (i.item_id === itemId)
    );

    if (index === -1) {
        showToast('Предмет не найден', 'error');
        return;
    }

    const item = state.inventory[index];
    const sellPrice = Math.floor(item.price * CONFIG.sellMultiplier);

    // Удаляем предмет
    state.inventory.splice(index, 1);

    // Добавляем деньги
    state.balance += sellPrice;
    state.stats.totalEarned += sellPrice;

    updateBalance();
    save();
    closeModal();
    renderInventory();

    showToast(`✅ Продано: ${item.name} (+💰 ${sellPrice})`, 'success');
    hapticFeedback('medium');
    playSound('sell');
}

// ===== ПРОДАЖА ВСЕХ ПРЕДМЕТОВ =====
function sellAllItems() {
    if (state.inventory.length === 0) {
        showToast('Инвентарь пуст', 'error');
        return;
    }

    const totalValue = state.inventory.reduce((sum, item) => {
        return sum + Math.floor(item.price * CONFIG.sellMultiplier);
    }, 0);

    const confirmHTML = `
        <div class="text-center space-y-4">
            <div class="text-6xl">💰</div>
            <h3 class="font-bold text-xl">Продать ВСЕ предметы?</h3>
            <p class="text-gray-400">Количество: ${state.inventory.length}</p>
            <p class="text-3xl font-bold text-yellow-300">💰 ${totalValue}</p>
            <div class="flex gap-2">
                <button onclick="confirmSellAllItems()" class="flex-1 bg-red-500/20 text-red-300 py-3 rounded-lg font-bold hover:bg-red-500/30 transition">
                    Да, продать всё
                </button>
                <button onclick="closeModal()" class="flex-1 bg-gray-500/20 text-gray-300 py-3 rounded-lg font-bold hover:bg-gray-500/30 transition">
                    Отмена
                </button>
            </div>
        </div>
    `;

    showModal(confirmHTML);
}

// ===== ПОДТВЕРЖДЕНИЕ ПРОДАЖИ ВСЕГО =====
function confirmSellAllItems() {
    if (state.inventory.length === 0) {
        showToast('Инвентарь пуст', 'error');
        return;
    }

    const totalValue = state.inventory.reduce((sum, item) => {
        return sum + Math.floor(item.price * CONFIG.sellMultiplier);
    }, 0);

    state.inventory = [];
    state.balance += totalValue;
    state.stats.totalEarned += totalValue;

    updateBalance();
    save();
    closeModal();
    renderInventory();

    showToast(`✅ Всё продано за 💰 ${totalValue}`, 'success');
    hapticFeedback('heavy');
    playSound('sell');
}

// Экспорт функций
window.renderInventory = renderInventory;
window.filterInventory = filterInventory;
window.sellItem = sellItem;
window.confirmSellItem = confirmSellItem;
window.sellAllItems = sellAllItems;
window.confirmSellAllItems = confirmSellAllItems;