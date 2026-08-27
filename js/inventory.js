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
    
    // Группировка
    const groups = {};
    state.inventory.forEach(item => {
        if (!groups[item.id]) {
            groups[item.id] = { ...item, qty: 0 };
        }
        groups[item.id].qty++;
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
    
    // Статистика
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const statsDiv = document.createElement('div');
    statsDiv.className = 'glass p-3 mb-3 text-center';
    statsDiv.innerHTML = `
        <p class="text-sm text-gray-400">
            Предметов: <span class="text-white font-bold">${state.inventory.length}</span> • 
            Стоимость: <span class="text-yellow-300 font-bold">💰 ${totalValue}</span>
        </p>
    `;
    container.appendChild(statsDiv);
    
    // Отображение предметов
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'glass p-3 mb-2';
        
        // Цвет рамки
        const borderColors = {
            common: 'rgba(255,255,255,0.4)',
            rare: '#4a9eff',
            epic: '#a855f7',
            legendary: '#ffd700',
        };
        div.style.borderLeft = `4px solid ${borderColors[item.rarity] || '#fff'}`;
        
        div.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-4xl">${item.icon}</span>
                    <div>
                        <p class="font-bold ${item.rarity === 'common' ? 'text-white' : item.rarity === 'rare' ? 'text-blue-400' : item.rarity === 'epic' ? 'text-purple-400' : 'text-yellow-400'}">
                            ${item.name} ${item.qty > 1 ? `(x${item.qty})` : ''}
                        </p>
                        <p class="text-xs text-gray-400">${item.type} • 💰 ${item.price}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="sellItem(${item.id})" class="bg-red-500/20 text-red-300 px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-500/30 transition">
                        💰 Продать
                    </button>
                    <button onclick="openSellModal(${item.id})" class="bg-yellow-500/20 text-yellow-300 px-3 py-2 rounded-lg text-sm font-bold hover:bg-yellow-500/30 transition">
                        📊 Выставить
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(div);
    });
}

// ===== ПРОДАЖА ПРЕДМЕТА =====
function sellItem(itemId) {
    console.log('Продажа предмета с ID:', itemId);
    
    const index = state.inventory.findIndex(i => i.id === itemId);
    
    if (index === -1) {
        showToast('Предмет не найден в инвентаре', 'error');
        return;
    }
    
    const item = state.inventory[index];
    const sellPrice = Math.floor(item.price * CONFIG.sellMultiplier);
    
    // Подтверждение
    if (!confirm(`Продать ${item.name} за 💰 ${sellPrice}?`)) {
        return;
    }
    
    // Удаляем предмет
    state.inventory.splice(index, 1);
    
    // Добавляем деньги
    state.balance += sellPrice;
    state.stats.totalEarned += sellPrice;
    
    updateBalance();
    save();
    renderInventory();
    
    showToast(`✅ Продано: ${item.name} (+💰 ${sellPrice})`, 'success');
    hapticFeedback('medium');
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
        state.balance += totalValue;
        state.stats.totalEarned += totalValue;
        
        updateBalance();
        save();
        renderInventory();
        
        showToast(`✅ Продано на 💰 ${totalValue}`, 'success');
        hapticFeedback('heavy');
    }
}

// ===== ПРОДАЖА ВСЕГО ИНВЕНТАРЯ =====
function sellAllItems() {
    if (state.inventory.length === 0) {
        showToast('Инвентарь пуст', 'error');
        return;
    }
    
    const totalValue = state.inventory.reduce((sum, item) => {
        return sum + Math.floor(item.price * CONFIG.sellMultiplier);
    }, 0);
    
    if (confirm(`Продать ВСЕ предметы за 💰 ${totalValue}?`)) {
        state.inventory = [];
        state.balance += totalValue;
        state.stats.totalEarned += totalValue;
        
        updateBalance();
        save();
        renderInventory();
        
        showToast(`✅ Всё продано за 💰 ${totalValue}`, 'success');
        hapticFeedback('heavy');
    }
}

// ===== ЭКСПОРТ ФУНКЦИЙ =====
window.renderInventory = renderInventory;
window.sellItem = sellItem;
window.sellAllByRarity = sellAllByRarity;
window.sellAllItems = sellAllItems;
