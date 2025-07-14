import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  console.log("✅ /api/generate route hit");

  const cookieStore = await cookies();

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value ?? undefined,
    getAll: () =>
      cookieStore.getAll().map(
        (cookie: { name: string; value: string }) => ({
          name: cookie.name,
          value: cookie.value,
        })
      ),
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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    tone,
  } = body;

  const toneInstructionsMap: Record<string, string> = {
    formal: `
Usa un tono formal y profesional. Dirígete al lector con cortesía ("Estimado/a", "Atentamente") y evita lenguaje coloquial. Usa frases largas, estructura académica, y voz pasiva si es natural. Ejemplo de cierre: "Agradezco su atención y quedo a su disposición para una entrevista."
`,
    neutral: `
Usa un tono claro, directo y educado. Evita excesiva formalidad, pero mantén respeto. Frases equilibradas, sin demasiada rigidez ni expresiones coloquiales. Ejemplo de cierre: "Gracias por su tiempo. Quedo atento/a a su respuesta."
`,
    casual: `
Usa un tono cercano, conversacional y accesible. Puedes usar frases como “Estoy muy entusiasmado/a con…” o “Me encantaría formar parte de…”. Usa construcciones más cortas, activas, y lenguaje positivo. Cierre ejemplo: "Gracias por leerme. Espero tener la oportunidad de hablar pronto."
`,
  };

  const toneInstruction = toneInstructionsMap[tone] || toneInstructionsMap.neutral;

  let userPrompt = "";

  if (type === "cover") {
    userPrompt = `
Redacta una carta de presentación profesional en HTML sin encabezados. Debe tener un solo cuerpo, con párrafos separados por <br><br> y sin títulos como "Perfil Profesional", etc.

Nombre del candidato: ${name}
Puesto deseado: ${jobType || "No especificado"}

🔹 Instrucciones de tono:
${toneInstruction.trim()}

📝 Contenido:
Usa los siguientes datos para redactar una carta personalizada. Incluye el nombre del candidato en el saludo de cierre.
---
Resumen profesional: ${summary}
Experiencia: ${experience}
Educación: ${education}
Habilidades: ${skills}
Idiomas: ${languages}
---

Devuelve solo el texto en formato HTML limpio. No incluyas "<html>" ni "<body>".
`.trim();
  } else if (type === "cv") {
    userPrompt = `
Redacta un currículum vítae completo en HTML, separado por secciones como: Perfil Profesional, Experiencia, Educación, Habilidades e Idiomas. Usa etiquetas <h2> para los encabezados de sección y <ul><li> para listas. El resultado debe estar en español y enfocado en mostrar profesionalismo, claridad y buena estructura.

Nombre del candidato: ${name}
Puesto deseado: ${jobType || "No especificado"}

Resumen profesional: ${summary}
Experiencia: ${experience}
Educación: ${education}
Habilidades: ${skills}
Idiomas: ${languages}

Devuelve solo el texto en HTML limpio, sin etiquetas <html> ni <body>.
`.trim();
  } else {
    return NextResponse.json({ error: "Tipo de documento no válido" }, { status: 400 });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Eres un asistente que redacta documentos profesionales en español (CVs o cartas de presentación).",
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.85,
  });

  const result = completion.choices[0].message.content;
  return NextResponse.json({ result });
}
