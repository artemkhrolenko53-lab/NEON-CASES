// ==================== STORM CASES - ЛОГИКА КЕЙСОВ ====================

let currentCase = null;
let isOpening = false;

// ===== ОТОБРАЖЕНИЕ КЕЙСОВ =====
function renderCases() {
    const container = document.getElementById('cases-list');

    if (!container) {
        console.error('❌ Контейнер кейсов не найден');
        return;
    }

    container.innerHTML = '';

    // Шапка
    const headerDiv = document.createElement('div');
    headerDiv.className = 'glass p-4 mb-4';
    headerDiv.innerHTML = `
        <div class="flex justify-between items-center">
            <div>
                <p class="text-sm text-gray-400">Баланс</p>
                <p class="text-2xl font-bold text-yellow-300">💰 ${state.balance}</p>
            </div>
            <button onclick="claimDaily()" class="bg-green-500/20 text-green-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-500/30 transition">
                🎁 Ежедневная награда
            </button>
        </div>
    `;
    container.appendChild(headerDiv);

    // Отображение кейсов
    CASES.forEach(caseObj => {
        const caseCard = createCaseCard(caseObj);
        container.appendChild(caseCard);
    });
}

// ===== СОЗДАНИЕ КАРТОЧКИ КЕЙСА =====
function createCaseCard(caseObj) {
    const div = document.createElement('div');
    div.className = 'glass p-5 mb-4 relative overflow-hidden cursor-pointer hover:scale-105 transition-transform';

    // Стили для разных кейсов
    const caseStyles = {
        0: { // Обычный кейс
            border: '2px solid rgba(255,255,255,0.3)',
            glow: 'box-shadow: 0 0 20px rgba(255,255,255,0.2)',
            bg: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
        },
        1: { // Редкий кейс
            border: '2px solid #4a9eff',
            glow: 'box-shadow: 0 0 25px rgba(74,158,255,0.4)',
            bg: 'linear-gradient(135deg, rgba(74,158,255,0.15), rgba(74,158,255,0.03))',
        },
        2: { // Легендарный кейс
            border: '2px solid #ffd700',
            glow: 'box-shadow: 0 0 30px rgba(255,215,0,0.5)',
            bg: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.03))',
        },
    };

    const style = caseStyles[caseObj.id] || caseStyles[0];
    div.style.cssText = `
        border: ${style.border};
        ${style.glow};
        background: ${style.bg};
    `;

    // Получаем предметы для этого кейса
    const rarities = Object.keys(caseObj.prob);
    const possibleItems = getItemsByRarity(rarities);

    // Находим лучший предмет для отображения
    const bestItem = possibleItems.reduce((best, item) =>
        !best || item.price > best.price ? item : best, null
    );

    // Проценты выпадения
    const probText = Object.entries(caseObj.prob)
        .map(([rarity, chance]) => {
            const rarityNames = {
                common: 'Обычный',
                rare: 'Редкий',
                epic: 'Эпический',
                legendary: 'Легендарный',
            };
            const rarityColors = {
                common: 'text-white',
                rare: 'text-blue-400',
                epic: 'text-purple-400',
                legendary: 'text-yellow-400',
            };
            return `<span class="${rarityColors[rarity]} text-xs">${rarityNames[rarity]}: ${chance}%</span>`;
        })
        .join(' • ');

    div.innerHTML = `
        <div class="absolute top-2 right-2 text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">
            ${possibleItems.length} предметов
        </div>
        
        <div class="flex items-center gap-4 mb-4">
            <div class="relative">
                <span class="text-6xl">${caseObj.icon}</span>
                <div class="absolute -bottom-2 -right-2 bg-yellow-500/20 text-yellow-300 text-xs font-bold px-2 py-1 rounded-full">
                    💰 ${caseObj.price}
                </div>
            </div>
            
            <div class="flex-1">
                <h3 class="text-xl font-bold text-white mb-1">${caseObj.name}</h3>
                <div class="flex flex-wrap gap-1">
                    ${probText}
                </div>
            </div>
        </div>
        
        ${bestItem ? `
        <div class="glass p-3 mb-4">
            <p class="text-xs text-gray-400 mb-2">🏆 Лучший предмет:</p>
            <div class="flex items-center gap-3">
                <span class="text-3xl">${bestItem.icon}</span>
                <div>
                    <p class="font-bold rarity-${bestItem.rarity}">${bestItem.name}</p>
                    <p class="text-xs text-gray-400">💰 ${bestItem.price}</p>
                </div>
            </div>
        </div>
        ` : ''}
        
        <button onclick="openCaseModal(${caseObj.id})" class="w-full bg-blue-500/20 text-blue-300 py-3 rounded-xl font-bold hover:bg-blue-500/30 transition">
            🎮 Открыть кейс
        </button>
    `;

    return div;
}

