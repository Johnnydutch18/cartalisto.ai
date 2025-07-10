// app/api/stripe/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ✅ Required for raw body support
export const config = {
  api: {
    bodyParser: false,
  },
};

// ✅ Match installed Stripe types
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// ✅ Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  let rawBody: string;
  const sig = req.headers.get("stripe-signature");

  try {
    rawBody = await req.text();
  } catch (err) {
    console.error("❌ Error reading raw body:", err);
    return NextResponse.json({ error: "Cannot read raw body" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Stripe webhook verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // ✅ Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const user_id = session.metadata?.user_id;
    const plan = session.metadata?.plan;

    if (!user_id || !plan) {
      console.error("❌ Missing user_id or plan in session metadata");
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ plan })
      .eq("id", user_id);

    if (error) {
      console.error("❌ Failed to update user plan:", error.message);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }

    console.log(`✅ Plan "${plan}" updated for user_id: ${user_id}`);
  }

  return NextResponse.json({ received: true });
}
