// ==================== STORM CASES - ГЛАВНЫЙ ФАЙЛ ====================

// ===== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК =====
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.add('hidden');
    });
    
    const targetTab = document.getElementById(`tab-${tab}`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }
    
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    switch(tab) {
        case 'cases':
            // Кейсы уже в HTML
            break;
        case 'market':
            renderMarket();
            break;
        case 'inventory':
            renderInventory();
            break;
        case 'settings':
            updateSettingsUI();
            break;
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    hapticFeedback('light');
}

// ===== ПОКАЗ ТОСТА =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toasts');
    
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast glass px-4 py-3 text-center text-white';
    
    switch(type) {
        case 'error':
            toast.style.background = 'rgba(255, 0, 0, 0.7)';
            toast.style.border = '1px solid rgba(255, 0, 0, 0.9)';
            break;
        case 'success':
            toast.style.background = 'rgba(0, 200, 0, 0.7)';
            toast.style.border = '1px solid rgba(0, 255, 0, 0.9)';
            break;
        default:
            toast.style.background = 'rgba(108, 92, 231, 0.7)';
            toast.style.border = '1px solid rgba(108, 92, 231, 0.9)';
    }
    
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ===== ПОКАЗ МОДАЛЬНОГО ОКНА =====
function showModal(content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/70" onclick="this.parentElement.remove()"></div>
        <div class="relative glass-strong p-6 m-4 max-w-sm w-full">
            ${content}
            <button onclick="this.closest('.fixed').remove()" 
                class="mt-4 w-full bg-white/10 py-3 rounded-lg hover:bg-white/20 transition">
                Закрыть
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// ===== ДОНАТ =====
function showDonate() {
    document.getElementById('donate-modal').classList.remove('hidden');
    hapticFeedback('light');
}

function closeDonate() {
    document.getElementById('donate-modal').classList.add('hidden');
}

// ===== СИНХРОНИЗАЦИЯ С БОТОМ =====
function syncWithBot() {
    if (!tg) return;
    
    // Отправляем текущее состояние боту
    sendDataToBot({
        action: 'sync_state',
        balance: state.balance,
        inventory: state.inventory,
    });
    
    // Слушаем ответ от бота
    tg.onEvent('message', (data) => {
        try {
            const parsed = JSON.parse(data);
            if (parsed.action === 'sync_state_response') {
                if (parsed.balance !== undefined && parsed.balance !== state.balance) {
                    state.balance = parsed.balance;
                    updateBalance();
                    save();
                }
                if (parsed.inventory) {
                    state.inventory = parsed.inventory;
                    save();
                    if (!document.getElementById('tab-inventory').classList.contains('hidden')) {
                        renderInventory();
                    }
                }
            }
        } catch (e) {
            console.log('Ответ от бота не JSON');
        }
    });
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initApp() {
    console.log('🚀 Запуск STORM CASES...');
    
    // 1. Загрузка данных
    load();
    
    // 2. Инициализация Telegram
    initTelegram();
    
    // 3. Обновление UI
    updateBalance();
    updateSettingsUI();
    
    // 4. Синхронизация с ботом
    syncWithBot();
    
    // 5. Показываем кейсы
    switchTab('cases');
    
    console.log('✅ STORM CASES успешно запущен');
    console.log('💰 Баланс:', state.balance);
    console.log('🎒 Предметов:', state.inventory.length);
}

// ===== ЗАПУСК =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ===== ЭКСПОРТ ФУНКЦИЙ =====
window.switchTab = switchTab;
window.showToast = showToast;
window.showModal = showModal;
window.showDonate = showDonate;
window.closeDonate = closeDonate;
window.openCaseModal = openCaseModal;
window.closeCaseModal = closeCaseModal;
window.openCase = openCase;
window.openSellModal = openSellModal;
window.closeSellModal = closeSellModal;
window.confirmSell = confirmSell;
window.sellItem = sellItem;
window.buyFromMarket = buyFromMarket;
window.removeFromMarket = removeFromMarket;
window.toggleSound = toggleSound;
window.toggleNotifications = toggleNotifications;
window.changeSoundVolume = changeSoundVolume;
window.updateUserName = updateUserName;
window.claimDaily = claimDaily;
window.inviteFriend = inviteFriend;
window.donate = donate;
window.showFullStats = showFullStats;
