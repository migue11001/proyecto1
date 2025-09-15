// Portfolio JavaScript - Gestione interattiva progetti CNC
// Sistema di autenticazione integrato

// Stato utente
let userState = {
    isAuthenticated: false,
    username: null,
    userType: 'guest' // guest, registered, premium
};

// Funzioni di autenticazione
function openLogin() {
    const modal = document.createElement('div');
    modal.className = 'login-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h3>Accedi al Portfoglio</h3>
                <span class="close-modal" onclick="closeLoginModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form class="login-form">
                    <input type="email" placeholder="Email" required>
                    <input type="password" placeholder="Password" required>
                    
                    <div class="form-actions">
                        <button type="submit">Accedi</button>
                    </div>
                </form>
                
                <p style="text-align: center; margin-top: 1rem;">
                    <span style="color: var(--text-light);">Non hai un account?</span>
                    <a href="#" onclick="showRegister()" style="color: var(--accent-orange); text-decoration: none;">Registrati</a>
                </p>
                
                <div class="demo-login" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--accent-orange);">
                    <p style="color: var(--text-light); text-align: center; margin-bottom: 1rem;">Account Demo:</p>
                    <button onclick="loginDemo()" style="width: 100%; background: rgba(252, 163, 17, 0.2); color: var(--accent-orange); border: 1px solid var(--accent-orange); padding: 0.8rem; border-radius: 8px; cursor: pointer;">
                        🚀 Accesso Demo
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'translateY(0)';
    }, 10);
}

function closeLoginModal() {
    const modal = document.querySelector('.login-modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'translateY(-50px)';
        
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function loginDemo() {
    // Simula login demo
    userState.isAuthenticated = true;
    userState.username = 'Demo User';
    userState.userType = 'registered';
    
    updateUserInterface();
    closeLoginModal();
    
    // Notifica successo
    showNotification('✅ Accesso effettuato! Ora puoi vedere i prezzi.', 'success');
}

function logout() {
    userState.isAuthenticated = false;
    userState.username = null;
    userState.userType = 'guest';
    
    updateUserInterface();
    showNotification('👋 Disconnesso con successo.', 'info');
}

function updateUserInterface() {
    const userStatus = document.getElementById('user-status');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (userState.isAuthenticated) {
        userStatus.textContent = `Ciao, ${userState.username}`;
        userStatus.style.display = 'inline';
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        
        // Aggiunge classe per mostrare prezzi
        document.body.classList.add('user-authenticated');
    } else {
        userStatus.style.display = 'none';
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        
        // Rimuove classe per nascondere prezzi
        document.body.classList.remove('user-authenticated');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto rimozione dopo 4 secondi
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

// Funzione per mostrare/nascondere codice CNC
function toggleCode(projectId) {
    const codeElement = document.getElementById(`code-${projectId}`);
    const toggleButton = codeElement.previousElementSibling.querySelector('.toggle-code');
    
    if (codeElement.style.display === 'none' || codeElement.style.display === '') {
        codeElement.style.display = 'block';
        toggleButton.textContent = '👁️‍🗨️';
        
        // Animazione di entrata
        codeElement.style.opacity = '0';
        codeElement.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            codeElement.style.transition = 'all 0.3s ease';
            codeElement.style.opacity = '1';
            codeElement.style.transform = 'translateY(0)';
        }, 10);
    } else {
        codeElement.style.opacity = '0';
        codeElement.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            codeElement.style.display = 'none';
            toggleButton.textContent = '👁️';
        }, 300);
    }
}

