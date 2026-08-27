// ==================== STORM CASES - API.JS ====================

// API для работы с Telegram WebApp
const api = {
    tg: null,
    initialized: false,

    // Инициализация API
    init() {
        console.log('🔄 Инициализация API...');

        // Пытаемся получить Telegram WebApp
        this.tg = window.Telegram?.WebApp || window.Telegram?.WebView || window.Telegram;

        if (!this.tg) {
            console.log('⚠️ Telegram WebApp не доступен');
            return false;
        }

        try {
            // Базовая инициализация
            if (this.tg.ready) this.tg.ready();
            if (this.tg.expand) this.tg.expand();

            // Установка цветов
            if (this.tg.setHeaderColor) {
                this.tg.setHeaderColor('#0a0a0f');
            }
            if (this.tg.setBackgroundColor) {
                this.tg.setBackgroundColor('#0a0a0f');
            }

            // Получение данных пользователя
            this.initUser();

            // Инициализация haptic feedback
            this.initHaptic();

            this.initialized = true;
            console.log('✅ API инициализирован');
            return true;
        } catch (error) {
            console.error('❌ Ошибка инициализации API:', error);
            return false;
        }
    },

    // Инициализация пользователя
    initUser() {
        try {
            let userData = null;

            // Пробуем разные способы получения данных
            if (this.tg.initDataUnsafe?.user) {
                userData = this.tg.initDataUnsafe.user;
            } else if (this.tg.initData) {
                try {
                    const params = new URLSearchParams(this.tg.initData);
                    const userParam = params.get('user');
                    if (userParam) {
                        userData = JSON.parse(decodeURIComponent(userParam));
                    }
                } catch (e) {
                    console.error('Ошибка парсинга initData:', e);
                }
            }

            if (userData) {
                state.userId = userData.id || 'guest';
                state.userName = userData.first_name || userData.username || 'Гость';
                console.log('✅ Пользователь:', state.userName);
            }
        } catch (error) {
            console.error('❌ Ошибка получения пользователя:', error);
        }
    },

    // Инициализация haptic feedback
    initHaptic() {
        if (!this.tg.HapticFeedback && this.tg.hapticFeedback) {
            this.tg.HapticFeedback = this.tg.hapticFeedback;
        }
    },

    // Haptic feedback
    haptic(type = 'light') {
        if (!this.tg?.HapticFeedback) return;

        try {
            switch(type) {
                case 'light':
                    if (this.tg.HapticFeedback.impactOccurred) {
                        this.tg.HapticFeedback.impactOccurred('light');
                    } else if (this.tg.HapticFeedback.light) {
                        this.tg.HapticFeedback.light();
                    }
                    break;
                case 'medium':
                    if (this.tg.HapticFeedback.impactOccurred) {
                        this.tg.HapticFeedback.impactOccurred('medium');
                    } else if (this.tg.HapticFeedback.medium) {
                        this.tg.HapticFeedback.medium();
                    }
                    break;
                case 'heavy':
                    if (this.tg.HapticFeedback.impactOccurred) {
                        this.tg.HapticFeedback.impactOccurred('heavy');
                    } else if (this.tg.HapticFeedback.heavy) {
                        this.tg.HapticFeedback.heavy();
                    }
                    break;
                case 'success':
                    if (this.tg.HapticFeedback.notificationOccurred) {
                        this.tg.HapticFeedback.notificationOccurred('success');
                    } else if (this.tg.HapticFeedback.success) {
                        this.tg.HapticFeedback.success();
                    }
                    break;
                case 'error':
                    if (this.tg.HapticFeedback.notificationOccurred) {
                        this.tg.HapticFeedback.notificationOccurred('error');
                    } else if (this.tg.HapticFeedback.error) {
                        this.tg.HapticFeedback.error();
                    }
                    break;
            }
        } catch (error) {
            console.error('❌ Ошибка haptic feedback:', error);
        }
    },

    // Отправка данных в бот
    sendData(data) {
        if (!this.tg?.sendData) return;

        try {
            this.tg.sendData(JSON.stringify(data));
        } catch (error) {
            console.error('❌ Ошибка отправки данных:', error);
        }
    },

    // Открытие ссылки
    openLink(url) {
        if (this.tg?.openTelegramLink) {
            this.tg.openTelegramLink(url);
        } else if (this.tg?.openLink) {
            this.tg.openLink(url);
        } else {
            window.open(url, '_blank');
        }
    },

    // Закрытие WebApp
    close() {
        if (this.tg?.close) {
            this.tg.close();
        }
    },

    // Показать подтверждение
    showConfirm(message, callback) {
        if (this.tg?.showConfirm) {
            this.tg.showConfirm(message, callback);
        } else {
            if (confirm(message)) {
                callback(true);
            } else {
                callback(false);
            }
        }
    },

    // Показать алерт
    showAlert(message, callback) {
        if (this.tg?.showAlert) {
            this.tg.showAlert(message, callback);
        } else {
            alert(message);
            if (callback) callback();
        }
    },

    // Показать попап
    showPopup(params, callback) {
        if (this.tg?.showPopup) {
            this.tg.showPopup(params, callback);
        } else {
            if (confirm(params.message)) {
                callback(params.buttons[0]?.id || 'ok');
            } else {
                callback(params.buttons[1]?.id || 'cancel');
            }
        }
    }
};

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ =====

function initTelegram() {
    return api.init();
}

function hapticFeedback(type = 'light') {
    api.haptic(type);
}

function sendDataToBot(data) {
    api.sendData(data);
}

function donate(stars) {
    const option = DONATION_OPTIONS[stars];
    if (!option) {
        showToast('Неверный пакет', 'error');
        return;
    }
    closeDonate();

    if (api.tg) {
        const link = `https://t.me/${BOT_USERNAME}?start=donate_${stars}`;
        api.openLink(link);
    } else {
        showToast('Оплата доступна только в Telegram', 'error');
    }
}

function inviteFriend() {
    const inviteCode = generateInviteCode();
    const inviteLink = `https://t.me/${BOT_USERNAME}?start=invite_${inviteCode}`;
    showInviteModal(inviteLink);
}

function showInviteModal(link) {
    const modalHTML = `
        <div class="text-center space-y-4">
            <span class="text-5xl">👥</span>
            <h3 class="font-bold text-xl">Пригласи друга!</h3>
            <p class="text-sm text-gray-400">Отправь эту ссылку другу. Ты получишь +${CONFIG.inviteReward} 💰!</p>
            <div class="glass p-3 break-all">
                <p class="text-xs text-gray-300">${link}</p>
            </div>
            <button onclick="copyInviteLink('${link}')" class="w-full bg-blue-500/20 text-blue-300 py-3 rounded-lg">
                📋 Скопировать ссылку
            </button>
        </div>
    `;
    showModal(modalHTML);
}

function copyInviteLink(link) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(() => {
            showToast('Ссылка скопирована!', 'success');
        }).catch(() => {
            prompt('Скопируйте ссылку:', link);
        });
    } else {
        prompt('Скопируйте ссылку:', link);
    }
}

function generateInviteCode() {
    return Math.random().toString(36).substring(2, 8);
}

function playSound(type) {
    if (!state.sound) return;
    console.log(`🔊 Звук: ${type}`);
}

// Экспорт API
window.api = api;
window.initTelegram = initTelegram;
window.hapticFeedback = hapticFeedback;
window.sendDataToBot = sendDataToBot;
window.donate = donate;
window.inviteFriend = inviteFriend;
window.copyInviteLink = copyInviteLink;
window.playSound = playSound;