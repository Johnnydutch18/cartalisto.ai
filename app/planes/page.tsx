import { createServerClient } from '@supabase/ssr'
import { cookies as getCookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function PlansPage() {
  // ✅ Await cookies()
  const cookieStore = await getCookies()

  // ✅ Proper cookie adapter
  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value,
    getAll: () => cookieStore.getAll(),
    set: (name: string, value: string, options: any) => {
      cookieStore.set({
        name,
        value,
        ...options,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    },
    remove: (name: string, options: any) => {
      cookieStore.set({
        name,
        value: '',
        ...options,
        maxAge: 0,
      })
    }
  }

  // ✅ Create Supabase client with cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieAdapter
    }
  )

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  return (
    <div>
      <h1>Planes</h1>
    </div>
  )
}
