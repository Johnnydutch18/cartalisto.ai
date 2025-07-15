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
    // Check if we have meaningful user input
    const hasUserInput = resume && resume.trim().length > 20;
    
    // Parse the resume content to extract information
    const parseResumeContent = (content: string) => {
      const lines = content.split('\n').filter(line => line.trim());
      const sections = {
        name: '',
        phone: '',
        email: '',
        address: '',
        summary: '',
        experience: '',
        education: '',
        skills: '',
        languages: ''
      };

      let currentSection = '';
      
      lines.forEach(line => {
        const trimmed = line.trim();
        
        // Extract contact info
        if (trimmed.toLowerCase().includes('nombre:')) {
          sections.name = trimmed.replace(/nombre:/i, '').trim();
        } else if (trimmed.toLowerCase().includes('teléfono:')) {
          sections.phone = trimmed.replace(/teléfono:/i, '').trim();
        } else if (trimmed.toLowerCase().includes('email:')) {
          sections.email = trimmed.replace(/email:/i, '').trim();
        } else if (trimmed.toLowerCase().includes('dirección:')) {
          sections.address = trimmed.replace(/dirección:/i, '').trim();
        }
        
        // Detect sections
        if (trimmed.toLowerCase().includes('perfil profesional')) {
          currentSection = 'summary';
        } else if (trimmed.toLowerCase().includes('experiencia laboral')) {
          currentSection = 'experience';
        } else if (trimmed.toLowerCase().includes('educación')) {
          currentSection = 'education';
        } else if (trimmed.toLowerCase().includes('habilidades')) {
          currentSection = 'skills';
        } else if (trimmed.toLowerCase().includes('idiomas')) {
          currentSection = 'languages';
        } else if (currentSection && !trimmed.includes(':')) {
          sections[currentSection as keyof typeof sections] += trimmed + ' ';
        }
      });

      return sections;
    };

    const userInfo = hasUserInput ? parseResumeContent(resume) : null;

    // Create comprehensive prompts for each format
    const formatPrompts = {
      'Tradicional': `
Actúa como un redactor experto de currículums con 15 años de experiencia en recursos humanos españoles.

FORMATO TRADICIONAL - CARACTERÍSTICAS ESPECÍFICAS:
- Diseño clásico y conservador, ideal para empresas tradicionales, gobierno, banca
- SOLO usar párrafos (<p>) con títulos en <strong>
- PROHIBIDO: listas, viñetas, emojis, íconos, colores, tablas
- Tono formal, sobrio, y profesional
- Usar vocabulario elevado y estructura de párrafos largos
- Mínimo 600 palabras de contenido sustancial

ESTRUCTURA OBLIGATORIA:
1. Encabezado personal (nombre, teléfono, email, dirección)
2. Perfil Profesional (párrafo de 4-5 líneas)
3. Experiencia Laboral (párrafos detallados por cada puesto)
4. Formación Académica (párrafos descriptivos)
5. Competencias Profesionales (párrafo integrado)
6. Idiomas (si aplica, en párrafo)

${hasUserInput ? `
INFORMACIÓN DEL USUARIO:
${resume}

INSTRUCCIONES:
- Expande significativamente cada sección proporcionada
- Si falta información, genera contenido coherente y profesional
- Mantén los datos personales reales del usuario
- Redacta en español neutro, formal y sofisticado
` : `
GENERAR CURRÍCULUM EJEMPLO:
Crea un currículum tradicional completo para un profesional administrativo genérico.
Usa nombres y datos ficticios pero realistas.
`}

FORMATO DE SALIDA:
- Solo HTML limpio con <div>, <p>, <strong>
- NO usar <html>, <body>, \`\`\`, ni markdown
- Contenido mínimo: 600 palabras
- Cada párrafo debe tener 3-4 líneas mínimo
`,

      'Moderno': `
Actúa como un redactor experto de currículums con 15 años de experiencia en empresas tecnológicas y startups.

FORMATO MODERNO - CARACTERÍSTICAS ESPECÍFICAS:
- Diseño limpio, profesional, contemporáneo
- Usar listas <ul><li> para organizar información
- Estructura clara con separación visual
- Tono profesional pero accesible
- Información de contacto en formato: Nombre | Ciudad | Teléfono | Email
- Mínimo 600 palabras de contenido sustancial

ESTRUCTURA OBLIGATORIA:
1. Encabezado: Nombre | Ciudad | Teléfono | Email
2. Perfil Profesional (párrafo de 3-4 líneas)
3. Experiencia Laboral (usar <ul><li> para cada puesto con detalles)
4. Educación (usar <ul><li> para cada título)
5. Habilidades Técnicas (usar <ul><li>)
6. Competencias Profesionales (usar <ul><li>)
7. Idiomas (usar <ul><li> si aplica)

${hasUserInput ? `
INFORMACIÓN DEL USUARIO:
${resume}

INSTRUCCIONES:
- Moderniza y expande cada sección proporcionada
- Usa listas para organizar información de manera clara
- Mantén los datos personales reales del usuario
- Agrega detalles específicos y cuantificables cuando sea posible
- Redacta en español neutro, profesional pero dinámico
` : `
GENERAR CURRÍCULUM EJEMPLO:
Crea un currículum moderno completo para un profesional de marketing digital.
Usa nombres y datos ficticios pero realistas.
`}

FORMATO DE SALIDA:
- Solo HTML limpio con <div>, <p>, <strong>, <ul>, <li>
- NO usar <html>, <body>, \`\`\`, ni markdown
- Contenido mínimo: 600 palabras
- Usar listas para organizar información eficientemente
`,

      'Creativo': `
Actúa como un redactor experto de currículums con 15 años de experiencia en industrias creativas y marketing.

FORMATO CREATIVO - CARACTERÍSTICAS ESPECÍFICAS:
- Diseño visual atractivo con elementos creativos
- Usar emojis estratégicamente en encabezados y contenido
- Tono profesional pero expresivo y humano
- Colores sutiles mediante styling inline
- Estructura dinámica y visualmente engaging
- Mínimo 600 palabras de contenido sustancial

ESTRUCTURA OBLIGATORIA:
1. 🎯 Encabezado: Nombre 📍 Ciudad ✉️ Email 📞 Teléfono
2. 📌 Perfil Profesional (párrafo con personalidad)
3. 💼 Experiencia Laboral (usar <ul><li> con emojis relevantes)
4. 🎓 Educación (usar <ul><li> con emojis)
5. 🚀 Habilidades Técnicas (usar <ul><li> con emojis)
6. 💡 Competencias Profesionales (usar <ul><li> con emojis)
7. 🗣️ Idiomas (usar <ul><li> si aplica)

EMOJIS SUGERIDOS:
- 💼 Experiencia laboral
- 🎓 Educación
- 🚀 Habilidades técnicas
- 💡 Competencias
- 🗣️ Idiomas
- 📈 Logros
- 🎯 Objetivos
- ⭐ Destacados

${hasUserInput ? `
INFORMACIÓN DEL USUARIO:
${resume}

INSTRUCCIONES:
- Transforma el contenido en un formato visualmente atractivo
- Usa emojis de manera profesional pero llamativa
- Mantén los datos personales reales del usuario
- Agrega personalidad y creatividad al lenguaje
- Redacta en español neutro, profesional pero con carácter
` : `
GENERAR CURRÍCULUM EJEMPLO:
Crea un currículum creativo completo para un diseñador gráfico.
Usa nombres y datos ficticios pero realistas.
`}

FORMATO DE SALIDA:
- Solo HTML limpio con <div>, <p>, <strong>, <ul>, <li>
- NO usar <html>, <body>, \`\`\`, ni markdown
- Contenido mínimo: 600 palabras
- Usar emojis estratégicamente para mejorar la presentación visual
- Puede incluir styling inline sutil (colores, etc.)
`
    };

    // Select the appropriate prompt based on format
    const selectedFormat = format || 'Tradicional';
    finalPrompt = formatPrompts[selectedFormat as keyof typeof formatPrompts] || formatPrompts['Tradicional'];
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
