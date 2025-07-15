import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const prompts = {
  Tradicional: `
Actúa como un redactor profesional de CV con más de 15 años de experiencia.

Tu tarea es generar un currículum en formato Tradicional para un usuario que ha proporcionado los siguientes datos:

{content}

Formato Tradicional:
- Tono formal y clásico (no creativo).
- Solo usa etiquetas HTML básicas como <p> y <strong>.
- No uses listas ni emojis.
- Cada sección debe ser larga y en formato de párrafo.
- Usa encabezados separados para cada sección como "Perfil Profesional", "Experiencia Laboral", "Educación", "Idiomas", "Competencias Profesionales".
- No inventes datos personales. Si el usuario no ha proporcionado nombre, email, etc., escribe un texto editable como: {Tu nombre aquí}, {Tu email aquí}.

Devuelve solo el HTML formateado y limpio. No añadas etiquetas <html> o markdown.
`,
  Moderno: `
Actúa como un redactor profesional de CV con más de 15 años de experiencia.

Tu tarea es generar un currículum en formato Moderno para un usuario que ha proporcionado los siguientes datos:

{content}

Formato Moderno:
- Tono neutro-profesional.
- Usa etiquetas HTML como <div>, <ul>, <li>, <strong> para organizar.
- Usa viñetas para listar habilidades, experiencia, educación.
- No uses emojis.
- Organiza el contenido en secciones claras con títulos.
- No inventes datos personales. Si el usuario no ha proporcionado nombre, email, etc., escribe un texto editable como: {Tu nombre aquí}, {Tu email aquí}.

Devuelve solo el HTML formateado y limpio. No añadas etiquetas <html> o markdown.
`,
  Creativo: `
Actúa como un redactor profesional de CV con más de 15 años de experiencia.

Tu tarea es generar un currículum en formato Creativo para un usuario que ha proporcionado los siguientes datos:

{content}

Formato Creativo:
- Tono expresivo pero profesional.
- Usa etiquetas HTML como <strong>, <ul>, <li>, <div>.
- Agrega emojis relevantes en los títulos y listas.
- Agrega personalidad al lenguaje.
- Ideal para marketing, diseño, startups.
- No inventes datos personales. Si el usuario no ha proporcionado nombre, email, etc., escribe un texto editable como: {Tu nombre aquí}, {Tu email aquí}.

Devuelve solo el HTML formateado y limpio. No añadas etiquetas <html> o markdown.
`,
};

export async function POST(req: Request) {
  const cookieStore = await nextCookies();

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value ?? undefined,
    getAll: () =>
      cookieStore.getAll().map(({ name, value }: { name: string; value: string }) => ({
        name,
        value,
      })),
    set: () => {},
    remove: () => {},
  } as const;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter }
  );

  const body = await req.json();
  const format = body.format as keyof typeof prompts;
  const selectedPrompt = prompts[format];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.85,
      messages: [
        {
          role: "user",
          content: selectedPrompt.replace("{content}", body.content || ""),
        },
      ],
    });

    const result = completion.choices[0].message.content;

    return NextResponse.json({ result });
  } catch (err) {
    console.error("❌ Error al llamar a OpenAI:", err);
    return NextResponse.json(
      { error: "Hubo un problema al generar el contenido." },
      { status: 500 }
    );
  }
}
