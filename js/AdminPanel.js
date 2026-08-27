// ==================== АДМИН-ПАНЕЛЬ (расширенная) ====================
let isAdminLogged = false;
let adminServer = null;
let currentAdminTab = 'players';
let actionPlayerId = null;
let actionType = null;

function ensureAdminData() {
    if (!state.adminLogs) state.adminLogs = [];
    if (!state.players) state.players = [];
    if (!state.supportTickets) state.supportTickets = [];
    if (!state.servers) state.servers = [...SERVERS];
    if (!state.chatMessages) state.chatMessages = [];
    if (!state.privateMessages) state.privateMessages = {};
    if (!state.admins) state.admins = []; // список админов, назначаемых владельцем
}

// ==================== ВХОД / ВЫХОД ====================
function openAdminLogin() {
    if (!state.currentServer) { showToast('Сначала выберите сервер!', 'error'); return; }
    document.getElementById('admin-login-modal').classList.remove('hidden');
}
function closeAdminLogin() { document.getElementById('admin-login-modal').classList.add('hidden'); }

function adminLogin() {
    const password = document.getElementById('admin-password').value.trim();
    if (!password) { showToast('Введите пароль', 'error'); return; }
    const server = state.currentServer;
    const valid = ADMIN_PASSWORDS[server] && Object.values(ADMIN_PASSWORDS[server]).includes(password);
    if (valid) {
        isAdminLogged = true;
        adminServer = server;
        closeAdminLogin();
        showToast('✅ Вы вошли как администратор', 'success');
        addAdminLog('Вход администратора', `Сервер: ${server}`);
        renderSettings();
    } else {
        showToast('Неверный пароль для этого сервера', 'error');
    }
}

function logoutAdmin() {
    isAdminLogged = false;
    adminServer = null;
    showToast('Вы вышли из админ-панели', 'info');
    renderSettings();
}

// ==================== ОТКРЫТИЕ ПАНЕЛИ ====================
function openAdminPanel() {
    if (!isAdminLogged || adminServer !== state.currentServer) {
        showToast('Вы не авторизованы как админ на этом сервере', 'error');
        return;
    }
    ensureAdminData();
    document.getElementById('admin-panel').classList.remove('hidden');
    switchAdminTab('players');
}
function closeAdminPanel() { document.getElementById('admin-panel').classList.add('hidden'); }

function switchAdminTab(tab) {
    currentAdminTab = tab;
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    const content = document.getElementById('admin-content');
    content.innerHTML = '';
    switch(tab) {
        case 'players': renderAdminPlayers(); break;
        case 'logs': renderAdminLogs(); break;
        case 'give': renderAdminGive(); break;
        case 'tickets': renderAdminTickets(); break;
        case 'chat': renderAdminChat(); break;
        case 'servers': renderAdminServers(); break;
        case 'economy': renderAdminEconomy(); break;
        case 'admins': renderAdminAdmins(); break; // новая вкладка
    }
}

// ==================== ЛОГИ ====================
function addAdminLog(action, details) {
    ensureAdminData();
    state.adminLogs.push({ time: new Date().toLocaleString(), action, details, admin: state.username || 'Администратор' });
    save();
}

// ==================== ИГРОКИ ====================
function renderAdminPlayers() {
    const content = document.getElementById('admin-content');
    if (!state.players.length) {
        state.players = [
            { id: 1, name: 'Игрок1', warnings: 0, muted: false, banned: false, balance: 500, server: state.currentServer },
            { id: 2, name: 'Игрок2', warnings: 1, muted: false, banned: false, balance: 300, server: state.currentServer },
            { id: 3, name: 'Игрок3', warnings: 0, muted: true, banned: false, balance: 700, server: state.currentServer },
        ];
        save();
    }
    const players = state.players.filter(p => p.server === state.currentServer);
    content.innerHTML = players.length ? '' : '<p style="text-align:center;color:#6b6b7b">Нет игроков</p>';
    players.forEach(player => {
        const row = document.createElement('div');
        row.className = 'player-row';
        row.innerHTML = `
            <span><b>${player.name}</b> (ID: ${player.id})</span>
            <span>💰 ${player.balance} | ⚠️ ${player.warnings}/3 | ${player.muted?'🔇':''}${player.banned?'⛔':''}</span>
            <div>
                <button class="btn admin-btn btn-remove" onclick="openPlayerAction(${player.id},'warn')">⚠️</button>
                <button class="btn admin-btn btn-sell" onclick="openPlayerAction(${player.id},'mute')">🔇</button>
                <button class="btn admin-btn btn-remove" onclick="openPlayerAction(${player.id},'ban')">⛔</button>
                ${player.muted ? `<button class="btn admin-btn btn-buy" onclick="openPlayerAction(${player.id},'unmute')">🔊</button>` : ''}
                ${player.banned ? `<button class="btn admin-btn btn-buy" onclick="openPlayerAction(${player.id},'unban')">✅</button>` : ''}
            </div>
        `;
        content.appendChild(row);
    });
}

