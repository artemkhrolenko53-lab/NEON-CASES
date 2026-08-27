// ==================== ДАННЫЕ И УТИЛИТЫ ====================
const STORAGE_KEY = 'storm_data';
const OWNER_TG_ID = 8601398572;

const RARITIES = {
    common: { name: 'Обычный', color: '#9e9e9e', label: 'common' },
    rare: { name: 'Редкий', color: '#42a5f5', label: 'rare' },
    epic: { name: 'Эпический', color: '#ab47bc', label: 'epic' },
    legendary: { name: 'Легендарный', color: '#ff9800', label: 'legendary' },
    mythic: { name: 'Мифический', color: '#f44336', label: 'mythic' }
};

const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary', 'mythic'];

const ITEMS_DB = {
    common: ['Песчаный вихрь', 'Лесной шёпот', 'Городские джунгли', 'Арктический патруль', 'Пустынный странник', 'Теневой клинок', 'Медный закат', 'Стальной рассвет', 'Серый кардинал', 'Ночной дозор', 'Болотный туман', 'Каменный век', 'Ледяной шторм', 'Пыльная буря', 'Тёмный лес', 'Гравий', 'Пепел', 'Глина', 'Уголь', 'Бетон'],
    rare: ['Неоновый каскад', 'Кибер-волна', 'Лавовый поток', 'Океанская глубина', 'Северное сияние', 'Электрик', 'Сапфировый', 'Аквамарин', 'Лазурный берег', 'Кобальт', 'Ультрамарин', 'Индиго', 'Голубой лёд', 'Морская пена', 'Волна'],
    epic: ['Драконье пламя', 'Феникс', 'Титановый', 'Королевский', 'Аметистовый', 'Тёмная материя', 'Звёздная пыль', 'Галактика', 'Квантовый', 'Небесный'],
    legendary: ['Коготь дракона', 'Клинок судьбы', 'Печать древних', 'Корона королей', 'Сердце вулкана', 'Глаз бури', 'Клык тигра', 'Молот богов'],
    mythic: ['Экскалибур', 'Рагнарёк', 'Вечность', 'Абсолют', 'Бесконечность']
};

const KNIVES = {
    legendary: ['Нож «Дракон»', 'Нож «Феникс»', 'Нож «Титан»', 'Нож «Волк»'],
    mythic: ['Нож «Экскалибур»', 'Нож «Рагнарёк»']
};

const CASES = [
    { id: 'common', name: 'Обычный кейс', icon: '📦', price: 80, chances: { common: 75, rare: 20, epic: 4.5, legendary: 0.5, mythic: 0 } },
    { id: 'rare', name: 'Редкий кейс', icon: '📘', price: 280, chances: { common: 0, rare: 65, epic: 25, legendary: 8, mythic: 2 } },
    { id: 'legendary', name: 'Легендарный кейс', icon: '📗', price: 650, chances: { common: 0, rare: 15, epic: 50, legendary: 35, mythic: 0 } },
    { id: 'knife', name: 'Ножевой кейс', icon: '🔪', price: 1000, chances: { common: 0, rare: 0, epic: 25, legendary: 70, mythic: 5 } },
    { id: 'premium', name: 'Премиум кейс', icon: '💎', price: 1500, chances: { common: 0, rare: 5, epic: 35, legendary: 50, mythic: 10 } },
    { id: 'mythic', name: 'Мифический кейс', icon: '🌟', price: 3000, chances: { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 100 } }
];

const CRAFT_RECIPES = [
    { id: 'craft_common', name: 'Улучшение до Rare', icon: '⚒️', result: 'rare', requirements: { common: 5 }, description: '5x Обычных предметов → 1 Редкий' },
    { id: 'craft_legendary', name: 'Улучшение до Legendary', icon: '🔥', result: 'legendary', requirements: { rare: 3, epic: 2 }, description: '3x Редких + 2x Эпических → 1 Легендарный' },
    { id: 'craft_mythic', name: 'Улучшение до Mythic', icon: '⚡', result: 'mythic', requirements: { legendary: 3, epic: 1 }, description: '3x Легендарных + 1x Эпический → 1 Мифический' }
];

// ==================== УТИЛИТЫ ====================
function getDefaultData() {
    return {
        users: {},
        servers: {},
        currentUser: null,
        currentServer: null,
        currentSession: null
    };
}

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) { console.error(e); }
    return getDefaultData();
}

function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { console.error(e); }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

function getServerData(data, serverName) {
    if (!data.servers[serverName]) {
        data.servers[serverName] = {
            market: [],
            chat: [],
            tickets: [],
            logs: [],
            admins: {},
            economy: { startBalance: 1000, sellMultiplier: 0.5 },
            online: Math.floor(Math.random() * 100) + 1,
            status: 'online'
        };
    }
    return data.servers[serverName];
}

function getUserServerData(data, nickname, serverName) {
    if (!data.users[nickname]) return null;
    if (!data.users[nickname].servers[serverName]) {
        data.users[nickname].servers[serverName] = {
            balance: data.servers[serverName]?.economy?.startBalance || 1000,
            inventory: [],
            stats: { casesOpened: 0, itemsReceived: 0, spent: 0, earned: 0 },
            warnings: [],
            muted: false,
            banned: false
        };
    }
    return data.users[nickname].servers[serverName];
}

function getRandomItemFromCase(caseDef) {
    const chances = caseDef.chances;
    const total = Object.values(chances).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (const [rarity, chance] of Object.entries(chances)) {
        if (chance <= 0) continue;
        roll -= chance;
        if (roll <= 0) {
            return generateItem(rarity, caseDef.id === 'knife' || caseDef.id === 'premium');
        }
    }
    return generateItem('common', false);
}

function generateItem(rarity, isKnifeCase = false) {
    let names = [...ITEMS_DB[rarity] || []];
    if (isKnifeCase && (rarity === 'legendary' || rarity === 'mythic')) {
        names = [...(KNIVES[rarity] || []), ...names];
    }
    const name = names[Math.floor(Math.random() * names.length)] || 'Предмет';
    return { id: generateId(), name, rarity, icon: getRarityIcon(rarity) };
}

function getRarityIcon(rarity) {
    const icons = { common: '⬜', rare: '🔷', epic: '🟣', legendary: '🟠', mythic: '🔴' };
    return icons[rarity] || '📦';
}

function getRarityColor(rarity) {
    return RARITIES[rarity]?.color || '#888';
}

