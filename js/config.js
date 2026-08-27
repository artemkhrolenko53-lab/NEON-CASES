// ==================== STORM CASES - КОНФИГУРАЦИЯ ====================
// ВАЖНО: Замените эти значения на свои при подключении к другому боту

// ===== НАСТРОЙКИ БОТА =====
const BOT_CONFIG = {
    // Имя бота без @ (замените на свое)
    username: 'storm_cases_bot',

    // Токен бота (используется только на сервере, не вставляйте сюда!)
    token: '8907615374:AAE3BqeX0A7Wd-ssUb-IU-YQO-HUXyfMmN8',

    // URL вашего Mini App (замените на свой)
    webAppUrl: 'https://artemkhrolenko53-lab.github.io/NEON-CASES/',

    // URL поддержки (замените на свой)
    supportUrl: 'https://t.me/your_support_bot',

    // URL канала (опционально)
    channelUrl: 'https://t.me/your_channel',

    // ID администраторов (замените на свои)
    adminIds: [
        -, // Главный админ
        // Добавьте дополнительные ID
    ],
};

// ===== НАСТРОЙКИ API =====
const API_CONFIG = {
    // URL вашего backend API (если есть)
    baseUrl: 'https://your-api-server.com',

    // Ключ API (если требуется)
    apiKey: 'your-api-key',

    // Время ожидания запросов (мс)
    timeout: 10000,
};

// ===== ПРЕДМЕТЫ =====
const ITEMS = [
    // ===== COMMON =====
    { id: 1, name: 'Glock-18', type: 'Пистолет', rarity: 'common', price: 30, icon: '🔫' },
    { id: 2, name: 'P250', type: 'Пистолет', rarity: 'common', price: 45, icon: '🔫' },
    { id: 3, name: 'MP9', type: 'ПП', rarity: 'common', price: 60, icon: '🔫' },
    { id: 4, name: 'Nova', type: 'Дробовик', rarity: 'common', price: 75, icon: '🔫' },
    { id: 5, name: 'UMP-45', type: 'ПП', rarity: 'common', price: 90, icon: '🔫' },
    { id: 6, name: 'Tec-9', type: 'Пистолет', rarity: 'common', price: 55, icon: '🔫' },
    { id: 7, name: 'MAG-7', type: 'Дробовик', rarity: 'common', price: 85, icon: '🔫' },
    { id: 8, name: 'MP7', type: 'ПП', rarity: 'common', price: 70, icon: '🔫' },
    { id: 9, name: 'Sawed-Off', type: 'Дробовик', rarity: 'common', price: 65, icon: '🔫' },
    { id: 10, name: 'MAC-10', type: 'ПП', rarity: 'common', price: 50, icon: '🔫' },

    // ===== RARE =====
    { id: 11, name: 'AK-47', type: 'Винтовка', rarity: 'rare', price: 180, icon: '🔫' },
    { id: 12, name: 'M4A4', type: 'Винтовка', rarity: 'rare', price: 220, icon: '🔫' },
    { id: 13, name: 'Desert Eagle', type: 'Пистолет', rarity: 'rare', price: 250, icon: '🔫' },
    { id: 14, name: 'FAMAS', type: 'Винтовка', rarity: 'rare', price: 200, icon: '🔫' },
    { id: 15, name: 'SSG 08', type: 'Снайперская', rarity: 'rare', price: 280, icon: '🔫' },
    { id: 16, name: 'Sport Gloves', type: 'Перчатки', rarity: 'rare', price: 150, icon: '🧤' },
    { id: 17, name: 'P90', type: 'ПП', rarity: 'rare', price: 210, icon: '🔫' },
    { id: 18, name: 'Galil AR', type: 'Винтовка', rarity: 'rare', price: 190, icon: '🔫' },

    // ===== EPIC =====
    { id: 19, name: 'AWP', type: 'Снайперская', rarity: 'epic', price: 450, icon: '🔫' },
    { id: 20, name: 'M4A1-S', type: 'Винтовка', rarity: 'epic', price: 500, icon: '🔫' },
    { id: 21, name: 'Butterfly Knife', type: 'Нож', rarity: 'epic', price: 600, icon: '🗡️' },
    { id: 22, name: 'USP-S', type: 'Пистолет', rarity: 'epic', price: 400, icon: '🔫' },
    { id: 23, name: 'Specialist Gloves', type: 'Перчатки', rarity: 'epic', price: 550, icon: '🧤' },
    { id: 24, name: 'SCAR-20', type: 'Снайперская', rarity: 'epic', price: 480, icon: '🔫' },

    // ===== LEGENDARY =====
    { id: 25, name: 'Karambit', type: 'Нож', rarity: 'legendary', price: 1200, icon: '🗡️' },
    { id: 26, name: 'Dragon Lore', type: 'Снайперская', rarity: 'legendary', price: 2500, icon: '🔫' },
    { id: 27, name: 'Pandora Gloves', type: 'Перчатки', rarity: 'legendary', price: 1800, icon: '🧤' },
    { id: 28, name: 'Gut Knife', type: 'Нож', rarity: 'legendary', price: 1100, icon: '🗡️' },
    { id: 29, name: 'Moto Gloves', type: 'Перчатки', rarity: 'legendary', price: 1600, icon: '🧤' },
    { id: 30, name: 'Howl', type: 'Винтовка', rarity: 'legendary', price: 3000, icon: '🔫' },
];

