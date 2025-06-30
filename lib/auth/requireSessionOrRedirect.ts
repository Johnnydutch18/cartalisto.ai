// lib/auth/requireSessionOrRedirect.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function requireSessionOrRedirect() {
  const cookieStore = cookies()
  const supabase = createServerClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login') // 🔁 redirect if not logged in
  }

  return { supabase, session }
}
