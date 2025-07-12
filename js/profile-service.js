/**
 * Profile Service - Handles user profile management and preferences
 * Provides comprehensive profile functionality including personal info, work preferences,
 * productivity goals, notification settings, and privacy controls
 * Uses local storage for data persistence
 */

class ProfileService {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.defaultProfile = {
            displayName: '',
            email: '',
            timezone: 'UTC',
            language: 'en',
            workPreferences: {
                startTime: '09:00',
                endTime: '17:00',
                workDays: [1, 2, 3, 4, 5], // Monday to Friday
                lunchBreakDuration: 60
            },
            productivityGoals: {
                dailyWorkGoal: 8,
                weeklyWorkGoal: 40,
                focusGoal: 4,
                breakGoal: 4
            },
            notifications: {
                email: true,
                desktop: true,
                sound: true,
                breakReminders: true,
                goalAlerts: true,
                weeklyReports: true
            },
            privacy: {
                dataCollection: true,
                crashReports: true,
                usageAnalytics: true,
                featureUpdates: true
            },
            avatar: null,
            createdAt: new Date(),
            lastUpdated: new Date()
        };
    }

    /**
     * Initialize the profile service with current user
     * @param {Object} user - User object (can be null for local mode)
     */
    async initialize(user = null) {
        this.currentUser = user;
        await this.loadUserProfile();
    }

    /**
     * Load user profile from local storage
     */
    async loadUserProfile() {
        try {
            const storedProfile = localStorage.getItem('timetracker_profile');
            
            if (storedProfile) {
                this.userProfile = { ...this.defaultProfile, ...JSON.parse(storedProfile) };
            } else {
                // Create new profile with default values
                this.userProfile = {
                    ...this.defaultProfile,
                    uid: 'local_user',
                    email: 'user@example.com',
                    displayName: 'User',
                    createdAt: new Date()
                };
                await this.saveUserProfile();
            }

            return this.userProfile;
        } catch (error) {
            console.error('Error loading user profile:', error);
            // Fallback to default profile
            this.userProfile = { ...this.defaultProfile };
            return this.userProfile;
        }
    }

    /**
     * Save user profile to local storage
     */
    async saveUserProfile() {
        try {
            if (!this.userProfile) {
                throw new Error('No profile data available');
            }

            this.userProfile.lastUpdated = new Date();
            
            localStorage.setItem('timetracker_profile', JSON.stringify(this.userProfile));
            
            console.log('Profile saved successfully to local storage');
            return true;
        } catch (error) {
            console.error('Error saving user profile:', error);
            throw error;
        }
    }

    /**
     * Update specific profile fields
     * @param {Object} updates - Object containing fields to update
     */
    async updateProfile(updates) {
        try {
            if (!this.userProfile) {
                throw new Error('No profile loaded');
            }

            // Deep merge updates
            this.userProfile = this.deepMerge(this.userProfile, updates);
            this.userProfile.lastUpdated = new Date();

            await this.saveUserProfile();
            return this.userProfile;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    /**
     * Update personal information
     * @param {Object} personalInfo - Personal information object
     */
    async updatePersonalInfo(personalInfo) {
        const updates = {
            displayName: personalInfo.displayName,
            timezone: personalInfo.timezone,
            language: personalInfo.language
        };

        return await this.updateProfile(updates);
    }

    /**
     * Update work preferences
     * @param {Object} workPrefs - Work preferences object
     */
    async updateWorkPreferences(workPrefs) {
        const updates = {
            workPreferences: {
                ...this.userProfile.workPreferences,
                ...workPrefs
            }
        };

        return await this.updateProfile(updates);
    }

    /**
     * Update productivity goals
     * @param {Object} goals - Productivity goals object
     */
    async updateProductivityGoals(goals) {
        const updates = {
            productivityGoals: {
                ...this.userProfile.productivityGoals,
                ...goals
            }
        };

        return await this.updateProfile(updates);
    }

    /**
     * Update notification preferences
     * @param {Object} notifications - Notification preferences object
     */
    async updateNotificationPreferences(notifications) {
        const updates = {
            notifications: {
                ...this.userProfile.notifications,
                ...notifications
            }
        };

        return await this.updateProfile(updates);
    }

    /**
     * Update privacy settings
     * @param {Object} privacy - Privacy settings object
     */
    async updatePrivacySettings(privacy) {
        const updates = {
            privacy: {
                ...this.userProfile.privacy,
                ...privacy
            }
        };

        return await this.updateProfile(updates);
    }

    /**
     * Update user avatar
     * @param {string} avatarData - Base64 encoded avatar image
     */
    async updateAvatar(avatarData) {
        const updates = {
            avatar: avatarData,
            lastUpdated: new Date()
        };

        return await this.updateProfile(updates);
    }

    /**
     * Export user profile data
     * @returns {Object} Profile data for export
     */
    exportProfile() {
        if (!this.userProfile) {
            throw new Error('No profile loaded');
        }

        const exportData = {
            ...this.userProfile,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };

        // Remove sensitive data
        delete exportData.uid;
        delete exportData.email;

        return exportData;
    }

    /**
     * Import user profile data
     * @param {Object} importData - Profile data to import
     */
    async importProfile(importData) {
        try {
            // Validate import data
            if (!importData || typeof importData !== 'object') {
                throw new Error('Invalid import data');
            }

            // Merge with current profile, preserving sensitive data
            const currentUid = this.userProfile?.uid;
            const currentEmail = this.userProfile?.email;

            this.userProfile = {
                ...this.defaultProfile,
                ...importData,
                uid: currentUid,
                email: currentEmail,
                lastUpdated: new Date()
            };

            await this.saveUserProfile();
            return this.userProfile;
        } catch (error) {
            console.error('Error importing profile:', error);
            throw error;
        }
    }

    /**
     * Reset profile to default values
     */
    async resetProfile() {
        try {
            const currentUid = this.userProfile?.uid;
            const currentEmail = this.userProfile?.email;

            this.userProfile = {
                ...this.defaultProfile,
                uid: currentUid,
                email: currentEmail,
                lastUpdated: new Date()
            };

            await this.saveUserProfile();
            return this.userProfile;
        } catch (error) {
            console.error('Error resetting profile:', error);
            throw error;
        }
    }

    /**
     * Delete user account and all associated data
     */
    async deleteAccount() {
        try {
            // Clear local storage
            localStorage.removeItem('timetracker_profile');
            
            console.log('Account deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting account:', error);
            throw error;
        }
    }

    /**
     * Get current profile data
     * @returns {Object} Current profile data
     */
    getProfile() {
        return this.userProfile;
    }

    /**
     * Get work preferences
     * @returns {Object} Work preferences
     */
    getWorkPreferences() {
        return this.userProfile?.workPreferences || this.defaultProfile.workPreferences;
    }

    /**
     * Get productivity goals
     * @returns {Object} Productivity goals
     */
    getProductivityGoals() {
        return this.userProfile?.productivityGoals || this.defaultProfile.productivityGoals;
    }

    /**
     * Get notification preferences
     * @returns {Object} Notification preferences
     */
    getNotificationPreferences() {
        return this.userProfile?.notifications || this.defaultProfile.notifications;
    }

    /**
     * Get privacy settings
     * @returns {Object} Privacy settings
     */
    getPrivacySettings() {
        return this.userProfile?.privacy || this.defaultProfile.privacy;
    }

    /**
     * Check if user is currently in work hours
     * @returns {boolean} True if currently in work hours
     */
    isWorkHours() {
        if (!this.userProfile?.workPreferences) {
            return false;
        }

        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes

        const { startTime, endTime, workDays } = this.userProfile.workPreferences;

        // Check if today is a work day
        if (!workDays.includes(currentDay)) {
            return false;
        }

        // Convert work times to minutes
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const workStartMinutes = startHour * 60 + startMin;
        const workEndMinutes = endHour * 60 + endMin;

        return currentTime >= workStartMinutes && currentTime <= workEndMinutes;
    }

    /**
     * Get remaining work time for today
     * @returns {number} Remaining work time in minutes
     */
    getRemainingWorkTime() {
        if (!this.isWorkHours()) {
            return 0;
        }

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const { endTime } = this.userProfile.workPreferences;
        const [endHour, endMin] = endTime.split(':').map(Number);
        const workEndMinutes = endHour * 60 + endMin;

        return Math.max(0, workEndMinutes - currentTime);
    }

    /**
     * Deep merge utility function
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * Validate profile data
     * @param {Object} profileData - Profile data to validate
     * @returns {Object} Validation result
     */
    validateProfile(profileData) {
        const errors = [];

        // Validate display name
        if (profileData.displayName && profileData.displayName.length < 2) {
            errors.push('Display name must be at least 2 characters long');
        }

        // Validate work preferences
        if (profileData.workPreferences) {
            const { startTime, endTime, workDays } = profileData.workPreferences;
            
            if (startTime && endTime) {
                const [startHour, startMin] = startTime.split(':').map(Number);
                const [endHour, endMin] = endTime.split(':').map(Number);
                
                if (startHour * 60 + startMin >= endHour * 60 + endMin) {
                    errors.push('Work end time must be after start time');
                }
            }

            if (workDays && (!Array.isArray(workDays) || workDays.length === 0)) {
                errors.push('At least one work day must be selected');
            }
        }

        // Validate productivity goals
        if (profileData.productivityGoals) {
            const { dailyWorkGoal, weeklyWorkGoal } = profileData.productivityGoals;
            
            if (dailyWorkGoal && (dailyWorkGoal < 1 || dailyWorkGoal > 16)) {
                errors.push('Daily work goal must be between 1 and 16 hours');
            }
            
            if (weeklyWorkGoal && (weeklyWorkGoal < 1 || weeklyWorkGoal > 80)) {
                errors.push('Weekly work goal must be between 1 and 80 hours');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Create and export singleton instance
const profileService = new ProfileService();
module.exports = profileService; 