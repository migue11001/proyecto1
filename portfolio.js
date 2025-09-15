// Portfolio JavaScript - Gestione interattiva progetti CNC
// Sistema di autenticazione integrato con Backend Django

// Stato utente - sincronizado con API
let userState = {
    isAuthenticated: false,
    username: null,
    userType: 'guest' // guest, registered, subscribed
};

// Initialize from API on load
function initializeUserState() {
    if (window.isUserAuthenticated && window.isUserAuthenticated()) {
        const userData = window.getUserData();
        userState.isAuthenticated = true;
        userState.username = userData.username || userData.email;
        userState.userType = window.isUserSubscribed() ? 'subscribed' : 'registered';
        updateUserInterface();
    }
}

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
                    <input type="text" name="username" placeholder="Username o Email" required>
                    <input type="password" name="password" placeholder="Password" required>
                    
                    <div class="form-actions">
                        <button type="submit">Accedi</button>
                    </div>
                </form>
                
                <p style="text-align: center; margin-top: 1rem;">
                    <span style="color: var(--text-light);">Non hai un account?</span>
                    <a href="#" onclick="showRegister()" style="color: var(--accent-orange); text-decoration: none;">Registrati</a>
                </p>
                
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

// Demo function removed for privacy

function logout() {
    // Clear API tokens
    if (window.clearAuthTokens) {
        window.clearAuthTokens();
    }
    
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

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('Portfolio CNC Pro - Sistema caricato con autenticazione Django');
    
    // Inizializza stato utente da API
    if (typeof initializeUserState === 'function') {
        initializeUserState();
    } else {
        updateUserInterface();
    }
    
    // Load projects from API
    loadProjectsFromAPI();
    
    // Event listeners per form submissions
    document.addEventListener('submit', function(e) {
        if (e.target.classList.contains('login-form')) {
            e.preventDefault();
            handleLoginSubmit(e.target);
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

// New API integration functions
async function handleLoginSubmit(form) {
    const formData = new FormData(form);
    const username = formData.get('username');
    const password = formData.get('password');
    
    try {
        const response = await window.API.login({ username, password });
        
        userState.isAuthenticated = true;
        userState.username = response.user.username || response.user.email;
        userState.userType = response.is_subscribed ? 'subscribed' : 'registered';
        
        updateUserInterface();
        closeLoginModal();
        
        const subscriptionStatus = response.is_subscribed ? 'suscriptor' : 'registrado';
        showNotification(`✅ Benvenuto ${userState.username}! (${subscriptionStatus})`, 'success');
        
    } catch (error) {
        console.error('Login failed:', error);
        showNotification('❌ Credenziali non valide. Riprova.', 'warning');
    }
}

async function loadProjectsFromAPI() {
    try {
        const projects = await window.API.getProjects();
        console.log('Projects loaded from API:', projects);
        
        // Update project cards with real data
        updateProjectCards(projects.results || projects);
        
    } catch (error) {
        console.error('Failed to load projects:', error);
        showNotification('⚠️ Errore nel caricamento progetti. Usando dati locali.', 'warning');
    }
}

function updateProjectCards(projects) {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (!portfolioGrid || projects.length === 0) return;
    
    // Clear existing cards except templates
    const existingCards = portfolioGrid.querySelectorAll('.project-card');
    existingCards.forEach(card => card.remove());
    
    // Create new cards from API data
    projects.forEach((project, index) => {
        const projectCard = createProjectCard(project, index + 1);
        portfolioGrid.appendChild(projectCard);
    });
}

function createProjectCard(project, index) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
        <div class="project-header">
            <h3>${project.title}</h3>
        </div>
        
        <div class="project-media">
            <div class="media-upload-area admin-only" onclick="uploadMedia(${index})" style="display:none;">
                <span>📹 Carica Video/Immagine</span>
                <input type="file" id="media-${index}" accept="video/*,image/*" style="display:none">
            </div>
            <div class="media-placeholder">
                <div class="placeholder-content">
                    <span>${getProcessIcon(project.process_type)}</span>
                    <p>Video dimostrativo disponibile</p>
                </div>
            </div>
        </div>

        <div class="project-description">
            <p>${project.description}</p>
        </div>

        <div class="cnc-code-section">
            <h4>Codice CNC <span class="toggle-code" onclick="toggleCode(${index})">👁️</span></h4>
            <pre class="cnc-code" id="code-${index}" style="display:none">
${project.cnc_code || 'Codice disponibile dopo la sottoscrizione...'}
            </pre>
        </div>

        <div class="project-actions" style="display:none;">
            <button class="download-btn">📥 Scarica Files</button>
            <span class="consultation-price">Consulenza: €${project.consultation_price}/ora</span>
        </div>
        
        <div class="public-cta">
            <p>Interessato a questo progetto? <a href="#" onclick="openLogin()" class="contact-link">Contattami per maggiori informazioni</a></p>
        </div>
    `;
    
    return card;
}

function getProcessIcon(processType) {
    const icons = {
        'milling': '🎬',
        'turning': '⚙️',
        '5axis': '✈️',
        'multiaxis': '🔧'
    };
    return icons[processType] || '🔧';
}

// Enhanced explanation request with subscription check
async function requestExplanation(type) {
    if (!userState.isAuthenticated) {
        showNotification('🔒 Devi effettuare l\'accesso per vedere le spiegazioni.', 'warning');
        setTimeout(() => openLogin(), 1000);
        return;
    }
    
    // Check if user is subscribed
    if (!window.isUserSubscribed()) {
        showSubscriptionModal(type);
        return;
    }
    
    // User is subscribed, show explanation
    try {
        // Find explanation ID based on type (this would need to be properly mapped)
        const explanationId = getExplanationIdByType(type);
        const response = await window.API.checkExplanationAccess(explanationId);
        
        if (response.has_access) {
            showExplanationModal(type, response.explanation_text);
        } else {
            showSubscriptionModal(type);
        }
    } catch (error) {
        console.error('Failed to get explanation:', error);
        showNotification('❌ Errore nel caricamento spiegazione.', 'warning');
    }
}

function showSubscriptionModal(explanationType) {
    const modal = document.createElement('div');
    modal.className = 'subscription-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Sottoscrizione Richiesta</h3>
                <span class="close-modal" onclick="closeSubscriptionModal()">&times;</span>
            </div>
            <div class="modal-body">
                <p>Per accedere alle spiegazioni dettagliate del codice CNC, è necessario sottoscrivere il servizio premium.</p>
                
                <div class="subscription-offer">
                    <h4>🚀 Abbonamento Premium</h4>
                    <p class="price">Solo <strong>£5/mese</strong></p>
                    <ul>
                        <li>✅ Accesso a tutte le spiegazioni</li>
                        <li>✅ Download dei file</li>
                        <li>✅ Supporto prioritario</li>
                    </ul>
                </div>
                
                <div class="form-actions">
                    <button onclick="closeSubscriptionModal()">Chiudi</button>
                    <button onclick="handleSubscription()" style="background: var(--accent-orange); color: var(--primary-dark);">Sottoscrivi Ora</button>
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

function closeSubscriptionModal() {
    const modal = document.querySelector('.subscription-modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'translateY(-50px)';
        setTimeout(() => modal.remove(), 300);
    }
}

async function handleSubscription() {
    try {
        const response = await window.API.subscribe();
        
        // Update user state
        userState.userType = 'subscribed';
        const userData = window.getUserData();
        userData.is_subscribed = true;
        
        closeSubscriptionModal();
        showNotification('🎉 Sottoscrizione attivata! Ora puoi accedere a tutte le spiegazioni.', 'success');
        
        // Update UI to show subscription features
        updateUserInterface();
        
    } catch (error) {
        console.error('Subscription failed:', error);
        showNotification('❌ Errore nella sottoscrizione. Riprova.', 'warning');
    }
}

function getExplanationIdByType(type) {
    // This would need to be properly mapped based on your actual data
    const mapping = {
        'setup': 1,
        'strategy': 2,
        'turning': 3,
        'finishing': 4,
        '5axis': 5,
        'titanium': 6,
        'collision': 7
    };
    return mapping[type] || 1;
}

function showExplanationModal(type, explanationText) {
    const modal = document.createElement('div');
    modal.className = 'explanation-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Spiegazione: ${type}</h3>
                <span class="close-modal" onclick="closeExplanationModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="explanation-content">
                    <p>${explanationText}</p>
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

function closeExplanationModal() {
    const modal = document.querySelector('.explanation-modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'translateY(-50px)';
        setTimeout(() => modal.remove(), 300);
    }
}