// Funzione per richiedere spiegazione del codice
function requestExplanation(type) {
    // Verifica se l'utente è autenticato
    if (!userState.isAuthenticated) {
        showNotification('🔒 Devi effettuare l\'accesso per vedere i prezzi e richiedere spiegazioni.', 'warning');
        setTimeout(() => openLogin(), 1000);
        return;
    }
    
    const explanationPrices = {
        'setup': '€15',
        'strategy': '€20',
        'turning': '€18',
        'finishing': '€22',
        '5axis': '€35',
        'titanium': '€25',
        'collision': '€30'
    };
    
    const explanationTypes = {
        'setup': 'Spiegazione Setup Macchina',
        'strategy': 'Strategia di Taglio',
        'turning': 'Ciclo di Tornitura',
        'finishing': 'Finitura Superficie',
        '5axis': 'Programmazione 5 Assi',
        'titanium': 'Parametri per Titanio',
        'collision': 'Controllo Collisioni'
    };
    
    const price = explanationPrices[type];
    const description = explanationTypes[type];
    
    if (confirm(`Vuoi richiedere la spiegazione: "${description}" - ${price}?\n\nSarai reindirizzato al modulo di contatto.`)) {
        // Simula apertura modulo di contatto
        openContactForm(description, price);
    }
}

// Funzione per aprire modulo di contatto
function openContactForm(service, price) {
    const modal = document.createElement('div');
    modal.className = 'contact-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Richiesta Consulenza</h3>
                <span class="close-modal" onclick="closeContactModal()">&times;</span>
            </div>
            <div class="modal-body">
                <p><strong>Servizio:</strong> ${service}</p>
                <p><strong>Prezzo:</strong> ${price}</p>
                
                <form class="contact-form">
                    <input type="text" placeholder="Nome" required>
                    <input type="email" placeholder="Email" required>
                    <input type="tel" placeholder="Telefono">
                    <textarea placeholder="Messaggio aggiuntivo" rows="4"></textarea>
                    
                    <div class="form-actions">
                        <button type="button" onclick="closeContactModal()">Annulla</button>
                        <button type="submit">Invia Richiesta</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate modal in
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'translateY(0)';
    }, 10);
}

// Funzione per chiudere modal
function closeContactModal() {
    const modal = document.querySelector('.contact-modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'translateY(-50px)';
        
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Funzione per upload media
function uploadMedia(projectId) {
    const fileInput = document.getElementById(`media-${projectId}`);
    fileInput.click();
    
    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const uploadArea = fileInput.parentElement;
                
                if (file.type.startsWith('video/')) {
                    uploadArea.innerHTML = `
                        <video controls style="width: 100%; max-height: 300px; border-radius: 10px;">
                            <source src="${e.target.result}" type="${file.type}">
                        </video>
                        <p style="margin-top: 1rem; color: var(--accent-orange);">✅ Video caricato: ${file.name}</p>
                    `;
                } else if (file.type.startsWith('image/')) {
                    uploadArea.innerHTML = `
                        <img src="${e.target.result}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 10px;">
                        <p style="margin-top: 1rem; color: var(--accent-orange);">✅ Immagine caricata: ${file.name}</p>
                    `;
                }
                
                // Add change media button
                uploadArea.innerHTML += `
                    <button onclick="uploadMedia(${projectId})" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--accent-orange); color: var(--primary-dark); border: none; border-radius: 5px; cursor: pointer;">
                        Cambia Media
                    </button>
                `;
            };
            
            reader.readAsDataURL(file);
        }
    };
}

// Funzione per aprire pannello aggiungi progetto
function openAddProject() {
    const modal = document.createElement('div');
    modal.className = 'add-project-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Aggiungi Nuovo Progetto</h3>
                <span class="close-modal" onclick="closeAddProjectModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form class="add-project-form">
                    <input type="text" placeholder="Titolo Progetto" required>
                    <textarea placeholder="Descrizione del progetto" rows="3" required></textarea>
                    
                    <div class="form-group">
                        <label>Tipo di Progetto:</label>
                        <select>
                            <option>Fresatura</option>
                            <option>Tornitura</option>
                            <option>5 Assi</option>
                            <option>Multi-asse</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Prezzo Consulenza (€/ora):</label>
                        <input type="number" placeholder="45" min="20" max="100">
                    </div>
                    
                    <textarea placeholder="Codice CNC (G-code)" rows="8"></textarea>
                    
                    <div class="form-actions">
                        <button type="button" onclick="closeAddProjectModal()">Annulla</button>
                        <button type="submit">Aggiungi Progetto</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate modal in
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'translateY(0)';
    }, 10);
}

