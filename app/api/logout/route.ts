import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";
import type { CookieOptions } from "@supabase/ssr";

export async function GET() {
  const cookieStore = await nextCookies(); // ✅ Must await in App Router API route

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value,
    getAll: () =>
      cookieStore.getAll().map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
      })),
    set: (name: string, value: string, options?: CookieOptions) => {
      cookieStore.set({
        name,
        value,
        ...options,
      });
    },
    delete: (name: string, options?: CookieOptions) => {
      cookieStore.set({
        name,
        value: "",
        ...options,
      });
    },
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: cookieAdapter,
    }
  );

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL!));
}
