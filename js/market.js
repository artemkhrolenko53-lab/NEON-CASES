// ==================== STORM CASES - РЫНОК ====================

// ===== ПЕРЕМЕННЫЕ ДЛЯ РЫНКА =====
let marketFilters = {
    search: '',
    rarity: 'all',
    sortBy: 'newest',
    showMyListings: false,
};

let pendingSellItemId = null;

// ===== ОТОБРАЖЕНИЕ РЫНКА =====
function renderMarket() {
    const container = document.getElementById('market-list');

    if (!container) {
        console.error('Контейнер рынка не найден');
        return;
    }

    // Очищаем контейнер
    container.innerHTML = '';

    // Создаём панель поиска и фильтров
    const filterPanel = createMarketFilterPanel();
    container.appendChild(filterPanel);

    // Получаем отфильтрованные предложения
    const listings = getFilteredListings();

    // Проверяем наличие предложений
    if (listings.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'text-center text-gray-400 py-8';
        emptyDiv.innerHTML = `
            <p class="text-5xl mb-3">📊</p>
            <p class="text-lg font-semibold">Рынок пуст</p>
            <p class="text-sm mt-2">Выставляйте предметы на продажу!</p>
        `;
        container.appendChild(emptyDiv);
        return;
    }

    // Статистика рынка
    const statsDiv = document.createElement('div');
    statsDiv.className = 'glass p-3 mb-2 text-center';
    statsDiv.innerHTML = `
        <p class="text-sm text-gray-400">
            Предложений: <span class="text-white font-bold">${listings.length}</span>
            ${getMarketStats(listings)}
        </p>
    `;
    container.appendChild(statsDiv);

    // Отображаем предложения
    listings.forEach((listing, index) => {
        const listingDiv = createMarketListingElement(listing, index);
        container.appendChild(listingDiv);
    });
}

