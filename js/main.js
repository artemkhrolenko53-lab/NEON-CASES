// ==================== ОСНОВНАЯ ЛОГИКА ====================
let state = {
    balance: 500,
    inventory: [],
    market: [],
    stats: { casesOpened: 0, itemsReceived: 0, totalSpent: 0, totalEarned: 0 },
    sound: true,
    notifications: true,
    currentServer: null,
    chatMessages: [],
    privateMessages: {},
    warnings: 0,
    muted: false,
    banned: false,
    username: null,
    password: null,
    userId: null,
    isOwner: false,
    isAdmin: false,
    adminLevel: 0,
};

let inventoryFilter = 'all';
let inventorySearch = '';
let currentChatMode = 'general';
let activePrivateChat = null;

// ==================== УТИЛИТЫ ====================
function save() {
    try { localStorage.setItem('storm_data', JSON.stringify(state)); } catch(e) {}
}

function load() {
    try {
        const data = localStorage.getItem('storm_data');
        if (data) {
            const parsed = JSON.parse(data);
            state = { ...state, ...parsed };
            if (!state.chatMessages) state.chatMessages = [];
            if (!state.privateMessages) state.privateMessages = {};
        }
    } catch(e) { console.error(e); }
}

function updateBalance() {
    document.getElementById('balance').textContent = state.balance;
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toasts');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.background = type === 'success' ? 'rgba(16,185,129,0.9)' : type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(108,92,231,0.9)';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    if (tab === 'cases') renderCases();
    if (tab === 'market') renderMarket();
    if (tab === 'inventory') renderInventory();
    if (tab === 'chat') renderChat();
    if (tab === 'settings') renderSettings();
}

function sendToBot(data) {
    if (window.Telegram?.WebApp) {
        try { window.Telegram.WebApp.sendData(JSON.stringify(data)); } catch(e) {}
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ TELEGRAM ====================
function initTelegram() {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        if (user) {
            if (user.id === BOT_CONFIG.ownerId) {
                state.isOwner = true;
                state.adminLevel = 5;
            } else if (BOT_CONFIG.adminIds.includes(user.id)) {
                state.isAdmin = true;
                state.adminLevel = 1;
            }
        }
    }
}

// ==================== РЕГИСТРАЦИЯ / ВХОД ====================
function showRegistration() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <h2 style="text-align:center;margin-bottom:16px">👤 Регистрация</h2>
            <input id="reg-username" class="form-input" placeholder="Придумайте ник">
            <input id="reg-password" type="password" class="form-input" placeholder="Придумайте пароль">
            <button class="btn btn-primary" onclick="closeModal(this.closest('.modal'))">Принять</button>
            <p style="text-align:center;margin-top:8px;font-size:12px">Уже есть аккаунт? <span style="color:var(--accent);cursor:pointer" onclick="showLogin()">Войти</span></p>
        </div>
    `;
    document.body.appendChild(modal);
}

function showLogin() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <h2 style="text-align:center;margin-bottom:16px">🔐 Вход</h2>
            <input id="login-username" class="form-input" placeholder="Ник">
            <input id="login-password" type="password" class="form-input" placeholder="Пароль">
            <button class="btn btn-primary" onclick="loginAccount()">Войти</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function registerAccount() {
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    if (!username || !password) { showToast('Заполните все поля!', 'error'); return; }
    state.username = username;
    state.password = password;
    state.userId = Math.floor(Math.random() * 100000) + 1;
    save();
    document.querySelector('.modal').remove();
    showToast('✅ Аккаунт создан!', 'success');
    initServerSelection();
}

function loginAccount() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if (state.username === username && state.password === password) {
        document.querySelector('.modal').remove();
        showToast('✅ Добро пожаловать, ' + username + '!', 'success');
        initServerSelection();
    } else {
        showToast('Неверный логин или пароль', 'error');
    }
}

// ==================== СЕРВЕРЫ ====================
function initServerSelection() {
    if (!state.username) { showRegistration(); return; }
    if (!state.currentServer) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <h2 style="text-align:center;margin-bottom:16px">🌍 Выбор сервера</h2>
                ${SERVERS.map(s => `
                    <div class="item-card" style="cursor:pointer" onclick="selectServer('${s.id}')">
                        <div class="item-info">
                            <div class="item-name">${s.name}</div>
                            <div class="item-type">Онлайн: ${s.playersOnline}/${s.maxPlayers}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        document.getElementById('server-name').textContent = state.currentServer.toUpperCase();
        showServerRules();
    }
}

