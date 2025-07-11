/**
 * Payment UI - Handles subscription management and payment user interface
 * Provides UI components for subscription plans, checkout, and management
 */

import paymentService from './payment-service.js';
import authService from './auth-service.js';

class PaymentUI {
    constructor() {
        this.currentUser = null;
        this.subscriptionStatus = null;
        this.plans = [];
        this.initialize();
    }

    /**
     * Initialize payment UI
     */
    async initialize() {
        // Listen for auth state changes
        authService.onAuthStateChanged((user) => {
            this.currentUser = user;
            if (user) {
                this.checkSubscriptionStatus();
            } else {
                this.hidePaymentUI();
            }
        });

        // Load subscription plans
        await this.loadSubscriptionPlans();
    }

    /**
     * Load available subscription plans
     */
    async loadSubscriptionPlans() {
        try {
            const result = await paymentService.getSubscriptionPlans();
            if (result.success) {
                this.plans = result.plans;
                this.renderSubscriptionPlans();
            }
        } catch (error) {
            console.error('Error loading subscription plans:', error);
        }
    }

    /**
     * Check current user's subscription status
     */
    async checkSubscriptionStatus() {
        if (!this.currentUser) return;

        try {
            const result = await paymentService.verifySubscription(this.currentUser.uid);
            if (result.success) {
                this.subscriptionStatus = result;
                this.updateSubscriptionUI();
            }
        } catch (error) {
            console.error('Error checking subscription status:', error);
        }
    }

    /**
     * Render subscription plans in the UI
     */
    renderSubscriptionPlans() {
        const plansContainer = document.getElementById('subscription-plans');
        if (!plansContainer) return;

        plansContainer.innerHTML = this.plans.map(plan => this.createPlanCard(plan)).join('');
        
        // Add event listeners to upgrade buttons
        this.plans.forEach(plan => {
            if (plan.priceId) {
                const upgradeBtn = document.getElementById(`upgrade-${plan.id}`);
                if (upgradeBtn) {
                    upgradeBtn.addEventListener('click', () => this.handleUpgrade(plan));
                }
            }
        });
    }