// ===== ОТКРЫТИЕ МОДАЛЬНОГО ОКНА КЕЙСА =====
function openCaseModal(caseId) {
    currentCase = CASES[caseId];

    if (!currentCase) {
        showToast('Кейс не найден', 'error');
        return;
    }

    const modalTitle = document.getElementById('modal-title');
    const modalPrice = document.getElementById('modal-price');
    const modalItems = document.getElementById('modal-items');

    if (!modalTitle || !modalPrice || !modalItems) {
        console.error('❌ Элементы модального окна не найдены');
        return;
    }

    modalTitle.textContent = currentCase.name;
    modalPrice.textContent = `💰 ${currentCase.price}`;

    modalItems.innerHTML = '';

    const rarities = Object.keys(currentCase.prob);
    const possibleItems = getItemsByRarity(rarities);

    // Группируем по редкости
    const groupedItems = {};
    possibleItems.forEach(item => {
        if (!groupedItems[item.rarity]) {
            groupedItems[item.rarity] = [];
        }
        groupedItems[item.rarity].push(item);
    });

    // Отображаем по группам
    Object.entries(groupedItems).forEach(([rarity, items]) => {
        const rarityNames = {
            common: 'Обычные',
            rare: 'Редкие',
            epic: 'Эпические',
            legendary: 'Легендарные',
        };

        const groupDiv = document.createElement('div');
        groupDiv.className = 'mb-4';
        groupDiv.innerHTML = `
            <p class="text-sm font-bold rarity-${rarity} mb-2">${rarityNames[rarity] || rarity}:</p>
            <div class="grid grid-cols-4 gap-2">
                ${items.map(item => `
                    <div class="text-center glass p-2">
                        <span class="text-2xl">${item.icon}</span><br>
                        <small class="rarity-${item.rarity} text-xs">${item.name}</small>
                    </div>
                `).join('')}
            </div>
        `;
        modalItems.appendChild(groupDiv);
    });

    const modal = document.getElementById('case-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }

    hapticFeedback('light');
}

// ===== ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА КЕЙСА =====
function closeCaseModal() {
    const modal = document.getElementById('case-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentCase = null;
}

// ===== ОТКРЫТИЕ КЕЙСА =====
function openCase() {
    if (!currentCase || isOpening) return;

    const caseObj = currentCase;

    if (!spendBalance(caseObj.price)) {
        showToast('Недостаточно монет', 'error');
        hapticFeedback('error');
        return;
    }

    closeCaseModal();
    isOpening = true;
    playSound('open');
    hapticFeedback('medium');

    const overlay = document.getElementById('opening-modal');
    const anim = document.getElementById('case-animation');
    const reveal = document.getElementById('item-reveal');

    if (!overlay || !anim || !reveal) {
        console.error('❌ Элементы анимации не найдены');
        isOpening = false;
        return;
    }

    overlay.classList.remove('hidden');
    anim.classList.remove('hidden');
    reveal.classList.add('hidden');

    anim.textContent = caseObj.icon;
    anim.className = 'text-8xl animate-shake';

    setTimeout(() => {
        anim.className = 'text-8xl animate-spin';
    }, 800);

    setTimeout(() => {
        const item = getRandomItem(caseObj);

        addItemToInventory(item);
        incrementCasesOpened();

        anim.classList.add('hidden');
        reveal.classList.remove('hidden');

        const rarityClass = `rarity-${item.rarity}`;
        const glowClass = `glow-${item.rarity}`;

        const rarityNames = {
            common: 'Обычный',
            rare: 'Редкий',
            epic: 'Эпический',
            legendary: 'Легендарный',
        };

        reveal.innerHTML = `
            <div class="text-center">
                <div class="text-8xl animate-reveal ${glowClass} rounded-full p-4 inline-block mb-4">${item.icon}</div>
                <p class="${rarityClass} text-3xl font-bold mb-2">${item.name}</p>
                <p class="text-gray-400 mb-1">${item.type}</p>
                <p class="text-gray-500 text-sm mb-3">${rarityNames[item.rarity] || item.rarity}</p>
                <p class="text-2xl font-bold text-yellow-300">💰 ${item.price}</p>
            </div>
        `;

        createParticles(item.rarity);
        playSound('win');
        hapticFeedback('success');

        // Обновляем инвентарь если он открыт
        const inventoryTab = document.getElementById('tab-inventory');
        if (inventoryTab && !inventoryTab.classList.contains('hidden')) {
            renderInventory();
        }

        setTimeout(() => {
            overlay.classList.add('hidden');
            isOpening = false;
            renderCases(); // Обновляем кейсы после открытия
        }, 3000);
    }, 1400);
}

// ===== ПОЛУЧЕНИЕ СЛУЧАЙНОГО ПРЕДМЕТА =====
function getRandomItem(caseObj) {
    const rand = Math.random() * 100;
    let cumulative = 0;

    for (const [rarity, chance] of Object.entries(caseObj.prob)) {
        cumulative += chance;
        if (rand <= cumulative) {
            const items = getItemsByRarity([rarity]);
            if (items.length > 0) {
                return items[Math.floor(Math.random() * items.length)];
            }
        }
    }

    return ITEMS[0];
}

// ===== СОЗДАНИЕ ЧАСТИЦ =====
function createParticles(rarity) {
    const colors = {
        common: ['#ffffff', '#cccccc', '#999999'],
        rare: ['#4a9eff', '#0066ff', '#66b3ff'],
        epic: ['#a855f7', '#7c3aed', '#c084fc'],
        legendary: ['#ffd700', '#ffcc00', '#ffaa00'],
    };

    const particleColors = colors[rarity] || colors.common;
    const overlay = document.getElementById('opening-modal');

    if (!overlay) return;

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 250;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        const size = 5 + Math.random() * 15;

        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            background: ${particleColors[Math.floor(Math.random() * particleColors.length)]};
            border-radius: 50%;
            left: 50%;
            top: 50%;
            --tx: ${tx}px;
            --ty: ${ty}px;
            animation-delay: ${Math.random() * 0.3}s;
        `;

        overlay.appendChild(particle);
        setTimeout(() => particle.remove(), 2000);
    }
}

// ===== ЕЖЕДНЕВНАЯ НАГРАДА =====
function claimDaily() {
    if (!canClaimDaily()) {
        const timeLeft = getTimeUntilNextDaily();
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

        if (hours > 0) {
            showToast(`Награда через ${hours} ч. ${minutes} мин.`, 'error');
        } else {
            showToast(`Награда через ${minutes} мин.`, 'error');
        }
        return;
    }

    addBalance(CONFIG.dailyReward);
    setDailyClaimed();

    // Модальное окно с наградой
    const rewardHTML = `
        <div class="text-center space-y-4">
            <div class="text-6xl">🎁</div>
            <h3 class="font-bold text-2xl">Ежедневная награда!</h3>
            <p class="text-gray-400">Вы получили:</p>
            <p class="text-4xl font-bold text-yellow-300">💰 ${CONFIG.dailyReward}</p>
            <button onclick="closeModal()" class="w-full bg-blue-500/20 text-blue-300 py-3 rounded-lg font-bold hover:bg-blue-500/30 transition">
                Отлично!
            </button>
        </div>
    `;

    showModal(rewardHTML);
    hapticFeedback('success');
    playSound('win');
    renderCases();
}

// Экспорт функций
window.renderCases = renderCases;
window.openCaseModal = openCaseModal;
window.closeCaseModal = closeCaseModal;
window.openCase = openCase;
window.claimDaily = claimDaily;