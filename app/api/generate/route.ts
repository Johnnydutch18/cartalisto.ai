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

  const { prompt, type, resume, format, jobType } = await req.json();

  if (!type) {
    return NextResponse.json({ error: 'Missing type' }, { status: 400 });
  }

  const userId = session.user.id;

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, letter_count, cv_count, last_generated_at')
    .eq('id', userId)
    .single();

  const isPro = profile?.plan === 'pro';
  const isStandard = profile?.plan === 'standard';
  const freeLimit = 1;
  const standardLimit = 5;

  const today = new Date().toISOString().split('T')[0];
  const lastGenDay = profile?.last_generated_at?.split('T')[0];

  let limitReached = false;
  let updatedCounts = {};

  if (!isPro && !isStandard) {
    if (lastGenDay !== today) {
      updatedCounts = { cv_count: 0, letter_count: 0 };
      await supabase
        .from('profiles')
        .update({ ...updatedCounts, last_generated_at: new Date().toISOString() })
        .eq('id', userId);
    }

    const totalCount = (profile?.cv_count || 0) + (profile?.letter_count || 0);
    const limit = freeLimit;

    if (totalCount >= limit) {
      return NextResponse.json({ error: 'Daily usage limit reached.' }, { status: 429 });
    }
  }

  // 🧠 Build prompt depending on type
  let finalPrompt = prompt;

  if (type === 'cv') {
    let visualStyle = '';
    if (format === 'tradicional') {
      visualStyle = 'Formato clásico con párrafos. Sin íconos, sin emojis, sin listas. Solo texto plano con títulos en negrita. No uses tablas.';
    } else if (format === 'moderno') {
      visualStyle = 'Diseño limpio con listas <ul>, secciones claras, y encabezados organizados. Incluye detalles de contacto arriba como nombre, teléfono, correo y LinkedIn.';
    } else if (format === 'creativo') {
      visualStyle = 'Formato moderno y visual. Usa emojis y encabezados llamativos. Diseñado para destacar habilidades y creatividad. Usa <ul>, <strong>, y estilo llamativo.';
    }

    finalPrompt = `
Actúa como un redactor experto de currículums con 15 años de experiencia en el mercado laboral de habla hispana. Tu tarea es crear un currículum completo, profesional y listo para usar.

🎯 Objetivo: Transformar el contenido proporcionado por el usuario en un CV convincente, bien redactado, visualmente claro y redactado en español neutro.

✅ Instrucciones:
- Si la información del usuario es breve o poco clara, interpreta y expande razonablemente el contenido.
- Si hay secciones clave ausentes (como perfil, experiencia, educación o habilidades), genéralas tú mismo.
- Mejora todo el lenguaje. Usa frases completas, vocabulario profesional y evita repetir exactamente lo que el usuario escribió.
- Nunca uses frases de despedida como “Un cordial saludo”. Este no es una carta.
- Devuelve solo HTML editable bien estructurado, usando <div>, <h1>, <h2>, <ul>, <li>, <p> y <strong>. No uses etiquetas <html> o <body>.
- Aplica el siguiente estilo visual: ${visualStyle}

🧾 Formato preferido: ${format}
💼 Tipo de empleo: ${jobType || 'No especificado'}
📋 CV o información del usuario:
${resume}
`.trim();
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: finalPrompt }],
      temperature: 0.7,
    });

    const result = response.choices?.[0]?.message?.content ?? '';

    const field = type === 'letter' ? 'letter_count' : 'cv_count';

    if (!isPro && !isStandard) {
      await supabase
        .from('profiles')
        .update({
          [field]: (profile?.[field] || 0) + 1,
          last_generated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    return NextResponse.json({
      result,
      usage: isPro || isStandard
        ? null
        : {
            cvCount: (type === 'cv' ? (profile?.cv_count || 0) + 1 : profile?.cv_count || 0),
            letterCount: (type === 'letter' ? (profile?.letter_count || 0) + 1 : profile?.letter_count || 0),
            limit: freeLimit,
          },
    });
  } catch (error) {
    console.error('❌ Error during AI generation:', error);
    return NextResponse.json({ error: 'Error generating content.' }, { status: 500 });
  }
}
