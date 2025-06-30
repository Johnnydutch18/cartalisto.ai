import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies as getCookies } from "next/headers";

export async function GET() {
  const cookieStore = await getCookies(); // ✅ FIXED: Await is needed here!

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value,
    getAll: () =>
      Array.from(cookieStore.getAll()).map((c) => ({
        name: (c as { name: string }).name,
        value: (c as { value: string }).value,
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

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL!));
}
