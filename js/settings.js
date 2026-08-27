// ==================== STORM CASES - НАСТРОЙКИ ====================

// ===== ОТОБРАЖЕНИЕ НАСТРОЕК =====
function renderSettings() {
    const container = document.getElementById('settings-list');

    if (!container) {
        console.error('❌ Контейнер настроек не найден');
        return;
    }

    container.innerHTML = '';

    // Профиль
    const profileSection = createProfileSection();
    container.appendChild(profileSection);

    // Настройки
    const settingsSection = createSettingsSection();
    container.appendChild(settingsSection);

    // Поддержка
    const supportSection = createSupportSection();
    container.appendChild(supportSection);

    // Статистика
    const statsSection = createStatsSection();
    container.appendChild(statsSection);

    // Опасная зона
    const dangerSection = createDangerSection();
    container.appendChild(dangerSection);
}

// ===== СЕКЦИЯ ПРОФИЛЯ =====
function createProfileSection() {
    const section = document.createElement('div');
    section.className = 'glass p-5 mb-4';

    section.innerHTML = `
        <h3 class="text-lg font-bold text-white mb-4">👤 Профиль</h3>
        
        <div class="space-y-3">
            <div>
                <label class="text-sm text-gray-400 block mb-2">Имя пользователя</label>
                <div class="flex gap-2">
                    <input 
                        type="text" 
                        id="user-name-input" 
                        value="${state.userName}"
                        class="flex-1 bg-white/10 border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition"
                        placeholder="Введите имя"
                        maxlength="20"
                    >
                    <button onclick="saveUserName()" class="bg-blue-500/20 text-blue-300 px-4 py-3 rounded-xl font-bold hover:bg-blue-500/30 transition">
                        💾
                    </button>
                </div>
            </div>
            
            <div>
                <label class="text-sm text-gray-400 block mb-2">ID пользователя</label>
                <div class="bg-white/10 border border-white/20 rounded-xl p-3 text-gray-300">
                    <span id="user-id">${state.userId}</span>
                    <button onclick="copyUserId()" class="ml-2 text-blue-400 hover:text-blue-300">
                        📋
                    </button>
                </div>
            </div>
        </div>
    `;

    return section;
}

// ===== СЕКЦИЯ НАСТРОЕК =====
function createSettingsSection() {
    const section = document.createElement('div');
    section.className = 'glass p-5 mb-4';

    section.innerHTML = `
        <h3 class="text-lg font-bold text-white mb-4">⚙️ Настройки</h3>
        
        <div class="space-y-4">
            <!-- Звук -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-2xl">🔊</span>
                    <div>
                        <p class="font-bold text-white">Звук</p>
                        <p class="text-xs text-gray-400">Включить звуковые эффекты</p>
                    </div>
                </div>
                <div id="sound-toggle" class="switch ${state.sound ? 'active' : ''}" onclick="toggleSound()"></div>
            </div>
            
            <!-- Уведомления -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-2xl">🔔</span>
                    <div>
                        <p class="font-bold text-white">Уведомления</p>
                        <p class="text-xs text-gray-400">Получать уведомления</p>
                    </div>
                </div>
                <div id="notifications-toggle" class="switch ${state.notifications ? 'active' : ''}" onclick="toggleNotifications()"></div>
            </div>
            
            <!-- Громкость -->
            <div>
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">🎵</span>
                        <div>
                            <p class="font-bold text-white">Громкость</p>
                            <p class="text-xs text-gray-400">Уровень громкости звука</p>
                        </div>
                    </div>
                    <span id="sound-volume-label" class="text-sm text-gray-400">${state.soundVolume}%</span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value="${state.soundVolume}" 
                    oninput="changeSoundVolume(this.value)"
                    class="w-full"
                >
            </div>
            
            <!-- Качество графики -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-2xl">🎨</span>
                    <div>
                        <p class="font-bold text-white">Качество графики</p>
                        <p class="text-xs text-gray-400">Влияет на производительность</p>
                    </div>
                </div>
                <select id="graphics-quality" class="bg-white/10 border border-white/20 rounded-xl p-2 text-white" onchange="changeGraphicsQuality(this.value)">
                    <option value="low" class="bg-gray-800">Низкое</option>
                    <option value="medium" class="bg-gray-800" selected>Среднее</option>
                    <option value="high" class="bg-gray-800">Высокое</option>
                </select>
            </div>
        </div>
    `;

    return section;
}