function selectServer(serverId) {
    state.currentServer = serverId;
    save();
    document.querySelector('.modal').remove();
    document.getElementById('server-name').textContent = serverId.toUpperCase();
    showServerRules();
}

function showServerRules() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <h2 style="text-align:center;margin-bottom:16px">📜 Правила сервера ${state.currentServer.toUpperCase()}</h2>
            <div style="font-size:13px;color:#ccc;line-height:1.5">
                <p>1. Запрещены оскорбления.</p>
                <p>2. Запрещён спам.</p>
                <p>3. Запрещено мошенничество.</p>
                <p>4. Администрация всегда права.</p>
                <p>5. 1 предупреждение - ограничения, 2 - запрет торговли, 3 - бан на 7 дней.</p>
            </div>
            <button class="btn btn-primary" onclick="closeModal(this.closest('.modal')); renderCases();">Принять</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function exitServer() {
    state.currentServer = null;
    save();
    document.getElementById('server-name').textContent = 'Сервер: -';
    showToast('Вы вышли из сервера', 'info');
    initServerSelection();
}

// ==================== КЕЙСЫ ====================
function renderCases() {
    const container = document.getElementById('cases-list');
    container.innerHTML = '<div class="section-title">📦 Кейсы</div>';
    CASES.forEach(caseObj => {
        const card = document.createElement('div');
        card.className = 'case-card';
        card.innerHTML = `
            <div class="case-header">
                <span class="case-icon">${caseObj.icon}</span>
                <div>
                    <div class="case-name">${caseObj.name}</div>
                    <div class="case-price">💰 ${caseObj.price}</div>
                </div>
            </div>
            <div class="case-prob">
                ${Object.entries(caseObj.prob).map(([r, ch]) => `<span class="filter-btn" style="cursor:default">${r}: ${ch}%</span>`).join('')}
            </div>
        `;
        card.onclick = () => showCaseDetails(caseObj);
        container.appendChild(card);
    });
}

function showCaseDetails(caseObj) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    const possibleItems = ITEMS.filter(i => Object.keys(caseObj.prob).includes(i.rarity));
    const itemsHtml = possibleItems.map(item => `
        <div class="item-card" style="cursor:default">
            <span class="item-icon">${item.icon}</span>
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-type">${item.type} | ${item.rarity}</div>
            </div>
            <div class="item-price">💰 ${item.price ?? '?'}</div>
        </div>
    `).join('');
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <h2 style="text-align:center;margin-bottom:16px">${caseObj.icon} ${caseObj.name}</h2>
            <p style="text-align:center;color:#6b6b7b;margin-bottom:12px">Возможные предметы:</p>
            ${itemsHtml || '<p style="text-align:center">Нет предметов</p>'}
            <div style="margin-top:16px">
                <button class="btn btn-primary" onclick="openCaseAnimation(${caseObj.id})">Открыть за 💰 ${caseObj.price}</button>
                <button class="btn btn-secondary" style="margin-top:8px" onclick="this.closest('.modal').remove()">Закрыть</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function openCaseAnimation(caseId) {
    const caseObj = CASES.find(c => c.id === caseId);
    if (!caseObj) return;
    if (state.balance < caseObj.price) { showToast('Недостаточно монет!', 'error'); return; }
    state.balance -= caseObj.price;
    state.stats.totalSpent += caseObj.price;
    state.stats.casesOpened++;
    updateBalance();
    save();
    const overlay = document.getElementById('opening-overlay');
    const animContainer = document.getElementById('opening-animation');
    overlay.classList.remove('hidden');
    animContainer.innerHTML = `<div class="opening-case">${caseObj.icon}</div>`;
    setTimeout(() => {
        animContainer.innerHTML = `<div class="opening-spin">${caseObj.icon}</div>`;
    }, 1000);
    setTimeout(() => {
        const item = getRandomItem(caseObj);
        state.inventory.push({ ...item, qty: 1 });
        state.stats.itemsReceived++;
        save();
        animContainer.innerHTML = `
            <div class="item-reveal">
                <div style="font-size:100px;margin-bottom:16px">${item.icon}</div>
                <h2>${item.name}</h2>
                <p style="color:#6b6b7b">${item.type}</p>
                <p style="color:#ffd700;font-size:20px">💰 ${item.price ?? '?'}</p>
            </div>
        `;
        sendToBot({ action: 'case_opened', caseId: caseObj.id, itemId: item.id, price: caseObj.price });
    }, 2000);
    setTimeout(() => {
        overlay.classList.add('hidden');
        showToast('🎉 Предмет получен!', 'success');
    }, 3500);
}

