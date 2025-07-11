/**
 * Payment Form - Simple payment form for direct Stripe integration
 * Handles card input and payment processing without hosted checkout
 */

import paymentService from './payment-service.js';

class PaymentForm {
    constructor() {
        this.elements = null;
        this.paymentMethod = null;
    }

    /**
     * Initialize the payment form
     * @param {string} containerId - ID of the container element
     * @returns {Promise<boolean>} - Whether initialization was successful
     */
    async initialize(containerId) {
        try {
            // Ensure Stripe is ready
            const isReady = await paymentService.ensureStripeReady();
            if (!isReady) {
                throw new Error('Payment system not initialized');
            }

            // Create card element
            this.elements = paymentService.stripe.elements();
            const card = this.elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                            color: '#aab7c4',
                        },
                    },
                    invalid: {
                        color: '#9e2146',
                    },
                },
            });

            // Mount the card element
            const cardElement = document.getElementById('card-element');
            if (cardElement) {
                card.mount(cardElement);
            }

            return true;
        } catch (error) {
            console.error('Payment form initialization error:', error);
            return false;
        }
    }

    /**
     * Process payment
     * @param {string} clientSecret - Payment intent client secret
     * @returns {Promise<Object>} - Payment result
     */
    async processPayment(clientSecret) {
        try {
            // Create payment method
            const { error: paymentMethodError, paymentMethod } = await paymentService.stripe.createPaymentMethod({
                type: 'card',
                card: this.elements.getElement('card'),
            });

            if (paymentMethodError) {
                throw new Error(paymentMethodError.message);
            }

            // Confirm the payment
            const { error: confirmError } = await paymentService.stripe.confirmCardPayment(clientSecret, {
                payment_method: paymentMethod.id
            });

            if (confirmError) {
                throw new Error(confirmError.message);
            }

            return { success: true };
        } catch (error) {
            console.error('Payment processing error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create HTML for payment form
     * @returns {string} - HTML string for payment form
     */
    createPaymentFormHTML() {
        return `
            <div class="payment-form">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Payment Information</h5>
                        <form id="payment-form">
                            <div class="mb-3">
                                <label for="card-element" class="form-label">Credit or debit card</label>
                                <div id="card-element" class="form-control">
                                    <!-- Stripe Elements will insert the card input here -->
                                </div>
                                <div id="card-errors" class="text-danger mt-2" role="alert"></div>
                            </div>
                            <button type="submit" class="btn btn-primary w-100" id="submit-payment">
                                <span id="button-text">Pay</span>
                                <div class="spinner d-none" id="spinner"></div>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }
}

export default PaymentForm; 