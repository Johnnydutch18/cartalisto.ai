import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

export async function POST(req: Request) {
  const cookieStore = await nextCookies();

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value,
    getAll: () =>
      cookieStore.getAll().map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
      })),
    set: (name: string, value: string, options?: any) => {
      cookieStore.set({ name, value, ...options });
    },
    delete: (name: string, options?: any) => {
      cookieStore.set({ name, value: "", ...options });
    },
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter }
  );

  const { data: user } = await supabase.auth.getUser();

  if (!user?.user) {
    return NextResponse.json({ error: "No estás autenticado." }, { status: 401 });
  }

  // ✅ Your generation logic goes here

  return NextResponse.json({ success: true, message: "Carta generada ✅" });
}
