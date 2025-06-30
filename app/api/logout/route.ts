import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

export async function GET() {
  const cookieStore = await nextCookies(); // ✅ FIX: Add 'await'

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value,
    getAll: () =>
      Array.from(cookieStore.getAll()).map((entry) => ({
        name: entry.name,
        value: entry.value,
      })),
    set: (name: string, value: string, options: any) =>
      cookieStore.set({ name, value, ...options }),
    delete: (name: string, options: any) =>
      cookieStore.set({ name, value: "", ...options }),
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: cookieAdapter,
    }
  );

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL));
}
