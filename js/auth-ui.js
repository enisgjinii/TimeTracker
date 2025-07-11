import authService from './auth-service.js';

class AuthUI {
    constructor() {
        this.currentForm = 'login';
        this.initializeAuthUI();
    }

    initializeAuthUI() {
        this.createAuthContainer();
        this.setupEventListeners();
        this.showLoginForm();
    }

    createAuthContainer() {
        // Create auth container if it doesn't exist
        if (!document.getElementById('auth-container')) {
            const authContainer = document.createElement('div');
            authContainer.id = 'auth-container';
            authContainer.className = 'auth-container';
            document.body.appendChild(authContainer);
        }
    }

    setupEventListeners() {
        // Listen for auth state changes
        authService.onAuthStateChanged((user) => {
            if (user) {
                this.hideAuthUI();
                this.showMainApp();
            } else {
                this.showAuthUI();
            }
        });
    }

    showAuthUI() {
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            authContainer.style.display = 'flex';
        }
        
        // Hide main app content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.display = 'none';
        }
    }

    hideAuthUI() {
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            authContainer.style.display = 'none';
        }
        
        // Show main app content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.display = 'block';
        }
    }

    showMainApp() {
        // Show the main application content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.display = 'block';
        }
        
        // Update user info in the app
        this.updateUserInfo();
    }

    updateUserInfo() {
        const user = authService.getCurrentUser();
        if (user) {
            const userInfoElements = document.querySelectorAll('.user-info');
            userInfoElements.forEach(element => {
                element.textContent = user.displayName || user.email;
            });
        }
    }

    showLoginForm() {
        this.currentForm = 'login';
        const authContainer = document.getElementById('auth-container');
        authContainer.innerHTML = this.getLoginHTML();
        this.setupLoginListeners();
    }

    showSignupForm() {
        this.currentForm = 'signup';
        const authContainer = document.getElementById('auth-container');
        authContainer.innerHTML = this.getSignupHTML();
        this.setupSignupListeners();
    }

    showResetPasswordForm() {
        this.currentForm = 'reset';
        const authContainer = document.getElementById('auth-container');
        authContainer.innerHTML = this.getResetPasswordHTML();
        this.setupResetPasswordListeners();
    }

    getLoginHTML() {
        return `
            <div class="auth-card">
                <div class="auth-header">
                    <h2><i class="fi fi-rr-user"></i> Welcome Back</h2>
                    <p>Sign in to your TimeTracker account</p>
                </div>
                
                <form id="login-form" class="auth-form">
                    <div class="form-group">
                        <label for="login-email">Email</label>
                        <input type="email" id="login-email" required placeholder="Enter your email">
                    </div>
                    
                    <div class="form-group">
                        <label for="login-password">Password</label>
                        <input type="password" id="login-password" required placeholder="Enter your password">
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary btn-full">
                            <i class="fi fi-rr-sign-in"></i> Sign In
                        </button>
                    </div>
                    
                    <div class="auth-links">
                        <a href="#" id="forgot-password-link">Forgot password?</a>
                        <a href="#" id="show-signup-link">Don't have an account? Sign up</a>
                    </div>
                </form>
                
                <div id="login-error" class="error-message" style="display: none;"></div>
            </div>
        `;
    }

    getSignupHTML() {
        return `
            <div class="auth-card">
                <div class="auth-header">
                    <h2><i class="fi fi-rr-user-add"></i> Create Account</h2>
                    <p>Join TimeTracker to start tracking your productivity</p>
                </div>
                
                <form id="signup-form" class="auth-form">
                    <div class="form-group">
                        <label for="signup-name">Full Name</label>
                        <input type="text" id="signup-name" required placeholder="Enter your full name">
                    </div>
                    
                    <div class="form-group">
                        <label for="signup-email">Email</label>
                        <input type="email" id="signup-email" required placeholder="Enter your email">
                    </div>
                    
                    <div class="form-group">
                        <label for="signup-password">Password</label>
                        <input type="password" id="signup-password" required placeholder="Create a password">
                        <small class="form-text">Password must be at least 6 characters long</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="signup-confirm-password">Confirm Password</label>
                        <input type="password" id="signup-confirm-password" required placeholder="Confirm your password">
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary btn-full">
                            <i class="fi fi-rr-user-add"></i> Create Account
                        </button>
                    </div>
                    
                    <div class="auth-links">
                        <a href="#" id="show-login-link">Already have an account? Sign in</a>
                    </div>
                </form>
                
                <div id="signup-error" class="error-message" style="display: none;"></div>
            </div>
        `;
    }

    getResetPasswordHTML() {
        return `
            <div class="auth-card">
                <div class="auth-header">
                    <h2><i class="fi fi-rr-lock-reset"></i> Reset Password</h2>
                    <p>Enter your email to receive a password reset link</p>
                </div>
                
                <form id="reset-form" class="auth-form">
                    <div class="form-group">
                        <label for="reset-email">Email</label>
                        <input type="email" id="reset-email" required placeholder="Enter your email">
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary btn-full">
                            <i class="fi fi-rr-lock-reset"></i> Send Reset Link
                        </button>
                    </div>
                    
                    <div class="auth-links">
                        <a href="#" id="back-to-login-link">Back to sign in</a>
                    </div>
                </form>
                
                <div id="reset-error" class="error-message" style="display: none;"></div>
                <div id="reset-success" class="success-message" style="display: none;"></div>
            </div>
        `;
    }

    setupLoginListeners() {
        const loginForm = document.getElementById('login-form');
        const forgotPasswordLink = document.getElementById('forgot-password-link');
        const showSignupLink = document.getElementById('show-signup-link');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showResetPasswordForm();
        });

        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignupForm();
        });
    }

    setupSignupListeners() {
        const signupForm = document.getElementById('signup-form');
        const showLoginLink = document.getElementById('show-login-link');

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSignup();
        });

        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
    }

    setupResetPasswordListeners() {
        const resetForm = document.getElementById('reset-form');
        const backToLoginLink = document.getElementById('back-to-login-link');

        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleResetPassword();
        });

        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorElement = document.getElementById('login-error');
        const submitButton = document.querySelector('#login-form button[type="submit"]');

        // Show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fi fi-rr-spinner"></i> Signing in...';
        errorElement.style.display = 'none';

        const result = await authService.signIn(email, password);

        if (result.success) {
            // Login successful - auth state change will handle UI update
            console.log('Login successful');
        } else {
            // Show error
            errorElement.textContent = result.error;
            errorElement.style.display = 'block';
            
            // Reset button
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fi fi-rr-sign-in"></i> Sign In';
        }
    }

    async handleSignup() {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const errorElement = document.getElementById('signup-error');
        const submitButton = document.querySelector('#signup-form button[type="submit"]');

        // Validate passwords match
        if (password !== confirmPassword) {
            errorElement.textContent = 'Passwords do not match';
            errorElement.style.display = 'block';
            return;
        }

        // Validate password length
        if (password.length < 6) {
            errorElement.textContent = 'Password must be at least 6 characters long';
            errorElement.style.display = 'block';
            return;
        }

        // Show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fi fi-rr-spinner"></i> Creating account...';
        errorElement.style.display = 'none';

        const result = await authService.signUp(email, password, name);

        if (result.success) {
            // Signup successful - auth state change will handle UI update
            console.log('Signup successful');
        } else {
            // Show error
            errorElement.textContent = result.error;
            errorElement.style.display = 'block';
            
            // Reset button
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fi fi-rr-user-add"></i> Create Account';
        }
    }

    async handleResetPassword() {
        const email = document.getElementById('reset-email').value;
        const errorElement = document.getElementById('reset-error');
        const successElement = document.getElementById('reset-success');
        const submitButton = document.querySelector('#reset-form button[type="submit"]');

        // Show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fi fi-rr-spinner"></i> Sending...';
        errorElement.style.display = 'none';
        successElement.style.display = 'none';

        const result = await authService.resetPassword(email);

        if (result.success) {
            // Show success message
            successElement.textContent = 'Password reset link sent to your email!';
            successElement.style.display = 'block';
            
            // Reset form
            document.getElementById('reset-form').reset();
        } else {
            // Show error
            errorElement.textContent = result.error;
            errorElement.style.display = 'block';
        }

        // Reset button
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fi fi-rr-lock-reset"></i> Send Reset Link';
    }

    // Method to handle logout
    async handleLogout() {
        const result = await authService.signOut();
        if (result.success) {
            console.log('Logout successful');
            // Auth state change will handle UI update
        } else {
            console.error('Logout error:', result.error);
        }
    }
}

export default AuthUI; 