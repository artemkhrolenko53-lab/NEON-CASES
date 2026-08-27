// ==================== STORM CASES - НАСТРОЙКИ ====================

// ===== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА =====
function updateSettingsUI() {
    updateToggleState('sound-toggle', state.sound);
    updateToggleState('notifications-toggle', state.notifications);
    
    const soundVolumeLabel = document.getElementById('sound-volume-label');
    if (soundVolumeLabel) soundVolumeLabel.textContent = state.soundVolume + '%';
    
    const soundSlider = document.querySelector('input[oninput="changeSoundVolume(this.value)"]');
    if (soundSlider) soundSlider.value = state.soundVolume;
    
    const userNameInput = document.getElementById('user-name-input');
    const userIdElement = document.getElementById('user-id');
    if (userNameInput) userNameInput.value = state.userName;
    if (userIdElement) userIdElement.textContent = state.userId;
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

// ===== ГРОМКОСТЬ ЗВУКА =====
function changeSoundVolume(value) {
    const volume = parseInt(value);
    if (isNaN(volume) || volume < 0 || volume > 100) return;
    
    state.soundVolume = volume;
    const label = document.getElementById('sound-volume-label');
    if (label) label.textContent = volume + '%';
    
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
