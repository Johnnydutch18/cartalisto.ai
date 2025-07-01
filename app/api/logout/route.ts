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
          // @ts-ignore
          cookieStore.set({ name: key, value, ...options });
        },
        remove: (key, options) => {
          // @ts-ignore
          cookieStore.set({ name: key, value: "", ...options });
        },
      },
    }
  );

  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