function getRarityBadgeHtml(rarity) {
    return `<span class="badge badge-${rarity}">${RARITIES[rarity]?.name || rarity}</span>`;
}

function getTelegramUserId() {
    try {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
            return window.Telegram.WebApp.initDataUnsafe.user.id;
        }
    } catch (e) {}
    return null;
}

function sendToBot(data) {
    try {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.sendData) {
            window.Telegram.WebApp.sendData(JSON.stringify(data));
            console.log('Sent to bot:', data);
        }
    } catch (e) { console.log('sendData error:', e); }
}

function isOwner() {
    const tgId = getTelegramUserId();
    return tgId !== null && tgId === OWNER_TG_ID;
}

// ==================== УПРАВЛЕНИЕ ЭКРАНАМИ ====================
let currentData = loadData();
let currentTab = 'cases';
let inventoryFilter = 'all';
let inventorySearch = '';
let chatTab = 'general';
let selectedChatUser = null;
let currentAdminLevel = 0;
let adminTab = 'players';

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.tab === tab));
    renderMainContent();
    if (tab === 'chat') renderChat();
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('modal-content').innerHTML = '';
}

function openModal(html) {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').style.display = 'flex';
}

function closeModalOnOverlay(e) {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
}

// ==================== АВТОРИЗАЦИЯ ====================
function authRegister() {
    const nick = document.getElementById('auth-nick').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();
    const errEl = document.getElementById('auth-error');
    if (!nick || !pass) { errEl.textContent = 'Введите ник и пароль'; return; }
    if (nick.length < 3) { errEl.textContent = 'Ник должен быть не короче 3 символов'; return; }
    if (currentData.users[nick]) { errEl.textContent = 'Такой аккаунт уже существует'; return; }
    const tgId = getTelegramUserId();
    currentData.users[nick] = {
        password: pass,
        telegramId: tgId,
        servers: {},
        settings: { sound: true, notifications: true },
        createdAt: Date.now()
    };
    currentData.currentUser = nick;
    saveData(currentData);
    errEl.textContent = '';
    document.getElementById('auth-nick').value = '';
    document.getElementById('auth-pass').value = '';
    showServerSelection();
}

function authLogin() {
    const nick = document.getElementById('auth-nick').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();
    const errEl = document.getElementById('auth-error');
    if (!nick || !pass) { errEl.textContent = 'Введите ник и пароль'; return; }
    const user = currentData.users[nick];
    if (!user || user.password !== pass) { errEl.textContent = 'Неверный ник или пароль'; return; }
    currentData.currentUser = nick;
    saveData(currentData);
    errEl.textContent = '';
    document.getElementById('auth-nick').value = '';
    document.getElementById('auth-pass').value = '';
    showServerSelection();
}

function logoutAccount() {
    currentData.currentUser = null;
    currentData.currentServer = null;
    currentData.currentSession = null;
    saveData(currentData);
    showScreen('screen-auth');
    document.getElementById('navbar').style.display = 'none';
}

// ==================== ВЫБОР СЕРВЕРА ====================
const SERVER_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];

function showServerSelection() {
    showScreen('screen-servers');
    document.getElementById('navbar').style.display = 'none';
    renderServerList();
}

function renderServerList() {
    const container = document.getElementById('server-list');
    container.innerHTML = '';
    SERVER_NAMES.forEach(name => {
        const srv = getServerData(currentData, name);
        const online = Math.floor(Math.random() * 100) + 1;
        srv.online = online;
        container.innerHTML += `
            <div class="server-card" onclick="selectServer('${name}')">
                <div class="server-info">
                    <span class="server-name">${name}</span>
                    <span class="server-online"><span class="online-dot"></span> Онлайн: ${online}/100</span>
                </div>
                <span style="font-size:20px;">→</span>
            </div>`;
    });
    saveData(currentData);
}

function selectServer(serverName) {
    currentData.currentServer = serverName;
    currentData.currentSession = { server: serverName, joinedAt: Date.now() };
    saveData(currentData);
    document.getElementById('rules-server-name').textContent = `Правила сервера ${serverName}`;
    showScreen('screen-rules');
}

function cancelRules() {
    currentData.currentServer = null;
    currentData.currentSession = null;
    saveData(currentData);
    showServerSelection();
}

function acceptRules() {
    const serverName = currentData.currentServer;
    if (!serverName) return;
    const userData = currentData.users[currentData.currentUser];
    if (!userData) return;
    getUserServerData(currentData, currentData.currentUser, serverName);
    saveData(currentData);
    showMainInterface();
}

// ==================== ОСНОВНОЙ ИНТЕРФЕЙС ====================
function showMainInterface() {
    showScreen('screen-main');
    document.getElementById('navbar').style.display = 'flex';
    document.getElementById('main-server-label').textContent = `Сервер: ${currentData.currentServer}`;
    document.getElementById('main-nick-label').textContent = `Игрок: ${currentData.currentUser}`;
    renderMainContent();
}

function getCurrentUserServerData() {
    return getUserServerData(currentData, currentData.currentUser, currentData.currentServer);
}

function getCurrentServerData() {
    return getServerData(currentData, currentData.currentServer);
}

function renderMainContent() {
    const container = document.getElementById('main-content');
    const userData = getCurrentUserServerData();
    if (!userData) return;
    document.getElementById('main-balance').textContent = userData.balance;

    const warningsHtml = userData.warnings && userData.warnings.length > 0 ?
        `<div class="warning-banner">⚠️ У вас ${userData.warnings.length} предупреждений</div>` : '';
    document.getElementById('main-warnings').innerHTML = warningsHtml;

    switch (currentTab) {
        case 'cases': renderCases(container); break;
        case 'inventory': renderInventory(container); break;
        case 'market': renderMarket(container); break;
        case 'chat': renderChat(); break;
        case 'settings': renderSettings(container); break;
        default: renderCases(container);
    }
}

// ==================== КЕЙСЫ ====================
function renderCases(container) {
    container.innerHTML = `<div class="case-grid">${CASES.map(c => `
        <div class="case-card" onclick="openCaseModal('${c.id}')">
            <div class="case-icon">${c.icon}</div>
            <div class="case-name">${c.name}</div>
            <div class="case-price">💰 ${c.price}</div>
        </div>`).join('')}</div>`;
}

