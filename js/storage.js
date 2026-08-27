// ==================== STORM CASES - ХРАНИЛИЩЕ ДАННЫХ ====================

const STORAGE_KEYS = {
    state: 'storm_data',
    dailyClaim: 'last_daily_claim',
    invites: 'storm_invites',
};

// ===== СОХРАНЕНИЕ =====
function save() {
    try {
        if (!state) {
            console.error('❌ State не инициализирован');
            return;
        }
        localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(state));
        console.log('✅ Данные сохранены');
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
    }
}

// ===== ЗАГРУЗКА =====
function load() {
    console.log('🔄 Начинаем загрузку данных...');
    
    try {
        const savedData = localStorage.getItem(STORAGE_KEYS.state);
        
        if (!savedData) {
            console.log('📝 Нет сохраненных данных, создаем новые');
            // Создаем новое состояние
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
            console.log('✅ Новое состояние создано');
            return true;
        }
        
        console.log('📥 Найдены сохраненные данные');
        const parsed = JSON.parse(savedData);
        console.log('📄 Распарсенные данные:', parsed);
        
        // Создаем состояние с проверкой всех полей
        state = {
            balance: typeof parsed.balance === 'number' && !isNaN(parsed.balance) 
                ? parsed.balance 
                : CONFIG.startBalance,
            inventory: Array.isArray(parsed.inventory) 
                ? parsed.inventory.filter(item => item && typeof item === 'object') 
                : [],
            sound: typeof parsed.sound === 'boolean' ? parsed.sound : true,
            notifications: typeof parsed.notifications === 'boolean' ? parsed.notifications : true,
            soundVolume: typeof parsed.soundVolume === 'number' ? parsed.soundVolume : 100,
            market: Array.isArray(parsed.market) 
                ? parsed.market.filter(item => item && typeof item === 'object') 
                : [],
            userName: typeof parsed.userName === 'string' && parsed.userName 
                ? parsed.userName 
                : 'Гость',
            userId: parsed.userId || 'guest',
            stats: {
                casesOpened: parsed.stats?.casesOpened || 0,
                itemsReceived: parsed.stats?.itemsReceived || 0,
                totalSpent: parsed.stats?.totalSpent || 0,
                totalEarned: parsed.stats?.totalEarned || 0,
                bestDrop: parsed.stats?.bestDrop || null,
            },
        };
        
        console.log('✅ Данные успешно загружены:', state);
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка при загрузке данных:', error);
        console.log('🔄 Сбрасываем поврежденные данные');
        
        try {
            localStorage.removeItem(STORAGE_KEYS.state);
        } catch (e) {
            console.error('❌ Не удалось очистить localStorage:', e);
        }
        
        // Создаем новое состояние
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
        
        console.log('✅ Создано новое состояние после ошибки');
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
    try {
        const lastClaim = parseInt(localStorage.getItem(STORAGE_KEYS.dailyClaim) || '0');
        const now = Date.now();
        return now - lastClaim >= 24 * 60 * 60 * 1000;
    } catch (error) {
        console.error('❌ Ошибка проверки ежедневной награды:', error);
        return true;
    }
}

function setDailyClaimed() {
    try {
        localStorage.setItem(STORAGE_KEYS.dailyClaim, Date.now().toString());
    } catch (error) {
        console.error('❌ Ошибка установки ежедневной награды:', error);
    }
}

function getTimeUntilNextDaily() {
    try {
        const lastClaim = parseInt(localStorage.getItem(STORAGE_KEYS.dailyClaim) || '0');
        const now = Date.now();
        const diff = 24 * 60 * 60 * 1000 - (now - lastClaim);
        return diff > 0 ? diff : 0;
    } catch (error) {
        console.error('❌ Ошибка получения времени до награды:', error);
        return 0;
    }
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
    try {
        const invites = getInvites();
        invites.push({
            userId: userId,
            timestamp: Date.now(),
        });
        localStorage.setItem(STORAGE_KEYS.invites, JSON.stringify(invites));
    } catch (error) {
        console.error('❌ Ошибка добавления приглашения:', error);
    }
}

function canInvite() {
    try {
        const invites = getInvites();
        const today = new Date().toDateString();
        const todayInvites = invites.filter(inv => new Date(inv.timestamp).toDateString() === today);
        return todayInvites.length < CONFIG.maxInvitesPerDay;
    } catch (error) {
        console.error('❌ Ошибка проверки приглашений:', error);
        return false;
    }
}

// ===== ЭКСПОРТ / ИМПОРТ =====
function exportData() {
    try {
        const data = {
            state: state,
            exportedAt: new Date().toISOString(),
            version: '1.0.0',
        };
        return JSON.stringify(data);
    } catch (error) {
        console.error('❌ Ошибка экспорта:', error);
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
        console.error('❌ Ошибка импорта:', error);
        return false;
    }
}

// ===== ФУНКЦИЯ СБРОСА =====
function resetAllData() {
    try {
        clearAllData();
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
        console.log('✅ Данные сброшены');
        return true;
    } catch (error) {
        console.error('❌ Ошибка сброса:', error);
        return false;
    }
}

// Экспортируем функции
window.resetAllData = resetAllData;
