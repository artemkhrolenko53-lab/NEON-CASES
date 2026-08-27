// ==================== STORM CASES - ИНВЕНТАРЬ ====================

// ===== ОТОБРАЖЕНИЕ ИНВЕНТАРЯ =====
function renderInventory() {
    const container = document.getElementById('inventory-list');

    if (!container) {
        console.error('Контейнер инвентаря не найден');
        return;
    }

    // Очищаем контейнер
    container.innerHTML = '';

    // Проверяем наличие предметов
    if (state.inventory.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <p class="text-5xl mb-3">🎒</p>
                <p class="text-lg font-semibold">Инвентарь пуст</p>
                <p class="text-sm mt-2">Открывайте кейсы, чтобы получить предметы!</p>
            </div>
        `;
        return;
    }

    // Группируем предметы
    const groups = groupInventory();
    const items = Object.values(groups);

    // Сортируем по редкости и цене
    items.sort((a, b) => {
        const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
        if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
            return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        }
        return b.price - a.price;
    });

    // Отображаем статистику
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

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

    // Определяем цвет рамки по редкости
    const rarityBorder = {
        common: 'border-l-2 border-l-white/30',
        rare: 'border-l-2 border-l-blue-400/50',
        epic: 'border-l-2 border-l-purple-400/50',
        legendary: 'border-l-2 border-l-yellow-400/70',
    };
    div.classList.add(rarityBorder[item.rarity] || '');

    div.innerHTML = `
        <div class="flex items-center gap-3 flex-1">
            <div class="relative">
                <span class="text-4xl">${item.icon}</span>
                ${item.qty > 1 ? `<span class="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">${item.qty}</span>` : ''}
            </div>
            <div class="flex-1">
                <p class="rarity-${item.rarity} font-semibold">${item.name}</p>
                <p class="text-xs text-gray-400">${item.type}</p>
                <p class="text-xs text-gray-500">Цена: 💰 ${item.price}</p>
            </div>
        </div>
        <div class="flex gap-2 ml-2">
            <button onclick="sellItem(${item.id})" class="bg-red-500/20 text-red-300 px-3 py-2 rounded-lg text-sm hover:bg-red-500/30 transition whitespace-nowrap">
                Продать
            </button>
            <button onclick="openSellModal(${item.id})" class="bg-yellow-500/20 text-yellow-300 px-3 py-2 rounded-lg text-sm hover:bg-yellow-500/30 transition whitespace-nowrap">
                Выставить
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

    // Проверяем наличие предмета
    const index = state.inventory.findIndex(i => i.id === itemId);
    if (index === -1) {
        showToast('Предмет не найден в инвентаре', 'error');
        return;
    }

    // Рассчитываем цену продажи
    const sellPrice = Math.floor(item.price * CONFIG.sellMultiplier);

    // Подтверждение продажи
    if (confirm(`Продать ${item.name} за 💰 ${sellPrice}?`)) {
        removeItemFromInventory(itemId);
        addBalance(sellPrice);
        renderInventory();
        showToast(`Продано: ${item.name} (+💰 ${sellPrice})`, 'success');
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

    if (confirm(`Продать все предметы редкости "${rarity}" за 💰 ${totalValue}?`)) {
        state.inventory = state.inventory.filter(i => i.rarity !== rarity);
        addBalance(totalValue);
        renderInventory();
        showToast(`Продано предметов на 💰 ${totalValue}`, 'success');
        hapticFeedback('heavy');
    }
}

// ===== СОРТИРОВКА ИНВЕНТАРЯ =====
function sortInventory(sortBy) {
    const groups = groupInventory();
    const items = Object.values(groups);

    switch(sortBy) {
        case 'price_asc':
            items.sort((a, b) => a.price - b.price);
            break;
        case 'price_desc':
            items.sort((a, b) => b.price - a.price);
            break;
        case 'rarity':
            const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
            items.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
            break;
        case 'name':
            items.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }

    // Перерисовываем инвентарь
    const container = document.getElementById('inventory-list');
    container.innerHTML = '';

    items.forEach(item => {
        const itemDiv = createInventoryItemElement(item);
        container.appendChild(itemDiv);
    });
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
    const groups = groupInventory();
    const uniqueItems = Object.keys(groups).length;

    const totalValue = state.inventory.reduce((sum, item) => sum + item.price, 0);

    const rarityCount = {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
    };

    state.inventory.forEach(item => {
        rarityCount[item.rarity]++;
    });

    return {
        totalItems,
        uniqueItems,
        totalValue,
        rarityCount,
    };
}

// ===== ОТОБРАЖЕНИЕ ПОДРОБНОЙ СТАТИСТИКИ =====
function showInventoryStats() {
    const stats = getInventoryStats();

    const statsHTML = `
        <div class="glass p-4 space-y-2">
            <h3 class="font-bold">📊 Статистика инвентаря</h3>
            <p>Всего предметов: ${stats.totalItems}</p>
            <p>Уникальных: ${stats.uniqueItems}</p>
            <p>Общая стоимость: 💰 ${stats.totalValue}</p>
            <div class="border-t border-white/10 pt-2">
                <p>Обычных: ${stats.rarityCount.common}</p>
                <p>Редких: ${stats.rarityCount.rare}</p>
                <p>Эпических: ${stats.rarityCount.epic}</p>
                <p>Легендарных: ${stats.rarityCount.legendary}</p>
            </div>
        </div>
    `;

    showModal(statsHTML);
}

// ===== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ МОДАЛЬНЫХ ОКОН =====
function showModal(content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/70" onclick="this.parentElement.remove()"></div>
        <div class="relative glass-strong p-6 m-4 max-w-sm w-full">
            ${content}
            <button onclick="this.closest('.fixed').remove()" class="mt-4 w-full bg-white/10 py-2 rounded-lg">Закрыть</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// ===== ЭКСПОРТ ИНВЕНТАРЯ =====
function exportInventory() {
    const groups = groupInventory();
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
    showToast('Инвентарь экспортирован', 'success');
}