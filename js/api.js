// ==================== STORM CASES - TELEGRAM API ====================

const tg = window.Telegram?.WebApp;

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initTelegram() {
    if (!tg) {
        console.log('⚠️ Telegram WebApp не обнаружен');
        return;
    }

    try {
        tg.ready();
        tg.expand();
        
        tg.setHeaderColor('#0a0a0f');
        tg.setBackgroundColor('#0a0a0f');
        
        if (tg.initDataUnsafe?.user) {
            state.userId = tg.initDataUnsafe.user.id;
            state.userName = tg.initDataUnsafe.user.first_name || 'Гость';
            updateUserInfo();
        }
        
        console.log('✅ Telegram WebApp инициализирован');
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
    }
}

function updateUserInfo() {
    const userIdElement = document.getElementById('user-id');
    const userNameInput = document.getElementById('user-name-input');
    
    if (userIdElement) userIdElement.textContent = state.userId;
    if (userNameInput) userNameInput.value = state.userName;
}

// ===== ВИБРАЦИЯ =====
function hapticFeedback(type = 'light') {
    if (!tg?.HapticFeedback) return;
    
    try {
        switch(type) {
            case 'light': tg.HapticFeedback.impactOccurred('light'); break;
            case 'medium': tg.HapticFeedback.impactOccurred('medium'); break;
            case 'heavy': tg.HapticFeedback.impactOccurred('heavy'); break;
            case 'success': tg.HapticFeedback.notificationOccurred('success'); break;
            case 'error': tg.HapticFeedback.notificationOccurred('error'); break;
            case 'warning': tg.HapticFeedback.notificationOccurred('warning'); break;
        }
    } catch (error) {
        console.error('Ошибка haptic feedback:', error);
    }
}

// ===== ОТПРАВКА ДАННЫХ В БОТА =====
function sendDataToBot(data) {
    if (!tg) return;
    
    try {
        tg.sendData(JSON.stringify(data));
    } catch (error) {
        console.error('❌ Ошибка отправки данных:', error);
    }
}

// ===== ДОНАТ (ИСПРАВЛЕН) =====
function donate(stars) {
    const option = DONATION_OPTIONS[stars];
    if (!option) {
        showToast('Неверный пакет', 'error');
        return;
    }
    
    closeDonate();
    
    if (tg) {
        // Открываем бота с параметром для оплаты
        tg.openTelegramLink(`https://t.me/${BOT_USERNAME}?start=donate_${stars}`);
    } else {
        showToast('Оплата доступна только в Telegram', 'error');
    }
}

// ===== ПРИГЛАШЕНИЕ ДРУГА (ИСПРАВЛЕНО) =====
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
            <p class="text-sm text-gray-400">
                Отправь эту ссылку другу.<br>
                Когда он перейдёт по ней, ты получишь <b>+100 💰</b>!
            </p>
            <div class="glass p-3 break-all">
                <p class="text-xs text-gray-300">${link}</p>
            </div>
            <button onclick="copyInviteLink('${link}')" 
                class="w-full bg-blue-500/20 text-blue-300 py-3 rounded-lg hover:bg-blue-500/30 transition">
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
            hapticFeedback('success');
        });
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = link;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
        showToast('Ссылка скопирована!', 'success');
    }
}

function generateInviteCode() {
    return Math.random().toString(36).substring(2, 8);
}

// ===== ОБРАБОТКА ВХОДЯЩИХ ДАННЫХ =====
function handleIncomingData(data) {
    try {
        const parsed = JSON.parse(data);
        
        switch(parsed.action) {
            case 'add_balance':
                addBalance(parsed.amount);
                showToast(`+${parsed.amount} 💰`, 'success');
                break;
            case 'remove_balance':
                spendBalance(parsed.amount);
                break;
            case 'add_item':
                const item = getItemById(parsed.itemId);
                if (item) addItemToInventory(item);
                break;
            default:
                console.log('Неизвестное действие:', parsed.action);
        }
    } catch (error) {
        console.error('Ошибка обработки данных:', error);
    }
}

function setupEventHandlers() {
    if (!tg) return;
    
    tg.onEvent('mainButtonClicked', () => {
        console.log('Main button clicked');
    });
    
    tg.onEvent('message', (data) => {
        handleIncomingData(data);
    });
}

// ===== ЗВУКИ =====
function playSound(type) {
    if (!state.sound) return;
    console.log(`🔊 Звук: ${type}`);
}