// ===== СЕКЦИЯ ПОДДЕРЖКИ =====
function createSupportSection() {
    const section = document.createElement('div');
    section.className = 'glass p-5 mb-4';

    section.innerHTML = `
        <h3 class="text-lg font-bold text-white mb-4">📞 Поддержка</h3>
        
        <div class="space-y-3">
            <button onclick="openSupportChat()" class="w-full bg-blue-500/20 text-blue-300 py-3 rounded-xl font-bold hover:bg-blue-500/30 transition flex items-center justify-center gap-2">
                💬 Написать в поддержку
            </button>
            
            <button onclick="showFAQ()" class="w-full bg-purple-500/20 text-purple-300 py-3 rounded-xl font-bold hover:bg-purple-500/30 transition flex items-center justify-center gap-2">
                ❓ FAQ
            </button>
            
            <button onclick="showAbout()" class="w-full bg-gray-500/20 text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-500/30 transition flex items-center justify-center gap-2">
                ℹ️ О приложении
            </button>
        </div>
    `;

    return section;
}

// ===== СЕКЦИЯ СТАТИСТИКИ =====
function createStatsSection() {
    const section = document.createElement('div');
    section.className = 'glass p-5 mb-4';

    const stats = state.stats;
    const totalSpent = stats.totalSpent || 0;
    const totalEarned = stats.totalEarned || 0;
    const netProfit = totalEarned - totalSpent;

    section.innerHTML = `
        <h3 class="text-lg font-bold text-white mb-4">📊 Статистика</h3>
        
        <div class="grid grid-cols-2 gap-3">
            <div class="bg-white/10 rounded-xl p-3 text-center">
                <p class="text-2xl font-bold text-white">${stats.casesOpened || 0}</p>
                <p class="text-xs text-gray-400">Кейсов открыто</p>
            </div>
            <div class="bg-white/10 rounded-xl p-3 text-center">
                <p class="text-2xl font-bold text-white">${stats.itemsReceived || 0}</p>
                <p class="text-xs text-gray-400">Предметов получено</p>
            </div>
            <div class="bg-white/10 rounded-xl p-3 text-center">
                <p class="text-2xl font-bold text-red-400">-💰 ${totalSpent}</p>
                <p class="text-xs text-gray-400">Потрачено</p>
            </div>
            <div class="bg-white/10 rounded-xl p-3 text-center">
                <p class="text-2xl font-bold text-green-400">+💰 ${totalEarned}</p>
                <p class="text-xs text-gray-400">Заработано</p>
            </div>
        </div>
        
        <div class="mt-3 bg-white/10 rounded-xl p-3 text-center">
            <p class="text-xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}">
                ${netProfit >= 0 ? '📈 +' : '📉 '}💰 ${netProfit}
            </p>
            <p class="text-xs text-gray-400">Чистая прибыль</p>
        </div>
        
        ${stats.bestDrop ? `
        <div class="mt-3 bg-white/10 rounded-xl p-3">
            <p class="text-sm font-semibold mb-2">🏆 Лучший дроп:</p>
            <div class="flex items-center gap-3">
                <span class="text-3xl">${stats.bestDrop.icon}</span>
                <div>
                    <p class="rarity-${stats.bestDrop.rarity} font-semibold">${stats.bestDrop.name}</p>
                    <p class="text-xs text-gray-400">💰 ${stats.bestDrop.price}</p>
                </div>
            </div>
        </div>
        ` : ''}
        
        <button onclick="showFullStats()" class="w-full mt-3 bg-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/20 transition">
            📊 Подробная статистика
        </button>
    `;

    return section;
}

// ===== СЕКЦИЯ ОПАСНОЙ ЗОНЫ =====
function createDangerSection() {
    const section = document.createElement('div');
    section.className = 'glass p-5 mb-4 border-red-500/30';
    section.style.border = '1px solid rgba(255,0,0,0.3)';

    section.innerHTML = `
        <h3 class="text-lg font-bold text-red-400 mb-4">⚠️ Опасная зона</h3>
        
        <div class="space-y-3">
            <button onclick="resetAllData()" class="w-full bg-red-500/20 text-red-300 py-3 rounded-xl font-bold hover:bg-red-500/30 transition">
                🔄 Сбросить все данные
            </button>
            
            <button onclick="exportDataFile()" class="w-full bg-yellow-500/20 text-yellow-300 py-3 rounded-xl font-bold hover:bg-yellow-500/30 transition">
                📤 Экспорт данных
            </button>
            
            <button onclick="importDataFile()" class="w-full bg-blue-500/20 text-blue-300 py-3 rounded-xl font-bold hover:bg-blue-500/30 transition">
                📥 Импорт данных
            </button>
        </div>
    `;

    return section;
}

