// ==================== АДМИН-ПАНЕЛЬ ====================
let isAdminLogged = false;
let adminServer = null;
let currentAdminTab = 'players';
let actionPlayerId = null;
let actionType = null;

// Инициализация данных при необходимости
function ensureAdminData() {
    if (!state.adminLogs) state.adminLogs = [];
    if (!state.players) state.players = [];
    if (!state.supportTickets) state.supportTickets = [];
    if (!state.servers) state.servers = [...SERVERS];
    if (!state.chatMessages) state.chatMessages = [];
    if (!state.privateMessages) state.privateMessages = {};
}

// Открыть окно входа админа
function openAdminLogin() {
    if (!state.currentServer) {
        showToast('Сначала выберите сервер!', 'error');
        return;
    }
    document.getElementById('admin-login-modal').classList.remove('hidden');
}

function closeAdminLogin() {
    document.getElementById('admin-login-modal').classList.add('hidden');
}

function adminLogin() {
    const password = document.getElementById('admin-password').value.trim();
    if (!password) {
        showToast('Введите пароль', 'error');
        return;
    }
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

function closeAdminPanel() {
    document.getElementById('admin-panel').classList.add('hidden');
}

function openAdminPanel() {
    if (!isAdminLogged || adminServer !== state.currentServer) {
        showToast('Вы не авторизованы как админ на этом сервере', 'error');
        return;
    }
    ensureAdminData();
    document.getElementById('admin-panel').classList.remove('hidden');
    switchAdminTab('players');
}

function switchAdminTab(tab) {
    currentAdminTab = tab;
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    const content = document.getElementById('admin-content');
    content.innerHTML = '';
    if (tab === 'players') renderAdminPlayers();
    else if (tab === 'logs') renderAdminLogs();
    else if (tab === 'give') renderAdminGive();
    else if (tab === 'tickets') renderAdminTickets();
    else if (tab === 'chat') renderAdminChat();
    else if (tab === 'servers') renderAdminServers();
    else if (tab === 'economy') renderAdminEconomy();
}

function addAdminLog(action, details) {
    ensureAdminData();
    state.adminLogs.push({
        time: new Date().toLocaleString(),
        action: action,
        details: details,
        admin: state.username || 'Администратор'
    });
    save();
}

// ===== Вкладка Игроки =====
function renderAdminPlayers() {
    const content = document.getElementById('admin-content');
    if (!state.players || state.players.length === 0) {
        state.players = [
            { id: 1, name: 'Игрок1', warnings: 0, muted: false, banned: false, balance: 500, server: state.currentServer },
            { id: 2, name: 'Игрок2', warnings: 1, muted: false, banned: false, balance: 300, server: state.currentServer },
            { id: 3, name: 'Игрок3', warnings: 0, muted: true, banned: false, balance: 700, server: state.currentServer },
        ];
        save();
    }
    const playersOnServer = state.players.filter(p => p.server === state.currentServer);
    if (playersOnServer.length === 0) {
        content.innerHTML = '<p style="text-align:center;color:#6b6b7b">Нет игроков на этом сервере</p>';
        return;
    }
    playersOnServer.forEach(player => {
        const row = document.createElement('div');
        row.className = 'player-row';
        row.innerHTML = `
            <span><b>${player.name}</b> (ID: ${player.id})</span>
            <span>Баланс: 💰 ${player.balance} | Предупреждения: ${player.warnings}/3 | ${player.muted ? '🔇 Мут' : ''} ${player.banned ? '⛔ Бан' : ''}</span>
            <div>
                <button class="btn admin-btn btn-remove" onclick="openPlayerAction(${player.id}, 'warn')">⚠️ Предупредить</button>
                <button class="btn admin-btn btn-sell" onclick="openPlayerAction(${player.id}, 'mute')">🔇 Мут</button>
                <button class="btn admin-btn btn-remove" onclick="openPlayerAction(${player.id}, 'ban')">⛔ Бан</button>
                ${player.muted ? `<button class="btn admin-btn btn-buy" onclick="openPlayerAction(${player.id}, 'unmute')">🔊 Снять мут</button>` : ''}
                ${player.banned ? `<button class="btn admin-btn btn-buy" onclick="openPlayerAction(${player.id}, 'unban')">✅ Разбан</button>` : ''}
            </div>
        `;
        content.appendChild(row);
    });
}

function openPlayerAction(playerId, type) {
    actionPlayerId = playerId;
    actionType = type;
    const modal = document.getElementById('player-action-modal');
    modal.classList.remove('hidden');
    const titleMap = {
        warn: '⚠️ Выдать предупреждение',
        mute: '🔇 Замутить',
        ban: '⛔ Забанить',
        unmute: '🔊 Снять мут',
        unban: '✅ Разбанить'
    };
    document.getElementById('player-action-title').textContent = titleMap[type] || 'Действие';
    const durationField = document.getElementById('player-action-duration').closest('.form-group');
    if (type === 'unmute' || type === 'unban' || type === 'warn') {
        durationField.classList.add('hidden');
    } else {
        durationField.classList.remove('hidden');
    }
}

function closePlayerAction() {
    document.getElementById('player-action-modal').classList.add('hidden');
    actionPlayerId = null;
    actionType = null;
}

function executePlayerAction() {
    const reason = document.getElementById('player-action-reason').value.trim();
    if (!reason && actionType !== 'unmute' && actionType !== 'unban') {
        showToast('Укажите причину!', 'error');
        return;
    }
    const duration = parseInt(document.getElementById('player-action-duration').value) || 0;
    const player = state.players.find(p => p.id === actionPlayerId && p.server === state.currentServer);
    if (!player) {
        showToast('Игрок не найден', 'error');
        return;
    }
    switch (actionType) {
        case 'warn':
            player.warnings = (player.warnings || 0) + 1;
            addAdminLog('Предупреждение', `${player.name}: ${reason}`);
            if (player.warnings >= 3) {
                player.banned = true;
                addAdminLog('Авто-бан', `${player.name} получил 3 предупреждения`);
                showToast('Игрок получил 3 предупреждения и забанен на 7 дней', 'success');
            } else {
                showToast(`Игрок ${player.name} получил предупреждение (${player.warnings}/3)`, 'success');
            }
            break;
        case 'mute':
            player.muted = true;
            player.muteDuration = duration;
            addAdminLog('Мут', `${player.name} на ${duration} часов: ${reason}`);
            showToast('Игрок замучен', 'success');
            break;
        case 'ban':
            player.banned = true;
            player.banDuration = duration;
            addAdminLog('Бан', `${player.name} на ${duration} часов: ${reason}`);
            showToast('Игрок забанен', 'success');
            break;
        case 'unmute':
            player.muted = false;
            player.muteDuration = 0;
            addAdminLog('Снят мут', player.name);
            showToast('Мут снят', 'success');
            break;
        case 'unban':
            player.banned = false;
            player.banDuration = 0;
            addAdminLog('Разбан', player.name);
            showToast('Игрок разбанен', 'success');
            break;
    }
    save();
    closePlayerAction();
    switchAdminTab('players');
}

// ===== Вкладка Логи =====
function renderAdminLogs() {
    const content = document.getElementById('admin-content');
    if (!state.adminLogs || state.adminLogs.length === 0) {
        content.innerHTML = '<p style="text-align:center;color:#6b6b7b">Логи пусты</p>';
        return;
    }
    const logsHtml = state.adminLogs.map(log => `
        <div class="item-card" style="flex-direction:column; align-items:flex-start;">
            <div style="display:flex; justify-content:space-between; width:100%;">
                <span class="item-name">${log.action}</span>
                <span class="chat-time">${log.time}</span>
            </div>
            <div class="item-type">${log.details}</div>
            <div style="font-size:11px; color:#6b6b7b">Админ: ${log.admin}</div>
        </div>
    `).join('');
    content.innerHTML = logsHtml;
}

// ===== Вкладка Выдать =====
function renderAdminGive() {
    const content = document.getElementById('admin-content');
    const itemOptions = ITEMS.map(item => `<option value="${item.id}">${item.icon} ${item.name} (${item.rarity})</option>`).join('');
    content.innerHTML = `
        <p style="margin-bottom:12px">Выберите игрока и что выдать:</p>
        <div class="form-group">
            <label class="form-label">Ник или ID игрока</label>
            <input id="give-target" class="form-input" placeholder="Введите ник или ID">
        </div>
        <div class="form-group">
            <label class="form-label">Тип выдачи</label>
            <select id="give-type" class="form-input" onchange="toggleGiveFields()">
                <option value="coins">💰 Монеты</option>
                <option value="item">🎁 Предмет</option>
            </select>
        </div>
        <div id="give-coins-field" class="form-group">
            <label class="form-label">Количество монет</label>
            <input id="give-coins" type="number" class="form-input" placeholder="Сумма">
        </div>
        <div id="give-item-field" class="form-group hidden">
            <label class="form-label">Предмет</label>
            <select id="give-item" class="form-input">${itemOptions}</select>
        </div>
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
    if (!target) {
        showToast('Введите игрока', 'error');
        return;
    }
    let player = state.players.find(p => p.name === target || p.id === parseInt(target));
    if (!player) {
        player = { id: state.players.length + 1, name: target, warnings: 0, muted: false, banned: false, balance: 0, server: state.currentServer };
        state.players.push(player);
    }
    if (type === 'coins') {
        const amount = parseInt(document.getElementById('give-coins').value);
        if (!amount || amount <= 0) {
            showToast('Введите положительное количество монет', 'error');
            return;
        }
        player.balance = (player.balance || 0) + amount;
        addAdminLog('Выдача монет', `${player.name}: +${amount} монет`);
        showToast(`Выдано ${amount} монет игроку ${player.name}`, 'success');
    } else {
        const itemId = parseInt(document.getElementById('give-item').value);
        const item = ITEMS.find(i => i.id === itemId);
        if (!item) {
            showToast('Предмет не найден', 'error');
            return;
        }
        addAdminLog('Выдача предмета', `${player.name}: ${item.name}`);
        showToast(`Выдан предмет ${item.name} игроку ${player.name}`, 'success');
    }
    save();
    switchAdminTab('give');
}

// ===== Вкладка Поддержка =====
function renderAdminTickets() {
    const content = document.getElementById('admin-content');
    if (!state.supportTickets) state.supportTickets = [];
    if (state.supportTickets.length === 0) {
        content.innerHTML = '<p style="text-align:center;color:#6b6b7b">Нет открытых обращений</p>';
        return;
    }
    const ticketsHtml = state.supportTickets.map(ticket => `
        <div class="item-card" style="flex-direction:column; align-items:flex-start;">
            <div style="display:flex; justify-content:space-between; width:100%;">
                <span class="item-name">#${ticket.id} ${ticket.subject}</span>
                <span class="chat-time">${ticket.time}</span>
            </div>
            <div class="item-type">От: ${ticket.user} | ${ticket.status}</div>
            <p style="font-size:13px; margin-top:4px">${ticket.message}</p>
            <div style="display:flex; gap:6px; margin-top:8px;">
                <button class="btn admin-btn btn-buy" onclick="resolveTicket(${ticket.id})">Отметить решённым</button>
                <button class="btn admin-btn btn-remove" onclick="deleteTicket(${ticket.id})">Удалить</button>
            </div>
        </div>
    `).join('');
    content.innerHTML = ticketsHtml;
}

function resolveTicket(id) {
    const ticket = state.supportTickets.find(t => t.id === id);
    if (ticket) {
        ticket.status = 'resolved';
        addAdminLog('Решение тикета', `#${id}: ${ticket.subject}`);
        save();
        switchAdminTab('tickets');
    }
}

