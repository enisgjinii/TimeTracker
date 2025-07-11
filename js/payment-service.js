/**
 * Payment Service - Handles Stripe payments and subscription management
 * Provides methods for creating checkout sessions, managing subscriptions, and verifying payment status
 */

class PaymentService {
    constructor() {
        let apiBaseUrl;
        if (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '') {
            apiBaseUrl = 'http://localhost:3001/api';
        } else {
            apiBaseUrl = `${window.location.origin}/api`;
        }

        this.apiBaseUrl = apiBaseUrl;
        this.stripe = null;
        this.initializationPromise = null;
        this.state = 'uninitialized'; // uninitialized, initializing, initialized, error

        console.log('💳 PaymentService: Instance created.');
        console.log('💳 PaymentService: API Base URL:', this.apiBaseUrl);
    }

    /**
     * Initializes the PaymentService, fetching configuration and loading Stripe.js.
     * This method is idempotent.
     * @returns {Promise<void>}
     */
    async init() {
        if (this.state === 'initialized') {
            console.log('💳 PaymentService: Already initialized.');
            return;
        }

        if (this.state === 'initializing') {
            console.log('💳 PaymentService: Initialization in progress, waiting...');
            return this.initializationPromise;
        }

        this.state = 'initializing';
        console.log('💳 PaymentService: Starting initialization...');

        this.initializationPromise = this._initializeStripeWithRetry();
        
        try {
            await this.initializationPromise;
            this.state = 'initialized';
            console.log('💳 PaymentService: Initialization successful.');
        } catch (error) {
            this.state = 'error';
            console.error('💳 PaymentService: Initialization failed.', error);
            this.initializationPromise = null;
            throw error; // Re-throw to allow UI to handle it
        }
    }

