// ==================== STORM CASES - ГЛАВНЫЙ ФАЙЛ ====================

// ===== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК =====
function switchTab(tab) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.add('hidden');
    });

    // Показываем нужную вкладку
    const targetTab = document.getElementById(`tab-${tab}`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }

    // Обновляем кнопки навигации
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Обновляем содержимое вкладок
    switch(tab) {
        case 'cases':
            renderCases();
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

    // Плавная прокрутка вверх
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Тактильный отклик
    hapticFeedback('light');
}

// ===== ОТОБРАЖЕНИЕ КЕЙСОВ =====
function renderCases() {
    const container = document.getElementById('cases-container');

    if (!container) {
        console.error('Контейнер кейсов не найден');
        return;
    }

    // Контейнер уже заполнен в HTML, не нужно перерисовывать
    // Но можно добавить динамические элементы, если нужно
}

// ===== ПОКАЗ ТОСТА =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toasts');

    if (!container) {
        console.error('Контейнер тостов не найден');
        return;
    }

    const toast = document.createElement('div');
    toast.className = 'toast glass px-4 py-3 text-center text-white';

    // Цвет фона в зависимости от типа
    switch(type) {
        case 'error':
            toast.style.background = 'rgba(255, 0, 0, 0.7)';
            toast.style.border = '1px solid rgba(255, 0, 0, 0.9)';
            break;
        case 'success':
            toast.style.background = 'rgba(0, 200, 0, 0.7)';
            toast.style.border = '1px solid rgba(0, 255, 0, 0.9)';
            break;
        case 'warning':
            toast.style.background = 'rgba(255, 150, 0, 0.7)';
            toast.style.border = '1px solid rgba(255, 200, 0, 0.9)';
            break;
        default:
            toast.style.background = 'rgba(108, 92, 231, 0.7)';
            toast.style.border = '1px solid rgba(108, 92, 231, 0.9)';
    }

    toast.textContent = message;
    container.appendChild(toast);

    // Автоматическое удаление
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

// ===== ИНИЦИАЛИЗАЦИЯ ЗВУКА =====
function initAudio() {
    musicPlayer = new Audio();
    musicPlayer.loop = true;
    // musicPlayer.src = 'assets/music/background.mp3'; // Добавьте файл позже
    musicPlayer.volume = state.musicVolume / 100;
}

// ===== ОБРАБОТКА КЛАВИАТУРЫ =====
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+1..4 для переключения вкладок
        if (e.ctrlKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    switchTab('cases');
                    break;
                case '2':
                    e.preventDefault();
                    switchTab('market');
                    break;
                case '3':
                    e.preventDefault();
                    switchTab('inventory');
                    break;
                case '4':
                    e.preventDefault();
                    switchTab('settings');
                    break;
            }
        }

        // Escape для закрытия модальных окон
        if (e.key === 'Escape') {
            closeCaseModal();
            closeDonate();
            closeSellModal();
        }
    });
}

// ===== ОБРАБОТКА ЖЕСТОВ =====
function setupGestures() {
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 100;
        const diff = touchEndX - touchStartX;

        if (Math.abs(diff) < swipeThreshold) return;

        const tabs = ['cases', 'market', 'inventory', 'settings'];
        const currentTab = document.querySelector('.tab-button.active')?.dataset.tab;
        const currentIndex = tabs.indexOf(currentTab);

        if (diff < 0 && currentIndex < tabs.length - 1) {
            // Свайп влево - следующая вкладка
            switchTab(tabs[currentIndex + 1]);
        } else if (diff > 0 && currentIndex > 0) {
            // Свайп вправо - предыдущая вкладка
            switchTab(tabs[currentIndex - 1]);
        }
    }
}

