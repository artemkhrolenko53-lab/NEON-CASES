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
        console.error('❌ Контейнер рынка не найден');
        return;
    }

    container.innerHTML = '';

    // Шапка рынка
    const headerDiv = document.createElement('div');
    headerDiv.className = 'glass p-4 mb-4';
    headerDiv.innerHTML = `
        <div class="flex justify-between items-center">
            <div>
                <p class="text-sm text-gray-400">Активных предложений</p>
                <p class="text-2xl font-bold text-white">${state.market.length}</p>
            </div>
            <button onclick="refreshMarket()" class="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-500/30 transition">
                🔄 Обновить
            </button>
        </div>
    `;
    container.appendChild(headerDiv);

    // Панель поиска и фильтров
    const filterPanel = createFilterPanel();
    container.appendChild(filterPanel);

    // Контейнер для предложений
    const listingsContainer = document.createElement('div');
    listingsContainer.id = 'market-listings-container';
    container.appendChild(listingsContainer);

    // Отображаем предложения
    displayMarketListings(listingsContainer);
}

// ===== СОЗДАНИЕ ПАНЕЛИ ФИЛЬТРОВ =====
function createFilterPanel() {
    const panel = document.createElement('div');
    panel.className = 'glass p-4 mb-4 space-y-3';

    panel.innerHTML = `
        <div class="relative">
            <input 
                type="text" 
                id="market-search" 
                placeholder="🔍 Поиск предметов..." 
                value="${marketFilters.search}"
                class="w-full bg-white/10 border border-white/20 rounded-xl p-3 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                oninput="updateMarketSearch(this.value)"
            >
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
            </span>
        </div>
        
        <div class="flex gap-2">
            <select id="market-rarity" class="flex-1 bg-white/10 border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition" onchange="updateMarketRarity(this.value)">
                <option value="all" class="bg-gray-800" ${marketFilters.rarity === 'all' ? 'selected' : ''}>Все редкости</option>
                <option value="legendary" class="bg-gray-800" ${marketFilters.rarity === 'legendary' ? 'selected' : ''}>💛 Легендарные</option>
                <option value="epic" class="bg-gray-800" ${marketFilters.rarity === 'epic' ? 'selected' : ''}>💜 Эпические</option>
                <option value="rare" class="bg-gray-800" ${marketFilters.rarity === 'rare' ? 'selected' : ''}>💙 Редкие</option>
                <option value="common" class="bg-gray-800" ${marketFilters.rarity === 'common' ? 'selected' : ''}>🤍 Обычные</option>
            </select>
            
            <select id="market-sort" class="flex-1 bg-white/10 border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition" onchange="updateMarketSort(this.value)">
                <option value="newest" class="bg-gray-800" ${marketFilters.sortBy === 'newest' ? 'selected' : ''}>Новые</option>
                <option value="price_asc" class="bg-gray-800" ${marketFilters.sortBy === 'price_asc' ? 'selected' : ''}>Дешевле</option>
                <option value="price_desc" class="bg-gray-800" ${marketFilters.sortBy === 'price_desc' ? 'selected' : ''}>Дороже</option>
                <option value="rarity" class="bg-gray-800" ${marketFilters.sortBy === 'rarity' ? 'selected' : ''}>По редкости</option>
            </select>
        </div>
        
        <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" ${marketFilters.showMyListings ? 'checked' : ''} onchange="toggleMyListings(this.checked)" class="w-5 h-5 bg-white/10 rounded">
            <span class="text-sm text-gray-300">Только мои предложения</span>
        </label>
    `;

    return panel;
}

