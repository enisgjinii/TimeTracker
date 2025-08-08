// Enhanced Features JavaScript for TimeTracker Pro

class EnhancedFeatures {
    constructor() {
        this.dashboard = new EnhancedDashboard();
        this.pomodoroTimer = null;
        this.sessionTimer = null;
        this.pomodoroState = {
            isRunning: false,
            isPaused: false,
            currentSession: 1,
            completedSessions: 0,
            streak: 0,
            timeRemaining: 25 * 60, // 25 minutes in seconds
            sessionType: 'focus' // 'focus', 'shortBreak', 'longBreak'
        };
        this.goals = [];
        this.achievements = [];
        this.currentView = 'timeline';
        this.sessionStartTime = null;
        this.currentSessionTime = 0;
        this.subscription = {
            plan: 'free',
            hoursUsed: 45,
            hoursLimit: 100,
            projectsUsed: 3,
            projectsLimit: 5,
            exportsUsed: 2,
            exportsLimit: 3
        };
        
        this.initializeEventHandlers();
        this.loadUserDataEnhanced();
        this.initializeSidebar();
        this.startSessionTracking();
    }

    // Initialize all event handlers
    initializeEventHandlers() {
        // Helpers that don't require jQuery
        const bindClickIfExists = (selector, handler) => {
            const elements = document.querySelectorAll(selector);
            if (!elements || elements.length === 0) return;
            const hasJquery = typeof window !== 'undefined' && typeof window.$ !== 'undefined';
            if (hasJquery) {
                try { window.$(selector).off('click'); } catch (_) {}
                try { window.$(selector).on('click', (e) => { e.preventDefault(); handler(); }); } catch (_) {}
            } else {
                elements.forEach((el) => {
                    el.addEventListener('click', (e) => { e.preventDefault(); handler(); });
                });
            }
        };

        bindClickIfExists('#nav-dashboard', () => this.showView('dashboard'));
        bindClickIfExists('#nav-timeline', () => this.showView('timeline'));
        bindClickIfExists('#nav-analytics', () => this.showView('analytics'));
        bindClickIfExists('#nav-pomodoro', () => this.showView('pomodoro'));
        bindClickIfExists('#nav-goals', () => this.showView('goals'));
        bindClickIfExists('#nav-settings', () => this.showView('settings'));
        bindClickIfExists('#nav-about', () => this.showView('about'));

        // Dashboard handlers
        $('#refreshDashboard').click(() => this.refreshDashboard());
        $('#exportReport').click(() => this.exportReport());

        // Pomodoro handlers (optional controls)
        bindClickIfExists('#pomodoroStart', () => this.startPomodoro());
        bindClickIfExists('#pomodoroPause', () => this.pausePomodoro());
        bindClickIfExists('#pomodoroReset', () => this.resetPomodoro());

        // Goals handlers
        $('#addGoalBtn').click(() => this.showAddGoalModal());

        // Analytics period handlers
        const periodButtons = document.querySelectorAll('[data-period]');
        if (periodButtons && periodButtons.length > 0) {
            periodButtons.forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.querySelectorAll('[data-period]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const period = btn.getAttribute('data-period');
                    this.updateAnalytics(period);
                });
            });
        }

        // Quick goal handlers
        window.createQuickGoal = (type, target) => this.createQuickGoal(type, target);

        // Sidebar quick actions
        bindClickIfExists('#quick-break', () => this.quickBreak());
        bindClickIfExists('#focus-mode', () => this.focusMode());
        bindClickIfExists('#manual-entry', () => this.openManualEntry());

        // Manual entry modal actions
        bindClickIfExists('#saveManualEntryBtn', () => this.saveManualEntry());

        // Upgrade/pricing modal open
        bindClickIfExists('#upgrade-btn', () => this.showSubscriptionModal());
    }

    // Initialize compact sidebar functionality
    initializeSidebar() {
        // Update subscription status
        this.updateSubscriptionStatus();
        
        // Initialize session tracking
        this.updateSessionStatus();
        
        // Add subscription management handler (sidebar upgrade button)
        const upgradeBtn = document.getElementById('upgrade-btn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => this.showSubscriptionModal());
        }
        
        // Add profile menu handler
        $('#profile-menu').click(() => this.showProfileMenu());
        
        // Update daily progress
        this.updateDailyProgress();
        
        // Start real-time updates
        setInterval(() => {
            this.updateSessionStatus();
            this.updateDailyProgress();
        }, 1000);
    }

    // Start session tracking
    startSessionTracking() {
        this.sessionStartTime = Date.now();
        this.sessionTimer = setInterval(() => {
            if (this.sessionStartTime) {
                this.currentSessionTime = Math.floor((Date.now() - this.sessionStartTime) / 1000);
                this.updateSessionDisplay();
            }
        }, 1000);
    }

    // Update session display
    updateSessionDisplay() {
        const hours = Math.floor(this.currentSessionTime / 3600);
        const minutes = Math.floor((this.currentSessionTime % 3600) / 60);
        const seconds = this.currentSessionTime % 60;
        
        const timeString = hours > 0 
            ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            : `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
        const sessionTimeEl = document.getElementById('session-time');
        if (sessionTimeEl) {
            sessionTimeEl.textContent = timeString;
        }
    }

    // Update session status
    updateSessionStatus() {
        const isTracking = typeof track !== 'undefined' ? track : false; // Use global tracking state
        const trackingBtn = document.getElementById('toggleTracking');
        const trackingPulse = document.querySelector('#toggleTracking .tracking-pulse');
        const trackingIcon = document.querySelector('#toggleTracking .tracking-icon');
        const trackingText = document.querySelector('#toggleTracking .tracking-text');

        if (trackingBtn) {
            if (isTracking) {
                trackingBtn.classList.remove('btn-primary');
                trackingBtn.classList.add('btn-danger');
                if (trackingIcon) {
                    trackingIcon.classList.remove('fi-rr-play');
                    trackingIcon.classList.add('fi-rr-pause');
                }
                if (trackingText) trackingText.textContent = 'Stop Tracking';
                if (trackingPulse) trackingPulse.style.display = 'block';
            } else {
                trackingBtn.classList.remove('btn-danger');
                trackingBtn.classList.add('btn-primary');
                if (trackingIcon) {
                    trackingIcon.classList.remove('fi-rr-pause');
                    trackingIcon.classList.add('fi-rr-play');
                }
                if (trackingText) trackingText.textContent = 'Start Tracking';
                if (trackingPulse) trackingPulse.style.display = 'none';
            }
        }
    }

    // Update daily progress
    updateDailyProgress() {
        // Calculate today's focus time from events
        const today = new Date();
        let todayEvents = [];
        
        if (typeof evs !== 'undefined') {
            todayEvents = evs.filter(ev => {
                const eventDate = new Date(ev.start);
                return eventDate.toDateString() === today.toDateString();
            });
        }

        const focusTimeMinutes = this.calculateFocusTime(todayEvents);
        const focusTimeHours = focusTimeMinutes / 60;
        const targetHours = 8; // Daily target
        const progressPercentage = Math.min((focusTimeHours / targetHours) * 100, 100);

        // Update progress bar
        const progressEl = document.getElementById('daily-progress');
        if (progressEl) {
            progressEl.style.width = `${progressPercentage}%`;
        }
        
        // Update focus time display
        const hours = Math.floor(focusTimeHours);
        const minutes = Math.round((focusTimeHours % 1) * 60);
        const focusEl = document.getElementById('daily-focus');
        if (focusEl) {
            focusEl.textContent = `${hours}h ${minutes}m`;
        }

        // Update subscription usage
        this.subscription.hoursUsed = Math.round(focusTimeHours);
        this.updateSubscriptionStatus();
    }

    // Update subscription status
    updateSubscriptionStatus() {
        const usagePercentage = (this.subscription.hoursUsed / this.subscription.hoursLimit) * 100;
        
        // Update usage bar/text (match existing DOM #usage-fill and #usage-text)
        const usageFillEl = document.getElementById('usage-fill');
        if (usageFillEl) usageFillEl.style.width = `${usagePercentage}%`;

        const usageTextEl = document.getElementById('usage-text');
        if (usageTextEl) usageTextEl.textContent = `${this.subscription.hoursUsed}h / ${this.subscription.hoursLimit}h`;
        
        // Update plan display
        const planNames = {
            free: 'Free Plan',
            pro: 'Pro Plan',
            enterprise: 'Enterprise Plan'
        };
        const currentPlanEl = document.getElementById('current-plan');
        if (currentPlanEl) currentPlanEl.textContent = planNames[this.subscription.plan];
        
        // Change color based on usage
        if (usageFillEl) {
            if (usagePercentage > 90) {
                usageFillEl.style.background = 'linear-gradient(90deg, var(--destructive) 0%, var(--destructive) 100%)';
            } else if (usagePercentage > 70) {
                usageFillEl.style.background = 'linear-gradient(90deg, var(--warning) 0%, var(--destructive) 100%)';
            } else {
                usageFillEl.style.background = 'linear-gradient(90deg, var(--success) 0%, var(--warning) 70%, var(--destructive) 100%)';
            }
        }
    }

    // Show subscription modal
    showSubscriptionModal() {
        // Ensure payment section renders inside pricing modal
        if (typeof window.showPaymentSection === 'function') {
            try { window.showPaymentSection(); } catch (_) {}
        }

        // Open pricing modal (matches index.html #pricingModal)
        const modalEl = document.getElementById('pricingModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }

        this.dashboard.createNotification('Subscription management opened', 'info');
    }

    // Get subscription plan name
    getSubscriptionPlanName() {
        const planNames = {
            free: 'Free Plan',
            pro: 'Pro Plan',
            enterprise: 'Enterprise Plan'
        };
        return planNames[this.subscription.plan] || 'Unknown Plan';
    }

    // Get subscription plan description
    getSubscriptionPlanDescription() {
        const descriptions = {
            free: 'Basic time tracking with limited features',
            pro: 'Advanced features with unlimited tracking',
            enterprise: 'Full-featured plan with team collaboration'
        };
        return descriptions[this.subscription.plan] || 'Plan description not available';
    }

    // Update plan buttons in modal
    updatePlanButtons() {
        // Reset all buttons
        const buttons = document.querySelectorAll('.pricing-card button');
        buttons.forEach(btn => {
            btn.classList.remove('current-plan-btn');
            btn.disabled = false;
            btn.textContent = 'Upgrade';
        });
        
        // Mark current plan
        if (this.subscription.plan === 'free') {
            const freeBtn = document.querySelector('.free-plan button');
            if (freeBtn) {
                freeBtn.classList.add('current-plan-btn');
                freeBtn.disabled = true;
                freeBtn.textContent = 'Current Plan';
            }
        } else if (this.subscription.plan === 'pro') {
            const proBtn = document.querySelector('.pro-plan button');
            if (proBtn) {
                proBtn.classList.add('current-plan-btn');
                proBtn.disabled = true;
                proBtn.textContent = 'Current Plan';
            }
        } else if (this.subscription.plan === 'enterprise') {
            const enterpriseBtn = document.querySelector('.enterprise-plan button');
            if (enterpriseBtn) {
                enterpriseBtn.classList.add('current-plan-btn');
                enterpriseBtn.disabled = true;
                enterpriseBtn.textContent = 'Current Plan';
            }
        }
    }

    // Show profile menu
    showProfileMenu() {
        // Create dropdown menu
        const menu = document.createElement('div');
        menu.className = 'profile-dropdown';
        menu.id = 'profile-dropdown';
        menu.innerHTML = `
            <div class="dropdown-item" onclick="enhancedFeatures.editProfile()">
                <i class="fi fi-rr-user me-2"></i>Edit Profile
            </div>
            <div class="dropdown-item" onclick="enhancedFeatures.showSubscriptionModal()">
                <i class="fi fi-rr-crown me-2"></i>Subscription
            </div>
            <div class="dropdown-item" onclick="enhancedFeatures.showSettings()">
                <i class="fi fi-rr-settings me-2"></i>Settings
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item danger" onclick="enhancedFeatures.logout()">
                <i class="fi fi-rr-sign-out me-2"></i>Sign Out
            </div>
        `;
        
        // Remove existing dropdown
        const existingDropdown = document.getElementById('profile-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }
        
        // Add new dropdown
        const userProfile = document.querySelector('.user-profile');
        if (userProfile) {
            userProfile.appendChild(menu);
            
            // Position dropdown
            menu.style.cssText = `
                position: absolute;
                bottom: 100%;
                right: 0;
                margin-bottom: 0.5rem;
                background: var(--card);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                min-width: 200px;
                z-index: 1000;
            `;
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (menu.parentNode) {
                    menu.style.opacity = '0';
                    setTimeout(() => menu.remove(), 300);
                }
            }, 5000);
            
            // Hide on click outside
            setTimeout(() => {
                document.addEventListener('click', (e) => {
                    if (!userProfile.contains(e.target)) {
                        menu.remove();
                    }
                }, { once: true });
            }, 100);
        }
    }

    // Enhanced tracking button functionality
    enhanceTrackingButton() {
        const trackingBtn = document.getElementById('toggleTracking');
        if (!trackingBtn) return;

        const trackingIcon = trackingBtn.querySelector('.tracking-icon');
        const trackingText = trackingBtn.querySelector('.tracking-text');
        const isTracking = typeof track !== 'undefined' ? track : false;

        if (isTracking) {
            if (trackingIcon) {
                trackingIcon.classList.remove('fi-rr-play');
                trackingIcon.classList.add('fi-rr-pause');
            }
            if (trackingText) trackingText.textContent = 'Stop Tracking';
            trackingBtn.classList.remove('btn-primary');
            trackingBtn.classList.add('btn-danger');
        } else {
            if (trackingIcon) {
                trackingIcon.classList.remove('fi-rr-pause');
                trackingIcon.classList.add('fi-rr-play');
            }
            if (trackingText) trackingText.textContent = 'Start Tracking';
            trackingBtn.classList.remove('btn-danger');
            trackingBtn.classList.add('btn-primary');
        }
    }

    // Quick actions (lightweight behavior to avoid coupling deeply with renderer internals)
    quickBreak() {
        // Pause tracking if active
        if (typeof track !== 'undefined' && track) {
            track = false;
            this.enhanceTrackingButton();
            this.updateSessionStatus();
        }
        this.dashboard.createNotification('Break started', 'info');
    }

    focusMode() {
        // Resume/start tracking
        if (typeof track !== 'undefined' && !track) {
            track = true;
            this.enhanceTrackingButton();
            this.updateSessionStatus();
            this.startSessionTracking();
        }
        this.dashboard.createNotification('Focus mode enabled', 'success');
    }

    openManualEntry() {
        const modalEl = document.getElementById('manualEntryModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    }

    saveManualEntry() {
        // Minimal UX feedback; actual persistence handled elsewhere in app
        const modalEl = document.getElementById('manualEntryModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
            const instance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            instance.hide();
        }
        this.dashboard.createNotification('Manual entry saved', 'success');
    }

    // Show specific view
    showView(viewName) {
        // Hide all views
        const views = document.querySelectorAll('[id$="-view"]');
        views.forEach(view => view.classList.add('d-none'));
        
        // Show selected view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.remove('d-none');
        }
        
        // Update navigation
        const navLinks = document.querySelectorAll('.nav-item');
        navLinks.forEach(link => link.classList.remove('active'));
        
        const activeNav = document.getElementById(`nav-${viewName}`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
        
        this.currentView = viewName;
        
        // Initialize view-specific content
        switch(viewName) {
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'analytics':
                this.initializeAnalytics();
                break;
            case 'pomodoro':
                this.initializePomodoro();
                break;
            case 'goals':
                this.initializeGoals();
                break;
        }
    }

    // Profile management functions
    editProfile() {
        this.dashboard.createNotification('Profile editing coming soon!', 'info');
    }

    showSettings() {
        this.showView('settings');
        const dropdown = document.getElementById('profile-dropdown');
        if (dropdown) dropdown.remove();
    }

    logout() {
        if (confirm('Are you sure you want to sign out?')) {
            // Reset user data
            localStorage.removeItem('timetracker-enhanced-data');
            localStorage.removeItem('timetracker-enhanced-data-v2');
            
            // Reset UI
            const userNameEl = document.getElementById('user-name');
            const userEmailEl = document.getElementById('user-email');
            if (userNameEl) userNameEl.textContent = 'Guest User';
            if (userEmailEl) userEmailEl.textContent = 'guest@example.com';
            
            this.dashboard.createNotification('Signed out successfully', 'success');
            
            const dropdown = document.getElementById('profile-dropdown');
            if (dropdown) dropdown.remove();
        }
    }

    // Subscription upgrade functions
    upgradeToPro() {
        this.dashboard.createNotification('Redirecting to payment...', 'info');
        
        // Simulate upgrade process
        setTimeout(() => {
            this.subscription.plan = 'pro';
            this.subscription.hoursLimit = 999999; // Unlimited
            this.subscription.projectsLimit = 999999;
            this.subscription.exportsLimit = 999999;
            
            this.updateSubscriptionStatus();
            this.dashboard.createNotification('🎉 Upgraded to Pro successfully!', 'success');
            
            // Close modal
            const modalEl = document.getElementById('subscriptionModal');
            if (modalEl && typeof bootstrap !== 'undefined') {
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();
            }
        }, 2000);
    }

    upgradeToEnterprise() {
        this.dashboard.createNotification('Contacting sales team...', 'info');
        
        // Simulate contact process
        setTimeout(() => {
            this.dashboard.createNotification('Sales team will contact you within 24 hours', 'success');
        }, 1500);
    }

    managePaymentMethods() {
        this.dashboard.createNotification('Payment method management coming soon!', 'info');
    }

    // Utility Functions
    calculateFocusTime(events) {
        return events
            .filter(ev => !this.isDistraction(ev.title))
            .reduce((total, ev) => total + (ev.end - ev.start), 0) / (1000 * 60); // Convert to minutes
    }

    isDistraction(title) {
        const distractionKeywords = ['youtube', 'facebook', 'twitter', 'instagram', 'reddit', 'discord', 'game'];
        return distractionKeywords.some(keyword => title.toLowerCase().includes(keyword));
    }

    // Enhanced data persistence
    saveUserDataEnhanced() {
        try {
            const data = {
                goals: this.goals,
                achievements: this.achievements,
                pomodoroState: this.pomodoroState,
                subscription: this.subscription,
                preferences: {
                    theme: typeof usrSet !== 'undefined' ? usrSet.themeMode : 'system',
                    notifications: true,
                    autoSave: true
                },
                version: '2.0.0',
                lastSaved: Date.now()
            };
            
            localStorage.setItem('timetracker-enhanced-data-v2', JSON.stringify(data));
            
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }

    // Enhanced data loading
    loadUserDataEnhanced() {
        try {
            // Try to load v2 data first
            let savedData = localStorage.getItem('timetracker-enhanced-data-v2');
            
            if (!savedData) {
                // Migrate from v1 if available
                savedData = localStorage.getItem('timetracker-enhanced-data');
            }
            
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // Load data with defaults
                this.goals = data.goals || [];
                this.achievements = data.achievements || [];
                this.pomodoroState = { ...this.pomodoroState, ...data.pomodoroState };
                this.subscription = { ...this.subscription, ...data.subscription };
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    // Placeholder methods for compatibility
    initializeDashboard() {
        console.log('Dashboard initialized');
    }

    initializeAnalytics() {
        console.log('Analytics initialized');
    }

    initializePomodoro() {
        console.log('Pomodoro initialized');
    }

    initializeGoals() {
        console.log('Goals initialized');
    }

    refreshDashboard() {
        this.dashboard.createNotification('Dashboard refreshed', 'info');
    }

    exportReport() {
        this.dashboard.createNotification('Report exported successfully', 'success');
    }

    startPomodoro() {
        console.log('Pomodoro started');
    }

    pausePomodoro() {
        console.log('Pomodoro paused');
    }

    resetPomodoro() {
        console.log('Pomodoro reset');
    }

    showAddGoalModal() {
        this.dashboard.createNotification('Goal creation coming soon!', 'info');
    }

    updateAnalytics(period) {
        console.log('Analytics updated for period:', period);
    }

    createQuickGoal(type, target) {
        this.dashboard.createNotification(`Quick goal created: ${type} - ${target}`, 'success');
    }
}

// Global functions for subscription management
window.upgradeToPro = () => {
    if (window.enhancedFeatures) {
        window.enhancedFeatures.upgradeToPro();
    }
};

window.upgradeToEnterprise = () => {
    if (window.enhancedFeatures) {
        window.enhancedFeatures.upgradeToEnterprise();
    }
};

window.managePaymentMethods = () => {
    if (window.enhancedFeatures) {
        window.enhancedFeatures.managePaymentMethods();
    }
};

// Initialize enhanced features when DOM is ready
let enhancedFeatures;
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        try {
            enhancedFeatures = new EnhancedFeatures();
            window.enhancedFeatures = enhancedFeatures;
            
            // Override the existing toggle tracking handler
            const toggleBtn = document.getElementById('toggleTracking');
            if (toggleBtn) {
                // Remove existing event listeners
                const newToggleBtn = toggleBtn.cloneNode(true);
                toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
                
                // Add new event listener
                newToggleBtn.addEventListener('click', function() {
                    if (typeof track !== 'undefined') {
                        track = !track;
                    }
                    
                    enhancedFeatures.enhanceTrackingButton();
                    enhancedFeatures.updateSessionStatus();
                    
                    if (track) {
                        enhancedFeatures.startSessionTracking();
                    } else {
                        // Save current segment if exists
                        if (typeof curSeg !== 'undefined' && curSeg) {
                            if (typeof evs !== 'undefined') {
                                evs.push(curSeg);
                            }
                            if (typeof saveSegCSV === 'function') {
                                saveSegCSV();
                            }
                            curSeg = null;
                        }
                        if (typeof renderView === 'function') {
                            renderView();
                        }
                    }
                });
            }
            
            console.log('Enhanced features initialized successfully');
        } catch (error) {
            console.error('Error initializing enhanced features:', error);
        }
    }, 1000);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedFeatures;
} else {
    window.EnhancedFeatures = EnhancedFeatures;
}