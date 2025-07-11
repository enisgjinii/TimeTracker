const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { priceId, firebaseUid } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: 'https://your-app.vercel.app/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://your-app.vercel.app/cancel',
      metadata: { firebaseUid }
    });
    res.status(200).json({ sessionId: session.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}; 