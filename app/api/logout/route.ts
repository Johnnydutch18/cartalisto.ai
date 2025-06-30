import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies as getCookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await getCookies();

    const cookieAdapter = {
      get: (name: string) => cookieStore.get(name)?.value,
      getAll: () =>
        Array.from(cookieStore.getAll()).map((entry) => ({
          name: entry?.name ?? "",
          value: entry?.value ?? "",
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

    // Hardcode the redirect target to eliminate env var issues
    return NextResponse.redirect("https://cartalisto-ai.vercel.app/");
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Logout failed", details: String(error) },
      { status: 500 }
    );
  }
}
