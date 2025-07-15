/**
 * Profile UI Service - Handles user interface interactions for profile management
 * Manages form handling, validation, and UI updates for the profile system
 */

const profileService = require('./profile-service.js');

class ProfileUI {
    constructor() {
        this.isInitialized = false;
        this.currentProfile = null;
        this.setupEventListeners();
    }

    /**
     * Initialize the profile UI
     */
    async initialize() {
        try {
            // Load current profile
            this.currentProfile = profileService.getProfile();
            if (!this.currentProfile) {
                console.warn('No profile loaded');
                return;
            }

            this.populateProfileForm();
            this.setupAvatarHandling();
            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing profile UI:', error);
        }
    }

    /**
     * Setup event listeners for profile management
     */
    setupEventListeners() {
        // Profile save button
        $('#saveProfileBtn').on('click', () => this.saveProfile());

        // Export profile button
        $('#exportProfileBtn').on('click', () => this.exportProfile());

        // Reset profile button
        $('#resetProfileBtn').on('click', () => this.resetProfile());

        // Delete account button
        $('#deleteAccountBtn').on('click', () => this.deleteAccount());

        // Change avatar button
        $('#changeAvatarBtn').on('click', () => this.changeAvatar());

        // Work days checkboxes
        $('.work-days-checkboxes input[type="checkbox"]').on('change', () => this.updateWorkDays());

        // Form validation on input
        $('#displayName').on('input', () => this.validateDisplayName());
        $('#workStartTime, #workEndTime').on('change', () => this.validateWorkTimes());
        $('#dailyWorkGoal, #weeklyWorkGoal').on('input', () => this.validateGoals());
    }

    /**
     * Populate the profile form with current data
     */
    populateProfileForm() {
        if (!this.currentProfile) return;

        // Personal information
        $('#displayName').val(this.currentProfile.displayName || '');
        $('#userEmail').val(this.currentProfile.email || '');
        $('#userTimezone').val(this.currentProfile.timezone || 'UTC');
        $('#userLanguage').val(this.currentProfile.language || 'en');

        // Work preferences
        const workPrefs = this.currentProfile.workPreferences || {};
        $('#workStartTime').val(workPrefs.startTime || '09:00');
        $('#workEndTime').val(workPrefs.endTime || '17:00');
        $('#lunchBreakDuration').val(workPrefs.lunchBreakDuration || 60);

        // Work days
        this.populateWorkDays(workPrefs.workDays || [1, 2, 3, 4, 5]);

        // Productivity goals
        const goals = this.currentProfile.productivityGoals || {};
        $('#dailyWorkGoal').val(goals.dailyWorkGoal || 8);
        $('#weeklyWorkGoal').val(goals.weeklyWorkGoal || 40);
        $('#focusGoal').val(goals.focusGoal || 4);
        $('#breakGoal').val(goals.breakGoal || 4);

        // Notification preferences
        const notifications = this.currentProfile.notifications || {};
        $('#emailNotifications').prop('checked', notifications.email !== false);
        $('#desktopNotifications').prop('checked', notifications.desktop !== false);
        $('#soundNotifications').prop('checked', notifications.sound !== false);
        $('#breakReminders').prop('checked', notifications.breakReminders !== false);
        $('#goalAlerts').prop('checked', notifications.goalAlerts !== false);
        $('#weeklyReports').prop('checked', notifications.weeklyReports !== false);

        // Privacy settings
        const privacy = this.currentProfile.privacy || {};
        $('#dataCollection').prop('checked', privacy.dataCollection !== false);
        $('#crashReports').prop('checked', privacy.crashReports !== false);
        $('#usageAnalytics').prop('checked', privacy.usageAnalytics !== false);
        $('#featureUpdates').prop('checked', privacy.featureUpdates !== false);

        // Avatar
        this.updateAvatarDisplay();
    }

    /**
     * Populate work days checkboxes
     * @param {Array} workDays - Array of work day numbers (0-6)
     */
    populateWorkDays(workDays) {
        const dayMap = {
            0: '#sunday',
            1: '#monday',
            2: '#tuesday',
            3: '#wednesday',
            4: '#thursday',
            5: '#friday',
            6: '#saturday'
        };

        // Reset all checkboxes
        $('.work-days-checkboxes input[type="checkbox"]').prop('checked', false);

        // Check selected days
        workDays.forEach(day => {
            const checkboxId = dayMap[day];
            if (checkboxId) {
                $(checkboxId).prop('checked', true);
            }
        });
    }

    /**
     * Get selected work days from checkboxes
     * @returns {Array} Array of work day numbers
     */
    getSelectedWorkDays() {
        const selectedDays = [];
        $('.work-days-checkboxes input[type="checkbox"]:checked').each(function() {
            selectedDays.push(parseInt($(this).val()));
        });
        return selectedDays;
    }

    /**
     * Update work days when checkboxes change
     */
    updateWorkDays() {
        const workDays = this.getSelectedWorkDays();
        if (workDays.length === 0) {
            this.showError('At least one work day must be selected');
            return;
        }
        this.clearErrors();
    }

