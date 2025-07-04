// /app/api/stripe/checkout/route.ts
import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!) // ✅ no apiVersion

export async function POST(req: Request) {
  try {
    const { tier, user_id } = await req.json()

    if (!tier || !user_id) {
      return NextResponse.json({ error: 'Missing tier or user ID' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env[`STRIPE_PRICE_${tier.toUpperCase()}`],
          quantity: 1,
        },
      ],
      metadata: {
        user_id,
        tier,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/planes?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/planes?cancelled=true`,
    })

    return NextResponse.redirect(session.url!, 303)
  } catch (error: any) {
    console.error('Stripe Checkout error:', error)
    return NextResponse.json({ error: 'Stripe error' }, { status: 500 })
  }
}
