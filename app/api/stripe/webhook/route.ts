import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_email;
    const priceId = session.metadata?.price_id;

    let plan: 'standard' | 'pro' | undefined;
    if (priceId === process.env.STRIPE_PRICE_STANDARD) plan = 'standard';
    if (priceId === process.env.STRIPE_PRICE_PRO) plan = 'pro';

    if (!plan || !customerEmail) {
      console.warn('⚠️ Missing price_id or customer_email in session.');
      return NextResponse.json({ received: true });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('profiles')
      .update({ plan })
      .eq('email', customerEmail);

    if (error) {
      console.error('❌ Supabase update failed:', error);
      return NextResponse.json({ error: 'Supabase error' }, { status: 500 });
    }

    console.log(`✅ Updated ${customerEmail} to plan: ${plan}`);
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
