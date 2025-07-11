const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Routes
app.post('/api/create-checkout-session', require('./api/create-checkout-session.js'));
app.post('/api/stripe-webhook', require('./api/stripe-webhook.js'));
app.get('/api/verify-subscription', require('./api/verify-subscription.js'));
app.get('/api/subscription-details', require('./api/subscription-details.js'));
app.post('/api/create-portal-session', require('./api/create-portal-session.js'));
app.post('/api/cancel-subscription', require('./api/cancel-subscription.js'));
app.get('/api/subscription-plans', require('./api/subscription-plans.js'));

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`API Base URL: http://localhost:${PORT}/api`);
}); 