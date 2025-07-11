/**
 * Payment Service - Handles Stripe payments and subscription management
 * Provides methods for creating checkout sessions, managing subscriptions, and verifying payment status
 */

class PaymentService {
    constructor() {
        // Detect environment and set appropriate API URL
        let apiBaseUrl;
        
        // Check if we're in Electron (file:// protocol) or localhost
        if (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '') {
            apiBaseUrl = 'http://localhost:3001/api';
        } else {
            // Production environment
            apiBaseUrl = `${window.location.origin}/api`;
        }
        
        this.apiBaseUrl = apiBaseUrl;
        this.stripe = null;
        this.initializationPromise = null;
        console.log('💳 PaymentService: Initializing...');
        console.log('💳 PaymentService: API Base URL:', this.apiBaseUrl);
        console.log('💳 PaymentService: Protocol:', window.location.protocol);
        console.log('💳 PaymentService: Hostname:', window.location.hostname);
        
        // Initialize Stripe after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.initializeStripe();
        }, 100);
    }

    /**
     * Initialize Stripe with publishable key
     * @param {string} publishableKey - Stripe publishable key
     */
    async initializeStripe(publishableKey = null) {
        // If already initializing, return the existing promise
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._initializeStripe(publishableKey);
        return this.initializationPromise;
    }

    /**
     * Internal method to initialize Stripe
     * @param {string} publishableKey - Stripe publishable key
     */
    async _initializeStripe(publishableKey = null) {
        try {
            console.log('💳 PaymentService: Initializing Stripe...');
            
            // If publishable key is provided, use it directly
            if (publishableKey) {
                await this.loadStripeAndInitialize(publishableKey);
                return;
            }
            
            // Otherwise, fetch from backend
            try {
                const response = await fetch(`${this.apiBaseUrl}/stripe-config`);
                if (response.ok) {
                    const config = await response.json();
                    await this.loadStripeAndInitialize(config.publishableKey);
                } else {
                    throw new Error('Failed to fetch Stripe configuration');
                }
            } catch (error) {
                console.error('💳 PaymentService: Failed to fetch Stripe config:', error);
                // Fallback to placeholder for development
                await this.loadStripeAndInitialize('pk_test_your_stripe_publishable_key_here');
            }
        } catch (error) {
            console.error('💳 PaymentService: Failed to initialize Stripe:', error);
            this.initializationPromise = null; // Reset on error
            throw error;
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
     * Ensure Stripe is initialized and ready for use
     * @returns {Promise<boolean>} - Whether Stripe is ready
     */
    async ensureStripeReady() {
        if (this.stripe) {
            return true;
        }

        try {
            console.log('💳 PaymentService: Ensuring Stripe is ready...');
            
            // If initialization is already in progress, wait for it
            if (this.initializationPromise) {
                await this.initializationPromise;
                return !!this.stripe;
            }
            
            // Otherwise, start initialization
            await this.initializeStripe();
            return !!this.stripe;
        } catch (error) {
            console.error('💳 PaymentService: Failed to ensure Stripe is ready:', error);
            return false;
        }
    }

    /**
     * Create a checkout session for subscription
     * @param {string} priceId - Stripe price ID for the subscription
     * @param {string} firebaseUid - Firebase user ID
     * @returns {Promise<Object>} - Checkout session data
     */
    async createCheckoutSession(priceId, firebaseUid) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId,
                    firebaseUid
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
                const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;
                shell.openExternal(checkoutUrl);
                return { success: true };
            }

            // Ensure Stripe is initialized before proceeding
            const isReady = await this.ensureStripeReady();
            if (!isReady) {
                throw new Error('Failed to initialize Stripe');
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