    /**
     * Save profile data
     */
    async saveProfile() {
        try {
            this.clearMessages();

            // Collect form data
            const profileData = this.collectProfileData();

            // Validate data
            const validation = profileService.validateProfile(profileData);
            if (!validation.isValid) {
                this.showErrors(validation.errors);
                return;
            }

            // Show loading state
            $('#saveProfileBtn').prop('disabled', true).html('<i class="fi fi-rr-spinner fa-spin me-2"></i>Saving...');

            // Update profile
            await profileService.updateProfile(profileData);

            // Update current profile
            this.currentProfile = profileService.getProfile();

            // Show success message
            this.showSuccess('Profile saved successfully!');

            // Reset button state
            $('#saveProfileBtn').prop('disabled', false).html('<i class="fi fi-rr-disk me-2"></i>Save Profile');

        } catch (error) {
            console.error('Error saving profile:', error);
            this.showError('Failed to save profile. Please try again.');
            $('#saveProfileBtn').prop('disabled', false).html('<i class="fi fi-rr-disk me-2"></i>Save Profile');
        }
    }

    /**
     * Collect profile data from form
     * @returns {Object} Profile data object
     */
    collectProfileData() {
        const workDays = this.getSelectedWorkDays();

        return {
            displayName: $('#displayName').val().trim(),
            timezone: $('#userTimezone').val(),
            language: $('#userLanguage').val(),
            workPreferences: {
                startTime: $('#workStartTime').val(),
                endTime: $('#workEndTime').val(),
                workDays: workDays,
                lunchBreakDuration: parseInt($('#lunchBreakDuration').val()) || 60
            },
            productivityGoals: {
                dailyWorkGoal: parseFloat($('#dailyWorkGoal').val()) || 8,
                weeklyWorkGoal: parseFloat($('#weeklyWorkGoal').val()) || 40,
                focusGoal: parseInt($('#focusGoal').val()) || 4,
                breakGoal: parseInt($('#breakGoal').val()) || 4
            },
            notifications: {
                email: $('#emailNotifications').is(':checked'),
                desktop: $('#desktopNotifications').is(':checked'),
                sound: $('#soundNotifications').is(':checked'),
                breakReminders: $('#breakReminders').is(':checked'),
                goalAlerts: $('#goalAlerts').is(':checked'),
                weeklyReports: $('#weeklyReports').is(':checked')
            },
            privacy: {
                dataCollection: $('#dataCollection').is(':checked'),
                crashReports: $('#crashReports').is(':checked'),
                usageAnalytics: $('#usageAnalytics').is(':checked'),
                featureUpdates: $('#featureUpdates').is(':checked')
            }
        };
    }

    /**
     * Export profile data
     */
    async exportProfile() {
        try {
            const exportData = profileService.exportProfile();
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            // Create download link
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `timetracker-profile-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            this.showSuccess('Profile exported successfully!');
        } catch (error) {
            console.error('Error exporting profile:', error);
            this.showError('Failed to export profile. Please try again.');
        }
    }

    /**
     * Reset profile to defaults
     */
    async resetProfile() {
        try {
            if (!confirm('Are you sure you want to reset your profile to default values? This action cannot be undone.')) {
                return;
            }

            // Show loading state
            $('#resetProfileBtn').prop('disabled', true).html('<i class="fi fi-rr-spinner fa-spin me-2"></i>Resetting...');

            await profileService.resetProfile();
            this.currentProfile = profileService.getProfile();
            this.populateProfileForm();

            this.showSuccess('Profile reset to default values!');
            $('#resetProfileBtn').prop('disabled', false).html('<i class="fi fi-rr-refresh me-2"></i>Reset to Defaults');

        } catch (error) {
            console.error('Error resetting profile:', error);
            this.showError('Failed to reset profile. Please try again.');
            $('#resetProfileBtn').prop('disabled', false).html('<i class="fi fi-rr-refresh me-2"></i>Reset to Defaults');
        }
    }

    /**
     * Delete user account
     */
    async deleteAccount() {
        try {
            const confirmMessage = 'Are you sure you want to delete your account? This action will permanently delete all your data and cannot be undone.';
            if (!confirm(confirmMessage)) {
                return;
            }

            // Show loading state
            $('#deleteAccountBtn').prop('disabled', true).html('<i class="fi fi-rr-spinner fa-spin me-2"></i>Deleting...');

            await profileService.deleteAccount();

            // Redirect to logout or show success message
            this.showSuccess('Account deleted successfully. You will be logged out.');
            
            // Logout after a delay
            setTimeout(() => {
                // Trigger logout (this should be handled by auth service)
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('Error deleting account:', error);
            this.showError('Failed to delete account. Please try again.');
            $('#deleteAccountBtn').prop('disabled', false).html('<i class="fi fi-rr-trash me-2"></i>Delete Account');
        }
    }

    /**
     * Setup avatar handling
     */
    setupAvatarHandling() {
        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        // Handle file selection
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this.handleAvatarUpload(file);
            }
        });

        // Update change avatar button to trigger file input
        $('#changeAvatarBtn').on('click', () => {
            fileInput.click();
        });
    }

    /**
     * Handle avatar upload
     * @param {File} file - Image file
     */
    async handleAvatarUpload(file) {
        try {
            // Validate file
            if (!file.type.startsWith('image/')) {
                this.showError('Please select a valid image file.');
                return;
            }

            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                this.showError('Image file size must be less than 5MB.');
                return;
            }

            // Convert to base64
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    await profileService.updateAvatar(e.target.result);
                    this.updateAvatarDisplay();
                    this.showSuccess('Avatar updated successfully!');
                } catch (error) {
                    console.error('Error updating avatar:', error);
                    this.showError('Failed to update avatar. Please try again.');
                }
            };
            reader.readAsDataURL(file);

        } catch (error) {
            console.error('Error handling avatar upload:', error);
            this.showError('Failed to upload avatar. Please try again.');
        }
    }

    /**
     * Update avatar display
     */
    updateAvatarDisplay() {
        const avatar = this.currentProfile?.avatar;
        const avatarElement = $('#profileAvatar');

        if (avatar) {
            avatarElement.html(`<img src="${avatar}" alt="Profile Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`);
        } else {
            avatarElement.html('<i class="fi fi-rr-user"></i>');
        }
    }

