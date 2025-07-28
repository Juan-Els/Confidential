// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyABzNYiDEAmTubW7iNJnBRbOMC6utmCwQw",
    authDomain: "confidential-node.firebaseapp.com",
    databaseURL: "https://confidential-node-default-rtdb.firebaseio.com/",
    projectId: "confidential-node",
    storageBucket: "confidential-node.firebasestorage.app",
    messagingSenderId: "816954641261",
    appId: "1:816954641261:web:e441e37d51d02d72a02864"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variables globales
let currentUser = null;
let messagesRef = null;
let typingRef = null;
let typingTimeout = null;
let isDecrypted = false;
let userPassword = null;
let originalMessages = new Map(); // Almacenar mensajes originales para desencriptación


// Configuración de usuarios
const users = {
    "Kenny": {
        password: "123",
        icon: "👤",
        color: "#667eea",
        role: "user"
    },
    "Getsell": {
        password: "1234",
        icon: "👥",
        color: "#764ba2",
        role: "user"
    },
    "Sebastian": {
        password: "2325",
        icon: "🔐",
        color: "#f093fb",
        role: "user"
    },
    "Administrador": {
        password: "098",
        icon: "⚡",
        color: "#ff6b6b",
        role: "admin"
    }
};

// Elementos del DOM
const screens = {
    login: document.getElementById('loginScreen'),
    chat: document.getElementById('chatScreen'),
    loading: document.getElementById('loadingScreen'),
    dashboard: document.getElementById('dashboardScreen')
};

const elements = {
    usernameInput: document.getElementById('usernameInput'),
    passwordInput: document.getElementById('passwordInput'),
    loginButton: document.getElementById('loginButton'),
    errorMessage: document.getElementById('errorMessage'),
    currentUserAvatar: document.getElementById('currentUserAvatar'),
    messagesContainer: document.getElementById('messagesContainer'),
    messageInput: document.getElementById('messageInput'),
    sendButton: document.getElementById('sendButton'),
    typingIndicator: document.getElementById('typingIndicator'),
    onlineUsers: document.getElementById('onlineUsers')
};

// Estado de la aplicación
let isConnected = false;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Verificar que todos los elementos existan
    console.log('Inicializando aplicación...');
    console.log('Elementos encontrados:', {
        loginScreen: !!screens.login,
        chatScreen: !!screens.chat,
        dashboardScreen: !!screens.dashboard,
        usernameInput: !!elements.usernameInput,
        passwordInput: !!elements.passwordInput,
        loginButton: !!elements.loginButton
    });
    
    setupEventListeners();
    showScreen('login');
    
    // Verificar conexión a Firebase
    checkFirebaseConnection();
}

function setupEventListeners() {
    // Input de usuario
    elements.usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            elements.passwordInput.focus();
        }
    });

    // Input de contraseña
    elements.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            attemptLogin();
        }
    });

    // Botón de login
    elements.loginButton.addEventListener('click', attemptLogin);

    // Input de mensaje
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    elements.messageInput.addEventListener('input', handleTyping);

    // Botón de enviar
    elements.sendButton.addEventListener('click', sendMessage);

    // Detectar cuando el usuario está escribiendo
    elements.messageInput.addEventListener('focus', () => {
        if (currentUser) {
            setTypingStatus(true);
        }
    });

    elements.messageInput.addEventListener('blur', () => {
        if (currentUser) {
            setTypingStatus(false);
        }
    });
}

function attemptLogin() {
    const username = elements.usernameInput.value.trim();
    const password = elements.passwordInput.value.trim();

    if (!username || !password) {
        showError('Por favor ingresa usuario y contraseña');
        return;
    }

    const user = users[username];
    
    if (!user) {
        showError('Usuario no encontrado');
        return;
    }

    if (password === user.password) {
        // Guardar contraseña para encriptación
        userPassword = password;
        
        currentUser = {
            name: username,
            icon: user.icon,
            color: user.color,
            role: user.role
        };
        
        showScreen('loading');
        
        // Redirigir según el rol del usuario
        if (user.role === 'admin') {
            setTimeout(() => {
                showScreen('dashboard');
                initializeDashboard();
            }, 1500);
        } else {
            connectToChat();
        }
    } else {
        showError('Contraseña incorrecta');
        elements.passwordInput.value = '';
    }
}