function openCaseModal(caseId) {
    const caseDef = CASES.find(c => c.id === caseId);
    if (!caseDef) return;
    const userData = getCurrentUserServerData();
    const canAfford = userData.balance >= caseDef.price;
    const chanceHtml = Object.entries(caseDef.chances).filter(([_, v]) => v > 0)
        .map(([r, v]) => `<span class="badge badge-${r}">${RARITIES[r]?.name}: ${v}%</span>`).join(' ');
    openModal(`
        <button class="modal-close" onclick="closeModal()">✕</button>
        <h3>${caseDef.icon} ${caseDef.name}</h3>
        <div style="text-align:center;margin-bottom:16px;font-size:13px;color:var(--text-dim);">
            Цена: <strong style="color:var(--accent2);">${caseDef.price} монет</strong>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:16px;">
            ${chanceHtml}
        </div>
        <div id="case-open-area">
            <button class="btn btn-primary" style="width:100%;" ${canAfford?'':'disabled'}
                onclick="startCaseOpening('${caseId}')">${canAfford?'Открыть кейс':'Недостаточно монет'}</button>
        </div>
        <p style="font-size:11px;color:var(--text-dim);text-align:center;margin-top:12px;">
            Возможные предметы из кейса
        </p>
        <div style="max-height:150px;overflow-y:auto;margin-top:8px;">
            ${getPossibleItemsHtml(caseDef)}
        </div>
    `);
}

function getPossibleItemsHtml(caseDef) {
    const rarities = Object.entries(caseDef.chances).filter(([_, v]) => v > 0).map(([r]) => r);
    let html = '';
    rarities.forEach(rarity => {
        const items = ITEMS_DB[rarity] || [];
        const knives = (caseDef.id === 'knife' || caseDef.id === 'premium') && (KNIVES[rarity]) ? KNIVES[rarity] : [];
        const allItems = [...knives, ...items];
        html += `<div style="font-size:12px;margin-bottom:4px;"><strong>${RARITIES[rarity]?.name}:</strong> ${allItems.slice(0,5).join(', ')}${allItems.length>5?'...':''}</div>`;
    });
    return html || '<div style="font-size:12px;color:var(--text-dim);">Нет данных</div>';
}

function startCaseOpening(caseId) {
    const caseDef = CASES.find(c => c.id === caseId);
    if (!caseDef) return;
    const userData = getCurrentUserServerData();
    if (userData.balance < caseDef.price) {
        closeModal();
        return;
    }
    userData.balance -= caseDef.price;
    userData.stats.spent += caseDef.price;
    userData.stats.casesOpened += 1;
    saveData(currentData);

    const area = document.getElementById('case-open-area');
    area.innerHTML = `
        <div class="case-open-anim">
            <div class="case-open-icon shaking" id="anim-icon">${caseDef.icon}</div>
            <p style="color:var(--text-dim);font-size:13px;">Открываем...</p>
        </div>`;
    const iconEl = document.getElementById('anim-icon');
    setTimeout(() => {
        iconEl.classList.remove('shaking');
        iconEl.classList.add('spinning');
        setTimeout(() => {
            const item = getRandomItemFromCase(caseDef);
            userData.inventory.push(item);
            userData.stats.itemsReceived += 1;
            saveData(currentData);
            document.getElementById('main-balance').textContent = userData.balance;
            sendToBot({ action: 'open_case', case: caseDef.id, item: item.name, rarity: item.rarity, cost: caseDef.price });
            area.innerHTML = `
                <div class="result-item">
                    <span class="result-icon">${item.icon}</span>
                    <div class="result-name" style="color:${getRarityColor(item.rarity)};">${item.name}</div>
                    ${getRarityBadgeHtml(item.rarity)}
                    <div style="margin-top:16px;display:flex;gap:8px;">
                        <button class="btn btn-primary btn-sm" onclick="startCaseOpening('${caseId}')">Открыть ещё</button>
                        <button class="btn btn-secondary btn-sm" onclick="closeModal();switchTab('inventory');">В инвентарь</button>
                    </div>
                </div>`;
        }, 1200);
    }, 600);
}

// ==================== ИНВЕНТАРЬ ====================
function renderInventory(container) {
    const userData = getCurrentUserServerData();
    const items = userData.inventory || [];
    let filtered = items;
    if (inventoryFilter !== 'all') filtered = filtered.filter(i => i.rarity === inventoryFilter);
    if (inventorySearch) filtered = filtered.filter(i => i.name.toLowerCase().includes(inventorySearch.toLowerCase()));

    container.innerHTML = `
        <input type="text" class="search-input" placeholder="Поиск предметов..." value="${inventorySearch}"
            oninput="inventorySearch=this.value;renderMainContent();">
        <button class="btn btn-secondary btn-sm filter-btn" onclick="toggleFilters()">
            ⚙️ Фильтры ${inventoryFilter!=='all'?'(активны)':''}
        </button>
        <div class="filters-panel ${inventoryFilter!=='all'?'show':''}" id="filters-panel">
            ${Object.keys(RARITIES).map(r => `
                <button class="filter-chip ${inventoryFilter===r?'active':''}"
                    onclick="setInventoryFilter('${r}')">${RARITIES[r].name}</button>
            `).join('')}
            <button class="filter-chip ${inventoryFilter==='all'?'active':''}"
                onclick="setInventoryFilter('all')">Все</button>
        </div>
        <button class="btn btn-secondary btn-sm" style="margin-bottom:12px;width:100%;" onclick="openCraftModal()">
            🔨 Крафты
        </button>
        <div style="margin-top:8px;">
            ${filtered.length === 0 ? '<p style="text-align:center;color:var(--text-dim);padding:20px;">Предметов не найдено</p>' :
            filtered.map(item => `
                <div class="item-card">
                    <span class="item-icon">${item.icon}</span>
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-rarity" style="color:${getRarityColor(item.rarity)};">${RARITIES[item.rarity]?.name}</div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-success btn-xs" onclick="sellItem('${item.id}')">Продать</button>
                        <button class="btn btn-secondary btn-xs" onclick="openMarketListing('${item.id}')">На рынок</button>
                    </div>
                </div>
            `).join('')}
        </div>`;
}

function toggleFilters() {
    const panel = document.getElementById('filters-panel');
    if (panel) panel.classList.toggle('show');
}

function setInventoryFilter(rarity) {
    inventoryFilter = rarity;
    renderMainContent();
}

function sellItem(itemId) {
    const userData = getCurrentUserServerData();
    const idx = userData.inventory.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    const item = userData.inventory[idx];
    const multiplier = getCurrentServerData().economy.sellMultiplier || 0.5;
    const price = Math.floor(getBasePrice(item.rarity) * multiplier);
    userData.inventory.splice(idx, 1);
    userData.balance += price;
    userData.stats.earned += price;
    saveData(currentData);
    document.getElementById('main-balance').textContent = userData.balance;
    sendToBot({ action: 'sell_item', item: item.name, rarity: item.rarity, price });
    renderMainContent();
}

