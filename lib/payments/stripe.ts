import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16", // or your actual API version
});

// Optional: a mock handler for subscription changes (replace later)
export async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  console.log("🔄 Subscription changed:", subscription.id);
  // Example: Update your DB with new subscription info
}
