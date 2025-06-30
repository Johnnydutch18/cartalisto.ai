import { createServerClient } from '@supabase/ssr';
import { cookies as nextCookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await nextCookies(); // ✅ Await this

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value ?? undefined,
    getAll: () =>
      cookieStore.getAll().map((cookie: { name: string; value: string }) => ({
        name: cookie.name,
        value: cookie.value,
      })),
    set: () => {},
    remove: () => {},
  } as const;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter }
  );

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL));
}