    /**
     * Internal method to initialize Stripe, with retry logic for fetching config.
     */
    async _initializeStripeWithRetry(retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`💳 PaymentService: Attempting to fetch config (Attempt ${i + 1}/${retries})`);
                const response = await fetch(`${this.apiBaseUrl}/stripe-config`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch Stripe configuration (status: ${response.status})`);
                }
                const config = await response.json();
                if (!config.publishableKey) {
                    throw new Error('Publishable key not found in server response.');
                }
                await this.loadStripeAndInitialize(config.publishableKey);
                return; // Success
            } catch (error) {
                console.warn(`💳 PaymentService: Attempt ${i + 1} failed.`, error.message);
                if (i === retries - 1) {
                    console.error('💳 PaymentService: All attempts to fetch config failed.');
                    // Fallback to hardcoded key as a last resort in Electron/dev environments
                    if (window.location.protocol === 'file:') {
                        console.warn('💳 PaymentService: Falling back to hardcoded publishable key.');
                        await this.loadStripeAndInitialize('pk_test_51RjlZuRjVTeY4vTLvc4HDiRgdt0ay9LVir7S4vFQhkcJZKHozU0pUGaXcJR6bbg4LtEEjtlx8u60Y7VnnhjIZHoC00YZlQhf6l');
                        return;
                    }
                    throw new Error('Could not initialize payment service. Please ensure the server is running and accessible.');
                }
                await new Promise(res => setTimeout(res, delay));
            }
        }
    }

    /**
     * Load Stripe.js and initialize with publishable key
     * @param {string} publishableKey - Stripe publishable key
     */
    async loadStripeAndInitialize(publishableKey) {
        return new Promise((resolve, reject) => {
            // Load Stripe.js dynamically
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = () => {
                try {
                    this.stripe = Stripe(publishableKey);
                    console.log('💳 PaymentService: Stripe initialized successfully');
                    resolve();
                } catch (error) {
                    console.error('💳 PaymentService: Failed to create Stripe instance:', error);
                    reject(error);
                }
            };
            script.onerror = () => {
                reject(new Error('Failed to load Stripe.js'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Get Stripe configuration from server
     * @returns {Promise<Object>} - Stripe configuration
     */
    async getStripeConfig() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/stripe-config`);
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Failed to fetch Stripe configuration');
            }
        } catch (error) {
            console.error('💳 PaymentService: Error fetching Stripe config:', error);
            // Fallback to hardcoded key for Electron
            return {
                publishableKey: 'pk_test_51RjlZuRjVTeY4vTLvc4HDiRgdt0ay9LVir7S4vFQhkcJZKHozU0pUGaXcJR6bbg4LtEEjtlx8u60Y7VnnhjIZHoC00YZlQhf6l'
            };
        }
    }

    /**
     * Ensure Stripe is initialized and ready for use
     * @returns {Promise<boolean>} - Whether Stripe is ready
     */
    async ensureStripeReady() {
        if (this.state !== 'initialized') {
             console.log('💳 PaymentService: Stripe not ready, attempting to initialize...');
            await this.init();
        }
        return this.state === 'initialized';
    }

        /**
     * Create a payment intent for subscription (alternative to checkout session)
     * @param {string} priceId - Stripe price ID for the subscription
     * @param {string} firebaseUid - Firebase user ID
     * @param {number} amount - Amount in cents
     * @returns {Promise<Object>} - Payment intent data
     */
    async createPaymentIntent(priceId, firebaseUid, amount) {
        try {
            const isReady = await this.ensureStripeReady();
            if (!isReady) {
                return { 
                    success: false, 
                    error: 'Payment system is not initialized. Please try again in a moment.',
                    needsInitialization: true
                };
            }

            const response = await fetch(`${this.apiBaseUrl}/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId,
                    firebaseUid,
                    amount
                })
            });

            if (!response.ok) {
                if (response.status === 503) {
                    return { 
                        success: false, 
                        error: 'Payment service not configured. Please contact support.',
                        needsConfiguration: true
                    };
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('💳 PaymentService: Payment intent created:', data);
            return { success: true, clientSecret: data.clientSecret, paymentIntentId: data.paymentIntentId };
        } catch (error) {
            console.error('Error creating payment intent:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create a checkout session for subscription (legacy method)
     * @param {string} priceId - Stripe price ID for the subscription
     * @param {string} firebaseUid - Firebase user ID
     * @param {string} email - User's email address
     * @returns {Promise<Object>} - Checkout session data
     */
    async createCheckoutSession(priceId, firebaseUid, email = null) {
        try {
            const isReady = await this.ensureStripeReady();
            if (!isReady) {
                return { 
                    success: false, 
                    error: 'Payment system is not initialized. Please try again in a moment.',
                    needsInitialization: true
                };
            }

            const response = await fetch(`${this.apiBaseUrl}/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId,
                    firebaseUid,
                    email
                })
            });

            if (!response.ok) {
                // Handle payment service not configured
                if (response.status === 503) {
                    return { 
                        success: false, 
                        error: 'Payment service not configured. Please contact support.',
                        needsConfiguration: true
                    };
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('💳 PaymentService: Checkout session created:', data);
            
            // Store the email for use in redirect
            this.lastCreatedSessionEmail = email;
            
            return { success: true, sessionId: data.sessionId };
        } catch (error) {
            console.error('Error creating checkout session:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Redirect to Stripe checkout
     * @param {string} sessionId - Stripe checkout session ID
     * @returns {Promise<Object>} - Redirect result
     */
    async redirectToCheckout(sessionId) {
        try {
            // If running in Electron, open in user's default browser
            if (window && window.process && window.process.type === 'renderer') {
                // Electron renderer process
                const { shell } = window.require('electron');
                
                // Get the publishable key from our configuration
                const stripeConfig = await this.getStripeConfig();
                const publishableKey = stripeConfig.publishableKey;
                
                // Get user email from the checkout session creation
                const userEmail = this.lastCreatedSessionEmail || '';
                
                // Use our custom checkout page with the publishable key and email
                const checkoutUrl = `http://localhost:3001/checkout.html?session_id=${sessionId}&key=${publishableKey}&email=${encodeURIComponent(userEmail)}`;
                console.log('💳 PaymentService: Opening custom checkout page with email:', checkoutUrl);
                shell.openExternal(checkoutUrl);
                return { success: true };
            }

            // For browser environments, ensure Stripe is initialized before proceeding
            const isReady = await this.ensureStripeReady();
            if (!isReady) {
                throw new Error('Failed to initialize Stripe for checkout.');
            }

            const { error } = await this.stripe.redirectToCheckout({
                sessionId: sessionId
            });

            if (error) {
                throw error;
            }

            return { success: true };
        } catch (error) {
            console.error('Error redirecting to checkout:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Verify user subscription status
     * @param {string} firebaseUid - Firebase user ID
     * @returns {Promise<Object>} - Subscription status
     */
    async verifySubscription(firebaseUid) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/verify-subscription?firebaseUid=${firebaseUid}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                // Handle Firebase service unavailable (503) - treat as no subscription
                if (response.status === 503) {
                    console.warn('Firebase service unavailable - treating as no subscription');
                    return { success: true, active: false, warning: 'Firebase service unavailable' };
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { success: true, active: data.active };
        } catch (error) {
            console.error('Error verifying subscription:', error);
            // For network errors or server issues, default to no subscription
            return { success: true, active: false, error: error.message };
        }
    }

    /**
     * Get subscription details from Firebase
     * @param {string} firebaseUid - Firebase user ID
     * @returns {Promise<Object>} - Subscription details
     */
    async getSubscriptionDetails(firebaseUid) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/subscription-details?firebaseUid=${firebaseUid}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { success: true, subscription: data.subscription };
        } catch (error) {
            console.error('Error getting subscription details:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create customer portal session for subscription management
     * @param {string} firebaseUid - Firebase user ID
     * @returns {Promise<Object>} - Portal session data
     */
    async createPortalSession(firebaseUid) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/create-portal-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ firebaseUid })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { success: true, url: data.url };
        } catch (error) {
            console.error('Error creating portal session:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cancel user subscription
     * @param {string} firebaseUid - Firebase user ID
     * @returns {Promise<Object>} - Cancellation result
     */
    async cancelSubscription(firebaseUid) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/cancel-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ firebaseUid })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { success: true, message: data.message };
        } catch (error) {
            console.error('Error canceling subscription:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get available subscription plans
     * @returns {Promise<Object>} - Available plans
     */
    async getSubscriptionPlans() {
        try {
            console.log('💳 PaymentService: Getting subscription plans...');
            const response = await fetch(`${this.apiBaseUrl}/subscription-plans`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('💳 PaymentService: Plans received:', data.plans.length);
            return { success: true, plans: data.plans };
        } catch (error) {
            console.error('💳 PaymentService: Error getting subscription plans:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if user has active subscription
     * @param {string} firebaseUid - Firebase user ID
     * @returns {Promise<boolean>} - Whether user has active subscription
     */
    async hasActiveSubscription(firebaseUid) {
        const result = await this.verifySubscription(firebaseUid);
        return result.success && result.active;
    }

    /**
     * Get subscription plan features based on plan type
     * @param {string} planType - Plan type (free, pro, business, enterprise)
     * @returns {Object} - Plan features
     */
    getPlanFeatures(planType) {
        const features = {
            free: {
                name: 'Free',
                price: '$0',
                features: [
                    'Basic time tracking',
                    'Daily activity view',
                    'Basic productivity insights',
                    'Manual time entry'
                ],
                limitations: [
                    'Limited to 7 days of history',
                    'No advanced analytics',
                    'No team features'
                ]
            },
            pro: {
                name: 'Pro',
                price: '$9.99/month',
                features: [
                    'Unlimited time tracking',
                    'Advanced analytics & insights',
                    'Productivity scoring',
                    'Custom categories & tags',
                    'Export data (CSV, JSON)',
                    'Email reports',
                    'Priority support'
                ],
                limitations: []
            },
            business: {
                name: 'Business',
                price: '$29.99/month',
                features: [
                    'All Pro features',
                    'Team management',
                    'Team productivity insights',
                    'Advanced reporting',
                    'API access',
                    'Custom integrations',
                    'Dedicated support'
                ],
                limitations: []
            },
            enterprise: {
                name: 'Enterprise',
                price: 'Custom pricing',
                features: [
                    'All Business features',
                    'Custom deployment',
                    'Advanced security',
                    'SLA guarantees',
                    'Custom integrations',
                    'Dedicated account manager',
                    'Training & onboarding'
                ],
                limitations: []
            }
        };

        return features[planType] || features.free;
    }
}

// Create and export a single instance
const paymentService = new PaymentService();
export default paymentService; 