function connectToChat() {
    // Simular conexión
    setTimeout(() => {
        initializeChat();
        showScreen('chat');
    }, 1500);
}

function initializeChat() {
    // Configurar avatar del usuario actual
    elements.currentUserAvatar.textContent = currentUser.icon;
    elements.currentUserAvatar.style.background = `linear-gradient(135deg, ${currentUser.color}, #764ba2)`;

    // Limpiar mensajes anteriores del DOM
    clearAllMessages();

    // Configurar referencias de Firebase
    messagesRef = database.ref('messages');
    typingRef = database.ref('typing');

    // Cargar mensajes existentes primero
    loadExistingMessages();
    
    // Luego escuchar nuevos mensajes
    listenForNewMessages();
    
    // Escuchar usuarios escribiendo
    listenForTyping();
    
    // Marcar usuario como conectado
    setUserOnlineStatus(true);
    
    // Inicializar estado de encriptación
    updateEncryptionUI();
}

function loadExistingMessages() {
    // Cargar mensajes existentes una sola vez
    messagesRef.once('value', (snapshot) => {
        const messages = snapshot.val();
        if (messages) {
            // Convertir a array y ordenar por timestamp
            const messageArray = Object.keys(messages).map(key => ({
                ...messages[key],
                firebaseKey: key
            })).sort((a, b) => a.timestamp - b.timestamp);
            
            // Mostrar cada mensaje
            messageArray.forEach(message => {
                displayMessage(message);
            });
        } else {
            // Si no hay mensajes, mostrar mensaje de bienvenida
            showWelcomeMessage();
        }
        
        // Scroll al final después de cargar todos los mensajes
        setTimeout(() => {
            scrollToBottom();
        }, 100);
    });
}

function listenForNewMessages() {
    // Obtener timestamp actual para solo escuchar mensajes nuevos
    const now = Date.now();
    
    // Escuchar solo mensajes nuevos (después del timestamp actual)
    messagesRef.orderByChild('timestamp').startAt(now).on('child_added', (snapshot) => {
        const message = snapshot.val();
        // Solo mostrar si el mensaje es realmente nuevo (no es del proceso de carga inicial)
        if (message.timestamp >= now) {
            displayMessage(message);
        }
    });
}

function listenForTyping() {
    typingRef.on('value', (snapshot) => {
        const typingUsers = snapshot.val() || {};
        updateTypingIndicator(typingUsers);
    });
}

async function sendMessage() {
    const messageText = elements.messageInput.value.trim();
    
    if (messageText && currentUser && userPassword) {
        // Encriptar el mensaje y el nombre usando la clave maestra
        const encryptedText = await chatEncryption.encryptText(messageText);
        const encryptedSender = await chatEncryption.encryptUsername(currentUser.name);
        
        const message = {
            id: Date.now().toString(),
            text: encryptedText,
            originalText: messageText, // Guardar texto original para referencia local
            sender: encryptedSender,
            originalSender: currentUser.name, // Guardar nombre original para referencia local
            senderId: currentUser.name, // Mantener ID real para lógica
            timestamp: Date.now(),
            icon: currentUser.icon,
            encrypted: true
        };

        // Enviar a Firebase (solo datos encriptados)
        const firebaseMessage = {
            id: message.id,
            text: message.text,
            sender: message.sender,
            senderId: message.senderId,
            timestamp: message.timestamp,
            icon: message.icon,
            encrypted: true
        };

        messagesRef.push(firebaseMessage);
        
        // Limpiar input
        elements.messageInput.value = '';
        
        // Detener indicador de escritura
        setTypingStatus(false);
    }
}

