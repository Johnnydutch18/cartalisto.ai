import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  console.log("✅ /api/generate route hit");

  // Supabase setup
  const cookieStore = await cookies();
  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value ?? undefined,
    getAll: () => cookieStore.getAll().map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
    })),
    set: () => {},
    remove: () => {},
  } as const;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter }
  );

  // Authentication check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request body
  const body = await req.json();
  const {
    type,
    name,
    jobType,
    summary,
    experience,
    education,
    skills,
    languages,
    tone = "neutral",
  } = body;

  // Enhanced tone instructions
  const toneInstructions = {
    formal: {
      greeting: "Estimado/a",
      closing: "Atentamente",
      style: "Lenguaje formal sin contracciones, estructura clásica",
      phrases: [
        "Me complace presentar mi candidatura",
        "En relación con la oferta publicada",
        "Quedo a su disposición para ampliar cualquier aspecto"
      ]
    },
    neutral: {
      greeting: "Estimado/a",
      closing: "Saludos cordiales",
      style: "Profesional pero accesible, algunas contracciones permitidas",
      phrases: [
        "Me dirijo a ustedes para expresar mi interés",
        "En respuesta a su anuncio",
        "Estoy disponible para una entrevista"
      ]
    },
    casual: {
      greeting: "Hola",
      closing: "Un saludo",
      style: "Coloquial pero profesional, tono cercano",
      phrases: [
        "Me encantaría unirme a su equipo como",
        "Acabo de ver su oferta y me parece ideal",
        "Estoy emocionado/a por esta oportunidad"
      ]
    }
  };

  const selectedTone = toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.neutral;

  // System prompt for consistent behavior
  const systemPrompt = `
Eres un experto en recursos humanos especializado en redacción de documentos profesionales en español.
Reglas estrictas:
1. Genera ${type === "cover" ? "SOLO cartas de presentación" : "SOLO CVs"} según lo solicitado
2. ${type === "cover" ? "Usa EXCLUSIVAMENTE etiquetas <p> para la carta" : "Usa <h2> para secciones y <ul><li> para listas en el CV"}
3. Idioma: Español (neutro internacional)
4. Excluir: Información inventada no proporcionada por el usuario
`.trim();

  let userPrompt = "";
  let temperature = 0.7;

  if (type === "cover") {
    userPrompt = `
Por favor genera una carta de presentación profesional en español con estos detalles:

Candidato: ${name || "[Nombre]"}
Puesto solicitado: ${jobType || "[Puesto]"}
Resumen profesional: ${summary || "[Resumen]"}
Experiencia relevante: ${experience || "[Experiencia]"}
Formación académica: ${education || "[Educación]"}
Habilidades clave: ${skills || "[Habilidades]"}
Idiomas: ${languages || "[Idiomas]"}

Instrucciones específicas:
- Saludo: ${selectedTone.greeting} [Nombre del reclutador o "equipo de selección"]
- Tono: ${selectedTone.style}
- Frases de ejemplo: ${selectedTone.phrases.join(" | ")}
- Cierre: ${selectedTone.closing}, ${name || "[Nombre]"}
- Estructura: Saludo → Introducción → Cuerpo (1-2 párrafos) → Cierre
- Formato HTML: SOLO etiquetas <p> separadas por <br><br>
- Longitud: 3-4 párrafos bien desarrollados
`.trim();
    temperature = 0.75; // Slightly higher for creative variation
  } else if (type === "cv") {
    userPrompt = `
Genera un currículum vítae completo en HTML con estas secciones:

Nombre: ${name}
Objetivo profesional: ${summary}
Experiencia laboral: ${experience}
Educación: ${education}
Habilidades: ${skills}
Idiomas: ${languages}

Instrucciones:
- Usa <h2> para encabezados de sección
- Usa <ul><li> para listas
- Mantén un tono profesional
- No inventes información no proporcionada
`.trim();
    temperature = 0.5; // More factual for CVs
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
    });

    let result = completion.choices[0].message.content?.trim() || "";

    // Post-processing
    if (type === "cover") {
      result = result
        .replace(/```html?|```/g, "")
        .replace(/<(?!\/?p\b)[^>]+>/g, "") // Remove all non-p tags
        .replace(/\n{3,}/g, "\n\n"); // Normalize line breaks
    }

    // Save to database (optional)
    await supabase.from("generations").insert([
      { 
        user_id: session.user.id, 
        type,
        output: result,
        metadata: { tone, jobType }
      }
    ]);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("❌ Error generating document:", error);
    return NextResponse.json(
      { error: "Error al generar el documento. Intente nuevamente." },
      { status: 500 }
    );
  }
}