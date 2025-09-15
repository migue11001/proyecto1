// API Configuration - Conexión con Backend Django
const API_BASE_URL = 'http://localhost:8000/api';

// Token management
let authTokens = {
    access: localStorage.getItem('access_token'),
    refresh: localStorage.getItem('refresh_token')
};

// Utility function to make API requests
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    // Add authorization header if token exists
    if (authTokens.access && !options.skipAuth) {
        defaultOptions.headers['Authorization'] = `Bearer ${authTokens.access}`;
    }
    
    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, config);
        
        if (response.status === 401 && authTokens.refresh) {
            // Try to refresh token
            const refreshed = await refreshAuthToken();
            if (refreshed && !options.skipAuth) {
                config.headers['Authorization'] = `Bearer ${authTokens.access}`;
                return await fetch(url, config);
            }
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// Authentication functions
async function refreshAuthToken() {
    if (!authTokens.refresh) return false;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh: authTokens.refresh
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            authTokens.access = data.access;
            localStorage.setItem('access_token', data.access);
            return true;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
    }
    
    // If refresh fails, clear tokens
    clearAuthTokens();
    return false;
}

function saveAuthTokens(tokens) {
    authTokens.access = tokens.access;
    authTokens.refresh = tokens.refresh;
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
}

function clearAuthTokens() {
    authTokens.access = null;
    authTokens.refresh = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
}

// User management
function saveUserData(userData) {
    localStorage.setItem('user_data', JSON.stringify(userData));
}

function getUserData() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
}

function isUserAuthenticated() {
    return authTokens.access && getUserData();
}

function isUserSubscribed() {
    const userData = getUserData();
    return userData && userData.is_subscribed;
}

// API Functions
const API = {
    // Projects
    async getProjects() {
        return await apiRequest('/projects/');
    },
    
    async getProject(id) {
        return await apiRequest(`/projects/${id}/`);
    },
    
    async getProjectStats() {
        return await apiRequest('/stats/', { skipAuth: true });
    },
    
    // Authentication
    async register(userData) {
        const response = await apiRequest('/auth/register/', {
            method: 'POST',
            body: JSON.stringify(userData),
            skipAuth: true
        });
        
        if (response.tokens) {
            saveAuthTokens(response.tokens);
            saveUserData(response.user);
        }
        
        return response;
    },
    
    async login(credentials) {
        const response = await apiRequest('/auth/login/', {
            method: 'POST',
            body: JSON.stringify(credentials),
            skipAuth: true
        });
        
        if (response.tokens) {
            saveAuthTokens(response.tokens);
            saveUserData({
                ...response.user,
                subscription_status: response.subscription_status,
                is_subscribed: response.is_subscribed
            });
        }
        
        return response;
    },
    
    async getUserProfile() {
        return await apiRequest('/auth/profile/');
    },
    
    // Subscriptions
    async subscribe() {
        const response = await apiRequest('/subscription/subscribe/', {
            method: 'POST'
        });
        
        // Update user data with new subscription status
        if (response.subscription) {
            const userData = getUserData();
            userData.subscription_status = 'active';
            userData.is_subscribed = true;
            saveUserData(userData);
        }
        
        return response;
    },
    
    async checkExplanationAccess(explanationId) {
        return await apiRequest(`/explanation/${explanationId}/access/`);
    },
    
    // Explanation requests
    async requestExplanation(data) {
        return await apiRequest('/explanation-request/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async getUserRequests() {
        return await apiRequest('/my-requests/');
    }
};

// Initialize auth state on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (isUserAuthenticated()) {
        console.log('User is authenticated:', getUserData());
        
        // Update UI to reflect authenticated state
        if (typeof updateUserInterface === 'function') {
            // Simulate userState for compatibility with existing code
            window.userState = {
                isAuthenticated: true,
                username: getUserData().username || getUserData().email,
                userType: isUserSubscribed() ? 'subscribed' : 'registered'
            };
            updateUserInterface();
        }
    }
});

// Export for global access
window.API = API;
window.isUserAuthenticated = isUserAuthenticated;
window.isUserSubscribed = isUserSubscribed;
window.getUserData = getUserData;
window.clearAuthTokens = clearAuthTokens;