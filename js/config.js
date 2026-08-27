// ==================== КОНФИГУРАЦИЯ ====================
const BOT_CONFIG = {
    username: 'storm_cases_bot',
    webAppUrl: 'https://your-url.com',
    supportUrl: 'https://t.me/StormSupports_Bot',
    ownerId: 8601398572, // ваш Telegram ID
    adminIds: [] // дополнительные админы (уровень 1)
};

const ITEMS = [
    // Обычные
    { id: 1, name: 'Glock-18', type: 'Пистолет', rarity: 'common', price: 30, icon: '🔫' },
    { id: 2, name: 'USP-S', type: 'Пистолет', rarity: 'common', price: 35, icon: '🔫' },
    { id: 3, name: 'P250', type: 'Пистолет', rarity: 'common', price: 45, icon: '🔫' },
    { id: 4, name: 'MAC-10', type: 'ПП', rarity: 'common', price: 50, icon: '🔫' },
    { id: 5, name: 'MP9', type: 'ПП', rarity: 'common', price: 60, icon: '🔫' },
    { id: 6, name: 'UMP-45', type: 'ПП', rarity: 'common', price: 70, icon: '🔫' },
    { id: 7, name: 'MP7', type: 'ПП', rarity: 'common', price: 75, icon: '🔫' },
    { id: 8, name: 'Nova', type: 'Дробовик', rarity: 'common', price: 65, icon: '🔫' },
    { id: 9, name: 'MAG-7', type: 'Дробовик', rarity: 'common', price: 85, icon: '🔫' },
    { id: 10, name: 'Sawed-Off', type: 'Дробовик', rarity: 'common', price: 65, icon: '🔫' },
    // Редкие
    { id: 11, name: 'Tec-9', type: 'Пистолет', rarity: 'rare', price: 55, icon: '🔫' },
    { id: 12, name: 'Desert Eagle', type: 'Пистолет', rarity: 'rare', price: 250, icon: '🔫' },
    { id: 13, name: 'P90', type: 'ПП', rarity: 'rare', price: 210, icon: '🔫' },
    { id: 14, name: 'Galil AR', type: 'Винтовка', rarity: 'rare', price: 190, icon: '🔫' },
    { id: 15, name: 'FAMAS', type: 'Винтовка', rarity: 'rare', price: 200, icon: '🔫' },
    { id: 16, name: 'SSG 08', type: 'Снайперская', rarity: 'rare', price: 280, icon: '🔫' },
    { id: 17, name: 'Sport Gloves', type: 'Перчатки', rarity: 'rare', price: 150, icon: '🧤' },
    // Эпические
    { id: 18, name: 'AK-47', type: 'Винтовка', rarity: 'epic', price: 180, icon: '🔫' },
    { id: 19, name: 'M4A4', type: 'Винтовка', rarity: 'epic', price: 220, icon: '🔫' },
    { id: 20, name: 'M4A1-S', type: 'Винтовка', rarity: 'epic', price: 250, icon: '🔫' },
    // Легендарные
    { id: 21, name: 'AWP', type: 'Снайперская', rarity: 'legendary', price: 450, icon: '🔫' },
    { id: 22, name: 'SCAR-20', type: 'Снайперская', rarity: 'legendary', price: 480, icon: '🔫' },
    { id: 23, name: 'Butterfly Knife', type: 'Нож', rarity: 'legendary', price: 600, icon: '🗡️' },
    { id: 24, name: 'Karambit', type: 'Нож', rarity: 'legendary', price: 1200, icon: '🗡️' },
    { id: 25, name: 'Gut Knife', type: 'Нож', rarity: 'legendary', price: 1100, icon: '🗡️' },
    { id: 26, name: 'Specialist Gloves', type: 'Перчатки', rarity: 'legendary', price: 550, icon: '🧤' },
    { id: 27, name: 'Moto Gloves', type: 'Перчатки', rarity: 'legendary', price: 1600, icon: '🧤' },
    { id: 28, name: 'Pandora Gloves', type: 'Перчатки', rarity: 'legendary', price: 1800, icon: '🧤' },
    { id: 29, name: 'Dragon Lore', type: 'Скин', rarity: 'legendary', price: 2500, icon: '🐉' },
    { id: 30, name: 'Howl', type: 'Скин', rarity: 'legendary', price: 3000, icon: '🐺' },
    // Мифические
    { id: 36, name: 'Мифический AWP', type: 'Снайперская', rarity: 'mythic', price: 15000, icon: '💥' },
    { id: 37, name: 'Мифический Керамбит', type: 'Нож', rarity: 'mythic', price: 20000, icon: '🔪' },
    { id: 38, name: 'Мифические Перчатки', type: 'Перчатки', rarity: 'mythic', price: 18000, icon: '🔥' },
];