// Funzione per chiudere modal aggiungi progetto
function closeAddProjectModal() {
    const modal = document.querySelector('.add-project-modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'translateY(-50px)';
        
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// CSS dinamico per i modali e notifiche
const modalStyles = `
    .notification {
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: var(--primary-dark);
        border: 2px solid var(--accent-orange);
        border-radius: 10px;
        padding: 1rem 1.5rem;
        color: var(--text-light);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        z-index: 2000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 400px;
        box-shadow: 0 8px 25px var(--shadow-dark);
    }
    
    .notification.success {
        border-color: #22c55e;
    }
    
    .notification.warning {
        border-color: #f59e0b;
    }
    
    .notification.info {
        border-color: var(--accent-orange);
    }
    
    .notification button {
        background: none;
        border: none;
        color: var(--accent-orange);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        margin: 0;
    }
    
    .login-modal,
    .contact-modal, .add-project-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(20, 33, 61, 0.9);
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .modal-content {
        background: var(--primary-dark);
        border: 2px solid var(--accent-orange);
        border-radius: 20px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        transform: translateY(-50px);
        transition: transform 0.3s ease;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--accent-orange);
    }
    
    .modal-header h3 {
        color: var(--accent-orange);
        margin: 0;
    }
    
    .close-modal {
        font-size: 2rem;
        color: var(--accent-orange);
        cursor: pointer;
        transition: transform 0.3s ease;
    }
    
    .close-modal:hover {
        transform: scale(1.2);
    }
    
    .contact-form input, .contact-form textarea,
    .add-project-form input, .add-project-form textarea, .add-project-form select {
        width: 100%;
        padding: 1rem;
        margin-bottom: 1rem;
        border: 1px solid var(--accent-orange);
        border-radius: 8px;
        background: rgba(229, 229, 229, 0.1);
        color: var(--text-light);
        font-size: 1rem;
    }
    
    .contact-form input:focus, .contact-form textarea:focus,
    .add-project-form input:focus, .add-project-form textarea:focus, .add-project-form select:focus {
        outline: none;
        border-color: var(--text-white);
        box-shadow: 0 0 10px var(--shadow-light);
    }
    
    .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
    }
    
    .form-actions button {
        padding: 0.8rem 1.5rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .form-actions button:first-child {
        background: transparent;
        border: 1px solid var(--accent-orange);
        color: var(--accent-orange);
    }
    
    .form-actions button:last-child {
        background: var(--accent-orange);
        color: var(--primary-dark);
    }
    
    .form-group {
        margin-bottom: 1rem;
    }
    
    .form-group label {
        color: var(--accent-orange);
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
    }
`;

// Aggiungere gli stili al documento
const styleElement = document.createElement('style');
styleElement.textContent = modalStyles;
document.head.appendChild(styleElement);

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    console.log('Portfolio CNC Pro - Sistema caricato con autenticazione');
    
    // Inizializza interfaccia utente
    updateUserInterface();
    
    // Aggiungere event listeners per form submissions
    document.addEventListener('submit', function(e) {
        if (e.target.classList.contains('login-form')) {
            e.preventDefault();
            // Simula login reale (in produzione si farebbe chiamata API)
            const email = e.target.querySelector('input[type="email"]').value;
            
            userState.isAuthenticated = true;
            userState.username = email.split('@')[0];
            userState.userType = 'registered';
            
            updateUserInterface();
            closeLoginModal();
            
            showNotification(`✅ Benvenuto ${userState.username}! Ora puoi vedere i prezzi.`, 'success');
        }
        
        if (e.target.classList.contains('contact-form')) {
            e.preventDefault();
            showNotification('📧 Richiesta inviata! Ti contatteremo presto.', 'success');
            closeContactModal();
        }
        
        if (e.target.classList.contains('add-project-form')) {
            e.preventDefault();
            showNotification('✅ Progetto aggiunto al portfolio!', 'success');
            closeAddProjectModal();
            // Qui si potrebbe aggiungere la logica per salvare il progetto
        }
    });
    
    // Controlla se ci sono parametri URL per auto-login demo
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === 'true') {
        setTimeout(() => loginDemo(), 1000);
    }
});