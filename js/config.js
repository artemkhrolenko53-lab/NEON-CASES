// ==================== STORM CASES - КОНФИГУРАЦИЯ ====================

// ===== ИМЯ БОТА =====
const BOT_USERNAME = 'StormCases_Bot'; // ← ЗАМЕНИТЕ НА ВАШЕ ИМЯ БОТА БЕЗ @

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
    },
    {
        id: 1,
        name: 'Редкий кейс',
        price: 280,
        icon: '🎁',
        prob: { rare: 80, epic: 20 },
    },
    {
        id: 2,
        name: 'Легендарный кейс',
        price: 650,
        icon: '💎',
        prob: { epic: 85, legendary: 15 },
    },
];

// ===== ДОНАТ =====
const DONATION_OPTIONS = {
    10: { stars: 10, coins: 500 },
    50: { stars: 50, coins: 3000 },
    100: { stars: 100, coins: 10000 },
};

// ===== ОБЩИЕ НАСТРОЙКИ =====
const CONFIG = {
    startBalance: 500,
    dailyReward: 200,
    inviteReward: 100,
    sellMultiplier: 0.6, // продажа за 60% от цены
    maxInvitesPerDay: 5,
};
