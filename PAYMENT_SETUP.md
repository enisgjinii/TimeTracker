# Payment System Setup Guide

This guide will help you set up the payment system for TimeTracker Pro with Stripe integration.

## Prerequisites

1. **Stripe Account**: Create a Stripe account at [stripe.com](https://stripe.com)
2. **Firebase Project**: Set up Firebase Authentication and Firestore
3. **Node.js**: Ensure you have Node.js installed

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY=your-firebase-private-key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (create these in your Stripe dashboard)
STRIPE_PRO_PRICE_ID=price_pro_monthly
STRIPE_BUSINESS_PRICE_ID=price_business_monthly

# App Configuration
APP_URL=http://localhost:3000
NODE_ENV=development
PORT=3000
```

## Stripe Setup

### 1. Create Products and Prices

In your Stripe Dashboard:

1. Go to **Products** → **Add Product**
2. Create the following products:

#### Pro Plan
- **Name**: TimeTracker Pro
- **Price**: $9.99/month
- **Billing**: Recurring
- **Price ID**: Copy this ID to `STRIPE_PRO_PRICE_ID`

#### Business Plan
- **Name**: TimeTracker Business
- **Price**: $29.99/month
- **Billing**: Recurring
- **Price ID**: Copy this ID to `STRIPE_BUSINESS_PRICE_ID`

### 2. Configure Webhooks

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to: `https://your-domain.com/api/stripe-webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Configure Customer Portal

1. Go to **Settings** → **Billing** → **Customer Portal**
2. Enable the portal
3. Configure settings as needed

## Firebase Setup

### 1. Service Account

1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Extract the following values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

### 2. Firestore Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see above)

3. Start the development server:
```bash
npm run dev
```

This will start both the Express API server and the Electron app.

## API Endpoints

The payment system includes the following API endpoints:

- `POST /api/create-checkout-session` - Create Stripe checkout session
- `POST /api/stripe-webhook` - Handle Stripe webhooks
- `GET /api/verify-subscription` - Verify user subscription status
- `GET /api/subscription-details` - Get detailed subscription info
- `POST /api/create-portal-session` - Create customer portal session
- `POST /api/cancel-subscription` - Cancel subscription
- `GET /api/subscription-plans` - Get available plans

## Testing

### Test Cards

Use these test card numbers in Stripe test mode:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

### Test Flow

1. Start the application
2. Sign up/login with Firebase
3. Go to Settings → Subscription
4. Click "Upgrade to Pro"
5. Complete the Stripe checkout
6. Verify subscription status updates

## Production Deployment

### 1. Update Environment Variables

- Use production Stripe keys
- Set `NODE_ENV=production`
- Update `APP_URL` to your production domain

### 2. Webhook URL

Update your Stripe webhook endpoint to your production URL:
```
https://your-domain.com/api/stripe-webhook
```

### 3. SSL Certificate

Ensure your production server has a valid SSL certificate for secure payments.

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is accessible
   - Verify webhook secret is correct
   - Check server logs for errors

2. **Subscription not updating**
   - Verify Firebase credentials
   - Check Firestore rules
   - Ensure webhook events are being processed

3. **Checkout session creation fails**
   - Verify Stripe secret key
   - Check price IDs are correct
   - Ensure all required fields are provided

### Debug Mode

Set `NODE_ENV=development` to see detailed error messages in API responses.

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables for all sensitive data
- Regularly rotate API keys
- Monitor webhook events for suspicious activity
- Implement rate limiting in production

## Support

For issues with the payment system:

1. Check the server logs for errors
2. Verify all environment variables are set correctly
3. Test with Stripe's test mode first
4. Check Stripe Dashboard for webhook delivery status 