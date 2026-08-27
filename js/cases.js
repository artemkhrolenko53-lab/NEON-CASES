// ==================== STORM CASES - ЛОГИКА КЕЙСОВ ====================

// ===== ОТКРЫТИЕ МОДАЛЬНОГО ОКНА КЕЙСА =====
function openCaseModal(caseId) {
    currentCase = CASES[caseId];
    
    if (!currentCase) {
        showToast('Кейс не найден', 'error');
        return;
    }
    
    document.getElementById('modal-title').textContent = currentCase.name;
    document.getElementById('modal-price').textContent = `💰 ${currentCase.price}`;
    
    const grid = document.getElementById('modal-items');
    grid.innerHTML = '';
    
    const rarities = Object.keys(currentCase.prob);
    const possibleItems = getItemsByRarity(rarities);
    
    possibleItems.forEach(item => {
        const cell = document.createElement('div');
        cell.className = 'text-center';
        cell.innerHTML = `
            <span class="text-2xl">${item.icon}</span><br>
            <small class="rarity-${item.rarity}">${item.name}</small>
        `;
        grid.appendChild(cell);
    });
    
    document.getElementById('case-modal').classList.remove('hidden');
    hapticFeedback('light');
}

// ===== ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА =====
function closeCaseModal() {
    document.getElementById('case-modal').classList.add('hidden');
    currentCase = null;
}

// ===== ОТКРЫТИЕ КЕЙСА =====
function openCase() {
    if (!currentCase || isOpening) return;
    
    if (!spendBalance(currentCase.price)) {
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
    
    overlay.classList.remove('hidden');
    anim.classList.remove('hidden');
    reveal.classList.add('hidden');
    
    anim.textContent = currentCase.icon;
    anim.className = 'text-8xl animate-shake';
    
    // Фаза 1: Тряска
    setTimeout(() => {
        anim.className = 'text-8xl animate-spin';
    }, 800);
    
    // Фаза 2: Вращение и результат
    setTimeout(() => {
        const item = getRandomItem(currentCase);
        
        addItemToInventory(item);
        incrementCasesOpened();
        
        anim.classList.add('hidden');
        reveal.classList.remove('hidden');
        
        const rarityClass = `rarity-${item.rarity}`;
        const glowClass = `glow-${item.rarity}`;
        
        reveal.innerHTML = `
            <div class="text-8xl animate-reveal ${glowClass} rounded-full p-4">${item.icon}</div>
            <p class="${rarityClass} text-2xl font-bold">${item.name}</p>
            <p class="text-gray-400">${item.type}</p>
            <p class="text-xl">💰 ${item.price}</p>
        `;
        
        createParticles(item.rarity);
        playSound('win');
        hapticFeedback('success');
        
        if (!document.getElementById('tab-inventory').classList.contains('hidden')) {
            renderInventory();
        }
        
        setTimeout(() => {
            overlay.classList.add('hidden');
            isOpening = false;
        }, 2000);
    }, 1400);
}

// ===== ВЫБОР СЛУЧАЙНОГО ПРЕДМЕТА =====
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
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 200;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.cssText = `
            width: ${5 + Math.random() * 10}px;
            height: ${5 + Math.random() * 10}px;
            background: ${particleColors[Math.floor(Math.random() * particleColors.length)]};
            border-radius: 50%;
            left: 50%;
            top: 50%;
            --tx: ${tx}px;
            --ty: ${ty}px;
        `;
        
        overlay.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    }
}

// ===== ЕЖЕДНЕВНАЯ НАГРАДА =====
function claimDaily() {
    if (!canClaimDaily()) {
        const timeLeft = getTimeUntilNextDaily();
        const hours = Math.ceil(timeLeft / (60 * 60 * 1000));
        showToast(`Награда будет доступна через ${hours} ч.`, 'error');
        return;
    }
    
    addBalance(CONFIG.dailyReward);
    setDailyClaimed();
    showToast(`Ежедневная награда: +${CONFIG.dailyReward} 💰`, 'success');
    hapticFeedback('success');
}
