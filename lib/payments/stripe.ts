import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil,
});

// ✅ Create Checkout Session
export async function createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string) {
  return await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}

// ✅ Create Customer Portal Session
export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// ✅ Handle Subscription Change
export async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  // TODO: Replace this with actual logic to update your database
  console.log("📦 Subscription updated:", subscription.id);
}
