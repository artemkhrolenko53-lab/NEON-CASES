// ==================== STORM CASES - ИНВЕНТАРЬ ====================

// ===== ОТОБРАЖЕНИЕ ИНВЕНТАРЯ =====
function renderInventory() {
    const container = document.getElementById('inventory-list');
    
    if (!container) {
        console.error('Контейнер инвентаря не найден');
        return;
    }
    
    container.innerHTML = '';
    
    if (!state.inventory || state.inventory.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <p class="text-5xl mb-3">🎒</p>
                <p class="text-lg font-semibold">Инвентарь пуст</p>
                <p class="text-sm mt-2">Открывайте кейсы, чтобы получить предметы!</p>
            </div>
        `;
        return;
    }
    
    // Группировка одинаковых предметов
    const groups = {};
    state.inventory.forEach(item => {
        if (!groups[item.id]) {
            groups[item.id] = { ...item, qty: 0 };
        }
        groups[item.id].qty++;
    });
    
    const items = Object.values(groups);
    
    // Сортировка: сначала легендарные, потом эпические и т.д.
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    items.sort((a, b) => {
        if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
            return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        }
        return b.price - a.price;
    });
    
    // Считаем общую стоимость
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    // Статистика
    const statsDiv = document.createElement('div');
    statsDiv.className = 'glass p-3 mb-3 text-center';
    statsDiv.innerHTML = `
        <p class="text-sm text-gray-400">
            Предметов: <span class="text-white font-bold">${state.inventory.length}</span> • 
            Уникальных: <span class="text-white font-bold">${items.length}</span> • 
            Стоимость: <span class="text-yellow-300 font-bold">💰 ${totalValue}</span>
        </p>
    `;
    container.appendChild(statsDiv);
    
    // Отображаем предметы
    items.forEach(item => {
        const itemDiv = createInventoryItemElement(item);
        container.appendChild(itemDiv);
    });
}

// ===== СОЗДАНИЕ ЭЛЕМЕНТА ИНВЕНТАРЯ =====
function createInventoryItemElement(item) {
    const div = document.createElement('div');
    div.className = 'glass p-3 flex justify-between items-center hover:bg-white/5 transition';
    
    // Цветная полоска слева по редкости
    const rarityBorder = {
        common: 'border-l-4 border-l-white/30',
        rare: 'border-l-4 border-l-blue-400/60',
        epic: 'border-l-4 border-l-purple-400/60',
        legendary: 'border-l-4 border-l-yellow-400/80',
    };
    div.classList.add(rarityBorder[item.rarity] || '');
    
    const qtyBadge = item.qty > 1 
        ? `<span class="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">${item.qty}</span>` 
        : '';
    
    div.innerHTML = `
        <div class="flex items-center gap-3 flex-1">
            <div class="relative">
                <span class="text-4xl">${item.icon}</span>
                ${qtyBadge}
            </div>
            <div class="flex-1">
                <p class="rarity-${item.rarity} font-semibold">${item.name}</p>
                <p class="text-xs text-gray-400">${item.type}</p>
                <p class="text-xs text-gray-500 mt-1">Цена: 💰 ${item.price}</p>
            </div>
        </div>
        <div class="flex gap-2 ml-2">
            <button onclick="sellItem(${item.id})" 
                class="bg-red-500/20 text-red-300 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition whitespace-nowrap">
                💰 Продать
            </button>
            <button onclick="openSellModal(${item.id})" 
                class="bg-yellow-500/20 text-yellow-300 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500/30 transition whitespace-nowrap">
                📊 Выставить
            </button>
        </div>
    `;
    
    return div;
}

// ===== ПРОДАЖА ПРЕДМЕТА =====
function sellItem(itemId) {
    const item = getItemById(itemId);
    
    if (!item) {
        showToast('Предмет не найден', 'error');
        return;
    }
    
    const index = state.inventory.findIndex(i => i.id === itemId);
    if (index === -1) {
        showToast('Предмет не найден в инвентаре', 'error');
        return;
    }
    
    const sellPrice = Math.floor(item.price * CONFIG.sellMultiplier);
    
    if (confirm(`Продать ${item.name} за 💰 ${sellPrice}?`)) {
        removeItemFromInventory(itemId);
        addBalance(sellPrice);
        renderInventory();
        showToast(`✅ Продано: ${item.name} (+💰 ${sellPrice})`, 'success');
        hapticFeedback('medium');
        playSound('sell');
    }
}

// ===== ПРОДАЖА ВСЕХ ПРЕДМЕТОВ ОПРЕДЕЛЁННОЙ РЕДКОСТИ =====
function sellAllByRarity(rarity) {
    const itemsToSell = state.inventory.filter(i => i.rarity === rarity);
    
    if (itemsToSell.length === 0) {
        showToast('Нет предметов этой редкости', 'error');
        return;
    }
    
    const totalValue = itemsToSell.reduce((sum, item) => {
        return sum + Math.floor(item.price * CONFIG.sellMultiplier);
    }, 0);
    
    if (confirm(`Продать все предметы "${rarity}" за 💰 ${totalValue}?`)) {
        state.inventory = state.inventory.filter(i => i.rarity !== rarity);
        addBalance(totalValue);
        renderInventory();
        showToast(`✅ Продано на 💰 ${totalValue}`, 'success');
        hapticFeedback('heavy');
    }
}

// ===== ФИЛЬТРАЦИЯ ИНВЕНТАРЯ =====
function filterInventory(rarity) {
    const container = document.getElementById('inventory-list');
    container.innerHTML = '';
    
    const filteredItems = rarity === 'all' 
        ? state.inventory 
        : state.inventory.filter(i => i.rarity === rarity);
    
    if (filteredItems.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <p class="text-5xl mb-3">🔍</p>
                <p>Ничего не найдено</p>
            </div>
        `;
        return;
    }
    
    const groups = {};
    filteredItems.forEach(item => {
        if (!groups[item.id]) {
            groups[item.id] = { ...item, qty: 0 };
        }
        groups[item.id].qty++;
    });
    
    Object.values(groups).forEach(item => {
        const itemDiv = createInventoryItemElement(item);
        container.appendChild(itemDiv);
    });
}

