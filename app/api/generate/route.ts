import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  console.log('✅ /api/generate route hit');

const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { prompt, type } = await req.json();

  if (!prompt || !type) {
    return NextResponse.json({ error: 'Missing prompt or type' }, { status: 400 });
  }

  // Optional: Usage limits can be enforced here
  const userId = session.user.id;

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, letter_count, cv_count, last_generated_at')
    .eq('id', userId)
    .single();

  // 🚦 Default limits
  const isPro = profile?.plan === 'pro';
  const isStandard = profile?.plan === 'standard';
  const freeLimit = 1;
  const standardLimit = 5;

  const today = new Date().toISOString().split('T')[0];
  const lastGenDay = profile?.last_generated_at?.split('T')[0];

  let limitReached = false;
  let updatedCounts = {};

  if (!isPro) {
    if (lastGenDay !== today) {
      // reset daily count
      updatedCounts = { cv_count: 0, letter_count: 0 };
      await supabase
        .from('profiles')
        .update({ ...updatedCounts, last_generated_at: new Date().toISOString() })
        .eq('id', userId);
    }

    const totalCount = (profile?.cv_count || 0) + (profile?.letter_count || 0);
    const limit = isStandard ? standardLimit : freeLimit;

    if (totalCount >= limit) {
      return NextResponse.json({ error: 'Daily usage limit reached.' }, { status: 429 });
    }
  }

  // 🧠 AI Completion
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const result = response.choices?.[0]?.message?.content ?? '';

    // 🧮 Update usage
    const field = type === 'letter' ? 'letter_count' : 'cv_count';

    await supabase
      .from('profiles')
      .update({
        [field]: (profile?.[field] || 0) + 1,
        last_generated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return NextResponse.json({
      result,
      usage: {
        cvCount: (type === 'cv' ? (profile?.cv_count || 0) + 1 : profile?.cv_count || 0),
        letterCount: (type === 'letter' ? (profile?.letter_count || 0) + 1 : profile?.letter_count || 0),
        limit: isPro ? Infinity : isStandard ? standardLimit : freeLimit,
      },
    });
  } catch (error) {
    console.error('❌ Error during AI generation:', error);
    return NextResponse.json({ error: 'Error generating content.' }, { status: 500 });
  }
}