async function displayMessage(message) {
    // Eliminar mensaje de bienvenida si existe
    clearWelcomeMessage();
    
    // Guardar mensaje original para posible desencriptación
    originalMessages.set(message.id || message.timestamp.toString(), message);
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.senderId === currentUser.name ? 'own' : 'other'}`;
    messageElement.setAttribute('data-message-id', message.id || message.timestamp.toString());
    
    const time = new Date(message.timestamp).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });

    let displayText = message.text;
    let displaySender = message.sender;
    
    // Si el mensaje está encriptado y estamos en modo desencriptado
    if (message.encrypted && isDecrypted && userPassword) {
        try {
            displayText = await chatEncryption.decryptText(message.text);
            displaySender = await chatEncryption.decryptUsernameAuto(message.sender);
        } catch (error) {
            console.error('Error al desencriptar mensaje:', error);
        }
    } else if (message.encrypted && !isDecrypted) {
        // Mostrar versión encriptada visual
        displayText = chatEncryption.generateEncryptedDisplayText(message.text);
        displaySender = chatEncryption.generateEncryptedDisplayName(message.sender);
        messageElement.classList.add('encrypted');
    }

    messageElement.innerHTML = `
        <div class="message-info">
            <span class="sender-name">${escapeHtml(displaySender)}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-bubble">
            ${escapeHtml(displayText)}
        </div>
    `;

    elements.messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

function handleTyping() {
    if (currentUser) {
        setTypingStatus(true);
        
        // Limpiar timeout anterior
        clearTimeout(typingTimeout);
        
        // Establecer nuevo timeout
        typingTimeout = setTimeout(() => {
            setTypingStatus(false);
        }, 2000);
    }
}

function setTypingStatus(isTyping) {
    if (currentUser && typingRef) {
        if (isTyping) {
            typingRef.child(currentUser.name).set({
                name: currentUser.name,
                timestamp: Date.now()
            });
        } else {
            typingRef.child(currentUser.name).remove();
        }
    }
}

function updateTypingIndicator(typingUsers) {
    const typingNames = [];
    
    Object.keys(typingUsers).forEach(userId => {
        if (userId !== currentUser.name) {
            const user = typingUsers[userId];
            // Verificar que el usuario esté escribiendo recientemente (últimos 3 segundos)
            if (Date.now() - user.timestamp < 3000) {
                typingNames.push(user.name);
            }
        }
    });

    if (typingNames.length > 0) {
        const text = typingNames.length === 1 
            ? `${typingNames[0]} está escribiendo...`
            : `${typingNames.join(', ')} están escribiendo...`;
        elements.typingIndicator.textContent = text;
    } else {
        elements.typingIndicator.textContent = '';
    }
}

function setUserOnlineStatus(isOnline) {
    // Aquí puedes implementar lógica para mostrar usuarios conectados
    // Por ahora solo actualizamos el texto
    if (isOnline) {
        elements.onlineUsers.textContent = 'Conectado';
    }
}

function clearWelcomeMessage() {
    const welcomeMessage = elements.messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
}

function clearAllMessages() {
    // Limpiar todos los mensajes del contenedor
    elements.messagesContainer.innerHTML = '';
}

function showWelcomeMessage() {
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'welcome-message';
    welcomeDiv.innerHTML = `
        <div class="welcome-icon">💬</div>
        <h3>¡Bienvenido al Chat Grupal!</h3>
        <p>Este es un espacio seguro para comunicarte con tus amigos</p>
        <div style="margin-top: 1rem; padding: 1rem; background: var(--surface-light); border-radius: 8px;">
            <p style="font-size: 0.9rem; color: var(--text-secondary);">
                Conectado como <strong>${currentUser.name}</strong> ${currentUser.icon}
            </p>
        </div>
    `;
    elements.messagesContainer.appendChild(welcomeDiv);
}

function scrollToBottom() {
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    screens[screenName].classList.add('active');
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.add('show');
}

function hideError() {
    elements.errorMessage.classList.remove('show');
}



function goBack() {
    // Si hay un usuario conectado, hacer logout completo
    if (currentUser) {
        logout();
        return;
    }
    
    // Limpiar campos de login
    elements.usernameInput.value = '';
    elements.passwordInput.value = '';
    hideError();
    showScreen('login');
}

function logout() {
    if (currentUser) {
        // Marcar como desconectado
        setUserOnlineStatus(false);
        setTypingStatus(false);
        
        // Limpiar referencias de Firebase
        if (messagesRef) {
            messagesRef.off();
            messagesRef = null;
        }
        if (typingRef) {
            typingRef.off();
            typingRef = null;
        }

        
        // Limpiar mensajes del DOM
        clearAllMessages();
        
        // Resetear estado
        currentUser = null;
        userPassword = null;
        isDecrypted = false;
        originalMessages.clear();
        
        // Limpiar inputs
        elements.usernameInput.value = '';
        elements.passwordInput.value = '';
        elements.messageInput.value = '';
        hideError();
        
        // Limpiar indicador de escritura
        elements.typingIndicator.textContent = '';
        
        // Volver al login
        showScreen('login');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}



function checkFirebaseConnection() {
    // Verificar si Firebase está configurado correctamente
    if (firebaseConfig.apiKey === "TU_API_KEY") {
        console.warn('⚠️ Firebase no está configurado. Por favor, actualiza la configuración en script.js');
        showConnectionStatus('disconnected', 'Firebase no configurado');
        return;
    }

    // Verificar conexión
    const connectedRef = database.ref('.info/connected');
    connectedRef.on('value', (snapshot) => {
        isConnected = snapshot.val();
        if (isConnected) {
            showConnectionStatus('connected', 'Conectado');
        } else {
            showConnectionStatus('disconnected', 'Sin conexión');
        }
    });
}

function showConnectionStatus(status, message) {
    // Crear o actualizar indicador de estado
    let statusElement = document.querySelector('.connection-status');
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.className = 'connection-status';
        document.body.appendChild(statusElement);
    }
    
    statusElement.className = `connection-status ${status}`;
    statusElement.textContent = message;
    
    // Auto-ocultar después de 3 segundos si está conectado
    if (status === 'connected') {
        setTimeout(() => {
            statusElement.style.opacity = '0';
            setTimeout(() => {
                if (statusElement.parentNode) {
                    statusElement.parentNode.removeChild(statusElement);
                }
            }, 300);
        }, 3000);
    }
}

// Manejar visibilidad de la página
document.addEventListener('visibilitychange', () => {
    if (currentUser) {
        if (document.hidden) {
            setTypingStatus(false);
        }
    }
});

// Manejar cierre de ventana
window.addEventListener('beforeunload', () => {
    if (currentUser) {
        setUserOnlineStatus(false);
        setTypingStatus(false);
    }
});

// Funciones del Dashboard de Administrador
function initializeDashboard() {
    console.log('Inicializando dashboard de administrador...');
    loadDashboardStats();
}

function loadDashboardStats() {
    // Cargar estadísticas del chat
    if (!messagesRef) {
        messagesRef = database.ref('messages');
    }
    
    messagesRef.once('value', (snapshot) => {
        const messages = snapshot.val();
        const messageCount = messages ? Object.keys(messages).length : 0;
        
        // Actualizar estadísticas en el dashboard
        const statsElement = document.getElementById('messageCount');
        if (statsElement) {
            statsElement.textContent = messageCount;
        }
        
        // Cargar últimos mensajes para preview
        loadRecentMessages(messages);
    });
}

function loadRecentMessages(messages) {
    const recentMessagesContainer = document.getElementById('recentMessages');
    if (!recentMessagesContainer || !messages) return;
    
    const messageArray = Object.keys(messages).map(key => ({
        ...messages[key],
        firebaseKey: key
    })).sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
    
    recentMessagesContainer.innerHTML = '';
    
    if (messageArray.length === 0) {
        recentMessagesContainer.innerHTML = '<p class="no-messages">No hay mensajes recientes</p>';
        return;
    }
    
    messageArray.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'recent-message-item';
        
        const time = new Date(message.timestamp).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${message.icon} ${message.sender}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${escapeHtml(message.text)}</div>
        `;
        
        recentMessagesContainer.appendChild(messageDiv);
    });
}

