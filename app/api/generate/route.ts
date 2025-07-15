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
Ejemplo de CV para editar directamente:

<strong>📌 Perfil Profesional</strong>
<p>Profesional motivado con experiencia en atención al cliente y logística. Responsable, organizado y orientado a resultados. Busco aplicar mis habilidades en un entorno dinámico.</p>

<strong>💼 Experiencia Laboral</strong>
<ul>
  <li><strong>Logística Express</strong> (2022–2023) – Gestión de almacén y preparación de pedidos.</li>
  <li><strong>ElectroFast</strong> (2020–2021) – Atención al cliente y soporte técnico.</li>
</ul>

<strong>🎓 Educación</strong>
<ul>
  <li>Bachillerato – IES Madrid Centro (2018)</li>
</ul>

<strong>🧠 Habilidades</strong>
<ul>
  <li>Comunicación efectiva</li>
  <li>Resolución de problemas</li>
  <li>Gestión del tiempo</li>
</ul>

<strong>🗣️ Idiomas</strong>
<ul>
  <li>Español – Nativo</li>
  <li>Inglés – Intermedio</li>
</ul>
`.trim();

  let styleGuide = '';
  switch (format) {
    case 'Tradicional':
      styleGuide = `
- Usa solo <p> y <strong>
- No uses listas, emojis, íconos, ni colores
- Redacta cada sección como párrafos formales
- Mantén un tono serio y sobrio`;
      break;
    case 'Moderno':
      styleGuide = `
- Usa <ul><li> para experiencia, educación, habilidades e idiomas
- Usa <strong> para encabezados
- Muestra los datos de contacto en la primera línea
- Tono profesional y directo. Sin emojis.`;
      break;
    case 'Creativo':
      styleGuide = `
- Usa encabezados con emojis como 📌, 💼, 🎓, 🧠, 🗣️
- Usa <ul><li> y frases expresivas
- Agrega emojis relevantes dentro del contenido
- Tono entusiasta, moderno, pero profesional`;
      break;
  }

  finalPrompt = `
Actúa como un redactor profesional de currículums con 15 años de experiencia.

🎯 Objetivo:
Tu tarea es transformar el texto del usuario en un currículum profesional, claro y visualmente adecuado. Si el contenido es breve o mal estructurado, reorganízalo y mejóralo tú mismo. Si no se proporciona nada, responde con un ejemplo listo para editar.

📌 Instrucciones:
- No uses nombres genéricos como Juan Martínez
- No uses etiquetas como "Nombre:", "Teléfono:" o "[Campo]"
- Devuelve solo HTML limpio usando <div>, <h1>, <h2>, <p>, <strong>, <ul>, <li>
- Nunca uses bloques de código \`\`\` ni etiquetas <html> o <body>
- El CV debe tener al menos 500 palabras si el usuario proporcionó contenido

🖋️ Estilo solicitado: ${format}
📋 Guía de estilo específica:
${styleGuide}

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
