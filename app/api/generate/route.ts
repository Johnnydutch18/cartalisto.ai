import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const prompts = {
  Tradicional: `Actúa como un redactor profesional de currículums con más de 15 años de experiencia.
Genera una versión de CV con el siguiente formato y tono:

Tradicional — Tono formal y clásico. Sin emojis, íconos ni elementos visuales. Usa solo etiquetas <p> y <strong> para la estructura. Escribe en párrafos largos con secciones claramente separadas. Ideal para trabajos tradicionales o en el sector público.

No inventes datos personales. Si faltan datos como nombre, dirección o teléfono, usa marcadores como {Tu nombre}, {Tu dirección}, etc.

No uses etiquetas <html>, <body> ni bloques de markdown.
Devuelve solo HTML limpio.
El contenido debe tener al menos 500 palabras.
Asegúrate de que cada sección esté bien desarrollada.

Información del usuario:
`,
  Moderno: `Actúa como un redactor profesional de currículums con más de 15 años de experiencia.
Genera una versión de CV con el siguiente formato y tono:

Moderno — Tono claro y profesional. Usa etiquetas HTML estructuradas: <div>, <strong>, <ul>, <li>. Organiza en secciones lógicas con viñetas para experiencia, habilidades y educación. Sin emojis. Ideal para trabajos en negocios, tecnología o servicios.

No inventes datos personales. Si faltan datos como nombre, dirección o teléfono, usa marcadores como {Tu nombre}, {Tu dirección}, etc.

No uses etiquetas <html>, <body> ni bloques de markdown.
Devuelve solo HTML limpio.
El contenido debe tener al menos 500 palabras.
Asegúrate de que cada sección esté bien desarrollada.

Información del usuario:
`,
  Creativo: `Actúa como un redactor profesional de currículums con más de 15 años de experiencia.
Genera una versión de CV con el siguiente formato y tono:

Creativo — Tono expresivo pero profesional. Añade emojis en títulos de secciones y elementos de lista cuando sea adecuado. Usa encabezados en negrita (<strong>), listas y un diseño visualmente llamativo. Incluye personalidad y energía en el lenguaje. Ideal para industrias creativas, startups o marketing.

No inventes datos personales. Si faltan datos como nombre, dirección o teléfono, usa marcadores como {Tu nombre}, {Tu dirección}, etc.

No uses etiquetas <html>, <body> ni bloques de markdown.
Devuelve solo HTML limpio.
El contenido debe tener al menos 500 palabras.
Asegúrate de que cada sección esté bien desarrollada.

Información del usuario:
`
};

export async function POST(req: Request) {
  console.log("✅ /api/generate route hit");

  const cookieStore = await nextCookies();

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value ?? undefined,
    getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
    set: () => {},
    remove: () => {},
  } as const;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter }
  );

  const body = await req.json();
  const { content } = body;
const format = body.format as keyof typeof prompts;


  if (!format || !prompts[format]) {
    return NextResponse.json({ error: "Formato no válido" }, { status: 400 });
  }

  const finalPrompt = `${prompts[format]}\n${content}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Eres un redactor profesional de currículums en español.",
        },
        {
          role: "user",
          content: finalPrompt,
        }
      ],
      temperature: 0.7,
    });

    const result = completion.choices[0].message.content;

    return NextResponse.json({ result });
  } catch (error) {
    console.error("❌ Error al generar el contenido:", error);
    return NextResponse.json({ error: "Error al generar contenido" }, { status: 500 });
  }
}
