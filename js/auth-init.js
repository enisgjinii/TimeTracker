import authService from './auth-service.js';
import AuthUI from './auth-ui.js';

class AuthManager {
    constructor() {
        this.authUI = null;
        this.initializeAuth();
    }

    async initializeAuth() {
        try {
            // Initialize the authentication UI
            this.authUI = new AuthUI();
            
            // Set up user menu functionality
            this.setupUserMenu();
            
            // Listen for auth state changes
            authService.onAuthStateChanged((user) => {
                this.handleAuthStateChange(user);
            });
            
            console.log('Authentication system initialized');
        } catch (error) {
            console.error('Error initializing authentication:', error);
        }
    }

    setupUserMenu() {
        const userMenuButton = document.getElementById('user-menu-button');
        const userMenuDropdown = document.getElementById('user-menu-dropdown');
        const logoutButton = document.getElementById('logout-button');

        if (userMenuButton) {
            userMenuButton.addEventListener('click', (e) => {
                e.preventDefault();
                userMenuDropdown.classList.toggle('show');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                userMenuDropdown.classList.remove('show');
            }
        });

        // Handle logout
        if (logoutButton) {
            logoutButton.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.handleLogout();
            });
        }
    }

    handleAuthStateChange(user) {
        if (user) {
            // User is signed in
            this.updateUserInfo(user);
            this.showMainContent();
        } else {
            // User is signed out
            this.updateUserInfo(null);
            this.showAuthUI();
        }
    }

    updateUserInfo(user) {
        const userInfoElements = document.querySelectorAll('.user-info');
        const userMenuButton = document.getElementById('user-menu-button');
        
        if (user) {
            const displayName = user.displayName || user.email || 'User';
            userInfoElements.forEach(element => {
                element.textContent = displayName;
            });
            
            // Update user menu button
            if (userMenuButton) {
                userMenuButton.innerHTML = `
                    <i class="fi fi-rr-user"></i>
                    <span class="user-info">${displayName}</span>
                    <i class="fi fi-rr-angle-small-down"></i>
                `;
            }
        } else {
            userInfoElements.forEach(element => {
                element.textContent = 'Guest';
            });
            
            // Reset user menu button
            if (userMenuButton) {
                userMenuButton.innerHTML = `
                    <i class="fi fi-rr-user"></i>
                    <span class="user-info">Guest</span>
                    <i class="fi fi-rr-angle-small-down"></i>
                `;
            }
        }
    }

    showMainContent() {
        // Hide auth container
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            authContainer.style.display = 'none';
        }
        
        // Show main content
        const mainContent = document.querySelector('.flex-grow-1');
        if (mainContent) {
            mainContent.style.display = 'block';
        }
    }

    showAuthUI() {
        // Show auth container
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            authContainer.style.display = 'flex';
        }
        
        // Hide main content
        const mainContent = document.querySelector('.flex-grow-1');
        if (mainContent) {
            mainContent.style.display = 'none';
        }
    }

    async handleLogout() {
        try {
            const result = await authService.signOut();
            if (result.success) {
                console.log('Logout successful');
                // Auth state change will handle UI update
            } else {
                console.error('Logout failed:', result.error);
                // Show error message to user
                this.showErrorMessage('Logout failed. Please try again.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showErrorMessage('An error occurred during logout.');
        }
    }

    showErrorMessage(message) {
        // Create a temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger position-fixed';
        errorDiv.style.cssText = 'top: 20px; right: 20px; z-index: 10000;';
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    // Method to check if user is authenticated
    isAuthenticated() {
        return authService.isAuthenticated();
    }

    // Method to get current user
    getCurrentUser() {
        return authService.getCurrentUser();
    }
}

// Initialize the auth manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

export default AuthManager; 