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
  const fallbackResume = `
Nombre: Juan Martínez
Teléfono: 600123456
Email: juan@example.com
Dirección: Barcelona, España

Perfil Profesional:
Profesional motivado con experiencia en atención al cliente, logística y administración. Destacado por su responsabilidad, adaptabilidad y habilidades comunicativas.

Experiencia Laboral:
- Asistente de almacén en Logística Express (2022 - 2023): Recepción, organización y envío de productos.
- Atención al cliente en ElectroFast (2020 - 2021): Resolución de incidencias, ventas y soporte diario.

Educación:
- Bachillerato en IES Barcelona Centro, 2018

Idiomas:
- Español (nativo)
- Inglés (intermedio)

Habilidades:
- Comunicación efectiva
- Gestión del tiempo
- Resolución de problemas
- Trabajo en equipo
`.trim();

  const cleanResume = typeof resume === 'string' && resume.trim().length > 0
    ? resume.trim()
    : fallbackResume;

  let visualStyle = '';
  if (format === 'Tradicional') {
    visualStyle = 'Diseño sobrio y clásico. Usa párrafos sin listas, sin emojis, sin íconos. Todo debe estar organizado por secciones claras con títulos en negrita. Usa <p> y <strong> para formatear, pero sin <ul>, <li>, ni tablas.';
  } else if (format === 'Moderno') {
    visualStyle = 'Diseño moderno, limpio y estructurado. Usa listas con <ul> y <li> para experiencia, habilidades e idiomas. Usa <strong> para los títulos de sección. Muestra datos de contacto arriba. Nada de emojis.';
  } else if (format === 'Creativo') {
    visualStyle = 'Diseño llamativo con emojis y encabezados destacados. Usa <ul>, <li>, <strong>, y <div>. Agrega emojis apropiados para cada sección (📌, 🧠, 💼, 🎓, 🗣️, etc). El objetivo es destacar creatividad y personalidad.';
  }

  finalPrompt = `
Eres un redactor profesional de currículums con 15 años de experiencia. Tu tarea es crear un CV completo y profesional con base en el contenido proporcionado.

🎯 Tu objetivo:
- Generar un currículum de mínimo 500 palabras.
- Redactar contenido real, detallado y profesional — aunque el texto original sea escaso o poco claro.
- Si faltan secciones (experiencia, educación, habilidades, idiomas), inventa contenido coherente y útil según el perfil.
- Mejora el lenguaje y estructura todo con claridad y estilo.
- NO uses ningún texto ficticio como [Nombre], [Campo], etc.
- NO devuelvas el resultado dentro de bloques \`\`\`html ni markdown.

✅ Formato visual: ${visualStyle}
💼 Tipo de empleo: ${jobType || 'No especificado'}

📋 Contenido proporcionado por el usuario:
${cleanResume}
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
