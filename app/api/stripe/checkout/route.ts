import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies as getCookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  console.log('🔁 Stripe checkout route hit')

  const body = await req.json()
  const { plan } = body

  if (!['standard', 'pro'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  // ✅ Await cookies() before using
  const cookieStore = await getCookies()

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value,
    set: () => {},
    remove: () => {},
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: cookieAdapter.get,
        set: cookieAdapter.set,
        remove: cookieAdapter.remove,
      },
    }
  )

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user || !user.email) {
    console.error('❌ Auth error:', authError)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price:
            plan === 'standard'
              ? process.env.STRIPE_PRICE_STANDARD!
              : process.env.STRIPE_PRICE_PRO!,
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        plan,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?canceled=true`,
    })

    console.log('✅ Stripe session created:', session.id)
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('❌ Stripe session error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Stripe error' },
      { status: 500 }
    )
  }
}