    /**
     * Create HTML for a subscription plan card
     * @param {Object} plan - Subscription plan object
     * @returns {string} - HTML string for plan card
     */
    createPlanCard(plan) {
        const isPopular = plan.popular ? 'border-primary' : 'border-secondary';
        const popularBadge = plan.popular ? '<span class="badge bg-primary position-absolute top-0 end-0 m-2">Most Popular</span>' : '';
        
        return `
            <div class="col-md-6 col-lg-3 mb-4">
                <div class="card h-100 ${isPopular} position-relative">
                    ${popularBadge}
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${plan.name}</h5>
                        <div class="mb-3">
                            <span class="h3">${plan.price === 0 ? 'Free' : `$${plan.price}`}</span>
                            ${plan.interval ? `<small class="text-muted">/${plan.interval}</small>` : ''}
                        </div>
                        
                        <ul class="list-unstyled mb-4 flex-grow-1">
                            ${plan.features.map(feature => `
                                <li class="mb-2">
                                    <i class="fi fi-rr-check text-success me-2"></i>
                                    ${feature}
                                </li>
                            `).join('')}
                        </ul>
                        
                        ${plan.limitations.length > 0 ? `
                            <div class="mb-3">
                                <small class="text-muted">
                                    ${plan.limitations.map(limitation => `
                                        <div><i class="fi fi-rr-cross text-danger me-1"></i>${limitation}</div>
                                    `).join('')}
                                </small>
                            </div>
                        ` : ''}
                        
                        <div class="mt-auto">
                            ${plan.id === 'free' ? 
                                '<button class="btn btn-outline-secondary w-100" disabled>Current Plan</button>' :
                                plan.custom ? 
                                    '<button class="btn btn-primary w-100" onclick="contactSales()">Contact Sales</button>' :
                                    `<button id="upgrade-${plan.id}" class="btn btn-primary w-100">Upgrade to ${plan.name}</button>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Handle subscription upgrade
     * @param {Object} plan - Selected plan
     */
    async handleUpgrade(plan) {
        if (!this.currentUser) {
            this.showLoginPrompt();
            return;
        }

        try {
            // Show loading state
            const button = document.getElementById(`upgrade-${plan.id}`);
            const originalText = button.textContent;
            button.textContent = 'Processing...';
            button.disabled = true;

            // Create checkout session
            const result = await paymentService.createCheckoutSession(plan.priceId, this.currentUser.uid);
            
            if (result.success) {
                // Redirect to Stripe checkout
                const redirectResult = await paymentService.redirectToCheckout(result.sessionId);
                if (!redirectResult.success) {
                    throw new Error(redirectResult.error);
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error during upgrade:', error);
            this.showError('Failed to process upgrade. Please try again.');
            
            // Reset button state
            const button = document.getElementById(`upgrade-${plan.id}`);
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    /**
     * Update subscription status in UI
     */
    updateSubscriptionUI() {
        const subscriptionStatus = document.getElementById('subscription-status');
        const subscriptionDetails = document.getElementById('subscription-details');
        const manageSubscriptionBtn = document.getElementById('manage-subscription');

        if (!subscriptionStatus || !subscriptionDetails) return;

        if (this.subscriptionStatus?.active) {
            subscriptionStatus.innerHTML = `
                <div class="alert alert-success">
                    <i class="fi fi-rr-check me-2"></i>
                    <strong>Active Subscription</strong>
                    <p class="mb-0 mt-2">You have an active subscription with full access to all features.</p>
                </div>
            `;

            if (this.subscriptionStatus.subscription) {
                const sub = this.subscriptionStatus.subscription;
                const endDate = sub.current_period_end ? 
                    new Date(sub.current_period_end).toLocaleDateString() : 'N/A';
                
                subscriptionDetails.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">Subscription Details</h6>
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Status:</strong> ${sub.status}</p>
                                    <p><strong>Current Period Ends:</strong> ${endDate}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Subscription ID:</strong> <small>${sub.stripeSubscriptionId || 'N/A'}</small></p>
                                    <p><strong>Last Updated:</strong> ${sub.updated_at ? new Date(sub.updated_at).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            if (manageSubscriptionBtn) {
                manageSubscriptionBtn.style.display = 'block';
                manageSubscriptionBtn.onclick = () => this.manageSubscription();
            }
        } else {
            subscriptionStatus.innerHTML = `
                <div class="alert alert-info">
                    <i class="fi fi-rr-info me-2"></i>
                    <strong>Free Plan</strong>
                    <p class="mb-0 mt-2">You're currently on the free plan. Upgrade to unlock advanced features.</p>
                </div>
            `;
            
            subscriptionDetails.innerHTML = '';
            
            if (manageSubscriptionBtn) {
                manageSubscriptionBtn.style.display = 'none';
            }
        }
    }

    /**
     * Manage subscription (open customer portal)
     */
    async manageSubscription() {
        if (!this.currentUser) return;

        try {
            const result = await paymentService.createPortalSession(this.currentUser.uid);
            if (result.success) {
                window.open(result.url, '_blank');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error opening customer portal:', error);
            this.showError('Failed to open subscription management. Please try again.');
        }
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription() {
        if (!this.currentUser) return;

        if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.')) {
            return;
        }

        try {
            const result = await paymentService.cancelSubscription(this.currentUser.uid);
            if (result.success) {
                this.showSuccess('Subscription will be canceled at the end of the current period.');
                await this.checkSubscriptionStatus();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error canceling subscription:', error);
            this.showError('Failed to cancel subscription. Please try again.');
        }
    }

    /**
     * Show login prompt
     */
    showLoginPrompt() {
        this.showError('Please log in to upgrade your subscription.');
        // You could trigger the login modal here
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        const alertContainer = document.getElementById('alert-container');
        if (alertContainer) {
            alertContainer.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    <i class="fi fi-rr-check me-2"></i>
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const alertContainer = document.getElementById('alert-container');
        if (alertContainer) {
            alertContainer.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="fi fi-rr-cross me-2"></i>
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
        }
    }

    /**
     * Hide payment UI
     */
    hidePaymentUI() {
        const paymentElements = document.querySelectorAll('.payment-related');
        paymentElements.forEach(element => {
            element.style.display = 'none';
        });
    }

    /**
     * Show payment UI
     */
    showPaymentUI() {
        const paymentElements = document.querySelectorAll('.payment-related');
        paymentElements.forEach(element => {
            element.style.display = 'block';
        });
    }
}

// Create and export a single instance
const paymentUI = new PaymentUI();
export default paymentUI;

// Global function for contact sales
window.contactSales = function() {
    window.open('mailto:sales@timetracker.com?subject=Enterprise%20Inquiry', '_blank');
}; 