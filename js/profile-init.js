/**
 * Profile Initialization - Integrates profile system with authentication
 * Handles profile loading when user logs in and profile updates
 */

const profileService = require('./profile-service.js');
const profileUI = require('./profile-ui.js');

class ProfileInit {
    constructor() {
        this.isInitialized = false;
        this.setupInitialization();
    }

    /**
     * Setup initialization
     */
    setupInitialization() {
        // Initialize profile system on page load
        $(document).ready(async () => {
            await this.initializeProfileSystem();
        });
    }

    /**
     * Initialize profile system
     */
    async initializeProfileSystem() {
        try {
            console.log('Initializing profile system...');

            // Initialize profile service (no user required for local mode)
            await profileService.initialize();

            // Initialize profile UI
            await profileUI.initialize();

            this.isInitialized = true;
            console.log('Profile system initialized successfully');

            // Update UI to show user is logged in
            this.updateUserInterface();

        } catch (error) {
            console.error('Error initializing profile system:', error);
        }
    }

    /**
     * Update user interface with profile data
     */
    updateUserInterface() {
        const profile = profileService.getProfile();
        if (!profile) return;

        // Update user info in header/navigation
        this.updateUserInfo(profile);

        // Update work hours indicator
        this.updateWorkHoursIndicator();

        // Update productivity goals display
        this.updateProductivityGoals();

        // Apply notification preferences
        this.applyNotificationPreferences();
    }

    /**
     * Update user information in the interface
     * @param {Object} profile - User profile data
     */
    updateUserInfo(profile) {
        // Update user display name in header
        const displayName = profile.displayName || profile.email || 'User';
        $('.user-display-name').text(displayName);

        // Update user email
        $('.user-email').text(profile.email || '');

        // Update avatar if exists
        if (profile.avatar) {
            $('.user-avatar').html(`<img src="${profile.avatar}" alt="Profile Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`);
        } else {
            $('.user-avatar').html('<i class="fi fi-rr-user"></i>');
        }

        // Update timezone info
        $('.user-timezone').text(profile.timezone || 'UTC');
    }

    /**
     * Update work hours indicator
     */
    updateWorkHoursIndicator() {
        const isWorkHours = profileService.isWorkHours();
        const remainingTime = profileService.getRemainingWorkTime();

        if (isWorkHours) {
            const hours = Math.floor(remainingTime / 60);
            const minutes = remainingTime % 60;
            $('.work-hours-indicator').html(`
                <span class="badge bg-success small">
                    <i class="fi fi-rr-clock me-1"></i>
                    Work Hours - ${hours}h ${minutes}m remaining
                </span>
            `);
        } else {
            $('.work-hours-indicator').html(`
                <span class="badge bg-secondary small">
                    <i class="fi fi-rr-clock me-1"></i>
                    Outside Work Hours
                </span>
            `);
        }
    }

    /**
     * Update productivity goals display
     */
    updateProductivityGoals() {
        const goals = profileService.getProductivityGoals();
        
        // Update goals in the interface
        $('.daily-work-goal').text(`${goals.dailyWorkGoal}h`);
        $('.weekly-work-goal').text(`${goals.weeklyWorkGoal}h`);
        $('.focus-goal').text(goals.focusGoal);
        $('.break-goal').text(goals.breakGoal);
    }

    /**
     * Apply notification preferences
     */
    applyNotificationPreferences() {
        const notifications = profileService.getNotificationPreferences();

        // Apply desktop notification permission
        if (notifications.desktop && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }

        // Apply sound notification settings
        if (notifications.sound) {
            // Enable sound notifications
            window.enableSoundNotifications = true;
        } else {
            window.enableSoundNotifications = false;
        }

        // Apply break reminders
        if (notifications.breakReminders) {
            this.setupBreakReminders();
        } else {
            this.clearBreakReminders();
        }

        // Apply goal alerts
        if (notifications.goalAlerts) {
            this.setupGoalAlerts();
        } else {
            this.clearGoalAlerts();
        }
    }