// ===== ФУНКЦИИ НАСТРОЕК =====

// Сохранение имени
function saveUserName() {
    const input = document.getElementById('user-name-input');
    if (!input) return;

    const name = input.value.trim();

    if (name.length < 2) {
        showToast('Имя должно быть не короче 2 символов', 'error');
        return;
    }

    if (name.length > 20) {
        showToast('Имя должно быть не длиннее 20 символов', 'error');
        return;
    }

    state.userName = name;
    save();
    showToast('👤 Имя обновлено', 'success');
    hapticFeedback('light');
}

// Копирование ID
function copyUserId() {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(state.userId).then(() => {
            showToast('ID скопирован', 'success');
        });
    } else {
        prompt('Ваш ID:', state.userId);
    }
}

// Переключение звука
function toggleSound() {
    state.sound = !state.sound;
    updateSettingsUI();
    save();

    showToast(state.sound ? '🔊 Звук включён' : '🔇 Звук выключен', 'success');
    hapticFeedback('light');

    if (state.sound) {
        playSound('click');
    }
}

// Переключение уведомлений
function toggleNotifications() {
    state.notifications = !state.notifications;
    updateSettingsUI();
    save();

    showToast(
        state.notifications ? '🔔 Уведомления включены' : '🔕 Уведомления выключены',
        'success'
    );
    hapticFeedback('light');
}

// Изменение громкости
function changeSoundVolume(value) {
    const volume = parseInt(value);
    if (isNaN(volume) || volume < 0 || volume > 100) return;

    state.soundVolume = volume;
    const label = document.getElementById('sound-volume-label');
    if (label) label.textContent = volume + '%';

    save();
}

// Изменение качества графики
function changeGraphicsQuality(value) {
    document.body.classList.remove('graphics-low', 'graphics-medium', 'graphics-high');
    document.body.classList.add(`graphics-${value}`);

    localStorage.setItem('graphics_quality', value);
    showToast('🎨 Качество графики обновлено', 'success');
}

// Обновление UI настроек
function updateSettingsUI() {
    const soundToggle = document.getElementById('sound-toggle');
    const notificationsToggle = document.getElementById('notifications-toggle');

    if (soundToggle) {
        soundToggle.classList.toggle('active', state.sound);
    }

    if (notificationsToggle) {
        notificationsToggle.classList.toggle('active', state.notifications);
    }

    const soundVolumeLabel = document.getElementById('sound-volume-label');
    if (soundVolumeLabel) {
        soundVolumeLabel.textContent = state.soundVolume + '%';
    }

    const soundSlider = document.querySelector('input[oninput="changeSoundVolume(this.value)"]');
    if (soundSlider) {
        soundSlider.value = state.soundVolume;
    }
}

// ===== ФУНКЦИИ ПОДДЕРЖКИ =====

function openSupportChat() {
    if (api.tg?.openTelegramLink) {
        api.openLink(CONFIG.supportUrl);
    } else {
        showToast('Поддержка доступна только в Telegram', 'error');
    }
}

function showFAQ() {
    const faqHTML = `
        <div class="space-y-4">
            <h3 class="font-bold text-xl text-center">❓ FAQ</h3>
            
            <div class="glass p-4">
                <p class="font-bold text-white mb-2">Как открыть кейс?</p>
                <p class="text-sm text-gray-400">Перейдите на вкладку "Кейсы", выберите кейс и нажмите "Открыть".</p>
            </div>
            
            <div class="glass p-4">
                <p class="font-bold text-white mb-2">Как продать предмет?</p>
                <p class="text-sm text-gray-400">Перейдите в инвентарь, нажмите "Продать" на предмете.</p>
            </div>
            
            <div class="glass p-4">
                <p class="font-bold text-white mb-2">Как выставить на рынок?</p>
                <p class="text-sm text-gray-400">В инвентаре нажмите "Выставить" и укажите цену.</p>
            </div>
            
            <div class="glass p-4">
                <p class="font-bold text-white mb-2">Как получить больше монет?</p>
                <p class="text-sm text-gray-400">Открывайте кейсы, продавайте предметы, получайте ежедневную награду или пополните баланс.</p>
            </div>
        </div>
    `;

    showModal(faqHTML);
}

