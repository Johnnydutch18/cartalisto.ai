import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

// ✅ Use correct Stripe version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    console.log("🔎 Confirming Stripe session:", sessionId);

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email = session.customer_email;
    const plan = session.metadata?.plan;

    console.log("📧 Email:", email);
    console.log("🧾 Plan:", plan);

    if (!email || !plan) {
      return NextResponse.json({ error: "Missing session metadata" }, { status: 400 });
    }

    // ✅ Use await for cookies
    const cookieStore = await nextCookies();
    const cookieAdapter = {
      get: (name: string) => cookieStore.get(name)?.value ?? undefined,
      getAll: () =>
        cookieStore.getAll().map(({ name, value }: { name: string; value: string }) => ({
          name,
          value,
        })),
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
      console.error("❌ Supabase profile lookup error:", profileError?.message);
      return NextResponse.json({ error: "User not found in Supabase" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ plan })
      .eq("id", userProfile.id);

    if (updateError) {
      console.error("❌ Supabase update error:", updateError.message);
      return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
    }

    console.log(`✅ Plan "${plan}" successfully set for ${email}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Stripe confirm error:", err.message || err);
    return NextResponse.json({ error: "Stripe error" }, { status: 500 });
  }
}