function getBasePrice(rarity) {
    const prices = { common: 20, rare: 80, epic: 250, legendary: 800, mythic: 3000 };
    return prices[rarity] || 20;
}

function openCraftModal() {
    const userData = getCurrentUserServerData();
    openModal(`
        <button class="modal-close" onclick="closeModal()">✕</button>
        <h3>🔨 Крафты</h3>
        ${CRAFT_RECIPES.map(recipe => {
            const canCraft = checkCraftAvailability(recipe);
            return `
            <div class="craft-item" onclick="${canCraft ? `craftItem('${recipe.id}')` : ''}"
                style="${canCraft ? '' : 'opacity:0.5;cursor:not-allowed;'}">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:24px;">${recipe.icon}</span>
                    <div>
                        <strong>${recipe.name}</strong>
                        <div class="craft-req">${recipe.description}</div>
                        <div class="craft-req">${formatCraftRequirements(recipe.requirements)}</div>
                    </div>
                </div>
            </div>`;
        }).join('')}
    `);
}

function formatCraftRequirements(reqs) {
    return Object.entries(reqs).map(([r, count]) => {
        const owned = countOwned(r);
        return `${count}× ${RARITIES[r]?.name} (${owned}/${count})`;
    }).join(', ');
}

function countOwned(rarity) {
    const userData = getCurrentUserServerData();
    return userData.inventory.filter(i => i.rarity === rarity).length;
}

function checkCraftAvailability(recipe) {
    for (const [rarity, count] of Object.entries(recipe.requirements)) {
        if (countOwned(rarity) < count) return false;
    }
    return true;
}

function craftItem(recipeId) {
    const recipe = CRAFT_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return;
    if (!checkCraftAvailability(recipe)) return;
    const userData = getCurrentUserServerData();
    for (const [rarity, count] of Object.entries(recipe.requirements)) {
        let removed = 0;
        userData.inventory = userData.inventory.filter(i => {
            if (i.rarity === rarity && removed < count) { removed++; return false; }
            return true;
        });
    }
    const newItem = generateItem(recipe.result, false);
    userData.inventory.push(newItem);
    saveData(currentData);
    sendToBot({ action: 'craft', recipe: recipe.name, result: newItem.name, rarity: newItem.rarity });
    closeModal();
    renderMainContent();
}

// ==================== РЫНОК ====================
function renderMarket(container) {
    const serverData = getCurrentServerData();
    const market = serverData.market || [];
    const userData = getCurrentUserServerData();
    container.innerHTML = `
        <div style="display:flex;gap:8px;margin-bottom:12px;">
            <button class="btn btn-primary btn-sm" style="flex:1;" onclick="showMyListings()">Мои лоты</button>
            <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="renderMainContent()">Все лоты</button>
        </div>
        ${market.length === 0 ? '<p style="text-align:center;color:var(--text-dim);padding:20px;">Рынок пуст</p>' :
        market.map(lot => {
            const isOwn = lot.seller === currentData.currentUser;
            return `
            <div class="market-item">
                <span class="item-icon">${lot.item.icon}</span>
                <div class="market-info">
                    <div class="item-name">${lot.item.name}</div>
                    <div style="font-size:12px;color:${getRarityColor(lot.item.rarity)};">${RARITIES[lot.item.rarity]?.name}</div>
                    <div style="font-size:12px;color:var(--text-dim);">Продавец: ${lot.seller}</div>
                    <div style="font-size:14px;font-weight:700;color:var(--accent2);">💰 ${lot.price}</div>
                </div>
                ${isOwn ? `<button class="btn btn-danger btn-xs" onclick="cancelListing('${lot.id}')">Снять</button>` :
                `<button class="btn btn-success btn-xs" onclick="buyListing('${lot.id}')">Купить</button>`}
            </div>`;
        }).join('')}`;
}

function showMyListings() {
    const container = document.getElementById('main-content');
    const serverData = getCurrentServerData();
    const myLots = (serverData.market || []).filter(l => l.seller === currentData.currentUser);
    container.innerHTML = `
        <button class="btn btn-secondary btn-sm" style="margin-bottom:12px;" onclick="renderMainContent()">← Назад</button>
        ${myLots.length === 0 ? '<p style="text-align:center;color:var(--text-dim);padding:20px;">У вас нет лотов</p>' :
        myLots.map(lot => `
            <div class="market-item">
                <span class="item-icon">${lot.item.icon}</span>
                <div class="market-info">
                    <div class="item-name">${lot.item.name}</div>
                    <div style="font-size:12px;color:${getRarityColor(lot.item.rarity)};">${RARITIES[lot.item.rarity]?.name}</div>
                    <div style="font-size:14px;font-weight:700;color:var(--accent2);">💰 ${lot.price}</div>
                </div>
                <button class="btn btn-danger btn-xs" onclick="cancelListing('${lot.id}')">Снять</button>
            </div>`).join('')}`;
}

function openMarketListing(itemId) {
    const userData = getCurrentUserServerData();
    const item = userData.inventory.find(i => i.id === itemId);
    if (!item) return;
    openModal(`
        <button class="modal-close" onclick="closeModal()">✕</button>
        <h3>Выставить на рынок</h3>
        <div style="text-align:center;margin-bottom:16px;">
            <span style="font-size:40px;">${item.icon}</span>
            <div>${item.name}</div>
            <div style="color:${getRarityColor(item.rarity)};font-size:12px;">${RARITIES[item.rarity]?.name}</div>
        </div>
        <input type="number" id="market-price" placeholder="Цена монет" min="1" style="margin-bottom:12px;">
        <button class="btn btn-primary" style="width:100%;" onclick="confirmMarketListing('${item.id}')">Выставить</button>
    `);
    setTimeout(() => document.getElementById('market-price')?.focus(), 100);
}

function confirmMarketListing(itemId) {
    const price = parseInt(document.getElementById('market-price')?.value);
    if (!price || price < 1) return;
    const userData = getCurrentUserServerData();
    const idx = userData.inventory.findIndex(i => i.id === itemId);
    if (idx === -1) { closeModal(); return; }
    const item = userData.inventory[idx];
    userData.inventory.splice(idx, 1);
    const serverData = getCurrentServerData();
    if (!serverData.market) serverData.market = [];
    serverData.market.push({ id: generateId(), item, seller: currentData.currentUser, price, listedAt: Date.now() });
    saveData(currentData);
    sendToBot({ action: 'market_list', item: item.name, price });
    closeModal();
    renderMainContent();
}

