import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export async function POST(req: NextRequest) {
  const cookieStore = await nextCookies();

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

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = await req.formData();
  const plan = body.get("plan");

  const prices: Record<string, string> = {
    standard: process.env.STRIPE_STANDARD_PRICE_ID!,
    pro: process.env.STRIPE_PRO_PRICE_ID!,
  };

  const priceId = prices[plan as string];

  // 🛠️ Extra pre-validation debug
  console.log("🛠️ Raw plan from formData:", plan);
  console.log("🛠️ Available price IDs:", prices);
  console.log("🛠️ Matched price ID:", priceId);

  // 🛑 Validate input
  if (!plan || typeof plan !== "string" || !priceId) {
    console.log("❌ INVALID PLAN OR PRICE ID");
    console.log("🧨 plan:", plan);
    console.log("🧨 priceId:", priceId);
    return NextResponse.json({ error: "Missing or invalid plan" }, { status: 400 });
  }

  // 🔍 FULL DEBUG LOGGING
  console.log("🧪 Creating Stripe session:");
  console.log("➡️ Plan:", plan);
  console.log("➡️ Price ID:", priceId);
  console.log("➡️ User Email:", user.email);
  console.log("➡️ User ID:", user.id);
  console.log("➡️ Success URL:", `${process.env.NEXT_PUBLIC_SITE_URL}/success`);
  console.log("➡️ Cancel URL:", `${process.env.NEXT_PUBLIC_SITE_URL}/planes`);
  console.log("🧾 ENV STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY?.slice(0, 10));
  console.log("🧾 ENV STRIPE_STANDARD_PRICE_ID:", process.env.STRIPE_STANDARD_PRICE_ID);
  console.log("🧾 ENV STRIPE_PRO_PRICE_ID:", process.env.STRIPE_PRO_PRICE_ID);
  console.log("🧾 ENV NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email!,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/planes`,
    metadata: {
      user_id: user.id,
      plan,
    },
  });

return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
}
