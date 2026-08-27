// ==================== STORM CASES - РЫНОК ====================

let pendingSellItemId = null;
let marketFilters = {
    search: '',
    rarity: 'all',
    sortBy: 'newest',
    showMyListings: false,
};

// ===== ОТОБРАЖЕНИЕ РЫНКА =====
function renderMarket() {
    const container = document.getElementById('market-list');
    
    if (!container) {
        console.error('Контейнер рынка не найден');
        return;
    }
    
    container.innerHTML = '';
    
    // Панель поиска и фильтров
    const filterPanel = createFilterPanel();
    container.appendChild(filterPanel);
    
    // Получаем отфильтрованные предложения
    const listings = getFilteredListings();
    
    if (listings.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'text-center text-gray-400 py-8';
        emptyDiv.innerHTML = `
            <p class="text-5xl mb-3">📊</p>
            <p class="text-lg font-semibold">Ничего не найдено</p>
            <p class="text-sm mt-2">Попробуйте изменить фильтры</p>
        `;
        container.appendChild(emptyDiv);
        return;
    }
    
    // Статистика
    const statsDiv = document.createElement('div');
    statsDiv.className = 'glass p-3 mb-3 text-center';
    statsDiv.innerHTML = `
        <p class="text-sm text-gray-400">
            Предложений: <span class="text-white font-bold">${listings.length}</span>
        </p>
    `;
    container.appendChild(statsDiv);
    
    // Отображаем предложения
    listings.forEach((listing, index) => {
        const div = createMarketItem(listing, index);
        container.appendChild(div);
    });
}

// ===== СОЗДАНИЕ ПАНЕЛИ ФИЛЬТРОВ =====
function createFilterPanel() {
    const panel = document.createElement('div');
    panel.className = 'glass p-3 mb-3 space-y-2';
    
    panel.innerHTML = `
        <input 
            type="text" 
            id="market-search" 
            placeholder="🔍 Поиск предметов..." 
            value="${marketFilters.search}"
            class="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-gray-500"
            oninput="updateMarketSearch(this.value)"
        >
        
        <div class="flex gap-2">
            <select id="market-rarity" class="flex-1 bg-white/10 border border-white/20 rounded-lg p-2 text-white" onchange="updateMarketRarity(this.value)">
                <option value="all" class="bg-gray-800" ${marketFilters.rarity === 'all' ? 'selected' : ''}>Все редкости</option>
                <option value="common" class="bg-gray-800" ${marketFilters.rarity === 'common' ? 'selected' : ''}>Обычные</option>
                <option value="rare" class="bg-gray-800" ${marketFilters.rarity === 'rare' ? 'selected' : ''}>Редкие</option>
                <option value="epic" class="bg-gray-800" ${marketFilters.rarity === 'epic' ? 'selected' : ''}>Эпические</option>
                <option value="legendary" class="bg-gray-800" ${marketFilters.rarity === 'legendary' ? 'selected' : ''}>Легендарные</option>
            </select>
            
            <select id="market-sort" class="flex-1 bg-white/10 border border-white/20 rounded-lg p-2 text-white" onchange="updateMarketSort(this.value)">
                <option value="newest" class="bg-gray-800" ${marketFilters.sortBy === 'newest' ? 'selected' : ''}>Новые</option>
                <option value="price_asc" class="bg-gray-800" ${marketFilters.sortBy === 'price_asc' ? 'selected' : ''}>Дешевле</option>
                <option value="price_desc" class="bg-gray-800" ${marketFilters.sortBy === 'price_desc' ? 'selected' : ''}>Дороже</option>
                <option value="rarity" class="bg-gray-800" ${marketFilters.sortBy === 'rarity' ? 'selected' : ''}>По редкости</option>
            </select>
        </div>
        
        <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" ${marketFilters.showMyListings ? 'checked' : ''} onchange="toggleMyListings(this.checked)" class="bg-white/10">
            <span>Только мои предложения</span>
        </label>
    `;
    
    return panel;
}

// ===== ОБНОВЛЕНИЕ ФИЛЬТРОВ =====
function updateMarketSearch(value) {
    marketFilters.search = value;
    renderMarket();
}

function updateMarketRarity(value) {
    marketFilters.rarity = value;
    renderMarket();
}

function updateMarketSort(value) {
    marketFilters.sortBy = value;
    renderMarket();
}

function toggleMyListings(value) {
    marketFilters.showMyListings = value;
    renderMarket();
}

// ===== ПОЛУЧЕНИЕ ОТФИЛЬТРОВАННЫХ ПРЕДЛОЖЕНИЙ =====
function getFilteredListings() {
    let listings = [...state.market];
    
    // Поиск
    if (marketFilters.search) {
        const search = marketFilters.search.toLowerCase();
        listings = listings.filter(l => 
            l.item.name.toLowerCase().includes(search) ||
            l.item.type.toLowerCase().includes(search) ||
            l.seller.toLowerCase().includes(search)
        );
    }
    
    // Редкость
    if (marketFilters.rarity !== 'all') {
        listings = listings.filter(l => l.item.rarity === marketFilters.rarity);
    }
    
    // Мои предложения
    if (marketFilters.showMyListings) {
        listings = listings.filter(l => l.seller === state.userName || l.seller === 'Вы');
    }
    
    // Сортировка
    switch(marketFilters.sortBy) {
        case 'price_asc':
            listings.sort((a, b) => a.price - b.price);
            break;
        case 'price_desc':
            listings.sort((a, b) => b.price - a.price);
            break;
        case 'rarity':
            const order = { legendary: 0, epic: 1, rare: 2, common: 3 };
            listings.sort((a, b) => order[a.item.rarity] - order[b.item.rarity]);
            break;
        default:
            listings.sort((a, b) => (b.id || 0) - (a.id || 0));
    }
    
    return listings;
}

