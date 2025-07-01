// /app/logout/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies as getCookies } from "next/headers";
import type { CookieOptions } from "@supabase/ssr";

export async function GET() {
  const cookieStore = await getCookies(); // ✅ MUST await this in API routes

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value,
    getAll: () =>
      cookieStore.getAll().map((c) => ({
        name: c.name,
        value: c.value,
      })),
    set: (name: string, value: string, options?: CookieOptions) => {
      cookieStore.set({ name, value, ...options });
    },
    delete: (name: string, options?: CookieOptions) => {
      cookieStore.set({ name, value: "", ...options });
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
