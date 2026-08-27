// ==================== STORM CASES - РЫНОК ====================

let pendingSellItemId = null;

function renderMarket() {
    const container = document.getElementById('market-list');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!state.market || state.market.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <p class="text-5xl mb-3">📊</p>
                <p class="text-lg font-semibold">Рынок пуст</p>
                <p class="text-sm mt-2">Выставляйте предметы на продажу!</p>
            </div>
        `;
        return;
    }
    
    state.market.forEach((listing, index) => {
        const div = document.createElement('div');
        div.className = 'glass p-3 mb-2 flex items-center justify-between';
        
        const isOwn = listing.seller === state.userName || listing.seller === 'Вы';
        
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-3xl">${listing.item.icon}</span>
                <div>
                    <p class="font-bold">${listing.item.name}</p>
                    <p class="text-xs text-gray-400">${listing.seller} • 💰 ${listing.price}</p>
                </div>
            </div>
            ${isOwn 
                ? `<button onclick="removeFromMarket(${index})" class="bg-red-500/20 text-red-300 px-3 py-2 rounded-lg text-sm font-bold">Снять</button>`
                : `<button onclick="buyFromMarket(${index})" class="bg-green-500/20 text-green-300 px-3 py-2 rounded-lg text-sm font-bold">Купить</button>`
            }
        `;
        
        container.appendChild(div);
    });
}

function openSellModal(itemId) {
    pendingSellItemId = itemId;
    
    const item = getItemById(itemId);
    if (!item) {
        showToast('Предмет не найден', 'error');
        return;
    }
    
    document.getElementById('sell-item-name').textContent = `${item.icon} ${item.name}`;
    document.getElementById('sell-price-input').value = item.price;
    document.getElementById('sell-modal').classList.remove('hidden');
}

function closeSellModal() {
    document.getElementById('sell-modal').classList.add('hidden');
    pendingSellItemId = null;
}

function confirmSell() {
    if (!pendingSellItemId) {
        showToast('Предмет не выбран', 'error');
        return;
    }
    
    const price = parseInt(document.getElementById('sell-price-input').value);
    
    if (!price || price < 1) {
        showToast('Введите корректную цену', 'error');
        return;
    }
    
    const index = state.inventory.findIndex(i => i.id === pendingSellItemId);
    
    if (index === -1) {
        showToast('Предмет не найден в инвентаре', 'error');
        closeSellModal();
        return;
    }
    
    const item = state.inventory[index];
    
    // Убираем из инвентаря
    state.inventory.splice(index, 1);
    
    // Добавляем на рынок
    state.market.push({
        id: Date.now(),
        item: { ...item, qty: 1 },
        seller: state.userName || 'Вы',
        price: price,
    });
    
    save();
    closeSellModal();
    renderMarket();
    renderInventory();
    
    showToast(`✅ Выставлено за 💰 ${price}`, 'success');
}

function buyFromMarket(index) {
    const listing = state.market[index];
    
    if (!listing) return;
    
    if (state.balance < listing.price) {
        showToast('Недостаточно монет', 'error');
        return;
    }
    
    state.balance -= listing.price;
    state.inventory.push({ ...listing.item, qty: 1 });
    state.market.splice(index, 1);
    
    updateBalance();
    save();
    renderMarket();
    renderInventory();
    
    showToast(`✅ Куплено: ${listing.item.name}`, 'success');
}

function removeFromMarket(index) {
    const listing = state.market[index];
    
    if (!listing) return;
    
    state.inventory.push({ ...listing.item, qty: 1 });
    state.market.splice(index, 1);
    
    save();
    renderMarket();
    renderInventory();
    
    showToast('✅ Снято с продажи', 'success');
}

// Экспорт
window.renderMarket = renderMarket;
window.openSellModal = openSellModal;
window.closeSellModal = closeSellModal;
window.confirmSell = confirmSell;
window.buyFromMarket = buyFromMarket;
window.removeFromMarket = removeFromMarket;