function cancelListing(lotId) {
    const serverData = getCurrentServerData();
    const idx = serverData.market.findIndex(l => l.id === lotId);
    if (idx === -1) return;
    const lot = serverData.market[idx];
    if (lot.seller !== currentData.currentUser) return;
    serverData.market.splice(idx, 1);
    const userData = getCurrentUserServerData();
    userData.inventory.push(lot.item);
    saveData(currentData);
    sendToBot({ action: 'market_cancel', item: lot.item.name });
    renderMainContent();
}

function buyListing(lotId) {
    const serverData = getCurrentServerData();
    const idx = serverData.market.findIndex(l => l.id === lotId);
    if (idx === -1) return;
    const lot = serverData.market[idx];
    const userData = getCurrentUserServerData();
    if (userData.balance < lot.price) { alert('Недостаточно монет'); return; }
    if (lot.seller === currentData.currentUser) { alert('Это ваш лот'); return; }
    userData.balance -= lot.price;
    userData.inventory.push(lot.item);
    const sellerData = currentData.users[lot.seller];
    if (sellerData && sellerData.servers[currentData.currentServer]) {
        sellerData.servers[currentData.currentServer].balance += lot.price;
        sellerData.servers[currentData.currentServer].stats.earned += lot.price;
    }
    serverData.market.splice(idx, 1);
    saveData(currentData);
    document.getElementById('main-balance').textContent = userData.balance;
    sendToBot({ action: 'market_buy', item: lot.item.name, price: lot.price, seller: lot.seller });
    renderMainContent();
}

// ==================== ЧАТ ====================
function renderChat() {
    const container = document.getElementById('main-content');
    const serverData = getCurrentServerData();
    const chat = serverData.chat || [];
    container.innerHTML = `
        <div class="chat-tabs">
            <button class="chat-tab ${chatTab==='general'?'active':''}" onclick="setChatTab('general')">Общий</button>
            <button class="chat-tab ${chatTab==='private'?'active':''}" onclick="setChatTab('private')">ЛС</button>
        </div>
        ${chatTab === 'private' ? `
            <select id="chat-user-select" style="margin-bottom:8px;" onchange="selectedChatUser=this.value;renderChatMessages();">
                <option value="">Выберите собеседника</option>
                ${Object.keys(currentData.users).filter(n => n !== currentData.currentUser).map(n =>
                    `<option value="${n}" ${selectedChatUser===n?'selected':''}>${n}</option>`).join('')}
            </select>
        ` : ''}
        <div class="chat-messages" id="chat-messages">
            ${renderChatMessagesHtml()}
        </div>
        <div class="chat-input-wrap">
            <input type="text" id="chat-input" placeholder="Сообщение..." onkeydown="if(event.key==='Enter')sendChatMessage();">
            <button class="btn btn-primary btn-sm" onclick="sendChatMessage()">➤</button>
        </div>`;
    scrollChatToBottom();
}

function setChatTab(tab) {
    chatTab = tab;
    selectedChatUser = null;
    renderChat();
}

