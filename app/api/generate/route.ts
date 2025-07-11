import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies as nextCookies } from 'next/headers';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  console.log('✅ /api/generate hit');

const cookieStore = await nextCookies(); // ✅ this resolves the error

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { inputText, format = 'tradicional', language = 'es' } = body;

  if (!inputText || typeof inputText !== 'string') {
    return NextResponse.json({ error: 'Missing input text' }, { status: 400 });
  }

  // ✨ Format-specific style guide
  const formatMap: Record<string, string> = {
    tradicional: 'con un estilo formal, profesional y tradicional',
    moderno: 'con un estilo claro, limpio y moderno',
    creativo: 'con un estilo llamativo, creativo y visualmente atractivo',
  };

  const formatStyle = formatMap[format.toLowerCase()] || formatMap.tradicional;

  const prompt = `
Eres un experto redactor de currículums en español. Tu tarea es mejorar y reescribir el siguiente contenido para generar un Currículum Vitae profesional, incluso si el texto de entrada es muy corto o mal redactado.

🔧 Reescribe, corrige errores, completa cualquier sección que falte (como perfil profesional, educación o habilidades) y presenta todo con un formato limpio en HTML.

✍️ Estilo: ${formatStyle}
🌐 Idioma: Español
⚠️ Nunca uses corchetes ni marcadores como [Nombre del Candidato]. Usa texto real.
✅ No repitas el texto original tal cual. Reescríbelo de forma profesional y natural.

Texto de entrada:
---
${inputText}
---
Devuelve solo el HTML limpio del currículum, usando etiquetas como <h2>, <p>, <ul>, etc.
  `.trim();

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const output = response.choices[0].message.content?.trim();

    return NextResponse.json({ output });
  } catch (error) {
    console.error('❌ OpenAI error:', error);
    return NextResponse.json({ error: 'Error generating content' }, { status: 500 });
  }
}
