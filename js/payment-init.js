/**
 * Payment Initialization - Ensures payment UI is properly loaded and initialized
 */

import paymentUI from './payment-ui.js';

// Initialize payment UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 PaymentInit: DOM loaded, initializing payment system...');
    
    // Create payment UI instance
    window.paymentUI = paymentUI;
    
    // Check if subscription section exists
    const subscriptionSection = document.querySelector('.settings-section h3');
    if (subscriptionSection) {
        console.log('🚀 PaymentInit: Found subscription section');
    } else {
        console.log('🚀 PaymentInit: Subscription section not found, checking for payment-related elements...');
        const paymentElements = document.querySelectorAll('.payment-related');
        console.log('🚀 PaymentInit: Found payment elements:', paymentElements.length);
    }
    
    console.log('🚀 PaymentInit: Payment system initialization complete');
});

// Also initialize when window loads
window.addEventListener('load', () => {
    console.log('🚀 PaymentInit: Window loaded, payment system ready');
}); 