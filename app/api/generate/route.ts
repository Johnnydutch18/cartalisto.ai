import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  console.log("✅ /api/generate route hit");

  const cookieStore = await nextCookies();

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value ?? undefined,
    getAll: () =>
      cookieStore.getAll().map(({ name, value }: any) => ({ name, value })),
    set: () => {},
    remove: () => {},
  } as const;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieAdapter,
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { resume, format, type, tone, letter } = body;

  let finalPrompt = "";

  if (type === "cv") {
    const hasUserInput = resume && resume.trim().length > 20;

    const safeResume = hasUserInput
      ? resume
      : "Nombre: {Tu nombre aquí}\nTeléfono: {Tu teléfono aquí}\nEmail: {Tu email aquí}\nDirección: {Tu dirección}\n\nPerfil Profesional: {Breve descripción}\nExperiencia Laboral: {Puestos anteriores}\nEducación: {Tu formación}\nHabilidades: {Habilidades principales}";

    const formatPrompts: Record<string, string> = {
      Tradicional: `
Actúa como un redactor experto de currículums con 15 años de experiencia en recursos humanos españoles.

FORMATO TRADICIONAL:
- Diseño clásico y formal
- Solo usar párrafos (<p>) con títulos en <strong>
- Prohibido: listas, emojis, tablas
- Tono sobrio y profesional
- Mínimo 600 palabras

INSTRUCCIONES:
- Usa el siguiente contenido del usuario
- Completa cualquier sección faltante con texto profesional
- NO uses datos falsos si ya están proporcionados

Contenido:
${safeResume}

Formato de salida:
- Solo HTML válido (<div>, <p>, <strong>)
- No usar <html>, markdown ni backticks
- Si falta un dato personal, usa {Tu nombre aquí}, etc.
`,

      Moderno: `
Actúa como un redactor experto en currículums modernos para startups y empresas tecnológicas.

FORMATO MODERNO:
- Diseño limpio y organizado
- Usar <ul><li> para experiencia, educación, habilidades
- Tono profesional pero accesible
- Mínimo 600 palabras

INSTRUCCIONES:
- Usa el contenido del usuario y expande con claridad
- Usa listas estructuradas para secciones técnicas

Contenido:
${safeResume}

Formato de salida:
- Solo HTML válido (<div>, <p>, <strong>, <ul>, <li>)
- No usar <html>, markdown ni backticks
- Si falta un dato personal, usa {Tu nombre aquí}, etc.
`,

      Creativo: `
Actúa como un redactor creativo de CV para diseño y marketing.

FORMATO CREATIVO:
- Visualmente llamativo, usa emojis con moderación
- Usa listas con encabezados expresivos
- Estilo profesional pero con carácter humano
- Mínimo 600 palabras

INSTRUCCIONES:
- Transforma el contenido del usuario en un CV creativo
- Usa emojis apropiados para secciones (🎯, 💼, 🧠...)

Contenido:
${safeResume}

Formato de salida:
- Solo HTML válido (<div>, <p>, <ul>, <li>, <strong>)
- No usar <html>, markdown ni backticks
- Si falta un dato personal, usa {Tu nombre aquí}, etc.
`
    };

    const selectedPrompt = formatPrompts[format as keyof typeof formatPrompts] || formatPrompts.Tradicional;
    finalPrompt = selectedPrompt;
  }

  if (type === "coverLetter") {
    const safeLetter = letter || "Especifica tu experiencia, puesto deseado y logros principales.";

    finalPrompt = `
Actúa como un redactor profesional de cartas de presentación.

Instrucciones:
- Tono: ${tone || "formal"}
- Redacta una carta profesional y personalizada
- Si no hay información clara, usa contenido ficticio pero realista
- Siempre incluye una despedida apropiada (ej. Un cordial saludo)

Contenido del usuario:
${safeLetter}

Formato de salida:
- Solo HTML válido (<div>, <p>, <strong>)
- No usar markdown, backticks, ni etiquetas <html>
`;
  }

  if (!finalPrompt) {
    return NextResponse.json({ error: "Tipo de generación inválido." }, { status: 400 });
  }

  try {
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: finalPrompt }],
    });

    const aiOutput = chatResponse.choices[0].message.content;

    return NextResponse.json({ output: aiOutput });
  } catch (err) {
    console.error("❌ Error generating content:", err);
    return NextResponse.json({ error: "Error al generar el contenido." }, { status: 500 });
  }
}
