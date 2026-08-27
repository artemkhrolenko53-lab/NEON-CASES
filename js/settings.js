// ==================== STORM CASES - НАСТРОЙКИ ====================

// ===== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА НАСТРОЕК =====
function updateSettingsUI() {
    // Переключатели
    updateToggleState('sound-toggle', state.sound);
    updateToggleState('music-toggle', state.music);
    updateToggleState('notifications-toggle', state.notifications);

    // Селекты
    const languageSelect = document.getElementById('language-select');
    const graphicsSelect = document.getElementById('graphics-quality');
    if (languageSelect) languageSelect.value = state.language;
    if (graphicsSelect) graphicsSelect.value = state.graphicsQuality;

    // Ползунки
    const soundVolumeLabel = document.getElementById('sound-volume-label');
    const musicVolumeLabel = document.getElementById('music-volume-label');
    if (soundVolumeLabel) soundVolumeLabel.textContent = state.soundVolume + '%';
    if (musicVolumeLabel) musicVolumeLabel.textContent = state.musicVolume + '%';

    const soundSlider = document.querySelector('input[oninput="changeSoundVolume(this.value)"]');
    const musicSlider = document.querySelector('input[oninput="changeMusicVolume(this.value)"]');
    if (soundSlider) soundSlider.value = state.soundVolume;
    if (musicSlider) musicSlider.value = state.musicVolume;

    // Профиль
    const userNameInput = document.getElementById('user-name-input');
    const userIdElement = document.getElementById('user-id');
    if (userNameInput) userNameInput.value = state.userName;
    if (userIdElement) userIdElement.textContent = state.userId;

    // Применяем настройки
    applyLanguage(state.language);
    applyGraphicsQuality(state.graphicsQuality);
}

function updateToggleState(elementId, isActive) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.toggle('active', isActive);
    }
}

// ===== ПЕРЕКЛЮЧАТЕЛИ =====
function toggleSound() {
    state.sound = !state.sound;
    updateToggleState('sound-toggle', state.sound);
    save();

    showToast(state.sound ? '🔊 Звук включён' : '🔇 Звук выключен', 'success');
    hapticFeedback('light');

    if (state.sound) {
        playSound('click');
    }
}

function toggleMusic() {
    state.music = !state.music;
    updateToggleState('music-toggle', state.music);
    save();

    if (state.music) {
        startMusic();
        showToast('🎵 Музыка включена', 'success');
    } else {
        stopMusic();
        showToast('🎵 Музыка выключена', 'success');
    }

    hapticFeedback('light');
}

function toggleNotifications() {
    state.notifications = !state.notifications;
    updateToggleState('notifications-toggle', state.notifications);
    save();

    showToast(
        state.notifications ? '🔔 Уведомления включены' : '🔕 Уведомления выключены',
        'success'
    );
    hapticFeedback('light');
}

// ===== СМЕНА ЯЗЫКА =====
function changeLanguage(lang) {
    if (!translations[lang]) {
        showToast('Язык не поддерживается', 'error');
        return;
    }

    state.language = lang;
    applyLanguage(lang);
    save();

    const langNames = {
        ru: 'Русский',
        en: 'English',
    };

    showToast(`🌍 Язык: ${langNames[lang] || lang}`, 'success');
    hapticFeedback('light');
}

function applyLanguage(lang) {
    // Переводим все элементы с data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // Обновляем плейсхолдеры
    const searchInput = document.getElementById('market-search');
    if (searchInput) {
        searchInput.placeholder = translations[lang]?.searchPlaceholder || '🔍 Поиск...';
    }

    // Обновляем заголовок
    document.title = translations[lang]?.title || 'STORM CASES';
}

// ===== КАЧЕСТВО ГРАФИКИ =====
function changeGraphicsQuality(quality) {
    const validQualities = ['low', 'medium', 'high'];
    if (!validQualities.includes(quality)) {
        showToast('Неверное качество', 'error');
        return;
    }

    state.graphicsQuality = quality;
    applyGraphicsQuality(quality);
    save();

    const qualityNames = {
        low: 'Низкое',
        medium: 'Среднее',
        high: 'Высокое',
    };

    showToast(`🎨 Качество: ${qualityNames[quality]}`, 'success');
    hapticFeedback('light');
}

function applyGraphicsQuality(quality) {
    document.body.classList.remove('graphics-low', 'graphics-high');

    if (quality === 'low') {
        document.body.classList.add('graphics-low');
        console.log('🟢 Низкое качество графики');
    } else if (quality === 'high') {
        document.body.classList.add('graphics-high');
        console.log('🟣 Высокое качество графики');
    } else {
        console.log('🟡 Среднее качество графики');
    }
}

// ===== ГРОМКОСТЬ =====
function changeSoundVolume(value) {
    const volume = parseInt(value);
    if (isNaN(volume) || volume < 0 || volume > 100) return;

    state.soundVolume = volume;
    const label = document.getElementById('sound-volume-label');
    if (label) label.textContent = volume + '%';

    save();
}

function changeMusicVolume(value) {
    const volume = parseInt(value);
    if (isNaN(volume) || volume < 0 || volume > 100) return;

    state.musicVolume = volume;
    const label = document.getElementById('music-volume-label');
    if (label) label.textContent = volume + '%';

    if (musicPlayer) {
        musicPlayer.volume = volume / 100;
    }

    save();
}

