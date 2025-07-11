# Vercel Webhook Setup Guide

## Overview
This guide helps you set up Stripe webhooks to work with your Vercel deployment at `time-tracker-bice-pi.vercel.app`.

## Current Issue
- **Manual webhook tests work** ✅
- **Automatic webhooks fail** ❌
- **Root cause**: Missing or incorrect `STRIPE_WEBHOOK_SECRET`

## Step-by-Step Solution

### 1. Get Your Webhook Secret from Stripe

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Create a new webhook endpoint or find your existing one
3. Set the webhook URL to: `https://time-tracker-bice-pi.vercel.app/api/stripe-webhook`
4. Enable these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **Copy the "Signing secret"** (starts with `whsec_`)

### 2. Update Your Environment Variables

#### Local Development (.env file)
Update your `.env` file with the real webhook secret:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
```

#### Vercel Deployment
Set these environment variables in your Vercel dashboard:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `time-tracker-bice-pi`
3. Go to **Settings** → **Environment Variables**
4. Add/Update these variables:

```
STRIPE_SECRET_KEY=sk_test_51RjlZuRjVTeY4vTLVexy4roi9JPW6YEixnsqeKr7jxhMvnxXkwsoVUyFrI3mSJRKXRZdLFlofVg9LoQZsc3uEFNH00gq5jfci3
STRIPE_PUBLISHABLE_KEY=pk_test_51RjlZuRjVTeY4vTLvc4HDiRgdt0ay9LVir7S4vFQhkcJZKHozU0pUGaXcJR6bbg4LtEEjtlx8u60Y7VnnhjIZHoC00YZlQhf6l
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
FIREBASE_PROJECT_ID=timetracker-7da41
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@timetracker-7da41.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### 3. Deploy to Vercel

```bash
# Deploy to production
vercel --prod

# Or if you haven't set up Vercel yet
vercel
```

### 4. Test Your Webhook Setup

#### Test 1: Check Vercel Deployment
```bash
# Test if your Vercel endpoints are working
node test-vercel-webhook.js
```

#### Test 2: Verify Environment Variables
Visit: `https://time-tracker-bice-pi.vercel.app/api/debug-env`

You should see:
```json
{
  "success": true,
  "environment": {
    "STRIPE_WEBHOOK_SECRET": "SET"
  }
}
```

#### Test 3: Make a Test Payment
1. Go to your app: `https://time-tracker-bice-pi.vercel.app`
2. Complete a test payment
3. Check Vercel logs for webhook events

### 5. Monitor Webhook Events

#### Check Vercel Logs
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Functions** tab
4. Look for `/api/stripe-webhook` function calls

#### Check Stripe Dashboard
1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your webhook endpoint
3. Check the **Events** tab for successful/failed deliveries

## Troubleshooting

### Issue: Webhook returns 404
**Solution**: Make sure your Vercel deployment is up to date
```bash
vercel --prod
```

### Issue: Signature verification fails
**Solution**: Check that `STRIPE_WEBHOOK_SECRET` is correct in Vercel environment variables

### Issue: Firebase errors
**Solution**: Verify Firebase credentials are set in Vercel environment variables

### Issue: Webhook not receiving events
**Solution**: 
1. Check webhook URL in Stripe Dashboard
2. Verify events are enabled
3. Test with Stripe CLI: `stripe listen --forward-to https://time-tracker-bice-pi.vercel.app/api/stripe-webhook`

## Manual vs Automatic Webhooks

### Manual Webhook Test (Working)
- **Endpoint**: `/api/test-webhook`
- **Process**: Direct API call, no signature verification
- **Use case**: Testing and debugging

### Automatic Webhook (Target)
- **Endpoint**: `/api/stripe-webhook`
- **Process**: Stripe-signed events with signature verification
- **Use case**: Production webhook handling

## Success Indicators

✅ **Webhook secret is properly configured**
✅ **Vercel deployment is working**
✅ **Environment variables are set**
✅ **Stripe webhook URL is correct**
✅ **Events are enabled in Stripe Dashboard**
✅ **Test payments trigger webhook events**
✅ **Firebase is updated automatically**

Once all these are green, your automatic webhooks will work just like the manual tests! 