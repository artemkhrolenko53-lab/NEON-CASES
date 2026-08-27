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
    
    // Проверяем есть ли предметы
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
    
    console.log('📦 Инвентарь:', state.inventory);
    
    // Группировка предметов
    const groups = {};
    state.inventory.forEach(item => {
        if (!groups[item.id]) {
            groups[item.id] = {
                id: item.id,
                name: item.name,
                type: item.type,
                rarity: item.rarity,
                price: item.price,
                icon: item.icon,
                qty: 0,
            };
        }
        groups[item.id].qty++;
    });
    
    const items = Object.values(groups);
    
    console.log('📦 Сгруппировано:', items);
    
    // Сортировка по редкости
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    items.sort((a, b) => {
        if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
            return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        }
        return b.price - a.price;
    });
    
    // Общая стоимость
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    // Статистика
    const statsDiv = document.createElement('div');
    statsDiv.className = 'glass p-3 mb-3 text-center';
    statsDiv.innerHTML = `
        <p class="text-sm text-gray-400">
            Предметов: <span class="text-white font-bold">${state.inventory.length}</span> • 
            Стоимость: <span class="text-yellow-300 font-bold">💰 ${totalValue}</span>
        </p>
    `;
    container.appendChild(statsDiv);
    
    // Создаём элементы для каждого предмета
    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'glass p-3 mb-2 flex justify-between items-center';
        itemDiv.style.borderLeft = '4px solid';
        
        // Цвет рамки по редкости
        switch(item.rarity) {
            case 'common':
                itemDiv.style.borderLeftColor = 'rgba(255,255,255,0.5)';
                break;
            case 'rare':
                itemDiv.style.borderLeftColor = '#4a9eff';
                break;
            case 'epic':
                itemDiv.style.borderLeftColor = '#a855f7';
                break;
            case 'legendary':
                itemDiv.style.borderLeftColor = '#ffd700';
                break;
        }
        
        // Иконка и информация
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'display: flex; align-items: center; gap: 12px; flex: 1;';
        infoDiv.innerHTML = `
            <span style="font-size: 36px;">${item.icon}</span>
            <div>
                <p class="rarity-${item.rarity}" style="font-weight: bold; font-size: 16px;">${item.name} ${item.qty > 1 ? `(x${item.qty})` : ''}</p>
                <p style="font-size: 12px; color: #a0a0b0;">${item.type}</p>
                <p style="font-size: 12px; color: #a0a0b0;">💰 ${item.price}</p>
            </div>
        `;
        
        // Кнопки
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.cssText = 'display: flex; gap: 8px;';
        
        const sellBtn = document.createElement('button');
        sellBtn.textContent = '💰 Продать';
        sellBtn.style.cssText = 'background: rgba(255,0,0,0.2); color: #ff6b6b; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; border: none; cursor: pointer;';
        sellBtn.onclick = () => sellItem(item.id);
        
        const marketBtn = document.createElement('button');
        marketBtn.textContent = '📊 Выставить';
        marketBtn.style.cssText = 'background: rgba(255,200,0,0.2); color: #ffd700; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; border: none; cursor: pointer;';
        marketBtn.onclick = () => openSellModal(item.id);
        
        buttonsDiv.appendChild(sellBtn);
        buttonsDiv.appendChild(marketBtn);
        
        itemDiv.appendChild(infoDiv);
        itemDiv.appendChild(buttonsDiv);
        container.appendChild(itemDiv);
    });
}

// ===== ПРОДАЖА ПРЕДМЕТА =====
function sellItem(itemId) {
    console.log('Продажа предмета:', itemId);
    
    const index = state.inventory.findIndex(i => i.id === itemId);
    
    if (index === -1) {
        showToast('Предмет не найден', 'error');
        return;
    }
    
    const item = state.inventory[index];
    const sellPrice = Math.floor(item.price * CONFIG.sellMultiplier);
    
    // Удаляем предмет из инвентаря
    state.inventory.splice(index, 1);
    
    // Добавляем деньги
    state.balance += sellPrice;
    updateBalance();
    save();
    
    // Перерисовываем
    renderInventory();
    
    showToast(`✅ Продано: ${item.name} (+💰 ${sellPrice})`, 'success');
}

// ===== ЭКСПОРТ ФУНКЦИЙ =====
window.renderInventory = renderInventory;
window.sellItem = sellItem;
