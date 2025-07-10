import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
apiVersion: "2025-04-30.basil",
});

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const email = session.customer_email;
    const plan = session.metadata?.plan;

    if (!email || !plan) {
      return NextResponse.json({ error: "Missing session metadata" }, { status: 400 });
    }

    const cookieStore = await nextCookies();
    const cookieAdapter = {
      get: (name: string) => cookieStore.get(name)?.value ?? undefined,
      getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
      set: () => {},
      remove: () => {},
    };

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: cookieAdapter }
    );

    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: "User not found in Supabase" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ plan })
      .eq("id", userProfile.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Stripe confirm error:", err.message || err);
    return NextResponse.json({ error: "Stripe error" }, { status: 500 });
  }
}
