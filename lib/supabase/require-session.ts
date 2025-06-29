// lib/supabase/require-session.ts
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function requireSessionOrRedirect() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}