// ===== КЕЙСЫ =====
const CASES = [
    {
        id: 0,
        name: 'Обычный кейс',
        price: 80,
        icon: '📦',
        prob: { common: 85, rare: 15 },
        description: 'Базовый кейс с обычными и редкими предметами',
    },
    {
        id: 1,
        name: 'Редкий кейс',
        price: 280,
        icon: '🎁',
        prob: { rare: 80, epic: 20 },
        description: 'Улучшенный кейс с редкими и эпическими предметами',
    },
    {
        id: 2,
        name: 'Легендарный кейс',
        price: 650,
        icon: '💎',
        prob: { epic: 85, legendary: 15 },
        description: 'Премиум кейс с эпическими и легендарными предметами',
    },
];

// ===== ДОНАТ =====
const DONATION_OPTIONS = {
    10: {
        stars: 10,
        coins: 500,
        emoji: '⭐',
        description: 'Базовый пакет',
        bonus: 0,
    },
    50: {
        stars: 50,
        coins: 3000,
        emoji: '🌟',
        description: 'Стандартный пакет',
        bonus: 10, // +10% бонус
    },
    100: {
        stars: 100,
        coins: 10000,
        emoji: '💫',
        description: 'Премиум пакет',
        bonus: 20, // +20% бонус
    },
};

// ===== ОБЩИЕ НАСТРОЙКИ =====
const CONFIG = {
    // Экономика
    startBalance: 500,
    dailyReward: 200,
    inviteReward: 100,
    sellMultiplier: 0.6,
    maxInvitesPerDay: 5,

    // Рынок
    minSellPrice: 1,
    maxSellPrice: 1000000,
    marketFee: 0, // Комиссия рынка (0 = без комиссии)

    // Приложение
    appVersion: '1.0.0',
    appName: 'STORM CASES',

    // Настройки интерфейса
    maxItemsPerPage: 50,
    animationDuration: 300,
    toastDuration: 3000,
};

// ===== ФУНКЦИИ ДЛЯ РАБОТЫ С API =====
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const url = `${API_CONFIG.baseUrl}${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_CONFIG.apiKey,
            },
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'API Error');
        }

        return result;
    } catch (error) {
        console.error('❌ API Error:', error);
        return null;
    }
}

// ===== ФУНКЦИИ ДЛЯ ПОЛУЧЕНИЯ ДАННЫХ =====
function getItemById(itemId) {
    return ITEMS.find(item => item.id === itemId);
}

function getItemsByRarity(rarities) {
    return ITEMS.filter(item => rarities.includes(item.rarity));
}

function getCaseById(caseId) {
    return CASES.find(case => case.id === caseId);
}

const BOT_CONFIG = {
    username: 'storm_cases_bot',
    webAppUrl: '...',
    supportUrl: '...',
    ownerId: 8601398572, // ваш Telegram ID
    adminIds: [] // можно заполнить дополнительными админами
};

// ===== ЭКСПОРТ КОНФИГУРАЦИИ =====
window.BOT_CONFIG = BOT_CONFIG;
window.API_CONFIG = API_CONFIG;
window.ITEMS = ITEMS;
window.CASES = CASES;
window.DONATION_OPTIONS = DONATION_OPTIONS;
window.CONFIG = CONFIG;
window.apiRequest = apiRequest;