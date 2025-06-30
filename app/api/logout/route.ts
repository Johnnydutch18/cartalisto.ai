// app/api/logout/route.ts

import { cookies as getCookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await getCookies(); // ✅ FIXED: now it's awaited

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieStore, // ✅ Type now matches Supabase expectations
    }
  );

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL));
}