// ===== АВТОСОХРАНЕНИЕ =====
function setupAutoSave() {
    // Сохраняем каждые 30 секунд
    setInterval(() => {
        save();
    }, 30000);

    // Сохраняем при закрытии
    window.addEventListener('beforeunload', () => {
        save();
    });

    // Сохраняем при сворачивании
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            save();
        }
    });
}

// ===== ОБРАБОТКА ОШИБОК =====
function setupErrorHandling() {
    window.onerror = (message, source, lineno, colno, error) => {
        console.error('Глобальная ошибка:', {
            message,
            source,
            lineno,
            colno,
            error,
        });

        showToast('Произошла ошибка', 'error');

        // Пытаемся сохранить данные
        save();

        return false;
    };

    window.onunhandledrejection = (event) => {
        console.error('Необработанное обещание:', event.reason);
        showToast('Произошла ошибка', 'error');
    };
}

// ===== ПРОВЕРКА ЦЕЛОСТНОСТИ ДАННЫХ =====
function validateState() {
    const issues = [];

    if (state.balance < 0) {
        issues.push('Отрицательный баланс');
        state.balance = 0;
    }

    if (!Array.isArray(state.inventory)) {
        issues.push('Инвентарь не массив');
        state.inventory = [];
    }

    if (!Array.isArray(state.market)) {
        issues.push('Рынок не массив');
        state.market = [];
    }

    if (state.soundVolume < 0 || state.soundVolume > 100) {
        issues.push('Некорректная громкость звука');
        state.soundVolume = 100;
    }

    if (state.musicVolume < 0 || state.musicVolume > 100) {
        issues.push('Некорректная громкость музыки');
        state.musicVolume = 100;
    }

    if (issues.length > 0) {
        console.warn('Найдены проблемы:', issues);
        save();
    }
}

// ===== ОТОБРАЖЕНИЕ ПРИВЕТСТВИЯ =====
function showWelcomeMessage() {
    const isFirstLaunch = !localStorage.getItem('storm_welcomed');

    if (isFirstLaunch) {
        setTimeout(() => {
            showToast('🎉 Добро пожаловать в STORM CASES!', 'success');
            localStorage.setItem('storm_welcomed', 'true');
        }, 1000);

        setTimeout(() => {
            showToast('💰 Вам начислено 500 монет!', 'info');
        }, 3000);
    }
}

// ===== ГЛАВНАЯ ИНИЦИАЛИЗАЦИЯ =====
function initApp() {
    console.log('🚀 Запуск STORM CASES...');

    // 1. Загружаем данные
    load();

    // 2. Валидация данных
    validateState();

    // 3. Инициализация Telegram
    initTelegram();

    // 4. Инициализация аудио
    initAudio();

    // 5. Обновление UI
    updateBalance();
    updateSettingsUI();

    // 6. Показываем начальную вкладку
    switchTab('cases');

    // 7. Настройка обработчиков
    setupKeyboardShortcuts();
    setupGestures();
    setupAutoSave();
    setupErrorHandling();

    // 8. Приветствие
    showWelcomeMessage();

    console.log('✅ STORM CASES успешно запущен');
    console.log('💰 Баланс:', state.balance);
    console.log('🎒 Предметов:', state.inventory.length);
    console.log('📊 Рынок:', state.market.length);
}

// ===== ЗАПУСК ПРИЛОЖЕНИЯ =====
document.addEventListener('DOMContentLoaded', initApp);

// Если DOM уже загружен
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ===== ЭКСПОРТ ФУНКЦИЙ ДЛЯ ГЛОБАЛЬНОГО ДОСТУПА =====
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
window.toggleMusic = toggleMusic;
window.toggleNotifications = toggleNotifications;
window.changeLanguage = changeLanguage;
window.changeGraphicsQuality = changeGraphicsQuality;
window.changeSoundVolume = changeSoundVolume;
window.changeMusicVolume = changeMusicVolume;
window.updateUserName = updateUserName;
window.claimDaily = claimDaily;
window.inviteFriend = inviteFriend;
window.donate = donate;