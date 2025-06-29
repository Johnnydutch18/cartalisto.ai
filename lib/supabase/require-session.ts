import { redirect } from 'next/navigation';
import { cookies as nextCookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function requireSessionOrRedirect() {
  const cookieStore = await nextCookies(); // ✅ Must await this in recent Next.js versions

  // ✅ Adapter to match Supabase's expected format
  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value,
    getAll: () =>
      cookieStore.getAll().map((c) => ({
        name: c.name,
        value: c.value,
      })),
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieAdapter,
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}