// ===== ПРОФИЛЬ =====
function updateUserName(name) {
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
        showToast('Имя должно быть не короче 2 символов', 'error');
        const input = document.getElementById('user-name-input');
        if (input) input.value = state.userName;
        return;
    }

    if (trimmedName.length > 20) {
        showToast('Имя должно быть не длиннее 20 символов', 'error');
        const input = document.getElementById('user-name-input');
        if (input) input.value = state.userName;
        return;
    }

    state.userName = trimmedName;
    const input = document.getElementById('user-name-input');
    if (input) input.value = trimmedName;

    save();
    showToast('👤 Имя обновлено', 'success');
    hapticFeedback('light');
}

// ===== СТАТИСТИКА =====
function showFullStats() {
    const stats = state.stats;

    const totalSpent = stats.totalSpent || 0;
    const totalEarned = stats.totalEarned || 0;
    const netProfit = totalEarned - totalSpent;
    const casesOpened = stats.casesOpened || 0;
    const itemsReceived = stats.itemsReceived || 0;

    const statsHTML = `
        <div class="space-y-3">
            <h3 class="font-bold text-lg">📊 Статистика</h3>
            
            <div class="glass p-4 text-center">
                <p class="text-3xl font-bold text-yellow-300">💰 ${state.balance}</p>
                <p class="text-xs text-gray-400 mt-1">Текущий баланс</p>
            </div>
            
            <div class="grid grid-cols-2 gap-2">
                <div class="glass p-3 text-center">
                    <p class="text-2xl font-bold">📦 ${casesOpened}</p>
                    <p class="text-xs text-gray-400">Кейсов открыто</p>
                </div>
                <div class="glass p-3 text-center">
                    <p class="text-2xl font-bold">🎁 ${itemsReceived}</p>
                    <p class="text-xs text-gray-400">Предметов получено</p>
                </div>
                <div class="glass p-3 text-center">
                    <p class="text-2xl font-bold text-red-400">-💰 ${totalSpent}</p>
                    <p class="text-xs text-gray-400">Потрачено</p>
                </div>
                <div class="glass p-3 text-center">
                    <p class="text-2xl font-bold text-green-400">+💰 ${totalEarned}</p>
                    <p class="text-xs text-gray-400">Заработано</p>
                </div>
            </div>
            
            <div class="glass p-3 text-center">
                <p class="text-xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}">
                    ${netProfit >= 0 ? '📈 +' : '📉 '}💰 ${netProfit}
                </p>
                <p class="text-xs text-gray-400">Чистая прибыль</p>
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
            
            <div class="glass p-3">
                <p class="text-sm font-semibold mb-2">🎒 Инвентарь:</p>
                <p>${state.inventory.length} предметов</p>
            </div>
        </div>
    `;

    showModal(statsHTML);
}

// ===== О ПРИЛОЖЕНИИ =====
function showAbout() {
    const aboutHTML = `
        <div class="text-center space-y-4">
            <span class="text-6xl">⚡</span>
            <h3 class="font-bold text-2xl">STORM CASES</h3>
            <p class="text-sm text-gray-400">Версия: 1.0.0</p>
            
            <div class="border-t border-white/10 pt-3 space-y-2">
                <p class="text-sm text-gray-300">
                    Открывайте кейсы, получайте предметы,
                    торгуйте на рынке и соревнуйтесь с друзьями!
                </p>
                <p class="text-xs text-gray-500">
                    © 2024 STORM CASES<br>
                    Все права защищены
                </p>
            </div>
        </div>
    `;

    showModal(aboutHTML);
}

// ===== ПОМОЩЬ =====
function showHelp() {
    const helpHTML = `
        <div class="space-y-3">
            <h3 class="font-bold text-lg">❓ Как играть?</h3>
            
            <div class="glass p-3">
                <p class="font-semibold">📦 Открытие кейсов</p>
                <p class="text-sm text-gray-400">Выберите кейс и нажмите "Открыть". Случайный предмет попадёт в инвентарь.</p>
            </div>
            
            <div class="glass p-3">
                <p class="font-semibold">💰 Заработок</p>
                <p class="text-sm text-gray-400">Продавайте предметы на рынке или в инвентаре. Приглашайте друзей!</p>
            </div>
            
            <div class="glass p-3">
                <p class="font-semibold">📊 Рынок</p>
                <p class="text-sm text-gray-400">Покупайте и продавайте предметы. Выставляйте свои по выгодной цене.</p>
            </div>
            
            <div class="glass p-3">
                <p class="font-semibold">🎁 Ежедневная награда</p>
                <p class="text-sm text-gray-400">Заходите каждый день и получайте бонусные монеты!</p>
            </div>
        </div>
    `;

    showModal(helpHTML);
}

// ===== БЫСТРЫЕ НАСТРОЙКИ =====
function setQuickSetting(preset) {
    switch(preset) {
        case 'maxPerformance':
            state.graphicsQuality = 'low';
            state.sound = false;
            state.music = false;
            state.notifications = false;
            showToast('Режим производительности', 'success');
            break;

        case 'balanced':
            state.graphicsQuality = 'medium';
            state.sound = true;
            state.music = false;
            state.notifications = true;
            showToast('Сбалансированный режим', 'success');
            break;

        case 'maxQuality':
            state.graphicsQuality = 'high';
            state.sound = true;
            state.music = true;
            state.notifications = true;
            showToast('Режим качества', 'success');
            break;

        default:
            return;
    }

    save();
    updateSettingsUI();
    hapticFeedback('medium');
}