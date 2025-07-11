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
        this.isInitialized = false;
        console.log('🔧 PaymentUI: Initializing...');
        this.initialize();
    }

    /**
     * Initialize payment UI
     */
    async initialize() {
        console.log('🔧 PaymentUI: Starting initialization...');

        // Initialize the payment service first
        await this.initializePaymentService();

        // Listen for auth state changes
        authService.onAuthStateChanged((user) => {
            console.log('🔧 PaymentUI: Auth state changed:', user ? 'User logged in' : 'User logged out');
            this.currentUser = user;
            if (user) {
                this.checkSubscriptionStatus();
                this.showPaymentUI();
            } else {
                // Show payment UI even without auth for demo purposes
                this.showPaymentUI();
            }
        });

        // Load subscription plans after payment service is ready
        await this.loadSubscriptionPlans();
        
        // Always show payment section for testing
        this.showPaymentSection();
        
        console.log('🔧 PaymentUI: Initialization complete');
        this.isInitialized = true;
    }

    /**
     * Initializes the payment service and updates the UI accordingly.
     */
    async initializePaymentService() {
        try {
            this.setPlanButtonsState(false, 'Initializing Payments...');
            await paymentService.init();
            this.setPlanButtonsState(true);
            this.showSuccess('Payment system ready.');
            
            // If we loaded default plans earlier, try to reload real plans now
            if (this.plans.length > 0 && this.plans.some(p => p.priceId && p.priceId.includes('_monthly'))) {
                console.log('🔧 PaymentUI: Reloading plans with real price IDs...');
                await this.loadSubscriptionPlans(1); // Single retry
            }
        } catch (error) {
            this.showError(`Payment Error: ${error.message}`);
            this.setPlanButtonsState(false, 'Payments Disabled');
        }
    }

    /**
     * Load available subscription plans with retry logic
     */
    async loadSubscriptionPlans(retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`🔧 PaymentUI: Loading subscription plans (attempt ${attempt}/${retries})...`);
                const result = await paymentService.getSubscriptionPlans();
                if (result.success) {
                    this.plans = result.plans;
                    console.log('🔧 PaymentUI: Plans loaded successfully:', this.plans.length);
                    console.log('🔧 PaymentUI: Plan price IDs:', this.plans.map(p => ({ id: p.id, priceId: p.priceId })));
                    this.renderSubscriptionPlans();
                    return; // Success
                } else {
                    console.error('🔧 PaymentUI: Failed to load plans:', result.error);
                    if (attempt === retries) {
                        this.loadDefaultPlans();
                    }
                }
            } catch (error) {
                console.error(`🔧 PaymentUI: Error loading subscription plans (attempt ${attempt}):`, error);
                if (attempt === retries) {
                    this.loadDefaultPlans();
                } else {
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
    }

    /**
     * Load default subscription plans as fallback
     */
    loadDefaultPlans() {
        console.log('🔧 PaymentUI: Loading default plans as fallback...');
        this.plans = [
            {
                id: 'free',
                name: 'Free',
                price: 0,
                priceId: null,
                interval: null,
                features: [
                    'Basic time tracking',
                    'Daily activity view',
                    'Basic productivity insights',
                    'Manual time entry',
                    '7 days of history'
                ],
                limitations: [
                    'Limited to 7 days of history',
                    'No advanced analytics',
                    'No team features',
                    'No export functionality'
                ],
                popular: false
            },
            {
                id: 'pro',
                name: 'Pro',
                price: 9.99,
                priceId: 'price_pro_monthly',
                interval: 'month',
                features: [
                    'Unlimited time tracking',
                    'Advanced analytics & insights',
                    'Productivity scoring',
                    'Custom categories & tags',
                    'Export data (CSV, JSON)',
                    'Email reports',
                    'Priority support',
                    'Unlimited history'
                ],
                limitations: [],
                popular: true
            },
            {
                id: 'business',
                name: 'Business',
                price: 29.99,
                priceId: 'price_business_monthly',
                interval: 'month',
                features: [
                    'All Pro features',
                    'Team management',
                    'Team productivity insights',
                    'Advanced reporting',
                    'API access',
                    'Custom integrations',
                    'Dedicated support',
                    'Team analytics'
                ],
                limitations: [],
                popular: false
            },
            {
                id: 'enterprise',
                name: 'Enterprise',
                price: null,
                priceId: null,
                interval: null,
                features: [
                    'All Business features',
                    'Custom deployment',
                    'Advanced security',
                    'SLA guarantees',
                    'Custom integrations',
                    'Dedicated account manager',
                    'Training & onboarding',
                    'White-label options'
                ],
                limitations: [],
                popular: false,
                custom: true
            }
        ];
        console.log('🔧 PaymentUI: Default plans loaded:', this.plans.length);
        this.renderSubscriptionPlans();
    }

    /**
     * Check current user's subscription status
     */
    async checkSubscriptionStatus() {
        if (!this.currentUser) return;

        try {
            console.log('🔧 PaymentUI: Checking subscription status for user:', this.currentUser.uid);
            const result = await paymentService.verifySubscription(this.currentUser.uid);
            if (result.success) {
                this.subscriptionStatus = result;
                this.updateSubscriptionUI();
                console.log('🔧 PaymentUI: Subscription status updated');
            }
        } catch (error) {
            console.error('🔧 PaymentUI: Error checking subscription status:', error);
        }
    }

    /**
     * Render subscription plans in the UI
     */
    renderSubscriptionPlans() {
        console.log('🔧 PaymentUI: Rendering subscription plans...');
        const plansContainer = document.getElementById('subscription-plans');
        if (!plansContainer) {
            console.error('🔧 PaymentUI: subscription-plans container not found!');
            return;
        }

        console.log('🔧 PaymentUI: Found plans container, rendering...');
        plansContainer.innerHTML = this.plans.map(plan => this.createPlanCard(plan)).join('');
        
        // Add event listeners to upgrade buttons and set initial state
        this.setPlanButtonsState(paymentService.state === 'initialized');
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
     * Sets the enabled/disabled state of all plan buttons.
     * @param {boolean} isEnabled - Whether to enable the buttons.
     * @param {string} [text] - Optional text to display on the buttons.
     */
    setPlanButtonsState(isEnabled, text = '') {
        this.plans.forEach(plan => {
            if (plan.priceId) {
                const upgradeBtn = document.getElementById(`upgrade-${plan.id}`);
                if (upgradeBtn) {
                    upgradeBtn.disabled = !isEnabled;
                    if (text) {
                        upgradeBtn.textContent = text;
                    } else if (isEnabled) {
                        upgradeBtn.textContent = `Upgrade to ${plan.name}`;
                    }
                    
                    if (isEnabled && !upgradeBtn.hasAttribute('data-listener-attached')) {
                        upgradeBtn.addEventListener('click', () => this.handleUpgrade(plan));
                        upgradeBtn.setAttribute('data-listener-attached', 'true');
                        console.log('🔧 PaymentUI: Added event listener for', plan.id);
                    }
                }
            }
        });
    }

    /**
     * Handle user upgrade to a new plan
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
                if (result.needsInitialization) {
                    this.showError('Payment system is not ready. Please wait a moment and try again.');
                    this.initializePaymentService(); // Attempt to re-initialize
                } else if (result.needsConfiguration) {
                    this.showError('Payment system is being configured. Please try again later or contact support.');
                } else if (result.serverUnavailable) {
                    this.showError('Payment server is not available. Please ensure the server is running and try again.');
                } else if (result.error && result.error.includes('Failed to fetch')) {
                    this.showError('Unable to connect to payment server. Please ensure the server is running and try again.');
                } else {
                    throw new Error(result.error);
                }
            }
        } catch (error) {
            console.error('Error during upgrade:', error);
            this.showError(`Upgrade Failed: ${error.message}`);
        } finally {
            // Reset button state (only if it still exists)
            const button = document.getElementById(`upgrade-${plan.id}`);
            if (button) {
                button.textContent = `Upgrade to ${plan.name}`;
                button.disabled = false;
            }
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

    /**
     * Manual trigger to show payment section (for testing)
     */
    showPaymentSection() {
        console.log('🔧 PaymentUI: Manually showing payment section...');
        
        // Show the subscription section
        const subscriptionSection = document.querySelector('.settings-section.payment-related');
        if (subscriptionSection) {
            subscriptionSection.style.display = 'block';
            console.log('🔧 PaymentUI: Subscription section shown');
        } else {
            console.error('🔧 PaymentUI: Subscription section not found');
        }
        
        // Render plans if not already rendered
        if (this.plans.length > 0) {
            this.renderSubscriptionPlans();
        } else {
            this.loadSubscriptionPlans();
        }
    }
}

// Create and export a single instance
const paymentUI = new PaymentUI();
export default paymentUI;

// Global function for contact sales
window.contactSales = function() {
    window.open('mailto:sales@timetracker.com?subject=Enterprise%20Inquiry', '_blank');
};

// Global function to manually show payment section (for testing)
window.showPaymentSection = function() {
    paymentUI.showPaymentSection();
}; 