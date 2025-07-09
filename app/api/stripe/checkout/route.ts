// app/api/stripe/checkout/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();


  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value ?? undefined,
    getAll: () => {
      const all: { name: string; value: string }[] = [];
      for (const c of cookieStore.getAll()) {
        all.push({ name: c.name, value: c.value });
      }
      return all;
    },
    set: () => {},
    remove: () => {},
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: cookieAdapter,
    }
  );

  const body = await req.formData();
  const plan = body.get("plan");

  if (!plan || typeof plan !== "string") {
    return NextResponse.json({ error: "Missing or invalid plan" }, { status: 400 });
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const email = user.email;

  const prices: Record<string, string> = {
    standard: process.env.STRIPE_STANDARD_PRICE_ID!,
    pro: process.env.STRIPE_PRO_PRICE_ID!,
  };

  const priceId = prices[plan];

  if (!priceId) {
    return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email!,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/planes`,
    metadata: {
      user_id: user.id,
      plan,
    },
  });

  return NextResponse.redirect(checkoutSession.url!, 303);
}