function openPlayerAction(playerId, type) {
    actionPlayerId = playerId; actionType = type;
    document.getElementById('player-action-modal').classList.remove('hidden');
    const titles = { warn:'⚠️ Предупреждение', mute:'🔇 Мут', ban:'⛔ Бан', unmute:'🔊 Снять мут', unban:'✅ Разбан' };
    document.getElementById('player-action-title').textContent = titles[type] || 'Действие';
    const durField = document.getElementById('player-action-duration').closest('.form-group');
    if (['unmute','unban','warn'].includes(type)) durField.classList.add('hidden');
    else durField.classList.remove('hidden');
}
function closePlayerAction() { document.getElementById('player-action-modal').classList.add('hidden'); actionPlayerId=null; actionType=null; }

function executePlayerAction() {
    const reason = document.getElementById('player-action-reason').value.trim();
    if (!reason && !['unmute','unban'].includes(actionType)) { showToast('Укажите причину!', 'error'); return; }
    const duration = parseInt(document.getElementById('player-action-duration').value) || 0;
    const player = state.players.find(p => p.id === actionPlayerId && p.server === state.currentServer);
    if (!player) { showToast('Игрок не найден', 'error'); return; }
    switch(actionType) {
        case 'warn':
            player.warnings = (player.warnings||0)+1;
            addAdminLog('Предупреждение', `${player.name}: ${reason}`);
            if (player.warnings >= 3) { player.banned = true; addAdminLog('Авто-бан', `${player.name} 3 предупреждения`); showToast('Игрок забанен на 7 дней', 'success'); }
            else showToast(`Предупреждение (${player.warnings}/3)`, 'success');
            break;
        case 'mute': player.muted = true; player.muteDuration = duration; addAdminLog('Мут', `${player.name} на ${duration}ч: ${reason}`); showToast('Мут выдан', 'success'); break;
        case 'ban': player.banned = true; player.banDuration = duration; addAdminLog('Бан', `${player.name} на ${duration}ч: ${reason}`); showToast('Бан выдан', 'success'); break;
        case 'unmute': player.muted = false; player.muteDuration = 0; addAdminLog('Снят мут', player.name); showToast('Мут снят', 'success'); break;
        case 'unban': player.banned = false; player.banDuration = 0; addAdminLog('Разбан', player.name); showToast('Разбанен', 'success'); break;
    }
    save(); closePlayerAction(); switchAdminTab('players');
}

// ==================== ЛОГИ ====================
function renderAdminLogs() {
    const content = document.getElementById('admin-content');
    const logs = state.adminLogs || [];
    if (!logs.length) { content.innerHTML = '<p style="text-align:center;color:#6b6b7b">Логи пусты</p>'; return; }
    content.innerHTML = logs.map(log => `
        <div class="item-card" style="flex-direction:column; align-items:flex-start;">
            <div style="display:flex; justify-content:space-between; width:100%;">
                <span class="item-name">${log.action}</span><span class="chat-time">${log.time}</span>
            </div>
            <div class="item-type">${log.details}</div>
            <div style="font-size:11px;color:#6b6b7b">Админ: ${log.admin}</div>
        </div>
    `).join('');
}

