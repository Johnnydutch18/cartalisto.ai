import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function requireSessionOrRedirect() {
  const cookies = await getCookies(); // ✅ FIX: Await the cookies Promise

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies, // ✅ cookies is now the actual ReadonlyRequestCookies object
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return { supabase, session };
}