function renderChatMessagesHtml() {
    const serverData = getCurrentServerData();
    const chat = serverData.chat || [];
    let messages = chat;
    if (chatTab === 'private' && selectedChatUser) {
        messages = chat.filter(m => m.type === 'private' &&
            ((m.author === currentData.currentUser && m.target === selectedChatUser) ||
             (m.author === selectedChatUser && m.target === currentData.currentUser)));
    } else if (chatTab === 'general') {
        messages = chat.filter(m => m.type === 'general');
    } else if (chatTab === 'private' && !selectedChatUser) {
        return '<p style="text-align:center;color:var(--text-dim);padding:20px;">Выберите собеседника</p>';
    }
    if (messages.length === 0) return '<p style="text-align:center;color:var(--text-dim);padding:20px;">Сообщений нет</p>';
    return messages.map(m => {
        const isOwn = m.author === currentData.currentUser;
        const time = new Date(m.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        return `<div class="chat-msg ${isOwn?'own':'other'}">
            ${!isOwn?`<div class="msg-author">${m.author}</div>`:''}
            ${m.text}
            <div class="msg-time">${time}</div>
        </div>`;
    }).join('');
}

function renderChatMessages() {
    const el = document.getElementById('chat-messages');
    if (el) {
        el.innerHTML = renderChatMessagesHtml();
        scrollChatToBottom();
    }
}

function scrollChatToBottom() {
    setTimeout(() => {
        const el = document.getElementById('chat-messages');
        if (el) el.scrollTop = el.scrollHeight;
    }, 50);
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input?.value.trim();
    if (!text) return;
    const serverData = getCurrentServerData();
    if (!serverData.chat) serverData.chat = [];
    if (chatTab === 'general') {
        serverData.chat.push({ id: generateId(), type: 'general', author: currentData.currentUser, text, timestamp: Date.now() });
        sendToBot({ action: 'chat_message', type: 'general', author: currentData.currentUser, text });
    } else if (chatTab === 'private' && selectedChatUser) {
        serverData.chat.push({ id: generateId(), type: 'private', author: currentData.currentUser, target: selectedChatUser, text, timestamp: Date.now() });
        sendToBot({ action: 'chat_message', type: 'private', author: currentData.currentUser, target: selectedChatUser, text });
    }
    input.value = '';
    saveData(currentData);
    renderChatMessages();
}

// ==================== НАСТРОЙКИ ====================
function renderSettings(container) {
    const userData = currentData.users[currentData.currentUser];
    const userServerData = getCurrentUserServerData();
    const settings = userData.settings || { sound: true, notifications: true };
    container.innerHTML = `
        <div class="glass" style="padding:16px;margin-bottom:16px;">
            <h3 style="margin-bottom:12px;">👤 Профиль</h3>
            <div class="stat-row"><span>Никнейм</span><span>${currentData.currentUser}</span></div>
            <div class="stat-row"><span>Сервер</span><span>${currentData.currentServer}</span></div>
            <div class="stat-row"><span>Баланс</span><span>💰 ${userServerData.balance}</span></div>
            <div class="stat-row"><span>Предметов</span><span>${userServerData.inventory.length}</span></div>
        </div>

        <div class="glass" style="padding:16px;margin-bottom:16px;">
            <h3 style="margin-bottom:12px;">⚙️ Настройки</h3>
            <div class="setting-row">
                <span class="setting-label">🔊 Звук</span>
                <label class="toggle-switch"><input type="checkbox" ${settings.sound?'checked':''} onchange="toggleSetting('sound',this.checked)"><span class="toggle-slider"></span></label>
            </div>
            <div class="setting-row">
                <span class="setting-label">🔔 Уведомления</span>
                <label class="toggle-switch"><input type="checkbox" ${settings.notifications?'checked':''} onchange="toggleSetting('notifications',this.checked)"><span class="toggle-slider"></span></label>
            </div>
        </div>

        <div class="glass" style="padding:16px;margin-bottom:16px;">
            <h3 style="margin-bottom:12px;">📊 Статистика</h3>
            <div class="stat-row"><span>Открыто кейсов</span><span>${userServerData.stats.casesOpened}</span></div>
            <div class="stat-row"><span>Получено предметов</span><span>${userServerData.stats.itemsReceived}</span></div>
            <div class="stat-row"><span>Потрачено</span><span>${userServerData.stats.spent} 💰</span></div>
            <div class="stat-row"><span>Заработано</span><span>${userServerData.stats.earned} 💰</span></div>
        </div>

        <button class="btn btn-secondary" style="width:100%;margin-bottom:12px;" onclick="openSupportModal()">
            📮 Поддержка
        </button>
        ${isOwner() ? `<button class="btn btn-warning" style="width:100%;margin-bottom:12px;" onclick="openAdminPanel()">
            🛡️ Админ-панель
        </button>` : `<button class="btn btn-secondary" style="width:100%;margin-bottom:12px;" onclick="openAdminLoginModal()">
            🛡️ Админ-панель
        </button>`}
        <button class="btn btn-danger" style="width:100%;" onclick="exitServer()">
            🚪 Выйти из сервера
        </button>`;
}

function toggleSetting(key, value) {
    const userData = currentData.users[currentData.currentUser];
    if (!userData.settings) userData.settings = {};
    userData.settings[key] = value;
    saveData(currentData);
}

function exitServer() {
    if (confirm('Выйти из сервера?')) {
        currentData.currentServer = null;
        currentData.currentSession = null;
        saveData(currentData);
        showServerSelection();
    }
}

function openSupportModal() {
    openModal(`
        <button class="modal-close" onclick="closeModal()">✕</button>
        <h3>📮 Поддержка</h3>
        <textarea id="support-text" placeholder="Опишите вашу проблему..." style="min-height:100px;margin-bottom:12px;"></textarea>
        <button class="btn btn-primary" style="width:100%;" onclick="submitTicket()">Отправить</button>
    `);
}

function submitTicket() {
    const text = document.getElementById('support-text')?.value.trim();
    if (!text) return;
    const serverData = getCurrentServerData();
    if (!serverData.tickets) serverData.tickets = [];
    serverData.tickets.push({ id: generateId(), author: currentData.currentUser, text, status: 'open', createdAt: Date.now() });
    saveData(currentData);
    sendToBot({ action: 'support_ticket', author: currentData.currentUser, text });
    closeModal();
    alert('Тикет отправлен!');
}

// ==================== ДОНАТ ====================
function openDonate() {
    openModal(`
        <button class="modal-close" onclick="closeModal()">✕</button>
        <h3>💰 Пополнение баланса</h3>
        <p style="text-align:center;font-size:13px;color:var(--text-dim);margin-bottom:16px;">Выберите пакет:</p>
        <div class="donate-option" onclick="processDonate(10)">
            <span class="donate-stars">⭐ 10 звёзд</span>
            <span class="donate-coins">500 монет</span>
        </div>
        <div class="donate-option" onclick="processDonate(50)">
            <span class="donate-stars">⭐ 50 звёзд</span>
            <span class="donate-coins">3000 монет</span>
        </div>
        <div class="donate-option" onclick="processDonate(100)">
            <span class="donate-stars">⭐ 100 звёзд</span>
            <span class="donate-coins">10000 монет</span>
        </div>
    `);
}

function processDonate(stars) {
    const link = `https://t.me/storm_cases_bot?start=donate_${stars}`;
    sendToBot({ action: 'donate_request', stars });
    try {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) {
            window.Telegram.WebApp.openTelegramLink(link);
        }
    } catch (e) { console.log(e); }
    closeModal();
    alert(`Откройте бота для оплаты ${stars} звёзд:\n${link}`);
}

// ==================== АДМИН-ПАНЕЛЬ ====================
function openAdminLoginModal() {
    openModal(`
        <button class="modal-close" onclick="closeModal()">✕</button>
        <h3>🛡️ Вход в админ-панель</h3>
        <input type="password" id="admin-pass-input" placeholder="Пароль администратора" style="margin-bottom:12px;">
        <button class="btn btn-primary" style="width:100%;" onclick="loginAdmin()">Войти</button>
    `);
}

function loginAdmin() {
    const pass = document.getElementById('admin-pass-input')?.value.trim();
    if (!pass) return;
    const serverName = currentData.currentServer;
    const expectedPass = `${serverName.toLowerCase()}123`;
    if (pass === expectedPass) {
        currentAdminLevel = 3;
        closeModal();
        openAdminPanel();
    } else {
        alert('Неверный пароль');
    }
}

function openAdminPanel() {
    if (isOwner()) currentAdminLevel = 5;
    else if (currentAdminLevel < 1) currentAdminLevel = 3;
    adminTab = 'players';
    renderAdminPanel();
}

