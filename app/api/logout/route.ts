import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => cookieStore.get(key)?.value,
        set: (key, value, options) => {
          cookieStore.set({ name: key, value, ...options });
        },
        remove: (key, options) => {
          cookieStore.set({ name: key, value: "", ...options });
        },
      },
    }
  );

  const { error } = await supabase.auth.signOut();

  return NextResponse.json({ success: !error });
}
