'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies as getCookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function PlansPage() {
  // ✅ Await cookies() once
  const cookieStore = await getCookies()

  const cookieAdapter = {
    get: (name: string) => {
      const allCookies = cookieStore.getAll()
      const found = allCookies.find((c: any) => c.name === name)
      return found?.value
    },
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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter }
  )

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching plan:', profileError)
    redirect('/error')
  }

  const currentPlan = profile?.plan ?? 'free'

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-6">Choose Your Plan</h1>
      <p className="mb-6">Your current plan: <strong>{currentPlan}</strong></p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            name: 'Free',
            id: 'free',
            description: '1 generation/day using GPT‑4o‑mini.',
            features: ['PDF download'],
            disabled: true,
            highlight: currentPlan === 'free',
          },
          {
            name: 'Estándar',
            id: 'standard',
            description: 'Unlimited generations with GPT‑4o.',
            features: ['Tone selector', 'PDF + copy'],
            disabled: currentPlan === 'standard',
            highlight: currentPlan === 'standard',
          },
          {
            name: 'Pro',
            id: 'pro',
            description: 'All Standard features plus extras.',
            features: ['GPT‑4.1', 'Inline editor (soon)', 'Priority support'],
            disabled: currentPlan === 'pro',
            highlight: currentPlan === 'pro',
          },
        ].map(plan => (
          <div
            key={plan.id}
            className={`border p-6 rounded shadow-sm ${
              plan.highlight ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <h2 className="text-xl font-semibold mb-2">{plan.name}</h2>
            <p className="text-sm mb-4">{plan.description}</p>
            <ul className="text-sm mb-4 list-disc pl-5">
              {plan.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            {plan.disabled ? (
              <span className="inline-block px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded cursor-default">
                Current Plan
              </span>
            ) : (
              <button
                onClick={async () => {
                  const res = await fetch('/api/stripe/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan: plan.id }),
                  })
                  const data = await res.json()
                  if (data?.url) window.location.href = data.url
                  else alert('Something went wrong!')
                }}
                className="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700 transition"
              >
                Upgrade to {plan.name}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
