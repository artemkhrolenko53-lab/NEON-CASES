// ==================== STORM CASES - ХРАНИЛИЩЕ ДАННЫХ ====================

const STORAGE_KEYS = {
    state: 'storm_data',
    dailyClaim: 'last_daily_claim',
    invites: 'storm_invites',
};

// ===== СОХРАНЕНИЕ =====
function save() {
    try {
        // Проверяем, что state существует и корректен
        if (!state || typeof state !== 'object') {
            console.error('❌ Некорректное состояние');
            return;
        }

        // Создаем копию для сохранения
        const dataToSave = JSON.parse(JSON.stringify(state));

        localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(dataToSave));
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

            // Создаем новое состояние с значениями по умолчанию
            const defaultState = {
                balance: CONFIG.startBalance,
                inventory: [],
                sound: true,
                notifications: true,
                soundVolume: 100,
                market: [],
                userName: 'Гость',
                userId: 'guest',
                stats: {
                    casesOpened: 0,
                    itemsReceived: 0,
                    totalSpent: 0,
                    totalEarned: 0,
                    bestDrop: null,
                },
            };

            // Объединяем с сохраненными данными, но проверяем каждый элемент
            state = {
                ...defaultState,
                ...parsed,
            };

            // Явно проверяем и исправляем каждое поле
            if (!Array.isArray(state.inventory)) {
                state.inventory = [];
            } else {
                // Проверяем каждый предмет в инвентаре
                state.inventory = state.inventory.filter(item =>
                    item && typeof item === 'object' && item.name
                );
            }

            if (!Array.isArray(state.market)) {
                state.market = [];
            } else {
                // Проверяем каждое предложение на рынке
                state.market = state.market.filter(listing =>
                    listing && typeof listing === 'object' && listing.item
                );
            }

            if (!state.stats || typeof state.stats !== 'object') {
                state.stats = {
                    casesOpened: 0,
                    itemsReceived: 0,
                    totalSpent: 0,
                    totalEarned: 0,
                    bestDrop: null,
                };
            } else {
                // Проверяем поля stats
                state.stats.casesOpened = state.stats.casesOpened || 0;
                state.stats.itemsReceived = state.stats.itemsReceived || 0;
                state.stats.totalSpent = state.stats.totalSpent || 0;
                state.stats.totalEarned = state.stats.totalEarned || 0;
                state.stats.bestDrop = state.stats.bestDrop || null;
            }

            if (typeof state.sound !== 'boolean') state.sound = true;
            if (typeof state.notifications !== 'boolean') state.notifications = true;
            if (typeof state.soundVolume !== 'number') state.soundVolume = 100;
            if (typeof state.balance !== 'number' || isNaN(state.balance)) state.balance = CONFIG.startBalance;
            if (!state.userName || typeof state.userName !== 'string') state.userName = 'Гость';
            if (!state.userId) state.userId = 'guest';

            console.log('✅ Данные загружены:', state);
            return true;
        } else {
            console.log('📝 Первый запуск, создаём сохранение');
            // Инициализируем состояние с нуля
            state = {
                balance: CONFIG.startBalance,
                inventory: [],
                sound: true,
                notifications: true,
                soundVolume: 100,
                market: [],
                userName: 'Гость',
                userId: 'guest',
                stats: {
                    casesOpened: 0,
                    itemsReceived: 0,
                    totalSpent: 0,
                    totalEarned: 0,
                    bestDrop: null,
                },
            };
            save();
            return false;
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        console.log('🔄 Сброс данных из-за ошибки');

        // Сбрасываем localStorage
        localStorage.removeItem(STORAGE_KEYS.state);

        // Инициализируем состояние с нуля
        state = {
            balance: CONFIG.startBalance,
            inventory: [],
            sound: true,
            notifications: true,
            soundVolume: 100,
            market: [],
            userName: 'Гость',
            userId: 'guest',
            stats: {
                casesOpened: 0,
                itemsReceived: 0,
                totalSpent: 0,
                totalEarned: 0,
                bestDrop: null,
            },
        };

        save();
        showToast('Данные были сброшены', 'error');
        return false;
    }
}
// ===== ПОЛНАЯ ОЧИСТКА =====
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

// ===== ЕЖЕДНЕВНАЯ НАГРАДА =====
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

// ===== ЭКСПОРТ / ИМПОРТ (при необходимости) =====
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
// Функция для полного сброса данных
function resetAllData() {
    try {
        localStorage.removeItem(STORAGE_KEYS.state);
        localStorage.removeItem(STORAGE_KEYS.dailyClaim);
        localStorage.removeItem(STORAGE_KEYS.invites);

        // Сбрасываем состояние
        state = {
            balance: CONFIG.startBalance,
            inventory: [],
            sound: true,
            notifications: true,
            soundVolume: 100,
            market: [],
            userName: 'Гость',
            userId: 'guest',
            stats: {
                casesOpened: 0,
                itemsReceived: 0,
                totalSpent: 0,
                totalEarned: 0,
                bestDrop: null,
            },
        };

        console.log('✅ Все данные сброшены');
        return true;
    } catch (error) {
        console.error('❌ Ошибка сброса данных:', error);
        return false;
    }
}

// Экспортируем функцию
window.resetAllData = resetAllData;
