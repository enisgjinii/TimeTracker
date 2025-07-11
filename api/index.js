const express = require('express');
const cors = require('cors');
const { buffer } = require('micro');

// Import all API handlers
const createCheckoutSession = require('./create-checkout-session.js');
const createPaymentIntent = require('./create-payment-intent.js');
const stripeWebhook = require('./stripe-webhook.js');
const verifySubscription = require('./verify-subscription.js');
const subscriptionDetails = require('./subscription-details.js');
const createPortalSession = require('./create-portal-session.js');
const cancelSubscription = require('./cancel-subscription.js');
const subscriptionPlans = require('./subscription-plans.js');
const stripeConfig = require('./stripe-config.js');
const debugSession = require('./debug-session.js');
const manualUpdate = require('./manual-update.js');
const testFirebase = require('./test-firebase.js');
const simpleTest = require('./simple-test.js');
const testWebhook = require('./test-webhook.js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route handlers
app.post('/create-checkout-session', createCheckoutSession);
app.post('/create-payment-intent', createPaymentIntent);
app.post('/stripe-webhook', stripeWebhook);
app.get('/verify-subscription', verifySubscription);
app.get('/subscription-details', subscriptionDetails);
app.post('/create-portal-session', createPortalSession);
app.post('/cancel-subscription', cancelSubscription);
app.get('/subscription-plans', subscriptionPlans);
app.get('/stripe-config', stripeConfig);
app.get('/debug-session', debugSession);
app.post('/manual-update', manualUpdate);
app.get('/test-firebase', testFirebase);
app.get('/simple-test', simpleTest);
app.post('/test-webhook', testWebhook);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('API error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app; 