    /**
     * Change avatar
     */
    changeAvatar() {
        // This is handled by setupAvatarHandling
    }

    /**
     * Validate display name
     */
    validateDisplayName() {
        const displayName = $('#displayName').val().trim();
        if (displayName && displayName.length < 2) {
            this.showFieldError('#displayName', 'Display name must be at least 2 characters long');
        } else {
            this.clearFieldError('#displayName');
        }
    }

    /**
     * Validate work times
     */
    validateWorkTimes() {
        const startTime = $('#workStartTime').val();
        const endTime = $('#workEndTime').val();

        if (startTime && endTime) {
            const [startHour, startMin] = startTime.split(':').map(Number);
            const [endHour, endMin] = endTime.split(':').map(Number);
            
            if (startHour * 60 + startMin >= endHour * 60 + endMin) {
                this.showFieldError('#workEndTime', 'Work end time must be after start time');
            } else {
                this.clearFieldError('#workEndTime');
            }
        }
    }

    /**
     * Validate goals
     */
    validateGoals() {
        const dailyGoal = parseFloat($('#dailyWorkGoal').val());
        const weeklyGoal = parseFloat($('#weeklyWorkGoal').val());

        if (dailyGoal && (dailyGoal < 1 || dailyGoal > 16)) {
            this.showFieldError('#dailyWorkGoal', 'Daily work goal must be between 1 and 16 hours');
        } else {
            this.clearFieldError('#dailyWorkGoal');
        }

        if (weeklyGoal && (weeklyGoal < 1 || weeklyGoal > 80)) {
            this.showFieldError('#weeklyWorkGoal', 'Weekly work goal must be between 1 and 80 hours');
        } else {
            this.clearFieldError('#weeklyWorkGoal');
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.clearMessages();
        const alert = $(`
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fi fi-rr-check me-2"></i>${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `);
        $('.settings-section').first().prepend(alert);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alert.alert('close');
        }, 5000);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.clearMessages();
        const alert = $(`
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fi fi-rr-exclamation me-2"></i>${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `);
        $('.settings-section').first().prepend(alert);
    }

    /**
     * Show multiple errors
     * @param {Array} errors - Array of error messages
     */
    showErrors(errors) {
        this.clearMessages();
        const errorList = errors.map(error => `<li>${error}</li>`).join('');
        const alert = $(`
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fi fi-rr-exclamation me-2"></i>Please fix the following errors:
                <ul class="mb-0 mt-2">${errorList}</ul>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `);
        $('.settings-section').first().prepend(alert);
    }

    /**
     * Show field-specific error
     * @param {string} fieldSelector - Field selector
     * @param {string} message - Error message
     */
    showFieldError(fieldSelector, message) {
        const field = $(fieldSelector);
        field.addClass('is-invalid');
        
        // Remove existing error message
        field.siblings('.invalid-feedback').remove();
        
        // Add error message
        field.after(`<div class="invalid-feedback">${message}</div>`);
    }

    /**
     * Clear field-specific error
     * @param {string} fieldSelector - Field selector
     */
    clearFieldError(fieldSelector) {
        const field = $(fieldSelector);
        field.removeClass('is-invalid');
        field.siblings('.invalid-feedback').remove();
    }

    /**
     * Clear all errors
     */
    clearErrors() {
        $('.is-invalid').removeClass('is-invalid');
        $('.invalid-feedback').remove();
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        $('.alert').alert('close');
    }
}

// Create and export singleton instance
const profileUI = new ProfileUI();
module.exports = profileUI; 