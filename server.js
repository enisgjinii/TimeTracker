const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Check required environment variables
const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n📝 Please create a .env file with the required variables.');
    console.error('📖 See PAYMENT_SETUP.md for detailed instructions.');
    process.exit(1);
}

console.log('✅ Environment variables loaded successfully');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Routes
app.post('/api/create-checkout-session', require('./api/create-checkout-session.js'));
app.post('/api/create-payment-intent', require('./api/create-payment-intent.js'));
app.post('/api/stripe-webhook', require('./api/stripe-webhook.js'));
app.get('/api/verify-subscription', require('./api/verify-subscription.js'));
app.get('/api/subscription-details', require('./api/subscription-details.js'));
app.post('/api/create-portal-session', require('./api/create-portal-session.js'));
app.post('/api/cancel-subscription', require('./api/cancel-subscription.js'));
app.get('/api/subscription-plans', require('./api/subscription-plans.js'));
app.get('/api/stripe-config', require('./api/stripe-config.js'));

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the custom checkout page
app.get('/checkout.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'checkout.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`📱 App URL: http://localhost:${PORT}`);
}); 