function clearAllChatMessages() {
    console.log('clearAllChatMessages() llamada');
    
    // Mostrar modal de confirmación
    showDeleteModal();
}

function showDeleteModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.classList.add('show');
        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.classList.remove('show');
        // Restaurar scroll del body
        document.body.style.overflow = '';
    }
}

function confirmDeleteMessages() {
    console.log('Confirmación del usuario: true');
    
    // Cerrar modal
    closeDeleteModal();
    
    // Inicializar messagesRef si no existe
    if (!messagesRef) {
        messagesRef = database.ref('messages');
        console.log('messagesRef inicializada:', messagesRef);
    }
    
    // Mostrar loading en el botón
    const deleteBtn = document.getElementById('deleteMessagesBtn');
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = `
            <div class="action-icon">🔄</div>
            <div class="action-content">
                <h4>Eliminando...</h4>
                <p>Por favor espera mientras se eliminan los mensajes</p>
            </div>
        `;
    }
    
    // Eliminar todos los mensajes de Firebase
    messagesRef.remove().then(() => {
        console.log('Mensajes eliminados exitosamente de Firebase');
        
        // Actualizar estadísticas
        loadDashboardStats();
        
        // Mostrar mensaje de éxito
        showDashboardMessage('✅ Todos los mensajes han sido eliminados exitosamente de Firebase', 'success');
        
        // Restaurar botón
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = `
                <div class="action-icon">🗑️</div>
                <div class="action-content">
                    <h4>Eliminar Todos los Mensajes</h4>
                    <p>Borra permanentemente todos los mensajes del chat</p>
                </div>
            `;
        }
        
    }).catch((error) => {
        console.error('Error al eliminar mensajes:', error);
        showDashboardMessage('❌ Error al eliminar los mensajes: ' + error.message, 'error');
        
        // Restaurar botón
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = `
                <div class="action-icon">🗑️</div>
                <div class="action-content">
                    <h4>Eliminar Todos los Mensajes</h4>
                    <p>Borra permanentemente todos los mensajes del chat</p>
                </div>
            `;
        }
    });
}

