import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

export async function GET() {
  const cookieStore = nextCookies(); // DO NOT await — works in App Router

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        getAll: () =>
          cookieStore.getAll().map((c) => ({
            name: c.name,
            value: c.value,
          })),
        set: (name, value, options) =>
          cookieStore.set({ name, value, ...options }),
        delete: (name, options) =>
          cookieStore.set({ name, value: "", ...options }),
      },
    }
  );

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL!));
}