const CASES = [
    { id: 0, name: 'Обычный кейс', price: 80, icon: '📦', prob: { common: 85, rare: 15 } },
    { id: 1, name: 'Редкий кейс', price: 280, icon: '🎁', prob: { rare: 80, epic: 20 } },
    { id: 2, name: 'Легендарный кейс', price: 650, icon: '💎', prob: { epic: 85, legendary: 15 } },
    { id: 3, name: 'Ножевой кейс', price: 1000, icon: '🗡️', prob: { rare: 50, epic: 35, legendary: 15 } },
    { id: 4, name: 'Премиум кейс', price: 1500, icon: '👑', prob: { epic: 60, legendary: 40 } },
    { id: 5, name: 'Мифический кейс', price: 3000, icon: '🌟', prob: { legendary: 90, mythic: 10 } },
];

const CRAFT_RECIPES = [
    { id: 1, resultId: 18, name: 'AK-47', ingredients: [{ id: 1, qty: 5 }, { id: 6, qty: 3 }] },
    { id: 2, resultId: 21, name: 'AWP', ingredients: [{ id: 16, qty: 3 }, { id: 22, qty: 2 }] },
    { id: 3, resultId: 23, name: 'Butterfly Knife', ingredients: [{ id: 24, qty: 1 }, { id: 25, qty: 1 }] },
    { id: 4, resultId: 27, name: 'Moto Gloves', ingredients: [{ id: 17, qty: 2 }, { id: 26, qty: 1 }] },
    { id: 5, resultId: 36, name: 'Мифический AWP', ingredients: [{ id: 29, qty: 2 }, { id: 21, qty: 5 }] },
    { id: 6, resultId: 37, name: 'Мифический Керамбит', ingredients: [{ id: 24, qty: 3 }, { id: 25, qty: 3 }] },
    { id: 7, resultId: 38, name: 'Мифические Перчатки', ingredients: [{ id: 27, qty: 2 }, { id: 28, qty: 2 }] },
];

const SERVERS = [
    { id: 'alpha', name: 'Alpha', maxPlayers: 100, playersOnline: Math.floor(Math.random() * 100) },
    { id: 'beta', name: 'Beta', maxPlayers: 100, playersOnline: Math.floor(Math.random() * 100) },
    { id: 'gamma', name: 'Gamma', maxPlayers: 100, playersOnline: Math.floor(Math.random() * 100) },
    { id: 'delta', name: 'Delta', maxPlayers: 100, playersOnline: Math.floor(Math.random() * 100) },
    { id: 'epsilon', name: 'Epsilon', maxPlayers: 100, playersOnline: Math.floor(Math.random() * 100) },
];

const ADMIN_PASSWORDS = {
    alpha: { admin: 'alpha123' },
    beta: { admin: 'beta123' },
    gamma: { admin: 'gamma123' },
    delta: { admin: 'delta123' },
    epsilon: { admin: 'epsilon123' },
};

const DONATION_OPTIONS = {
    10: { stars: 10, coins: 500 },
    50: { stars: 50, coins: 3000 },
    100: { stars: 100, coins: 10000 },
};
