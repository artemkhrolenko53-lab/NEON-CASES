// ==================== STORM CASES - РЫНОК ====================

// ===== ОТОБРАЖЕНИЕ РЫНКА =====
function renderMarket() {
    const container = document.getElementById('market-list');
    
    if (!container) {
        console.error('Контейнер рынка не найден');
        return;
    }
    
    container.innerHTML = '';
    
    if (state.market.length === 0) {
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
        const listingDiv = createMarketListingElement(listing, index);
        container.appendChild(listingDiv);
    });
}

// ===== СОЗДАНИЕ ЭЛЕМЕНТА ПРЕДЛОЖЕНИЯ =====
function createMarketListingElement(listing, index) {
    const div = document.createElement('div');
    div.className = 'glass p-3 flex justify-between items-center hover:bg-white/5 transition';
    
    const rarityBorder = {
        common: 'border-l-2 border-l-white/30',
        rare: 'border-l-2 border-l-blue-400/50',
        epic: 'border-l-2 border-l-purple-400/50',
        legendary: 'border-l-2 border-l-yellow-400/70',
    };
    div.classList.add(rarityBorder[listing.item.rarity] || '');
    
    const isOwnListing = listing.seller === state.userName || listing.seller === 'Вы';
    
    let actionButton = '';
    if (isOwnListing) {
        actionButton = `
            <button onclick="removeFromMarket(${index})" 
                class="bg-red-500/20 text-red-300 px-3 py-2 rounded-lg text-sm hover:bg-red-500/30 transition whitespace-nowrap">
                Снять
            </button>
        `;
    } else {
        actionButton = `
            <button onclick="buyFromMarket(${index})" 
                class="bg-green-500/20 text-green-300 px-3 py-2 rounded-lg text-sm hover:bg-green-500/30 transition whitespace-nowrap">
                Купить
            </button>
        `;
    }
    
    div.innerHTML = `
        <div class="flex items-center gap-3 flex-1">
            <span class="text-3xl">${listing.item.icon}</span>
            <div class="flex-1">
                <p class="rarity-${listing.item.rarity} font-semibold">${listing.item.name}</p>
                <p class="text-xs text-gray-400">${listing.item.type}</p>
                <p class="text-xs text-gray-500">
                    Продавец: ${isOwnListing ? 'Вы' : listing.seller}
                </p>
            </div>
        </div>
        <div class="flex items-center gap-2 ml-2">
            <span class="font-bold text-yellow-300">💰 ${listing.price}</span>
            ${actionButton}
        </div>
    `;
    
    return div;
}

// ===== ПОКУПКА С РЫНКА =====
function buyFromMarket(index) {
    const listing = state.market[index];
    
    if (!listing) {
        showToast('Предложение не найдено', 'error');
        return;
    }
    
    if (state.balance < listing.price) {
        showToast('Недостаточно монет для покупки', 'error');
        hapticFeedback('error');
        return;
    }
    
    if (!confirm(`Купить ${listing.item.name} за 💰 ${listing.price}?`)) {
        return;
    }
    
    spendBalance(listing.price);
    addItemToInventory(listing.item);
    
    state.market.splice(index, 1);
    save();
    
    renderMarket();
    
    if (!document.getElementById('tab-inventory').classList.contains('hidden')) {
        renderInventory();
    }
    
    showToast(`Куплено: ${listing.item.name}`, 'success');
    hapticFeedback('success');
    playSound('buy');
}

// ===== СНЯТИЕ С РЫНКА =====
function removeFromMarket(index) {
    const listing = state.market[index];
    
    if (!listing) {
        showToast('Предложение не найдено', 'error');
        return;
    }
    
    addItemToInventory(listing.item);
    state.market.splice(index, 1);
    save();
    
    renderMarket();
    renderInventory();
    
    showToast('Предмет снят с продажи', 'success');
    hapticFeedback('light');
}

// ===== ВЫСТАВЛЕНИЕ НА РЫНОК =====
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
    
    const priceInput = document.getElementById('sell-price-input');
    const price = parseInt(priceInput.value);
    
    if (!price || price < 1) {
        showToast('Введите корректную цену', 'error');
        return;
    }
    
    if (price > 1000000) {
        showToast('Слишком высокая цена', 'error');
        return;
    }
    
    const item = getItemById(pendingSellItemId);
    if (!item) {
        showToast('Предмет не найден', 'error');
        return;
    }
    
    const removedItem = removeItemFromInventory(pendingSellItemId);
    if (!removedItem) {
        showToast('Предмет не найден в инвентаре', 'error');
        return;
    }
    
    const listing = {
        id: Date.now(),
        item: { ...item, qty: 1 },
        seller: state.userName || 'Вы',
        price: price,
        createdAt: new Date().toISOString(),
    };
    
    state.market.push(listing);
    save();
    
    closeSellModal();
    renderMarket();
    renderInventory();
    
    showToast(`Предмет выставлен за 💰 ${price}`, 'success');
    hapticFeedback('success');
}
