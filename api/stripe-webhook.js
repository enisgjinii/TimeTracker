import { buffer } from 'micro';
import Stripe from 'stripe';
import admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}
const db = admin.firestore();

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const firebaseUid = session.metadata.firebaseUid;
    await db.collection('users').doc(firebaseUid).set({
      subscription: {
        active: true,
        priceId: session.display_items?.[0]?.price?.id || session.metadata.priceId,
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        current_period_end: session.current_period_end
      }
    }, { merge: true });
  }

  // Handle subscription updates/cancellations as needed

  res.json({ received: true });
} 