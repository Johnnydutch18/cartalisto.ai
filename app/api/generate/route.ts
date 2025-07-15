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
Actúa como un redactor profesional con 15+ años de experiencia en recursos humanos para sectores conservadores en España.

🔵 FORMATO TRADICIONAL:
- Tono formal, serio, y profesional.
- Estructura clásica con secciones en <strong> y contenido en <p>.
- SOLO usa <p> y <strong>. NO uses listas, emojis, colores ni íconos.
- El lenguaje debe ser elegante, con párrafos completos y detallados.
- Mínimo 600 palabras.

🔧 ESTRUCTURA:
1. Encabezado Personal: nombre completo, teléfono, email, dirección.
2. Perfil Profesional: 1 párrafo largo y bien escrito.
3. Experiencia Laboral: 1 párrafo completo por empleo.
4. Educación: 1 párrafo por grado o formación.
5. Competencias Profesionales: párrafo fluido.
6. Idiomas (si aplica): en párrafo formal.

${hasUserInput ? `
📎 DATOS DEL USUARIO:
${resume}

✍️ INSTRUCCIONES:
- Usa toda la información del usuario.
- Si falta alguna sección, agrega ejemplos coherentes en español formal y profesional.
- Mantén siempre el nombre y datos personales reales del usuario si fueron dados.
- No escribas etiquetas como "Nombre:" o "Teléfono:" — solo el contenido.
` : `
📄 GENERAR CURRÍCULUM DE EJEMPLO:
Currículum tradicional para una asistente administrativa en una empresa pública.
Nombre ficticio realista: Laura Morales Ruiz.
`}
📦 FORMATO DE SALIDA:
- Solo HTML limpio con <p> y <strong>.
- Sin listas, emojis, \`\`\`, <html>, o markdown.
- Redacción elegante y clara, en español neutro.
`,


      'Moderno': `
Eres un experto en redacción de CVs modernos para empresas tecnológicas, consultoras y startups.

🔵 FORMATO MODERNO:
- Tono profesional pero accesible.
- Usa <ul><li> para secciones como experiencia, habilidades, idiomas.
- Encabezado limpio con nombre completo, ciudad, teléfono, email.
- Diseño claro y escaneable.
- Mínimo 600 palabras.

🔧 ESTRUCTURA:
1. Encabezado: Nombre completo | Ciudad | Teléfono | Email
2. Perfil Profesional: 3–4 líneas como párrafo.
3. Experiencia Laboral: <ul><li> con fechas, rol y logros claros.
4. Educación: <ul><li> por título obtenido.
5. Habilidades Técnicas: <ul><li>
6. Competencias Profesionales: <ul><li>
7. Idiomas (si aplica): <ul><li>

${hasUserInput ? `
📎 DATOS DEL USUARIO:
${resume}

✍️ INSTRUCCIONES:
- Convierte la información del usuario en un CV moderno, bien estructurado.
- Si falta información, incluye ejemplos relevantes que el usuario pueda editar.
- No repitas el nombre como "Nombre:" — solo el dato limpio.
- Escribe en español neutro, profesional y claro.
` : `
📄 GENERAR CURRÍCULUM DE EJEMPLO:
Currículum moderno para un gerente de proyectos digitales en una empresa de software.
Nombre ficticio realista: Andrés Torres Díaz.
`}
📦 FORMATO DE SALIDA:
- Solo HTML limpio con <div>, <strong>, <ul>, <li>, <p>.
- Sin emojis ni markdown. No uses <html> ni \`\`\`.
- Asegura claridad visual y separación entre secciones.
`,


  'Creativo': `
Actúa como redactor creativo de currículums para industrias como diseño, medios, publicidad y startups.

🟡 FORMATO CREATIVO:
- Tono profesional pero expresivo y humano.
- Usa emojis en títulos y puntos clave (🎯, 💼, 🚀, 🗣️, etc.).
- Usa listas <ul><li> con texto llamativo y concreto.
- Agrega personalidad en el lenguaje.
- Mínimo 600 palabras.

🔧 ESTRUCTURA:
1. 🎯 Encabezado: Nombre ✉️ Email 📍 Ciudad 📞 Teléfono
2. 📌 Perfil Profesional: párrafo corto con voz propia.
3. 💼 Experiencia Laboral: <ul><li> con emojis y resultados visibles.
4. 🎓 Educación: <ul><li> con logros clave.
5. 🚀 Habilidades Técnicas: <ul><li>
6. 💡 Competencias Profesionales: <ul><li>
7. 🗣️ Idiomas: <ul><li>

${hasUserInput ? `
📎 DATOS DEL USUARIO:
${resume}

✍️ INSTRUCCIONES:
- Convierte la información en un currículum creativo, visualmente atractivo.
- Usa emojis estratégicamente en títulos y listas.
- El texto debe sonar humano, con energía, sin perder profesionalismo.
- No uses etiquetas como "Nombre:" — solo el valor real.
- Redacta en español claro y expresivo.
` : `
📄 GENERAR CURRÍCULUM DE EJEMPLO:
Diseñadora gráfica para una startup de tecnología creativa.
Nombre ficticio realista: Clara Vidal Sánchez.
`}
📦 FORMATO DE SALIDA:
- Solo HTML limpio. Usa <p>, <strong>, <ul>, <li>.
- NO uses <html>, markdown, ni bloques de código.
- Usa emojis pero no abuses — deben complementar.
`,

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