function showDashboardMessage(message, type = 'info') {
    const messageContainer = document.getElementById('dashboardMessage');
    if (!messageContainer) return;
    
    messageContainer.className = `dashboard-message ${type}`;
    messageContainer.textContent = message;
    messageContainer.style.display = 'block';
    
    // Auto-ocultar después de 4 segundos
    setTimeout(() => {
        messageContainer.style.opacity = '0';
        setTimeout(() => {
            messageContainer.style.display = 'none';
            messageContainer.style.opacity = '1';
        }, 300);
    }, 4000);
}

function logoutFromDashboard() {
    // Limpiar referencias
    if (messagesRef) {
        messagesRef.off();
        messagesRef = null;
    }
    
    // Resetear estado
    currentUser = null;
    userPassword = null;
    isDecrypted = false;
    originalMessages.clear();
    
    // Limpiar campos de login
    elements.usernameInput.value = '';
    elements.passwordInput.value = '';
    hideError();
    
    // Volver al login
    showScreen('login');
}

// Funciones de utilidad para debugging
window.debugChat = {
    getCurrentUser: () => currentUser,
    getUsers: () => users,
    clearMessages: () => {
        if (messagesRef) {
            messagesRef.remove();
        }
    },
    sendTestMessage: (text = "Mensaje de prueba") => {
        if (currentUser) {
            const message = {
                id: Date.now().toString(),
                text: text,
                sender: currentUser.name,
                senderId: currentUser.name,
                timestamp: Date.now(),
                icon: currentUser.icon
            };
            messagesRef.push(message);
        }
    }
};

// Event listener para cerrar modal al hacer clic fuera
document.addEventListener('DOMContentLoaded', function() {
    const deleteModal = document.getElementById('deleteConfirmModal');
    const decryptModal = document.getElementById('decryptPasswordModal');
    const decryptPasswordInput = document.getElementById('decryptPasswordInput');
    
    if (deleteModal) {
        deleteModal.addEventListener('click', function(e) {
            if (e.target === deleteModal) {
                closeDeleteModal();
            }
        });
    }
    
    if (decryptModal) {
        decryptModal.addEventListener('click', function(e) {
            if (e.target === decryptModal) {
                closeDecryptModal();
            }
        });
    }
    
    if (decryptPasswordInput) {
        decryptPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                confirmDecryption();
            }
        });
    }
});

// Event listener para cerrar modal con la tecla Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const deleteModal = document.getElementById('deleteConfirmModal');
        const decryptModal = document.getElementById('decryptPasswordModal');
        
        if (deleteModal && deleteModal.classList.contains('show')) {
            closeDeleteModal();
        }
        if (decryptModal && decryptModal.classList.contains('show')) {
            closeDecryptModal();
        }
    }
});

// Funciones de Encriptación/Desencriptación
function toggleEncryption() {
    if (isDecrypted) {
        // Si está desencriptado, volver a encriptar
        encryptMessages();
    } else {
        // Si está encriptado, pedir contraseña para desencriptar
        showDecryptModal();
    }
}

