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
        console.log('💳 PaymentService: Initializing...');
        console.log('💳 PaymentService: API Base URL:', this.apiBaseUrl);
        console.log('💳 PaymentService: Protocol:', window.location.protocol);
        console.log('💳 PaymentService: Hostname:', window.location.hostname);
        // Initialize Stripe when needed
        this.initializeStripe();
    }

    /**
     * Initialize Stripe with publishable key
     * @param {string} publishableKey - Stripe publishable key
     */
    async initializeStripe(publishableKey = null) {
        try {
            console.log('💳 PaymentService: Initializing Stripe...');
            // Load Stripe.js dynamically
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = () => {
                // Use environment variable or passed key
                const key = publishableKey || 'pk_test_your_stripe_publishable_key_here';
                this.stripe = Stripe(key);
                console.log('💳 PaymentService: Stripe initialized successfully');
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error('💳 PaymentService: Failed to initialize Stripe:', error);
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
            if (!this.stripe) {
                throw new Error('Stripe not initialized');
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