// ===== ПОЛУЧЕНИЕ СТАТИСТИКИ ИНВЕНТАРЯ =====
function getInventoryStats() {
    const totalItems = state.inventory.length;
    const groups = {};
    state.inventory.forEach(item => {
        groups[item.id] = (groups[item.id] || 0) + 1;
    });
    const uniqueItems = Object.keys(groups).length;
    const totalValue = state.inventory.reduce((sum, item) => sum + item.price, 0);
    
    const rarityCount = { common: 0, rare: 0, epic: 0, legendary: 0 };
    state.inventory.forEach(item => {
        rarityCount[item.rarity]++;
    });
    
    return { totalItems, uniqueItems, totalValue, rarityCount };
}

// ===== ЭКСПОРТ ИНВЕНТАРЯ =====
function exportInventory() {
    const groups = {};
    state.inventory.forEach(item => {
        if (!groups[item.id]) groups[item.id] = { ...item, qty: 0 };
        groups[item.id].qty++;
    });
    
    const exportData = Object.values(groups).map(item => ({
        name: item.name,
        type: item.type,
        rarity: item.rarity,
        price: item.price,
        icon: item.icon,
        quantity: item.qty,
    }));
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.json';
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('📦 Инвентарь экспортирован', 'success');
}

// ===== ЭКСПОРТ ФУНКЦИЙ =====
window.renderInventory = renderInventory;
window.sellItem = sellItem;
window.sellAllByRarity = sellAllByRarity;
window.filterInventory = filterInventory;
window.getInventoryStats = getInventoryStats;
window.exportInventory = exportInventory;
