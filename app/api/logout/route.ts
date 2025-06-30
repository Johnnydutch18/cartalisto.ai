import { NextResponse } from 'next/server';
import { cookies as getCookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET() {
  const cookieStore = await getCookies(); // ✅ await here fixes the error

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          cookieStore.set({ name, value, ...options });
        },
        remove: (name: string, options: any) => {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL));
}
