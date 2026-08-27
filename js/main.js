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

    // Обновляем кнопки
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Вызываем нужный рендер
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
            renderSettings();
            break;
    }

    hapticFeedback('light');
}

// ===== ПОКАЗ ТОСТА =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toasts');
    if (!container) {
        console.error('❌ Контейнер для тостов не найден');
        return;
    }

    const toast = document.createElement('div');
    toast.className = 'toast glass px-4 py-3 text-center text-white mb-2';

    // Стили для разных типов
    const styles = {
        info: {
            background: 'rgba(108, 92, 231, 0.9)',
            icon: 'ℹ️',
        },
        success: {
            background: 'rgba(0, 200, 0, 0.9)',
            icon: '✅',
        },
        error: {
            background: 'rgba(255, 0, 0, 0.9)',
            icon: '❌',
        },
        warning: {
            background: 'rgba(255, 165, 0, 0.9)',
            icon: '⚠️',
        },
    };

    const style = styles[type] || styles.info;
    toast.style.background = style.background;
    toast.innerHTML = `${style.icon} ${message}`;

    container.appendChild(toast);

    // Анимация появления
    toast.style.animation = 'slideInUp 0.3s ease-out';

    // Удаление через 3 секунды
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ===== ПОКАЗ МОДАЛЬНОГО ОКНА =====
function showModal(content) {
    // Закрываем предыдущее модальное окно
    closeModal();

    const modal = document.createElement('div');
    modal.id = 'custom-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="closeModal()"></div>
        <div class="relative glass-strong p-6 w-full max-w-sm mx-auto animate-reveal">
            ${content}
            <button onclick="closeModal()" class="mt-4 w-full bg-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/20 transition">
                Закрыть
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    // Блокируем прокрутку body
    document.body.style.overflow = 'hidden';
}

// ===== ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА =====
function closeModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.remove();
    }

    // Разблокируем прокрутку
    document.body.style.overflow = '';
}

// ===== ДОНАТ =====
function showDonate() {
    const donateModal = document.getElementById('donate-modal');
    if (donateModal) {
        donateModal.classList.remove('hidden');
        renderDonateOptions();
    }
}

function closeDonate() {
    const donateModal = document.getElementById('donate-modal');
    if (donateModal) {
        donateModal.classList.add('hidden');
    }
}

// ===== ОТОБРАЖЕНИЕ ОПЦИЙ ДОНАТА =====
function renderDonateOptions() {
    const container = document.getElementById('donate-options');
    if (!container) return;

    container.innerHTML = '';

    Object.entries(DONATION_OPTIONS).forEach(([stars, option]) => {
        const div = document.createElement('div');
        div.className = 'glass p-4 mb-3 cursor-pointer hover:scale-105 transition-transform';

        const emoji = stars == 10 ? '⭐' : stars == 50 ? '🌟' : '💫';
        const bonus = stars == 10 ? '' : stars == 50 ? '+10% бонус' : '+20% бонус';

        div.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-4xl">${emoji}</span>
                    <div>
                        <p class="font-bold text-white">${stars} звёзд</p>
                        <p class="text-sm text-gray-400">💰 ${option.coins} монет</p>
                        ${bonus ? `<p class="text-xs text-green-400">${bonus}</p>` : ''}
                    </div>
                </div>
                <button onclick="donate(${stars})" class="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-500/30 transition">
                    Купить
                </button>
            </div>
        `;

        container.appendChild(div);
    });
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ =====
function initApp() {
    console.log('🚀 Запуск STORM CASES...');

    try {
        // Проверяем наличие всех необходимых объектов
        if (typeof CONFIG === 'undefined') {
            console.error('❌ CONFIG не определен');
            return;
        }

        if (typeof STORAGE_KEYS === 'undefined') {
            console.error('❌ STORAGE_KEYS не определен');
            return;
        }

        // Загружаем данные
        load();
        console.log('✅ Данные загружены');

        // Инициализируем API
        if (typeof api !== 'undefined') {
            api.init();
        } else {
            initTelegram();
        }

        // Загружаем качество графики
        loadGraphicsQuality();

        // Обновляем UI
        updateBalance();
        updateSettingsUI();

        // Показываем вкладку кейсов
        switchTab('cases');

        // Показываем приветствие для новых пользователей
        if (state.userName === 'Гость') {
            setTimeout(() => {
                showWelcomeModal();
            }, 500);
        }

        console.log('✅ STORM CASES запущен');
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        showToast('Ошибка загрузки приложения', 'error');
    }
}

// ===== ЗАГРУЗКА КАЧЕСТВА ГРАФИКИ =====
function loadGraphicsQuality() {
    const quality = localStorage.getItem('graphics_quality') || 'medium';
    document.body.classList.add(`graphics-${quality}`);

    const select = document.getElementById('graphics-quality');
    if (select) {
        select.value = quality;
    }
}

// ===== ПРИВЕТСТВЕННОЕ ОКНО =====
function showWelcomeModal() {
    const welcomeHTML = `
        <div class="text-center space-y-4">
            <div class="text-6xl">⚡</div>
            <h3 class="font-bold text-2xl">Добро пожаловать в STORM CASES!</h3>
            <p class="text-gray-400">
                Открывай кейсы, собирай редкие предметы,<br>
                торгуй на рынке и зарабатывай монеты!
            </p>
            <div class="glass p-4">
                <p class="text-sm text-gray-300">
                    🎁 Ежедневная награда: <span class="text-yellow-300 font-bold">${CONFIG.dailyReward} 💰</span><br>
                    🎮 Начальный баланс: <span class="text-yellow-300 font-bold">${CONFIG.startBalance} 💰</span>
                </p>
            </div>
        </div>
    `;

    showModal(welcomeHTML);
}

// ===== ОБРАБОТКА ОШИБОК =====
window.addEventListener('error', function(e) {
    console.error('❌ Глобальная ошибка:', e.error || e.message);
});

// ===== ОБРАБОТКА НЕОБРАБОТАННЫХ ПРОМИСОВ =====
window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Необработанный промис:', e.reason);
});

// ===== ЭКСПОРТ ВСЕХ ФУНКЦИЙ =====
window.switchTab = switchTab;
window.showToast = showToast;
window.showModal = showModal;
window.closeModal = closeModal;
window.showDonate = showDonate;
window.closeDonate = closeDonate;
window.renderDonateOptions = renderDonateOptions;

// ===== ЗАПУСК ПРИЛОЖЕНИЯ =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}