function deleteTicket(id) {
    state.supportTickets = state.supportTickets.filter(t => t.id !== id);
    addAdminLog('Удаление тикета', `#${id}`);
    save();
    switchAdminTab('tickets');
}

// ===== Вкладка Чат =====
function renderAdminChat() {
    const content = document.getElementById('admin-content');
    if (!state.chatMessages || state.chatMessages.length === 0) {
        content.innerHTML = '<p style="text-align:center;color:#6b6b7b">Чат пуст</p>';
        return;
    }
    content.innerHTML = `
        <button class="btn btn-remove" onclick="clearChat()">🧹 Очистить чат</button>
        <div style="margin-top:12px;">
            ${state.chatMessages.map((msg, index) => `
                <div class="item-card" style="flex-direction:column; align-items:flex-start;">
                    <div style="display:flex; justify-content:space-between; width:100%;">
                        <span class="item-name">${msg.user}</span>
                        <span class="chat-time">${msg.time}</span>
                    </div>
                    <div style="font-size:13px;">${msg.text}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function clearChat() {
    if (confirm('Очистить весь чат?')) {
        state.chatMessages = [];
        addAdminLog('Очистка чата', 'Все сообщения удалены');
        save();
        switchAdminTab('chat');
        showToast('Чат очищен', 'success');
    }
}

// ===== Вкладка Серверы =====
function renderAdminServers() {
    const content = document.getElementById('admin-content');
    const servers = state.servers || SERVERS;
    content.innerHTML = servers.map(server => `
        <div class="item-card" style="flex-direction:column; align-items:flex-start;">
            <div style="display:flex; justify-content:space-between; width:100%;">
                <span class="item-name">${server.name}</span>
                <span class="item-type">Онлайн: ${server.playersOnline}/${server.maxPlayers}</span>
            </div>
            <div style="display:flex; gap:6px; margin-top:8px;">
                <button class="btn admin-btn btn-sell" onclick="adminAction('warn', ${server.id})">Перезапустить</button>
                <button class="btn admin-btn btn-remove" onclick="adminAction('ban', ${server.id})">Отключить</button>
            </div>
        </div>
    `).join('');
}

// ===== Вкладка Экономика =====
function renderAdminEconomy() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
        <p style="margin-bottom:12px">Управление экономикой сервера</p>
        <div class="form-group">
            <label class="form-label">Начальный баланс</label>
            <input id="economy-start-balance" class="form-input" type="number" value="${state.startBalance || 500}">
        </div>
        <div class="form-group">
            <label class="form-label">Множитель продажи (0.1 - 1.0)</label>
            <input id="economy-sell-multiplier" class="form-input" type="number" step="0.1" value="${state.sellMultiplier || 0.6}">
        </div>
        <button class="btn btn-primary" onclick="saveEconomySettings()">Сохранить</button>
    `;
}

function saveEconomySettings() {
    state.startBalance = parseInt(document.getElementById('economy-start-balance').value) || 500;
    state.sellMultiplier = parseFloat(document.getElementById('economy-sell-multiplier').value) || 0.6;
    addAdminLog('Изменение экономики', `Начальный баланс: ${state.startBalance}, множитель: ${state.sellMultiplier}`);
    save();
    showToast('Экономика обновлена', 'success');
}

// ===== Интеграция с поддержкой =====
function addSupportTicket(subject, message) {
    ensureAdminData();
    const ticket = {
        id: Date.now(),
        subject: subject,
        message: message,
        user: state.username || 'Гость',
        time: new Date().toLocaleString(),
        status: 'open'
    };
    state.supportTickets.push(ticket);
    save();
}

// Переопределяем функцию отправки поддержки
const originalSendSupportMessage = window.sendSupportMessage;
window.sendSupportMessage = function() {
    const subject = document.getElementById('support-subject').value.trim();
    const message = document.getElementById('support-message').value.trim();
    if (!subject || !message) {
        showToast('Заполните все поля!', 'error');
        return;
    }
    addSupportTicket(subject, message);
    document.querySelector('.modal').remove();
    showToast('✅ Отправлено!', 'success');
};

// Выход из админки
function logoutAdmin() {
    isAdminLogged = false;
    adminServer = null;
    showToast('Вы вышли из админ-панели', 'info');
    renderSettings();
}

// Инициализация при загрузке
ensureAdminData();