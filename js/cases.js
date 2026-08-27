// ==================== STORM CASES - ЛОГИКА КЕЙСОВ ====================

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

function closeCaseModal() {
    document.getElementById('case-modal').classList.add('hidden');
    currentCase = null;
}

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

    overlay.classList.remove('hidden');
    anim.classList.remove('hidden');
    reveal.classList.add('hidden');
    // ...
}

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