    /**
     * Setup break reminders
     */
    setupBreakReminders() {
        // Clear existing reminders
        this.clearBreakReminders();

        // Set up periodic break reminders
        this.breakReminderInterval = setInterval(() => {
            const profile = profileService.getProfile();
            if (!profile || !profile.workPreferences) return;

            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const { startTime, endTime, workDays, lunchBreakDuration } = profile.workPreferences;

            // Check if it's work hours
            if (!profileService.isWorkHours()) return;

            // Check if it's time for a break
            const [startHour, startMin] = startTime.split(':').map(Number);
            const [endHour, endMin] = endTime.split(':').map(Number);
            const workStartMinutes = startHour * 60 + startMin;

            // Suggest breaks every 2 hours
            const workDuration = currentTime - workStartMinutes;
            if (workDuration > 0 && workDuration % 120 === 0) {
                this.showBreakReminder();
            }
        }, 60000); // Check every minute
    }

    /**
     * Clear break reminders
     */
    clearBreakReminders() {
        if (this.breakReminderInterval) {
            clearInterval(this.breakReminderInterval);
            this.breakReminderInterval = null;
        }
    }

    /**
     * Show break reminder
     */
    showBreakReminder() {
        const notifications = profileService.getNotificationPreferences();
        
        // Desktop notification
        if (notifications.desktop && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('TimeTracker Pro', {
                body: 'It\'s time for a break! Take a moment to stretch and refresh.',
                icon: '/icons/default.png'
            });
        }

        // Sound notification
        if (notifications.sound && window.enableSoundNotifications) {
            // Play notification sound
            this.playNotificationSound();
        }

        // In-app notification
        this.showInAppNotification('Break Reminder', 'It\'s time for a break! Take a moment to stretch and refresh.', 'info');
    }

    /**
     * Setup goal alerts
     */
    setupGoalAlerts() {
        // This would integrate with the tracking system to show alerts when goals are achieved
        // For now, we'll set up a basic structure
        this.goalAlertsEnabled = true;
    }

    /**
     * Clear goal alerts
     */
    clearGoalAlerts() {
        this.goalAlertsEnabled = false;
    }

    /**
     * Show goal achievement alert
     * @param {string} goalType - Type of goal achieved
     * @param {string} message - Achievement message
     */
    showGoalAlert(goalType, message) {
        if (!this.goalAlertsEnabled) return;

        const notifications = profileService.getNotificationPreferences();
        
        // Desktop notification
        if (notifications.desktop && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Goal Achieved!', {
                body: message,
                icon: '/icons/default.png'
            });
        }

        // Sound notification
        if (notifications.sound && window.enableSoundNotifications) {
            this.playNotificationSound();
        }

        // In-app notification
        this.showInAppNotification('Goal Achieved!', message, 'success');
    }

    /**
     * Play notification sound
     */
    playNotificationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
            audio.volume = 0.3;
            audio.play();
        } catch (error) {
            console.log('Could not play notification sound');
        }
    }

    /**
     * Show in-app notification
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, info, warning, error)
     */
    showInAppNotification(title, message, type = 'info') {
        const alertClass = `alert-${type}`;
        const iconClass = type === 'success' ? 'fi-rr-check' : 
                         type === 'warning' ? 'fi-rr-exclamation' : 
                         type === 'error' ? 'fi-rr-cross' : 'fi-rr-info';

        const notification = $(`
            <div class="alert ${alertClass} alert-dismissible fade show notification-toast" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
                <i class="fi ${iconClass} me-2"></i>
                <strong>${title}</strong><br>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `);

        $('body').append(notification);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            notification.alert('close');
        }, 5000);
    }

    /**
     * Get current profile data
     * @returns {Object} Current profile data
     */
    getCurrentProfile() {
        return profileService.getProfile();
    }

    /**
     * Check if profile system is initialized
     * @returns {boolean} True if initialized
     */
    isProfileInitialized() {
        return this.isInitialized;
    }

    /**
     * Refresh profile data
     */
    async refreshProfile() {
        if (this.isInitialized) {
            await profileService.loadUserProfile();
            this.updateUserInterface();
        }
    }
}

// Create and export singleton instance
const profileInit = new ProfileInit();
module.exports = profileInit; 