// ===== ОТОБРАЖЕНИЕ ПРЕДЛОЖЕНИЙ =====
function displayMarketListings(container) {
    const listings = getFilteredListings();

    if (listings.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">📊</div>
                <p class="text-xl font-bold text-gray-300">Ничего не найдено</p>
                <p class="text-sm text-gray-500 mt-2">Попробуйте изменить фильтры или поиск</p>
            </div>
        `;
        return;
    }

    listings.forEach((listing, index) => {
        const div = createMarketListingCard(listing, index);
        container.appendChild(div);
    });
}

// ===== СОЗДАНИЕ КАРТОЧКИ ПРЕДЛОЖЕНИЯ =====
function createMarketListingCard(listing, index) {
    const div = document.createElement('div');
    div.className = 'glass p-4 mb-3 relative overflow-hidden';

    // Стили по редкости
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

    const style = rarityStyles[listing.item.rarity] || rarityStyles.common;
    div.style.cssText = `
        border: ${style.border};
        ${style.glow};
        background: ${style.bg};
    `;

    const isOwn = listing.seller === state.userName || listing.seller === 'Вы';
    const rarityNames = {
        legendary: 'Легендарный',
        epic: 'Эпический',
        rare: 'Редкий',
        common: 'Обычный',
    };

    div.innerHTML = `
        <div class="flex items-center gap-4">
            <div class="relative">
                <span class="text-5xl">${listing.item.icon}</span>
            </div>
            
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <p class="font-bold ${style.textColor}">${listing.item.name}</p>
                    <span class="text-xs px-2 py-1 rounded-full ${style.badge}">
                        ${rarityNames[listing.item.rarity] || listing.item.rarity}
                    </span>
                </div>
                <p class="text-xs text-gray-400">${listing.item.type}</p>
                <div class="flex items-center gap-2 mt-1">
                    <p class="text-xs text-gray-500">${isOwn ? '👤 Вы' : `👤 ${listing.seller}`}</p>
                    <span class="text-xs text-gray-600">•</span>
                    <p class="text-xs text-gray-500">${formatDate(listing.createdAt)}</p>
                </div>
            </div>
        </div>
        
        <div class="flex items-center justify-between mt-3">
            <p class="text-2xl font-bold text-yellow-300">💰 ${listing.price}</p>
            <div class="flex gap-2">
                ${isOwn 
                    ? `<button onclick="removeFromMarket(${index})" class="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-500/30 transition">
                        Снять
                    </button>`
                    : `<button onclick="buyFromMarket(${index})" class="bg-green-500/20 text-green-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-500/30 transition">
                        Купить
                    </button>`
                }
            </div>
        </div>
    `;

    return div;
}

// ===== ФОРМАТИРОВАНИЕ ДАТЫ =====
function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин. назад`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч. назад`;
    return `${Math.floor(diff / 86400000)} дн. назад`;
}

// ===== ОБНОВЛЕНИЕ ФИЛЬТРОВ =====
function updateMarketSearch(value) {
    marketFilters.search = value;
    const container = document.getElementById('market-listings-container');
    if (container) {
        displayMarketListings(container);
    }
}

function updateMarketRarity(value) {
    marketFilters.rarity = value;
    const container = document.getElementById('market-listings-container');
    if (container) {
        displayMarketListings(container);
    }
}

function updateMarketSort(value) {
    marketFilters.sortBy = value;
    const container = document.getElementById('market-listings-container');
    if (container) {
        displayMarketListings(container);
    }
}

function toggleMyListings(value) {
    marketFilters.showMyListings = value;
    const container = document.getElementById('market-listings-container');
    if (container) {
        displayMarketListings(container);
    }
}

function refreshMarket() {
    renderMarket();
    showToast('🔄 Рынок обновлен', 'success');
    hapticFeedback('light');
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

// ===== ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ВЫСТАВЛЕНИЯ =====
function openSellModal(itemId) {
    console.log('📊 openSellModal вызван с ID:', itemId);

    // Ищем предмет в инвентаре
    const item = state.inventory.find(i =>
        (i.id === itemId) || (i.item_id === itemId)
    );

    if (!item) {
        showToast('Предмет не найден в инвентаре', 'error');
        return;
    }

    pendingSellItemId = itemId;

    const modal = document.getElementById('sell-modal');
    const nameElement = document.getElementById('sell-item-name');
    const priceInput = document.getElementById('sell-price-input');

    if (!modal || !nameElement || !priceInput) {
        console.error('❌ Элементы модального окна не найдены!');
        showToast('Ошибка интерфейса', 'error');
        return;
    }

    nameElement.textContent = `${item.icon} ${item.name}`;
    priceInput.value = item.price;

    modal.classList.remove('hidden');
    hapticFeedback('light');

    console.log('✅ Модальное окно открыто');
}

// ===== ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА =====
function closeSellModal() {
    const modal = document.getElementById('sell-modal');
    if (modal) modal.classList.add('hidden');
    pendingSellItemId = null;
}

// ===== ПОДТВЕРЖДЕНИЕ ВЫСТАВЛЕНИЯ =====
function confirmSell() {
    console.log('✅ confirmSell вызван, pendingSellItemId:', pendingSellItemId);

    if (!pendingSellItemId) {
        showToast('Предмет не выбран', 'error');
        return;
    }

    const priceInput = document.getElementById('sell-price-input');
    if (!priceInput) {
        console.error('❌ Элемент sell-price-input не найден');
        showToast('Ошибка интерфейса', 'error');
        return;
    }

    const price = parseInt(priceInput.value);

    if (!price || price < CONFIG.minSellPrice) {
        showToast(`Введите цену от ${CONFIG.minSellPrice}`, 'error');
        return;
    }

    if (price > CONFIG.maxSellPrice) {
        showToast(`Максимальная цена: ${CONFIG.maxSellPrice}`, 'error');
        return;
    }

    // Ищем предмет по id или item_id
    const index = state.inventory.findIndex(i =>
        (i.id === pendingSellItemId) || (i.item_id === pendingSellItemId)
    );

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
    playSound('sell');
}

// ===== ПОКУПКА =====
function buyFromMarket(index) {
    const listings = getFilteredListings();
    const listing = listings[index];

    if (!listing) return;

    if (state.balance < listing.price) {
        showToast('Недостаточно монет', 'error');
        hapticFeedback('error');
        return;
    }

    // Модальное окно подтверждения
    const confirmHTML = `
        <div class="text-center space-y-4">
            <div class="text-6xl">${listing.item.icon}</div>
            <h3 class="font-bold text-xl">Купить ${listing.item.name}?</h3>
            <p class="text-gray-400">Продавец: ${listing.seller}</p>
            <p class="text-3xl font-bold text-yellow-300">💰 ${listing.price}</p>
            <div class="flex gap-2">
                <button onclick="confirmBuy(${index})" class="flex-1 bg-green-500/20 text-green-300 py-3 rounded-lg font-bold hover:bg-green-500/30 transition">
                    Да, купить
                </button>
                <button onclick="closeModal()" class="flex-1 bg-gray-500/20 text-gray-300 py-3 rounded-lg font-bold hover:bg-gray-500/30 transition">
                    Отмена
                </button>
            </div>
        </div>
    `;

    showModal(confirmHTML);
}

// ===== ПОДТВЕРЖДЕНИЕ ПОКУПКИ =====
function confirmBuy(index) {
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
    closeModal();
    renderMarket();
    renderInventory();

    showToast(`✅ Куплено: ${listing.item.name}`, 'success');
    hapticFeedback('success');
}

// ===== СНЯТИЕ С РЫНКА =====
function removeFromMarket(index) {
    const listings = getFilteredListings();
    const listing = listings[index];

    if (!listing) return;

    const confirmHTML = `
        <div class="text-center space-y-4">
            <div class="text-6xl">${listing.item.icon}</div>
            <h3 class="font-bold text-xl">Снять с продажи?</h3>
            <p class="text-gray-400">${listing.item.name}</p>
            <div class="flex gap-2">
                <button onclick="confirmRemove(${index})" class="flex-1 bg-red-500/20 text-red-300 py-3 rounded-lg font-bold hover:bg-red-500/30 transition">
                    Да, снять
                </button>
                <button onclick="closeModal()" class="flex-1 bg-gray-500/20 text-gray-300 py-3 rounded-lg font-bold hover:bg-gray-500/30 transition">
                    Отмена
                </button>
            </div>
        </div>
    `;

    showModal(confirmHTML);
}

// ===== ПОДТВЕРЖДЕНИЕ СНЯТИЯ =====
function confirmRemove(index) {
    const listings = getFilteredListings();
    const listing = listings[index];

    if (!listing) return;

    state.inventory.push({ ...listing.item, qty: 1 });

    const actualIndex = state.market.findIndex(l => l.id === listing.id);
    if (actualIndex !== -1) {
        state.market.splice(actualIndex, 1);
    }

    save();
    closeModal();
    renderMarket();
    renderInventory();

    showToast('✅ Снято с продажи', 'success');
    hapticFeedback('light');
}

// Экспорт функций
window.renderMarket = renderMarket;
window.updateMarketSearch = updateMarketSearch;
window.updateMarketRarity = updateMarketRarity;
window.updateMarketSort = updateMarketSort;
window.toggleMyListings = toggleMyListings;
window.refreshMarket = refreshMarket;
window.openSellModal = openSellModal;
window.closeSellModal = closeSellModal;
window.confirmSell = confirmSell;
window.buyFromMarket = buyFromMarket;
window.confirmBuy = confirmBuy;
window.removeFromMarket = removeFromMarket;
window.confirmRemove = confirmRemove;