function renderAdminPanel() {
    const container = document.getElementById('main-content');
    const serverData = getCurrentServerData();
    const tabs = [
        { id: 'players', name: 'Игроки', show: currentAdminLevel >= 3 },
        { id: 'logs', name: 'Логи', show: currentAdminLevel >= 3 },
        { id: 'give', name: 'Выдать', show: currentAdminLevel >= 3 },
        { id: 'tickets', name: 'Поддержка', show: currentAdminLevel >= 3 },
        { id: 'chat', name: 'Чат', show: currentAdminLevel >= 3 },
        { id: 'servers', name: 'Серверы', show: currentAdminLevel >= 3 },
        { id: 'economy', name: 'Экономика', show: currentAdminLevel >= 3 },
        { id: 'admins', name: 'Админы', show: currentAdminLevel >= 5 }
    ];
    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:16px;">🛡️ Админ-панель</h3>
            <span class="badge" style="background:var(--accent);color:#fff;">Уровень ${currentAdminLevel}</span>
        </div>
        <div class="admin-tabs">
            ${tabs.filter(t => t.show).map(t => `
                <button class="admin-tab ${adminTab===t.id?'active':''}" onclick="setAdminTab('${t.id}')">${t.name}</button>
            `).join('')}
        </div>
        <div id="admin-panel-content">${renderAdminTabContent()}</div>
        <button class="btn btn-secondary btn-sm" style="margin-top:16px;width:100%;" onclick="renderMainContent()">← Назад</button>`;
}

function setAdminTab(tab) {
    adminTab = tab;
    renderAdminPanel();
}

function renderAdminTabContent() {
    switch (adminTab) {
        case 'players': return renderAdminPlayers();
        case 'logs': return renderAdminLogs();
        case 'give': return renderAdminGive();
        case 'tickets': return renderAdminTickets();
        case 'chat': return renderAdminChat();
        case 'servers': return renderAdminServers();
        case 'economy': return renderAdminEconomy();
        case 'admins': return renderAdminAdmins();
        default: return renderAdminPlayers();
    }
}

function renderAdminPlayers() {
    const serverData = getCurrentServerData();
    const players = Object.keys(currentData.users).filter(n => currentData.users[n].servers[currentData.currentServer]);
    return `
        <p style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">${players.length} игроков на сервере</p>
        ${players.map(nick => {
            const ud = currentData.users[nick].servers[currentData.currentServer];
            return `<div class="player-row">
                <div>
                    <strong>${nick}</strong>
                    ${ud.muted?'<span class="muted-badge">МУТ</span>':''}
                    ${ud.banned?'<span class="banned-badge">БАН</span>':''}
                    <div style="font-size:11px;color:var(--text-dim);">Баланс: ${ud.balance} | Предметов: ${ud.inventory.length} | Предупреждений: ${ud.warnings.length}</div>
                </div>
                <div class="player-actions">
                    <button class="btn btn-warning btn-xs" onclick="adminWarn('${nick}')">⚠️</button>
                    <button class="btn btn-secondary btn-xs" onclick="adminMute('${nick}')">🔇</button>
                    <button class="btn btn-danger btn-xs" onclick="adminBan('${nick}')">🚫</button>
                    ${(ud.muted||ud.banned)?`<button class="btn btn-success btn-xs" onclick="adminUnrestrict('${nick}')">✅</button>`:''}
                </div>
            </div>`;
        }).join('')}`;
}

function adminWarn(nick) {
    const ud = currentData.users[nick].servers[currentData.currentServer];
    ud.warnings.push({ reason: 'Предупреждение администратора', at: Date.now() });
    addLog(`Предупреждение игроку ${nick}`);
    saveData(currentData);
    renderAdminPanel();
}

function adminMute(nick) {
    const ud = currentData.users[nick].servers[currentData.currentServer];
    ud.muted = !ud.muted;
    addLog(`${ud.muted?'Мут':'Снятие мута'} игроку ${nick}`);
    saveData(currentData);
    renderAdminPanel();
}

function adminBan(nick) {
    const ud = currentData.users[nick].servers[currentData.currentServer];
    ud.banned = !ud.banned;
    addLog(`${ud.banned?'Бан':'Снятие бана'} игроку ${nick}`);
    saveData(currentData);
    renderAdminPanel();
}

function adminUnrestrict(nick) {
    const ud = currentData.users[nick].servers[currentData.currentServer];
    ud.muted = false;
    ud.banned = false;
    addLog(`Снятие всех ограничений игроку ${nick}`);
    saveData(currentData);
    renderAdminPanel();
}

function addLog(action) {
    const serverData = getCurrentServerData();
    if (!serverData.logs) serverData.logs = [];
    serverData.logs.push({ action, admin: currentData.currentUser, at: Date.now() });
}

function renderAdminLogs() {
    const serverData = getCurrentServerData();
    const logs = serverData.logs || [];
    return logs.length === 0 ? '<p style="color:var(--text-dim);">Логов нет</p>' :
        logs.slice(-50).reverse().map(l => `
        <div class="log-entry">
            <strong>${l.admin}</strong>: ${l.action}
            <span style="font-size:10px;color:var(--text-dim);float:right;">${new Date(l.at).toLocaleString('ru-RU')}</span>
        </div>`).join('');
}

function renderAdminGive() {
    return `
        <input type="text" id="give-nick" placeholder="Ник игрока" style="margin-bottom:8px;">
        <select id="give-type" style="margin-bottom:8px;">
            <option value="coins">Монеты</option>
            <option value="item">Предмет</option>
        </select>
        <div id="give-details"></div>
        <button class="btn btn-primary" style="width:100%;" onclick="adminGive()">Выдать</button>`;
}

function adminGive() {
    const nick = document.getElementById('give-nick')?.value.trim();
    const type = document.getElementById('give-type')?.value;
    if (!nick || !currentData.users[nick]) { alert('Игрок не найден'); return; }
    if (!currentData.users[nick].servers[currentData.currentServer]) {
        getUserServerData(currentData, nick, currentData.currentServer);
    }
    const ud = currentData.users[nick].servers[currentData.currentServer];
    if (type === 'coins') {
        const amount = parseInt(document.getElementById('give-amount')?.value);
        if (!amount || amount < 1) return;
        ud.balance += amount;
        addLog(`Выдано ${amount} монет игроку ${nick}`);
    } else {
        const rarity = document.getElementById('give-rarity')?.value;
        const item = generateItem(rarity, false);
        ud.inventory.push(item);
        addLog(`Выдан предмет ${item.name} (${rarity}) игроку ${nick}`);
    }
    saveData(currentData);
    alert('Выдано!');
    renderAdminPanel();
}

function renderAdminTickets() {
    const serverData = getCurrentServerData();
    const tickets = serverData.tickets || [];
    return tickets.length === 0 ? '<p style="color:var(--text-dim);">Тикетов нет</p>' :
        tickets.map(t => `
        <div class="ticket-item">
            <div style="display:flex;justify-content:space-between;">
                <strong>${t.author}</strong>
                <span class="ticket-status" style="color:${t.status==='open'?'var(--warning)':'var(--success)'};">${t.status}</span>
            </div>
            <div style="font-size:12px;margin:8px 0;">${t.text}</div>
            <div style="font-size:10px;color:var(--text-dim);">${new Date(t.createdAt).toLocaleString('ru-RU')}</div>
            <div style="display:flex;gap:4px;margin-top:8px;">
                ${t.status==='open'?`<button class="btn btn-success btn-xs" onclick="resolveTicket('${t.id}')">Решить</button>`:''}
                <button class="btn btn-danger btn-xs" onclick="deleteTicket('${t.id}')">Удалить</button>
            </div>
        </div>`).join('');
}

function resolveTicket(id) {
    const serverData = getCurrentServerData();
    const t = serverData.tickets.find(x => x.id === id);
    if (t) { t.status = 'resolved'; addLog(`Решён тикет от ${t.author}`); }
    saveData(currentData);
    renderAdminPanel();
}

function deleteTicket(id) {
    const serverData = getCurrentServerData();
    serverData.tickets = serverData.tickets.filter(x => x.id !== id);
    addLog('Удалён тикет');
    saveData(currentData);
    renderAdminPanel();
}

function renderAdminChat() {
    const serverData = getCurrentServerData();
    return `
        <p style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">Сообщений: ${(serverData.chat||[]).length}</p>
        <button class="btn btn-danger" style="width:100%;" onclick="clearChat()">Очистить общий чат</button>`;
}

function clearChat() {
    if (!confirm('Очистить общий чат?')) return;
    const serverData = getCurrentServerData();
    serverData.chat = (serverData.chat || []).filter(m => m.type !== 'general');
    addLog('Очищен общий чат');
    saveData(currentData);
    alert('Чат очищен');
    renderAdminPanel();
}

function renderAdminServers() {
    const serverData = getCurrentServerData();
    const allServers = SERVER_NAMES.map(name => {
        const s = getServerData(currentData, name);
        return { name, ...s };
    });
    return allServers.map(s => `
        <div class="player-row">
            <div>
                <strong>${s.name}</strong>
                <span class="server-status ${s.status}">${s.status}</span>
                <div style="font-size:11px;color:var(--text-dim);">Онлайн: ${s.online}</div>
            </div>
            <div class="player-actions">
                <button class="btn btn-warning btn-xs" onclick="toggleServerStatus('${s.name}')">${s.status==='online'?'Отключить':'Включить'}</button>
            </div>
        </div>`).join('');
}

function toggleServerStatus(name) {
    const s = getServerData(currentData, name);
    s.status = s.status === 'online' ? 'offline' : 'online';
    addLog(`Сервер ${name}: ${s.status}`);
    saveData(currentData);
    renderAdminPanel();
}

function renderAdminEconomy() {
    const serverData = getCurrentServerData();
    const econ = serverData.economy || { startBalance: 1000, sellMultiplier: 0.5 };
    return `
        <div class="setting-row">
            <span class="setting-label">Начальный баланс</span>
            <input type="number" id="econ-start" value="${econ.startBalance}" style="width:100px;min-height:32px;padding:6px 10px;">
        </div>
        <div class="setting-row">
            <span class="setting-label">Множитель продажи</span>
            <input type="number" id="econ-mult" value="${econ.sellMultiplier}" step="0.1" min="0.1" style="width:100px;min-height:32px;padding:6px 10px;">
        </div>
        <button class="btn btn-primary" style="width:100%;margin-top:12px;" onclick="saveEconomy()">Сохранить</button>`;
}

function saveEconomy() {
    const start = parseInt(document.getElementById('econ-start')?.value);
    const mult = parseFloat(document.getElementById('econ-mult')?.value);
    if (!start || start < 0 || !mult || mult < 0) return;
    const serverData = getCurrentServerData();
    serverData.economy = { startBalance: start, sellMultiplier: mult };
    addLog(`Изменена экономика: start=${start}, mult=${mult}`);
    saveData(currentData);
    alert('Сохранено');
    renderAdminPanel();
}

function renderAdminAdmins() {
    if (currentAdminLevel < 5) return '<p style="color:var(--text-dim);">Нет доступа</p>';
    const serverData = getCurrentServerData();
    const admins = serverData.admins || {};
    return `
        <p style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">Управление администраторами</p>
        <input type="text" id="admin-add-nick" placeholder="Ник администратора" style="margin-bottom:8px;">
        <button class="btn btn-primary" style="width:100%;margin-bottom:12px;" onclick="addAdmin()">Добавить админа</button>
        ${Object.keys(admins).length===0?'<p style="color:var(--text-dim);">Нет админов</p>':Object.keys(admins).map(n => `
            <div class="player-row">
                <strong>${n}</strong>
                <span class="badge" style="background:var(--accent);color:#fff;">Lv.${admins[n]}</span>
                <button class="btn btn-danger btn-xs" onclick="removeAdmin('${n}')">Удалить</button>
            </div>`).join('')}`;
}

function addAdmin() {
    const nick = document.getElementById('admin-add-nick')?.value.trim();
    if (!nick || !currentData.users[nick]) { alert('Игрок не найден'); return; }
    const serverData = getCurrentServerData();
    if (!serverData.admins) serverData.admins = {};
    serverData.admins[nick] = 3;
    addLog(`Добавлен админ ${nick} (уровень 3)`);
    saveData(currentData);
    renderAdminPanel();
}

function removeAdmin(nick) {
    const serverData = getCurrentServerData();
    if (serverData.admins) delete serverData.admins[nick];
    addLog(`Удалён админ ${nick}`);
    saveData(currentData);
    renderAdminPanel();
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
function init() {
    currentData = loadData();

    // Привязка событий
    document.getElementById('btn-login')?.addEventListener('click', authLogin);
    document.getElementById('btn-register')?.addEventListener('click', authRegister);
    document.getElementById('btn-logout-account')?.addEventListener('click', logoutAccount);
    document.getElementById('btn-cancel-rules')?.addEventListener('click', cancelRules);
    document.getElementById('btn-accept-rules')?.addEventListener('click', acceptRules);
    document.getElementById('balance-display')?.addEventListener('click', openDonate);
    document.getElementById('modal-overlay')?.addEventListener('click', closeModalOnOverlay);

    // Навигация
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchTab(item.dataset.tab));
    });

    // Проверка сессии
    if (currentData.currentUser && currentData.currentServer && currentData.currentSession) {
        const user = currentData.users[currentData.currentUser];
        if (user && user.servers[currentData.currentServer]) {
            showMainInterface();
            return;
        }
    }
    if (currentData.currentUser && currentData.users[currentData.currentUser]) {
        showServerSelection();
    } else {
        showScreen('screen-auth');
        document.getElementById('navbar').style.display = 'none';
    }

    // Telegram WebApp инициализация
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
        }
    } catch (e) {}
}

document.addEventListener('DOMContentLoaded', init);
