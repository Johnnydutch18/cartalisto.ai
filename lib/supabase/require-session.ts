import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function requireSessionOrRedirect() {
  const cookieStore = await cookies(); // ✅ FIXED: wait for the Promise to resolve

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value ?? undefined,
    getAll: () =>
      cookieStore.getAll().map((c) => ({
        name: c.name,
        value: c.value,
      })),
    set: () => {},
    remove: () => {},
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
