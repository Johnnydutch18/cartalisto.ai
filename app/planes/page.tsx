// app/planes/page.tsx
'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Type-safe cookie adapter using bracket notation
function createCookieAdapter() {
  return {
    get: (name: string) => {
      return (cookies() as unknown as { get: (name: string) => { value: string } | undefined }).get(name)?.value
    },
    set: (name: string, value: string, options: any) => {
      try {
        (cookies() as unknown as { set: (options: any) => void }).set({
          name,
          value,
          ...options,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        })
      } catch (error) {
        console.error('Cookie set error:', error)
      }
    },
    remove: (name: string, options: any) => {
      try {
        (cookies() as unknown as { set: (options: any) => void }).set({
          name,
          value: '',
          ...options,
          maxAge: 0,
        })
      } catch (error) {
        console.error('Cookie remove error:', error)
      }
    }
  }
}

export default async function PlansPage() {
  const cookieAdapter = createCookieAdapter()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieAdapter.get(name),
        set: (name, value, options) => cookieAdapter.set(name, value, options),
        remove: (name, options) => cookieAdapter.remove(name, options),
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching profile:', profileError)
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
            highlight: currentPlan === 'free'
          },
          {
            name: 'Standard',
            id: 'standard',
            description: 'Unlimited generations with GPT‑4o.',
            features: ['Tone selector', 'PDF + copy'],
            disabled: currentPlan === 'standard',
            highlight: currentPlan === 'standard'
          },
          {
            name: 'Pro',
            id: 'pro',
            description: 'All Standard features plus extras.',
            features: ['GPT‑4.1', 'Inline editor (soon)', 'Priority support'],
            disabled: currentPlan === 'pro',
            highlight: currentPlan === 'pro'
          }
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
              <form method="POST" action="/api/stripe/checkout">
                <input type="hidden" name="plan" value={plan.id} />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700 transition"
                >
                  Upgrade to {plan.name}
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
