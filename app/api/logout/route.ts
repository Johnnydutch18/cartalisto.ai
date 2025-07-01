import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Handle both v13 (Promise) and v14 (direct) cookie stores
  const cookieStore = await cookies(); // Add await for compatibility

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          cookieStore.set({ name, value, ...options });
        },
        remove: (name, options) => {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Sign out from Supabase
  const { error } = await supabase.auth.signOut();
  
  // Manually clear all auth cookies with immediate expiration
  await Promise.all([
    cookieStore.set({
      name: 'sb-access-token',
      value: '',
      expires: new Date(0),
      path: '/',
    }),
    cookieStore.set({
      name: 'sb-refresh-token',
      value: '',
      expires: new Date(0),
      path: '/',
    })
  ]);

  // Redirect to clear client state
  return NextResponse.redirect(new URL('/', request.url), {
    status: 302,
  });
}