function getRandomItem(caseObj) {
    const rand = Math.random() * 100;
    let cum = 0;
    for (const [rarity, chance] of Object.entries(caseObj.prob)) {
        cum += chance;
        if (rand <= cum) {
            const pool = ITEMS.filter(i => i.rarity === rarity);
            if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
        }
    }
    return ITEMS[0];
}

// ==================== ИНВЕНТАРЬ ====================
function renderInventory() {
    const container = document.getElementById('inventory-list');
    container.innerHTML = '';
    container.innerHTML = `
        <div class="search-bar">
            <input class="search-input" placeholder="🔍 Поиск..." value="${inventorySearch}" oninput="inventorySearch = this.value; renderInventory();">
        </div>
        <div class="filters">
            ${['all','common','rare','epic','legendary','mythic'].map(f => `<button class="filter-btn ${inventoryFilter === f ? 'active' : ''}" onclick="inventoryFilter='${f}'; renderInventory();">${f === 'all' ? 'Все' : f}</button>`).join('')}
        </div>
        <button class="btn btn-craft" style="width:100%; margin-bottom:12px" onclick="showCrafts()">🛠️ Крафты</button>
    `;
    let items = state.inventory.filter(item => {
        if (inventoryFilter !== 'all' && item.rarity !== inventoryFilter) return false;
        if (inventorySearch && !item.name.toLowerCase().includes(inventorySearch.toLowerCase())) return false;
        return true;
    });
    if (!items.length) {
        container.innerHTML += '<div style="text-align:center;padding:40px;color:#6b6b7b"><div style="font-size:64px">🎒</div><p>Ничего не найдено</p></div>';
        return;
    }
    items.forEach(item => {
        const realIndex = state.inventory.indexOf(item);
        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <span class="item-icon">${item.icon}</span>
            <div class="item-info">
                <div class="item-name ${item.rarity === 'mythic' ? 'mythic' : ''}">${item.name} ${item.qty > 1 ? '(x' + item.qty + ')' : ''}</div>
                <div class="item-price">💰 ${item.price ?? '?'}</div>
                <div class="item-type">${item.type} | ${item.rarity}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
                <button class="btn btn-sell" onclick="sellItem(${realIndex})">Продать</button>
                <button class="btn btn-list" onclick="openSellModal(${realIndex})">Выставить</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function showCrafts() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <h2 style="text-align:center;margin-bottom:16px">🛠️ Крафты</h2>
            ${CRAFT_RECIPES.map(recipe => {
                const result = ITEMS.find(i => i.id === recipe.resultId);
                const ingredientsText = recipe.ingredients.map(ing => {
                    const ingItem = ITEMS.find(i => i.id === ing.id);
                    return `${ingItem.icon} ${ingItem.name} x${ing.qty}`;
                }).join(' + ');
                const canCraft = recipe.ingredients.every(ing => {
                    const count = state.inventory.filter(i => i.id === ing.id).reduce((sum, i) => sum + (i.qty || 1), 0);
                    return count >= ing.qty;
                });
                return `
                    <div class="item-card">
                        <div class="item-info">
                            <div class="item-name ${result.rarity === 'mythic' ? 'mythic' : ''}">${result.icon} ${result.name}</div>
                            <div class="item-type">${ingredientsText}</div>
                        </div>
                        <button class="btn btn-craft" ${canCraft ? '' : 'disabled style="opacity:.5"'} onclick="craftItem(${recipe.id})">Скрафтить</button>
                    </div>
                `;
            }).join('')}
            <button class="btn btn-secondary" style="margin-top:12px" onclick="this.closest('.modal').remove()">Закрыть</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function craftItem(recipeId) {
    const recipe = CRAFT_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return;
    const canCraft = recipe.ingredients.every(ing => {
        const count = state.inventory.filter(i => i.id === ing.id).reduce((sum, i) => sum + (i.qty || 1), 0);
        return count >= ing.qty;
    });
    if (!canCraft) { showToast('Недостаточно материалов!', 'error'); return; }
    recipe.ingredients.forEach(ing => {
        let remaining = ing.qty;
        for (let i = state.inventory.length - 1; i >= 0 && remaining > 0; i--) {
            if (state.inventory[i].id === ing.id) {
                const item = state.inventory[i];
                const qty = item.qty || 1;
                if (qty <= remaining) {
                    remaining -= qty;
                    state.inventory.splice(i, 1);
                } else {
                    item.qty -= remaining;
                    remaining = 0;
                }
            }
        }
    });
    const resultItem = ITEMS.find(i => i.id === recipe.resultId);
    state.inventory.push({ ...resultItem, qty: 1 });
    state.stats.itemsReceived++;
    save();
    document.querySelector('.modal').remove();
    renderInventory();
    showToast(`✅ Скрафчено: ${resultItem.name}!`, 'success');
    sendToBot({ action: 'craft', recipeId: recipe.id, resultId: resultItem.id });
}

function sellItem(index) {
    const item = state.inventory[index];
    if (item.price === null || item.price === undefined) { showToast('Нельзя продать этот предмет!', 'error'); return; }
    const price = Math.floor(item.price * 0.6);
    showConfirmModal(item.icon, `Продать ${item.name}?`, `+💰 ${price}`, () => {
        state.inventory.splice(index, 1);
        state.balance += price;
        state.stats.totalEarned += price;
        updateBalance();
        save();
        renderInventory();
        showToast('✅ +💰 ' + price, 'success');
        sendToBot({ action: 'sell', itemId: item.id, price: price });
    });
}

function openSellModal(index) {
    const item = state.inventory[index];
    if (item.price === null || item.price === undefined) { showToast('Нельзя выставить этот предмет!', 'error'); return; }
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <h2 style="text-align:center;margin-bottom:16px">📊 Выставить на рынок</h2>
            <p style="text-align:center;margin-bottom:16px">${item.icon} ${item.name}</p>
            <input id="sell-price" type="number" class="form-input" value="${item.price}" placeholder="Цена">
            <button class="btn btn-primary" style="margin-bottom:8px" onclick="confirmSell(${index})">Выставить</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmSell(index) {
    const price = parseInt(document.getElementById('sell-price').value);
    if (!price || price < 1) { showToast('Введите цену!', 'error'); return; }
    const item = state.inventory[index];
    state.inventory.splice(index, 1);
    state.market.push({ id: Date.now(), item: item, seller: 'Вы', price: price });
    document.querySelector('.modal').remove();
    save();
    renderInventory();
    showToast('✅ Выставлено за 💰 ' + price, 'success');
    sendToBot({ action: 'list_market', itemId: item.id, price: price });
}

// ==================== РЫНОК ====================
function renderMarket() {
    const container = document.getElementById('market-list');
    container.innerHTML = '';
    if (!state.market.length) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#6b6b7b"><div style="font-size:64px">📊</div><p>Рынок пуст</p></div>';
        return;
    }
    state.market.forEach((listing, index) => {
        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <span class="item-icon">${listing.item.icon}</span>
            <div class="item-info">
                <div class="item-name ${listing.item.rarity === 'mythic' ? 'mythic' : ''}">${listing.item.name}</div>
                <div class="item-price">💰 ${listing.price}</div>
                <div class="item-type">${listing.seller}</div>
            </div>
            ${listing.seller === 'Вы' 
                ? '<button class="btn btn-remove" onclick="removeListing(' + index + ')">Снять</button>'
                : '<button class="btn btn-buy" onclick="buyItem(' + index + ')">Купить</button>'}
        `;
        container.appendChild(div);
    });
}

function buyItem(index) {
    const listing = state.market[index];
    if (state.balance < listing.price) { showToast('Недостаточно монет!', 'error'); return; }
    showConfirmModal(listing.item.icon, `Купить ${listing.item.name}?`, `-💰 ${listing.price}`, () => {
        state.balance -= listing.price;
        state.inventory.push({ ...listing.item, qty: 1 });
        state.market.splice(index, 1);
        updateBalance();
        save();
        renderMarket();
        showToast('✅ Куплено!', 'success');
        sendToBot({ action: 'buy_market', listingId: listing.id, price: listing.price });
    });
}

function removeListing(index) {
    const listing = state.market[index];
    state.inventory.push({ ...listing.item, qty: 1 });
    state.market.splice(index, 1);
    save();
    renderMarket();
    showToast('✅ Снято', 'success');
    sendToBot({ action: 'remove_listing', listingId: listing.id });
}

// ==================== ЧАТ ====================
function setChatMode(mode) {
    currentChatMode = mode;
    document.getElementById('chat-tab-general').classList.toggle('active', mode === 'general');
    document.getElementById('chat-tab-private').classList.toggle('active', mode === 'private');
    renderChat();
}

function renderChat() {
    const container = document.getElementById('chat-list');
    container.innerHTML = '';
    if (currentChatMode === 'general') {
        container.innerHTML = `
            <div class="chat-messages" id="chat-messages">
                ${state.chatMessages.map(msg => {
                    const isMy = msg.user === state.username;
                    return `<div class="chat-msg ${isMy ? 'my-msg' : 'other-msg'}">
                        <div class="chat-user">${msg.user}</div>
                        <div class="chat-bubble">${msg.text}</div>
                        <div class="chat-time">${msg.time}</div>
                    </div>`;
                }).join('')}
            </div>
            <div style="display:flex;gap:8px">
                <input id="chat-input" class="form-input" placeholder="Сообщение..." style="flex:1;margin-bottom:0">
                <button class="btn btn-primary" style="width:auto;padding:12px" onclick="sendChatMessage()">➤</button>
            </div>
        `;
        const messages = document.getElementById('chat-messages');
        if (messages) messages.scrollTop = messages.scrollHeight;
    } else {
        container.innerHTML = `
            <div style="margin-bottom:8px">
                <input id="private-recipient" class="form-input" placeholder="Ник собеседника">
                <button class="btn btn-secondary" onclick="openPrivateChat()">Открыть ЛС</button>
            </div>
            <div id="private-chat-area">${activePrivateChat ? renderPrivateMessages(activePrivateChat) : '<p style="text-align:center;color:#6b6b7b">Выберите собеседника</p>'}</div>
        `;
    }
}

function renderPrivateMessages(recipient) {
    const msgs = state.privateMessages[recipient] || [];
    return `
        <div class="chat-messages">
            ${msgs.map(msg => {
                const isMy = msg.from === state.username;
                return `<div class="chat-msg ${isMy ? 'my-msg' : 'other-msg'}">
                    <div class="chat-user">${msg.from}</div>
                    <div class="chat-bubble">${msg.text}</div>
                    <div class="chat-time">${msg.time}</div>
                </div>`;
            }).join('')}
        </div>
        <div style="display:flex;gap:8px">
            <input id="private-input" class="form-input" placeholder="Сообщение..." style="flex:1;margin-bottom:0">
            <button class="btn btn-primary" style="width:auto;padding:12px" onclick="sendPrivateMessage('${recipient}')">➤</button>
        </div>
    `;
}

function openPrivateChat() {
    const recipient = document.getElementById('private-recipient').value.trim();
    if (!recipient) { showToast('Введите ник!', 'error'); return; }
    activePrivateChat = recipient;
    document.getElementById('private-chat-area').innerHTML = renderPrivateMessages(recipient);
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    const msg = { user: state.username || 'Вы', text, time: new Date().toLocaleTimeString() };
    state.chatMessages.push(msg);
    save();
    input.value = '';
    renderChat();
    sendToBot({ action: 'chat_message', message: text, server: state.currentServer });
}

function sendPrivateMessage(recipient) {
    const input = document.getElementById('private-input');
    const text = input.value.trim();
    if (!text) return;
    if (!state.privateMessages[recipient]) state.privateMessages[recipient] = [];
    state.privateMessages[recipient].push({ from: state.username || 'Вы', text, time: new Date().toLocaleTimeString() });
    save();
    document.getElementById('private-chat-area').innerHTML = renderPrivateMessages(recipient);
}

// ==================== НАСТРОЙКИ ====================
function renderSettings() {
    const container = document.getElementById('settings-list');
    container.innerHTML = `
        <div class="settings-section">
            <h3 class="settings-title">👤 Профиль</h3>
            <div class="settings-row"><span>Ник</span><span>${state.username || 'Гость'}</span></div>
            <div class="settings-row"><span>Баланс</span><span style="color:#ffd700;">💰 ${state.balance}</span></div>
            <div class="settings-row"><span>Сервер</span><span>${state.currentServer ? state.currentServer.toUpperCase() : 'Не выбран'}</span></div>
        </div>
        <div class="settings-section">
            <h3 class="settings-title">⚙️ Настройки</h3>
            <div class="settings-row"><span>🔊 Звук</span><div class="switch ${state.sound ? 'active' : ''}" onclick="state.sound = !state.sound; save(); renderSettings();"></div></div>
            <div class="settings-row"><span>🔔 Уведомления</span><div class="switch ${state.notifications ? 'active' : ''}" onclick="state.notifications = !state.notifications; save(); renderSettings();"></div></div>
        </div>
        <div class="settings-section">
            <h3 class="settings-title">📊 Статистика</h3>
            <div class="settings-row"><span>Кейсов открыто</span><span>${state.stats.casesOpened}</span></div>
            <div class="settings-row"><span>Предметов</span><span>${state.inventory.length}</span></div>
            <div class="settings-row"><span>Потрачено</span><span style="color:#ef4444;">-💰 ${state.stats.totalSpent}</span></div>
            <div class="settings-row"><span>Заработано</span><span style="color:#10b981;">+💰 ${state.stats.totalEarned}</span></div>
        </div>
        <div class="settings-section">
            <h3 class="settings-title">📞 Поддержка</h3>
            <button class="btn btn-primary" onclick="showSupportForm()">💬 Написать в поддержку</button>
        </div>
        <div class="settings-section">
            <h3 class="settings-title">🚪 Сервер</h3>
            <button class="btn btn-primary" onclick="exitServer()">Выйти из сервера</button>
        </div>
        ${state.isOwner || state.isAdmin ? `
        <div class="settings-section">
            <h3 class="settings-title">🔐 Админ-панель</h3>
            <button class="btn btn-primary" onclick="openAdminPanel()">🔧 Открыть админ-панель</button>
            <button class="btn btn-secondary" onclick="logoutAdmin()">Выйти из админки</button>
        </div>` : `
        <div class="settings-section">
            <h3 class="settings-title">🔐 Админ-панель</h3>
            <button class="btn btn-secondary" onclick="openAdminLogin()">Войти как админ</button>
        </div>`}
        ${state.warnings > 0 ? `
        <div class="settings-section">
            <h3 class="settings-title">⚠️ Предупреждения</h3>
            <div class="settings-row"><span>Количество</span><span>${state.warnings}/3</span></div>
        </div>` : ''}
    `;
}

function showSupportForm() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <h2 style="text-align:center;margin-bottom:16px">📞 Поддержка</h2>
            <input id="support-subject" class="form-input" placeholder="Тема">
            <textarea id="support-message" class="form-input" placeholder="Сообщение..."></textarea>
            <button class="btn btn-primary" style="margin-bottom:8px" onclick="sendSupportMessage()">📤 Отправить</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function sendSupportMessage() {
    const subject = document.getElementById('support-subject').value.trim();
    const message = document.getElementById('support-message').value.trim();
    if (!subject || !message) { showToast('Заполните все поля!', 'error'); return; }
    addSupportTicket(subject, message);
    document.querySelector('.modal').remove();
    showToast('✅ Отправлено!', 'success');
}

// ==================== ДОНАТ ====================
function showDonate() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <h2 style="text-align:center;margin-bottom:16px">⭐ Пополнение</h2>
            <button class="btn btn-primary" style="margin-bottom:8px" onclick="donate(10)">10 ⭐ = 💰 500</button>
            <button class="btn btn-primary" style="margin-bottom:8px" onclick="donate(50)">50 ⭐ = 💰 3000</button>
            <button class="btn btn-primary" style="margin-bottom:8px" onclick="donate(100)">100 ⭐ = 💰 10000</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Закрыть</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function donate(stars) {
    document.querySelector('.modal').remove();
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink('https://t.me/storm_cases_bot?start=donate_' + stars);
    }
}

// ==================== МОДАЛЬНОЕ ПОДТВЕРЖДЕНИЕ ====================
function showConfirmModal(icon, text, priceText, callback) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content" style="text-align:center">
            <div style="font-size:60px;margin-bottom:16px">${icon}</div>
            <p style="margin-bottom:8px">${text}</p>
            <p style="color:#ffd700;font-size:20px;font-weight:700;margin-bottom:16px">${priceText}</p>
            <button class="btn btn-primary" style="margin-bottom:8px" id="confirm-btn">Подтвердить</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('confirm-btn').onclick = () => { modal.remove(); callback(); };
}

function closeModal(modalElement) {
    if (modalElement && modalElement.classList.contains('modal')) {
        modalElement.remove();
    } else if (modalElement) {
        const modal = modalElement.closest('.modal');
        if (modal) modal.remove();
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.remove());
}

// ==================== ЗАПУСК ====================
initTelegram();
load();
updateBalance();

if (!state.username) {
    showRegistration();
} else if (!state.currentServer) {
    initServerSelection();
} else {
    document.getElementById('server-name').textContent = state.currentServer.toUpperCase();
    renderCases();
}
