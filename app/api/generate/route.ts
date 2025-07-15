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
    if (totalCount >= freeLimit) {
      return NextResponse.json({ error: 'Daily usage limit reached.' }, { status: 429 });
    }
  }

  // 🔧 Format resume input into structured text
  const structuredResume = typeof resume === 'object'
    ? `
Nombre completo: ${resume.name || 'No especificado'}
Teléfono: ${resume.phone || 'No especificado'}
Email: ${resume.email || 'No especificado'}
Dirección: ${resume.address || 'No especificado'}

Perfil profesional:
${resume.summary || 'No especificado'}

Experiencia laboral:
${resume.experience || 'No especificado'}

Educación:
${resume.education || 'No especificado'}

Idiomas:
${resume.languages || 'No especificado'}

Habilidades:
${resume.skills || 'No especificado'}
    `.trim()
    : resume;

  // 🎨 CV Format Style Guide
  let visualStyle = '';
  if (format === 'tradicional') {
    visualStyle = 'Formato clásico con párrafos. Sin íconos, sin emojis, sin listas. Solo texto plano con títulos en negrita. No uses tablas.';
  } else if (format === 'moderno') {
    visualStyle = 'Diseño limpio con listas <ul>, secciones claras, y encabezados organizados. Incluye detalles de contacto arriba como nombre, teléfono, correo y LinkedIn.';
  } else if (format === 'creativo') {
    visualStyle = 'Formato moderno y visual. Usa emojis y encabezados llamativos. Diseñado para destacar habilidades y creatividad. Usa <ul>, <strong>, y estilo llamativo.';
  }

  let finalPrompt = prompt;

if (type === 'cv') {
  const hasInput = typeof resume === 'string' && resume.trim().length > 0;

  const fallbackExample = `
<strong>Ejemplo de currículum para editar</strong>
...
`.trim();

  const styleGuide = {
    Tradicional: `
🎨 Tono: Formal y sobrio.
⛔️ No uses emojis, listas, ni colores.
✅ Usa solo <p> y <strong> para los títulos.
✅ Redacta las secciones como párrafos largos, uno tras otro.
✅ Encabezados como "Perfil Profesional", "Experiencia Laboral", "Educación", etc. deben ir en <strong>.
❗ El resultado debe parecer un currículum clásico y reservado.
`,

    Moderno: `
🎨 Tono: Profesional y neutral.
✅ Usa <ul><li> para "Experiencia Laboral", "Educación", "Habilidades", "Idiomas".
✅ Encabezados con <strong>. NO emojis.
✅ Datos personales en una línea: Nombre | Ciudad | Teléfono | Email.
✅ Redacción clara, directa, estructurada.
❗ Este formato debe parecer actual, usado para trabajos en empresas modernas.
`,

    Creativo: `
🎨 Tono: Profesional pero expresivo y entusiasta.
✅ Usa encabezados con emojis: 📌 Perfil, 💼 Experiencia, 🎓 Educación, 🧠 Habilidades, 🗣️ Idiomas.
✅ Usa <ul><li> para contenido donde sea útil.
✅ Agrega emojis de forma natural en los bullets o descripciones.
✅ Encabezado con nombre y ciudad puede incluir emojis como 📍, ✉️, 📞.
❗ El lenguaje puede ser más humano y visual. Ideal para diseño, marketing, etc.
`,
  };

  // ✅ Define safeFormat BEFORE using it
  const safeFormat = format as keyof typeof styleGuide;

  finalPrompt = `
Actúa como un redactor profesional de currículums con más de 15 años de experiencia.

🎯 Tu tarea es transformar el siguiente texto en un currículum completo, profesional y visualmente coherente, según el formato indicado.

🛑 No uses nombres inventados como Juan Martínez. No uses "Nombre:", "Teléfono:", ni ningún marcador como [Campo].

✅ Devuelve solo HTML limpio: <div>, <p>, <strong>, <ul>, <li>, etc.
❌ No incluyas etiquetas <html>, <body> ni bloques de código como \`\`\`.

📄 Formato solicitado: ${format}
📋 Guía de estilo:
${styleGuide[safeFormat]}

📝 Texto del usuario:
${hasInput ? resume.trim() : fallbackExample}
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
