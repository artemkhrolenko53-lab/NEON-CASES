// ==================== STORM CASES - РАБОТА С ХРАНИЛИЩЕМ ====================

// ===== КЛЮЧИ ДЛЯ LOCALSTORAGE =====
const STORAGE_KEYS = {
    state: 'storm_data',
    dailyClaim: 'last_daily_claim',
    invites: 'storm_invites',
    settings: 'storm_settings',
};

// ===== СОХРАНЕНИЕ =====
function save() {
    try {
        localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(state));
        console.log('✅ Данные сохранены');
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        showToast('Ошибка сохранения данных', 'error');
    }
}

// ===== ЗАГРУЗКА =====
function load() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEYS.state);
        if (savedData) {
            const parsed = JSON.parse(savedData);

            // Объединяем с текущим состоянием
            state = { ...state, ...parsed };

            // Проверка на отсутствующие поля
            if (!state.inventory) state.inventory = [];
            if (!state.market) state.market = [];
            if (!state.stats) {
                state.stats = {
                    casesOpened: 0,
                    itemsReceived: 0,
                    totalSpent: 0,
                    totalEarned: 0,
                    bestDrop: null,
                };
            }
            if (state.sound === undefined) state.sound = true;
            if (state.music === undefined) state.music = false;
            if (state.notifications === undefined) state.notifications = true;
            if (state.language === undefined) state.language = 'ru';
            if (state.graphicsQuality === undefined) state.graphicsQuality = 'medium';
            if (state.soundVolume === undefined) state.soundVolume = 100;
            if (state.musicVolume === undefined) state.musicVolume = 100;
            if (state.userName === undefined) state.userName = 'Гость';
            if (state.userId === undefined) state.userId = 'guest';

            console.log('✅ Данные загружены');
            return true;
        } else {
            console.log('📝 Первый запуск, создаём сохранение');
            save();
            return false;
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        showToast('Ошибка загрузки данных', 'error');
        return false;
    }
}

// ===== СБРОС ДАННЫХ =====
function clearAllData() {
    try {
        localStorage.removeItem(STORAGE_KEYS.state);
        localStorage.removeItem(STORAGE_KEYS.dailyClaim);
        localStorage.removeItem(STORAGE_KEYS.invites);
        console.log('✅ Все данные удалены');
        return true;
    } catch (error) {
        console.error('❌ Ошибка очистки:', error);
        return false;
    }
}

// ===== ПРОВЕРКА ЕЖЕДНЕВНОЙ НАГРАДЫ =====
function canClaimDaily() {
    const lastClaim = parseInt(localStorage.getItem(STORAGE_KEYS.dailyClaim) || '0');
    const now = Date.now();
    return now - lastClaim >= 24 * 60 * 60 * 1000;
}

function setDailyClaimed() {
    localStorage.setItem(STORAGE_KEYS.dailyClaim, Date.now().toString());
}

function getTimeUntilNextDaily() {
    const lastClaim = parseInt(localStorage.getItem(STORAGE_KEYS.dailyClaim) || '0');
    const now = Date.now();
    const diff = 24 * 60 * 60 * 1000 - (now - lastClaim);
    return diff > 0 ? diff : 0;
}

// ===== ПРИГЛАШЕНИЯ =====
function getInvites() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.invites) || '[]');
    } catch {
        return [];
    }
}

function addInvite(userId) {
    const invites = getInvites();
    invites.push({
        userId: userId,
        timestamp: Date.now(),
    });
    localStorage.setItem(STORAGE_KEYS.invites, JSON.stringify(invites));
}

function canInvite() {
    const invites = getInvites();
    const today = new Date().toDateString();
    const todayInvites = invites.filter(inv => new Date(inv.timestamp).toDateString() === today);
    return todayInvites.length < CONFIG.maxInvitesPerDay;
}

// ===== ЭКСПОРТ/ИМПОРТ ДАННЫХ =====
function exportData() {
    try {
        const data = {
            state: state,
            exportedAt: new Date().toISOString(),
            version: '1.0.0',
        };
        return JSON.stringify(data);
    } catch (error) {
        console.error('Ошибка экспорта:', error);
        return null;
    }
}

function importData(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        if (data.state) {
            state = { ...state, ...data.state };
            save();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Ошибка импорта:', error);
        return false;
    }
}