// ===== СОЗДАНИЕ ПАНЕЛИ ФИЛЬТРОВ =====
function createMarketFilterPanel() {
    const panel = document.createElement('div');
    panel.className = 'glass p-3 mb-3 space-y-2';

    panel.innerHTML = `
        <!-- Поиск -->
        <input 
            type="text" 
            id="market-search" 
            placeholder="🔍 Поиск предметов..." 
            value="${marketFilters.search}"
            class="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-gray-500"
            oninput="updateMarketSearch(this.value)"
        >
        
        <!-- Фильтры -->
        <div class="flex gap-2">
            <!-- Фильтр по редкости -->
            <select 
                id="market-rarity-filter" 
                class="flex-1 bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                onchange="updateMarketRarity(this.value)"
            >
                <option value="all" class="bg-gray-800" ${marketFilters.rarity === 'all' ? 'selected' : ''}>Все редкости</option>
                <option value="common" class="bg-gray-800" ${marketFilters.rarity === 'common' ? 'selected' : ''}>Обычные</option>
                <option value="rare" class="bg-gray-800" ${marketFilters.rarity === 'rare' ? 'selected' : ''}>Редкие</option>
                <option value="epic" class="bg-gray-800" ${marketFilters.rarity === 'epic' ? 'selected' : ''}>Эпические</option>
                <option value="legendary" class="bg-gray-800" ${marketFilters.rarity === 'legendary' ? 'selected' : ''}>Легендарные</option>
            </select>
            
            <!-- Сортировка -->
            <select 
                id="market-sort" 
                class="flex-1 bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                onchange="updateMarketSort(this.value)"
            >
                <option value="newest" class="bg-gray-800" ${marketFilters.sortBy === 'newest' ? 'selected' : ''}>Новые</option>
                <option value="price_asc" class="bg-gray-800" ${marketFilters.sortBy === 'price_asc' ? 'selected' : ''}>Дешевле</option>
                <option value="price_desc" class="bg-gray-800" ${marketFilters.sortBy === 'price_desc' ? 'selected' : ''}>Дороже</option>
                <option value="rarity" class="bg-gray-800" ${marketFilters.sortBy === 'rarity' ? 'selected' : ''}>По редкости</option>
            </select>
        </div>
        
        <!-- Показать мои -->
        <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input 
                type="checkbox" 
                ${marketFilters.showMyListings ? 'checked' : ''}
                onchange="toggleMyListings(this.checked)"
                class="bg-white/10 border-white/20"
            >
            Только мои предложения
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

    // Фильтр по поиску
    if (marketFilters.search) {
        const searchTerm = marketFilters.search.toLowerCase();
        listings = listings.filter(listing =>
            listing.item.name.toLowerCase().includes(searchTerm) ||
            listing.item.type.toLowerCase().includes(searchTerm) ||
            listing.seller.toLowerCase().includes(searchTerm)
        );
    }

    // Фильтр по редкости
    if (marketFilters.rarity !== 'all') {
        listings = listings.filter(listing =>
            listing.item.rarity === marketFilters.rarity
        );
    }

    // Фильтр моих предложений
    if (marketFilters.showMyListings) {
        listings = listings.filter(listing =>
            listing.seller === state.userName || listing.seller === 'Вы'
        );
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
            const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
            listings.sort((a, b) => rarityOrder[a.item.rarity] - rarityOrder[b.item.rarity]);
            break;
        case 'newest':
        default:
            listings.sort((a, b) => (b.id || 0) - (a.id || 0));
            break;
    }

    return listings;
}

// ===== СОЗДАНИЕ ЭЛЕМЕНТА ПРЕДЛОЖЕНИЯ =====
function createMarketListingElement(listing, index) {
    const div = document.createElement('div');
    div.className = 'glass p-3 flex justify-between items-center hover:bg-white/5 transition';

    // Определяем цвет рамки по редкости
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
    const listings = getFilteredListings();
    const listing = listings[index];

    if (!listing) {
        showToast('Предложение не найдено', 'error');
        return;
    }

    // Проверяем баланс
    if (state.balance < listing.price) {
        showToast('Недостаточно монет для покупки', 'error');
        hapticFeedback('error');
        return;
    }

    // Подтверждение покупки
    if (!confirm(`Купить ${listing.item.name} за 💰 ${listing.price}?`)) {
        return;
    }

    // Списываем монеты
    spendBalance(listing.price);

    // Добавляем предмет в инвентарь
    addItemToInventory(listing.item);

    // Удаляем предложение с рынка
    const actualIndex = state.market.findIndex(l => l.id === listing.id);
    if (actualIndex !== -1) {
        state.market.splice(actualIndex, 1);
    }

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
    const listings = getFilteredListings();
    const listing = listings[index];

    if (!listing) {
        showToast('Предложение не найдено', 'error');
        return;
    }

    // Возвращаем предмет в инвентарь
    addItemToInventory(listing.item);

    // Удаляем с рынка
    const actualIndex = state.market.findIndex(l => l.id === listing.id);
    if (actualIndex !== -1) {
        state.market.splice(actualIndex, 1);
    }

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

    // Убираем предмет из инвентаря
    const removedItem = removeItemFromInventory(pendingSellItemId);
    if (!removedItem) {
        showToast('Предмет не найден в инвентаре', 'error');
        return;
    }

    // Добавляем на рынок
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

// ===== ПОЛУЧЕНИЕ СТАТИСТИКИ РЫНКА =====
function getMarketStats(listings) {
    if (listings.length === 0) return '';

    const avgPrice = Math.floor(
        listings.reduce((sum, l) => sum + l.price, 0) / listings.length
    );

    const cheapest = Math.min(...listings.map(l => l.price));
    const mostExpensive = Math.max(...listings.map(l => l.price));

    return `• Средняя цена: 💰 ${avgPrice} • Мин: 💰 ${cheapest} • Макс: 💰 ${mostExpensive}`;
}

// ===== ОЧИСТКА РЫНКА =====
function clearMarket() {
    if (state.market.length === 0) {
        showToast('Рынок уже пуст', 'error');
        return;
    }

    if (confirm('Удалить все предложения с рынка?')) {
        state.market = [];
        save();
        renderMarket();
        showToast('Рынок очищен', 'success');
    }
}

// ===== ЭКСПОРТ РЫНКА =====
function exportMarket() {
    const exportData = state.market.map(listing => ({
        item: listing.item,
        seller: listing.seller,
        price: listing.price,
        createdAt: listing.createdAt,
    }));

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'market_listings.json';
    a.click();

    URL.revokeObjectURL(url);
    showToast('Данные рынка экспортированы', 'success');
}