// ==================== ВЫДАЧА ====================
function renderAdminGive() {
    const content = document.getElementById('admin-content');
    const itemOptions = ITEMS.map(item => `<option value="${item.id}">${item.icon} ${item.name} (${item.rarity})</option>`).join('');
    content.innerHTML = `
        <div class="form-group"><label class="form-label">Ник или ID игрока</label><input id="give-target" class="form-input" placeholder="Введите ник или ID"></div>
        <div class="form-group"><label class="form-label">Тип выдачи</label><select id="give-type" class="form-input" onchange="toggleGiveFields()"><option value="coins">💰 Монеты</option><option value="item">🎁 Предмет</option></select></div>
        <div id="give-coins-field" class="form-group"><label class="form-label">Количество монет</label><input id="give-coins" type="number" class="form-input" placeholder="Сумма"></div>
        <div id="give-item-field" class="form-group hidden"><label class="form-label">Предмет</label><select id="give-item" class="form-input">${itemOptions}</select></div>
        <button class="btn btn-primary" onclick="executeGiveFromAdmin()">Выдать</button>
    `;
}
function toggleGiveFields() {
    const type = document.getElementById('give-type').value;
    document.getElementById('give-coins-field').classList.toggle('hidden', type !== 'coins');
    document.getElementById('give-item-field').classList.toggle('hidden', type !== 'item');
}
function executeGiveFromAdmin() {
    const target = document.getElementById('give-target').value.trim();
    const type = document.getElementById('give-type').value;
    if (!target) { showToast('Введите игрока', 'error'); return; }
    let player = state.players.find(p => p.name === target || p.id === parseInt(target));
    if (!player) { player = { id: state.players.length+1, name: target, warnings:0, muted:false, banned:false, balance:0, server:state.currentServer }; state.players.push(player); }
    if (type === 'coins') {
        const amount = parseInt(document.getElementById('give-coins').value);
        if (!amount || amount <= 0) { showToast('Введите сумму', 'error'); return; }
        player.balance = (player.balance||0) + amount;
        addAdminLog('Выдача монет', `${player.name}: +${amount}`);
        showToast(`Выдано ${amount} монет игроку ${player.name}`, 'success');
    } else {
        const itemId = parseInt(document.getElementById('give-item').value);
        const item = ITEMS.find(i => i.id === itemId);
        if (!item) { showToast('Предмет не найден', 'error'); return; }
        // в реальности предмет добавляется в инвентарь игрока, здесь просто лог
        addAdminLog('Выдача предмета', `${player.name}: ${item.name}`);
        showToast(`Выдан предмет ${item.name} игроку ${player.name}`, 'success');
    }
    save(); switchAdminTab('give');
}

// ==================== ТИКЕТЫ ====================
function renderAdminTickets() {
    const content = document.getElementById('admin-content');
    const tickets = state.supportTickets || [];
    if (!tickets.length) { content.innerHTML = '<p style="text-align:center;color:#6b6b7b">Нет обращений</p>'; return; }
    content.innerHTML = tickets.map(ticket => `
        <div class="item-card" style="flex-direction:column; align-items:flex-start;">
            <div style="display:flex; justify-content:space-between; width:100%;"><span class="item-name">#${ticket.id} ${ticket.subject}</span><span class="chat-time">${ticket.time}</span></div>
            <div class="item-type">От: ${ticket.user} | ${ticket.status}</div>
            <p style="font-size:13px; margin-top:4px">${ticket.message}</p>
            <div style="display:flex; gap:6px; margin-top:8px;">
                <button class="btn admin-btn btn-buy" onclick="resolveTicket(${ticket.id})">Решить</button>
                <button class="btn admin-btn btn-remove" onclick="deleteTicket(${ticket.id})">Удалить</button>
            </div>
        </div>
    `).join('');
}
function resolveTicket(id) {
    const ticket = state.supportTickets.find(t => t.id === id);
    if (ticket) { ticket.status = 'resolved'; addAdminLog('Решение тикета', `#${id}: ${ticket.subject}`); save(); switchAdminTab('tickets'); }
}
function deleteTicket(id) {
    state.supportTickets = state.supportTickets.filter(t => t.id !== id);
    addAdminLog('Удаление тикета', `#${id}`); save(); switchAdminTab('tickets');
}

// ==================== ЧАТ ====================
function renderAdminChat() {
    const content = document.getElementById('admin-content');
    if (!state.chatMessages.length) { content.innerHTML = '<p style="text-align:center;color:#6b6b7b">Чат пуст</p>'; return; }
    content.innerHTML = `<button class="btn btn-remove" onclick="clearChat()">🧹 Очистить чат</button><div style="margin-top:12px">${state.chatMessages.map(msg => `
        <div class="item-card" style="flex-direction:column; align-items:flex-start;"><div style="display:flex;justify-content:space-between;width:100%"><span class="item-name">${msg.user}</span><span class="chat-time">${msg.time}</span></div><div style="font-size:13px">${msg.text}</div></div>
    `).join('')}</div>`;
}
function clearChat() {
    if (confirm('Очистить весь чат?')) { state.chatMessages = []; addAdminLog('Очистка чата','Все сообщения удалены'); save(); switchAdminTab('chat'); showToast('Чат очищен','success'); }
}

