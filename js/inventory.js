// ==================== STORM CASES - ИНВЕНТАРЬ ====================

function renderInventory() {
    const container = document.getElementById('inventory-list');
    
    if (!container) {
        console.error('Контейнер не найден');
        return;
    }
    
    container.innerHTML = '';
    
    if (!state.inventory || state.inventory.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <p class="text-5xl mb-3">🎒</p>
                <p class="text-lg font-semibold">Инвентарь пуст</p>
                <p class="text-sm mt-2">Открывайте кейсы!</p>
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
        div.className = 'glass p-3 mb-2 flex items-center justify-between';
        
        // Цвет рамки
        const borderColors = {
            common: 'rgba(255,255,255,0.4)',
            rare: '#4a9eff',
            epic: '#a855f7',
            legendary: '#ffd700',
        };
        div.style.borderLeft = `4px solid ${borderColors[item.rarity] || '#fff'}`;
        
        div.innerHTML = `
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
                <button onclick="sellItem(${item.id})" class="bg-red-500/20 text-red-300 px-3 py-2 rounded-lg text-sm font-bold">
                    Продать
                </button>
                <button onclick="openSellModal(${item.id})" class="bg-yellow-500/20 text-yellow-300 px-3 py-2 rounded-lg text-sm font-bold">
                    Выставить
                </button>
            </div>
        `;
        
        container.appendChild(div);
    });
}

function sellItem(itemId) {
    const index = state.inventory.findIndex(i => i.id === itemId);
    
    if (index === -1) {
        showToast('Предмет не найден', 'error');
        return;
    }
    
    const item = state.inventory[index];
    const sellPrice = Math.floor(item.price * CONFIG.sellMultiplier);
    
    state.inventory.splice(index, 1);
    state.balance += sellPrice;
    updateBalance();
    save();
    renderInventory();
    
    showToast(`✅ Продано: ${item.name} (+💰 ${sellPrice})`, 'success');
}

// Экспорт
window.renderInventory = renderInventory;
window.sellItem = sellItem;