// ===== СОЗДАНИЕ ЭЛЕМЕНТА РЫНКА =====
function createMarketItem(listing, index) {
    const div = document.createElement('div');
    div.className = 'glass p-3 mb-2 flex items-center justify-between';
    
    const borderColors = {
        common: 'rgba(255,255,255,0.4)',
        rare: '#4a9eff',
        epic: '#a855f7',
        legendary: '#ffd700',
    };
    div.style.borderLeft = `4px solid ${borderColors[listing.item.rarity] || '#fff'}`;
    
    const isOwn = listing.seller === state.userName || listing.seller === 'Вы';
    
    div.innerHTML = `
        <div class="flex items-center gap-3 flex-1">
            <span class="text-3xl">${listing.item.icon}</span>
            <div>
                <p class="font-bold">${listing.item.name}</p>
                <p class="text-xs text-gray-400">${listing.item.type}</p>
                <p class="text-xs text-gray-500">${isOwn ? 'Вы' : listing.seller} • 💰 ${listing.price}</p>
            </div>
        </div>
        <div class="flex gap-2">
            <span class="font-bold text-yellow-300">💰 ${listing.price}</span>
            ${isOwn 
                ? `<button onclick="removeFromMarket(${index})" class="bg-red-500/20 text-red-300 px-3 py-2 rounded-lg text-sm font-bold">Снять</button>`
                : `<button onclick="buyFromMarket(${index})" class="bg-green-500/20 text-green-300 px-3 py-2 rounded-lg text-sm font-bold">Купить</button>`
            }
        </div>
    `;
    
    return div;
}

// ===== ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ВЫСТАВЛЕНИЯ =====
function openSellModal(itemId) {
    console.log('openSellModal вызван с ID:', itemId);
    
    const item = getItemById(itemId);
    
    if (!item) {
        showToast('Предмет не найден', 'error');
        return;
    }
    
    pendingSellItemId = itemId;
    
    const modal = document.getElementById('sell-modal');
    const nameElement = document.getElementById('sell-item-name');
    const priceInput = document.getElementById('sell-price-input');
    
    if (!modal || !nameElement || !priceInput) {
        console.error('Элементы модального окна не найдены!');
        showToast('Ошибка интерфейса', 'error');
        return;
    }
    
    nameElement.textContent = `${item.icon} ${item.name}`;
    priceInput.value = item.price;
    
    modal.classList.remove('hidden');
    
    console.log('Модальное окно открыто');
}

// ===== ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА =====
function closeSellModal() {
    const modal = document.getElementById('sell-modal');
    if (modal) modal.classList.add('hidden');
    pendingSellItemId = null;
}

// ===== ПОДТВЕРЖДЕНИЕ ВЫСТАВЛЕНИЯ =====
function confirmSell() {
    console.log('confirmSell вызван, pendingSellItemId:', pendingSellItemId);
    
    if (!pendingSellItemId) {
        showToast('Предмет не выбран', 'error');
        return;
    }
    
    const priceInput = document.getElementById('sell-price-input');
    const price = parseInt(priceInput?.value);
    
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
        createdAt: new Date().toISOString(),
    });
    
    save();
    closeSellModal();
    renderMarket();
    renderInventory();
    
    showToast(`✅ Выставлено за 💰 ${price}`, 'success');
    hapticFeedback('success');
}

// ===== ПОКУПКА =====
function buyFromMarket(index) {
    const listings = getFilteredListings();
    const listing = listings[index];
    
    if (!listing) return;
    
    if (state.balance < listing.price) {
        showToast('Недостаточно монет', 'error');
        return;
    }
    
    state.balance -= listing.price;
    state.inventory.push({ ...listing.item, qty: 1 });
    
    // Удаляем из market
    const actualIndex = state.market.findIndex(l => l.id === listing.id);
    if (actualIndex !== -1) {
        state.market.splice(actualIndex, 1);
    }
    
    updateBalance();
    save();
    renderMarket();
    renderInventory();
    
    showToast(`✅ Куплено: ${listing.item.name}`, 'success');
}

// ===== СНЯТИЕ С РЫНКА =====
function removeFromMarket(index) {
    const listings = getFilteredListings();
    const listing = listings[index];
    
    if (!listing) return;
    
    state.inventory.push({ ...listing.item, qty: 1 });
    
    const actualIndex = state.market.findIndex(l => l.id === listing.id);
    if (actualIndex !== -1) {
        state.market.splice(actualIndex, 1);
    }
    
    save();
    renderMarket();
    renderInventory();
    
    showToast('✅ Снято с продажи', 'success');
}

// ===== ЭКСПОРТ =====
window.renderMarket = renderMarket;
window.openSellModal = openSellModal;
window.closeSellModal = closeSellModal;
window.confirmSell = confirmSell;
window.buyFromMarket = buyFromMarket;
window.removeFromMarket = removeFromMarket;
window.updateMarketSearch = updateMarketSearch;
window.updateMarketRarity = updateMarketRarity;
window.updateMarketSort = updateMarketSort;
window.toggleMyListings = toggleMyListings;