function showDecryptModal() {
    const modal = document.getElementById('decryptPasswordModal');
    const input = document.getElementById('decryptPasswordInput');
    const errorMsg = document.getElementById('decryptErrorMessage');
    
    if (modal) {
        // Limpiar campos
        input.value = '';
        errorMsg.textContent = '';
        errorMsg.classList.remove('show');
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus en el input
        setTimeout(() => input.focus(), 300);
    }
}

function closeDecryptModal() {
    const modal = document.getElementById('decryptPasswordModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

async function confirmDecryption() {
    const passwordInput = document.getElementById('decryptPasswordInput');
    const errorMsg = document.getElementById('decryptErrorMessage');
    const confirmBtn = document.getElementById('confirmDecryptBtn');
    
    const enteredPassword = passwordInput.value.trim();
    
    if (!enteredPassword) {
        showDecryptError('Por favor ingresa tu contraseña');
        return;
    }
    
    // Verificar que la contraseña sea correcta
    if (enteredPassword !== userPassword) {
        showDecryptError('Contraseña incorrecta');
        passwordInput.value = '';
        return;
    }
    
    // Mostrar loading
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="btn-icon">🔄</span>Desencriptando...';
    
    try {
        // Desencriptar mensajes
        await decryptMessages();
        closeDecryptModal();
        
        // Actualizar estado visual
        updateEncryptionUI();
        
    } catch (error) {
        console.error('Error al desencriptar:', error);
        showDecryptError('Error al desencriptar los mensajes');
    } finally {
        // Restaurar botón
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<span class="btn-icon">🔓</span>Desencriptar';
    }
}

function showDecryptError(message) {
    const errorMsg = document.getElementById('decryptErrorMessage');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.classList.add('show');
    }
}

async function decryptMessages() {
    isDecrypted = true;
    
    // Limpiar contenedor de mensajes
    clearAllMessages();
    
    // Volver a mostrar todos los mensajes desencriptados
    const messages = Array.from(originalMessages.values()).sort((a, b) => a.timestamp - b.timestamp);
    
    for (const message of messages) {
        await displayMessage(message);
    }
    
    // Si no hay mensajes, mostrar mensaje de bienvenida
    if (messages.length === 0) {
        showWelcomeMessage();
    }
}

async function encryptMessages() {
    isDecrypted = false;
    
    // Limpiar contenedor de mensajes
    clearAllMessages();
    
    // Volver a mostrar todos los mensajes encriptados
    const messages = Array.from(originalMessages.values()).sort((a, b) => a.timestamp - b.timestamp);
    
    for (const message of messages) {
        await displayMessage(message);
    }
    
    // Si no hay mensajes, mostrar mensaje de bienvenida
    if (messages.length === 0) {
        showWelcomeMessage();
    }
    
    // Actualizar estado visual
    updateEncryptionUI();
}

function updateEncryptionUI() {
    const decryptBtn = document.getElementById('decryptBtn');
    
    if (isDecrypted) {
        decryptBtn.innerHTML = '🔒';
        decryptBtn.title = 'Encriptar mensajes';
        decryptBtn.classList.add('encrypted');
        
        // Mostrar indicador de estado
        showEncryptionStatus('🔓 Mensajes Desencriptados', 'decrypted');
    } else {
        decryptBtn.innerHTML = '🔓';
        decryptBtn.title = 'Ver mensajes desencriptados';
        decryptBtn.classList.remove('encrypted');
        
        // Mostrar indicador de estado
        showEncryptionStatus('🔒 Mensajes Encriptados', 'encrypted');
    }
}

function showEncryptionStatus(message, type) {
    // Remover indicador anterior si existe
    const existingStatus = document.querySelector('.encryption-status');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    // Crear nuevo indicador
    const statusDiv = document.createElement('div');
    statusDiv.className = `encryption-status ${type}`;
    statusDiv.textContent = message;
    
    document.body.appendChild(statusDiv);
    
    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
        if (statusDiv.parentNode) {
            statusDiv.style.opacity = '0';
            setTimeout(() => {
                if (statusDiv.parentNode) {
                    statusDiv.remove();
                }
            }, 300);
        }
    }, 3000);
}
