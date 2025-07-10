"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const updateProfile = async () => {
      const stripeCustomerId = searchParams.get("customer");
      const priceId = searchParams.get("priceId");

      const plan = priceId?.includes("pro")
        ? "pro"
        : priceId?.includes("estandar")
        ? "estandar"
        : "free";

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (user && stripeCustomerId) {
        await supabase
          .from("profiles")
          .update({
            stripe_customer_id: stripeCustomerId,
            plan,
            email: user.email,
          })
          .eq("id", user.id);
      }

      router.push("/cuenta");
    };

    updateProfile();
  }, [searchParams, router]);

  return <p className="p-6">Actualizando tu cuenta...</p>;
}
