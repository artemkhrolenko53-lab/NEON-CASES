// ==================== STORM CASES - TELEGRAM API ====================

const tg = window.Telegram?.WebApp;

function initTelegram() {
    if (!tg) return;

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
    } catch (e) {
        console.error('Ошибка Telegram:', e);
    }
}

function updateUserInfo() {
    const userIdElement = document.getElementById('user-id');
    const userNameInput = document.getElementById('user-name-input');
    if (userIdElement) userIdElement.textContent = state.userId;
    if (userNameInput) userNameInput.value = state.userName;
}

function hapticFeedback(type = 'light') {
    if (!tg?.HapticFeedback) return;
    try {
        switch(type) {
            case 'light': tg.HapticFeedback.impactOccurred('light'); break;
            case 'medium': tg.HapticFeedback.impactOccurred('medium'); break;
            case 'heavy': tg.HapticFeedback.impactOccurred('heavy'); break;
            case 'success': tg.HapticFeedback.notificationOccurred('success'); break;
            case 'error': tg.HapticFeedback.notificationOccurred('error'); break;
        }
    } catch (e) {}
}

function sendDataToBot(data) {
    if (!tg) return;
    try {
        tg.sendData(JSON.stringify(data));
    } catch (e) {}
}

function donate(stars) {
    const option = DONATION_OPTIONS[stars];
    if (!option) {
        showToast('Неверный пакет', 'error');
        return;
    }
    closeDonate();

    if (tg) {
        tg.openTelegramLink(`https://t.me/${BOT_USERNAME}?start=donate_${stars}`);
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
            <p class="text-sm text-gray-400">Отправь эту ссылку другу. Ты получишь +100 💰!</p>
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