function showAbout() {
    const aboutHTML = `
        <div class="text-center space-y-4">
            <div class="text-6xl">⚡</div>
            <h3 class="font-bold text-2xl">STORM CASES</h3>
            <p class="text-gray-400">Версия ${CONFIG.appVersion}</p>
            <p class="text-sm text-gray-500">
                Увлекательная игра с кейсами и предметами.<br>
                Открывай кейсы, собирай коллекцию, торгуй на рынке!
            </p>
            <div class="glass p-3">
                <p class="text-xs text-gray-400">Создано с ❤️</p>
            </div>
        </div>
    `;

    showModal(aboutHTML);
}

// ===== ФУНКЦИИ ЭКСПОРТА/ИМПОРТА =====

function exportDataFile() {
    const data = exportData();
    if (!data) {
        showToast('Ошибка экспорта', 'error');
        return;
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storm_cases_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('📤 Данные экспортированы', 'success');
}

function importDataFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = importData(event.target.result);
            if (result) {
                showToast('📥 Данные импортированы', 'success');
                renderSettings();
                updateBalance();
            } else {
                showToast('Ошибка импорта', 'error');
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

// ===== ПОКАЗ ПОЛНОЙ СТАТИСТИКИ =====
function showFullStats() {
    const stats = state.stats;

    const statsHTML = `
        <div class="space-y-4">
            <h3 class="font-bold text-xl text-center">📊 Полная статистика</h3>
            
            <div class="glass p-4">
                <p class="text-sm text-gray-400 mb-2">💰 Баланс</p>
                <p class="text-2xl font-bold text-yellow-300">${state.balance}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-2">
                <div class="glass p-3 text-center">
                    <p class="text-2xl font-bold">📦 ${stats.casesOpened || 0}</p>
                    <p class="text-xs text-gray-400">Кейсов открыто</p>
                </div>
                <div class="glass p-3 text-center">
                    <p class="text-2xl font-bold">🎁 ${stats.itemsReceived || 0}</p>
                    <p class="text-xs text-gray-400">Предметов</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-2">
                <div class="glass p-3 text-center">
                    <p class="text-xl font-bold text-red-400">-💰 ${stats.totalSpent || 0}</p>
                    <p class="text-xs text-gray-400">Потрачено</p>
                </div>
                <div class="glass p-3 text-center">
                    <p class="text-xl font-bold text-green-400">+💰 ${stats.totalEarned || 0}</p>
                    <p class="text-xs text-gray-400">Заработано</p>
                </div>
            </div>
            
            <div class="glass p-3">
                <p class="text-sm font-semibold mb-2">🎒 Инвентарь:</p>
                <p>${state.inventory.length} предметов</p>
            </div>
            
            ${stats.bestDrop ? `
            <div class="glass p-3">
                <p class="text-sm font-semibold mb-2">🏆 Лучший дроп:</p>
                <div class="flex items-center gap-3">
                    <span class="text-3xl">${stats.bestDrop.icon}</span>
                    <div>
                        <p class="rarity-${stats.bestDrop.rarity} font-semibold">${stats.bestDrop.name}</p>
                        <p class="text-xs text-gray-400">💰 ${stats.bestDrop.price}</p>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    `;

    showModal(statsHTML);
}

// Экспорт функций
window.renderSettings = renderSettings;
window.saveUserName = saveUserName;
window.copyUserId = copyUserId;
window.toggleSound = toggleSound;
window.toggleNotifications = toggleNotifications;
window.changeSoundVolume = changeSoundVolume;
window.changeGraphicsQuality = changeGraphicsQuality;
window.updateSettingsUI = updateSettingsUI;
window.openSupportChat = openSupportChat;
window.showFAQ = showFAQ;
window.showAbout = showAbout;
window.exportDataFile = exportDataFile;
window.importDataFile = importDataFile;
window.showFullStats = showFullStats;