// ==================== СЕРВЕРЫ ====================
function renderAdminServers() {
    const content = document.getElementById('admin-content');
    const servers = state.servers || SERVERS;
    content.innerHTML = servers.map(server => `
        <div class="item-card" style="flex-direction:column; align-items:flex-start;">
            <div style="display:flex; justify-content:space-between; width:100%;"><span class="item-name">${server.name}</span><span class="item-type">Онлайн: ${server.playersOnline}/${server.maxPlayers}</span></div>
            <div style="display:flex; gap:6px; margin-top:8px;"><button class="btn admin-btn btn-sell" onclick="restartServer('${server.id}')">Перезапустить</button><button class="btn admin-btn btn-remove" onclick="shutdownServer('${server.id}')">Отключить</button></div>
        </div>
    `).join('');
}
function restartServer(id) { addAdminLog('Перезапуск сервера', id); showToast('Сервер перезапущен', 'success'); }
function shutdownServer(id) { addAdminLog('Отключение сервера', id); showToast('Сервер отключён', 'success'); }

// ==================== ЭКОНОМИКА ====================
function renderAdminEconomy() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
        <div class="form-group"><label class="form-label">Начальный баланс</label><input id="economy-start-balance" class="form-input" type="number" value="${state.startBalance || 500}"></div>
        <div class="form-group"><label class="form-label">Множитель продажи (0.1 - 1.0)</label><input id="economy-sell-multiplier" class="form-input" type="number" step="0.1" value="${state.sellMultiplier || 0.6}"></div>
        <button class="btn btn-primary" onclick="saveEconomySettings()">Сохранить</button>
    `;
}
function saveEconomySettings() {
    state.startBalance = parseInt(document.getElementById('economy-start-balance').value) || 500;
    state.sellMultiplier = parseFloat(document.getElementById('economy-sell-multiplier').value) || 0.6;
    addAdminLog('Изменение экономики', `Баланс: ${state.startBalance}, множитель: ${state.sellMultiplier}`);
    save(); showToast('Экономика обновлена','success');
}

// ==================== УПРАВЛЕНИЕ АДМИНАМИ (для владельца) ====================
function renderAdminAdmins() {
    const content = document.getElementById('admin-content');
    const admins = state.admins || [];
    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:12px">
            <h3>Администраторы</h3>
            <button class="btn admin-btn btn-buy" onclick="showAddAdminForm()">➕ Добавить</button>
        </div>
        ${admins.length ? admins.map(admin => `
            <div class="player-row">
                <span>${admin.name} (ID: ${admin.id})</span>
                <span>Уровень: ${admin.level}</span>
                <button class="btn admin-btn btn-remove" onclick="removeAdmin(${admin.id})">Удалить</button>
            </div>
        `).join('') : '<p style="text-align:center;color:#6b6b7b">Нет админов</p>'}
    `;
}

function showAddAdminForm() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
        <h3 style="margin-bottom:12px">Новый админ</h3>
        <div class="form-group"><label class="form-label">Telegram ID</label><input id="new-admin-id" class="form-input" type="number" placeholder="ID"></div>
        <div class="form-group"><label class="form-label">Имя</label><input id="new-admin-name" class="form-input" placeholder="Ник"></div>
        <div class="form-group"><label class="form-label">Пароль</label><input id="new-admin-password" class="form-input" type="text" placeholder="Пароль"></div>
        <div class="form-group"><label class="form-label">Уровень (1-5)</label><input id="new-admin-level" class="form-input" type="number" min="1" max="5" value="1"></div>
        <button class="btn btn-primary" onclick="addNewAdmin()">Добавить</button>
        <button class="btn btn-secondary" style="margin-top:8px" onclick="switchAdminTab('admins')">Назад</button>
    `;
}

function addNewAdmin() {
    const id = document.getElementById('new-admin-id').value.trim();
    const name = document.getElementById('new-admin-name').value.trim();
    const password = document.getElementById('new-admin-password').value.trim();
    const level = parseInt(document.getElementById('new-admin-level').value);
    if (!id || !name || !password || !level) { showToast('Заполните все поля', 'error'); return; }
    if (!state.admins) state.admins = [];
    state.admins.push({ id: parseInt(id), name, password, level, server: state.currentServer });
    // обновить пароли на сервере (локально)
    if (!ADMIN_PASSWORDS[state.currentServer]) ADMIN_PASSWORDS[state.currentServer] = {};
    ADMIN_PASSWORDS[state.currentServer][name] = password;
    addAdminLog('Добавлен админ', `${name} (уровень ${level})`);
    save(); showToast('Админ добавлен', 'success'); switchAdminTab('admins');
}

function removeAdmin(adminId) {
    const admin = state.admins.find(a => a.id === adminId);
    if (admin) {
        state.admins = state.admins.filter(a => a.id !== adminId);
        delete ADMIN_PASSWORDS[state.currentServer][admin.name];
        addAdminLog('Удалён админ', admin.name);
        save(); switchAdminTab('admins');
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
ensureAdminData();
