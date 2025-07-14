import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
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

  // Authentication check
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) {
    return NextResponse.json({ result: "No estás autenticado." }, { status: 401 });
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, cvCount, letterCount, lastGeneratedAt, email")
    .eq("id", user.id)
    .single();

  // Parse request body
  let name = "";
  let jobTitle = "";
  let experience = "";
  let tone: "formal" | "neutral" | "casual" = "neutral";
  let company = "";
  let additionalInfo = "";

  try {
    const body = await req.json();
    name = body.name || "";
    jobTitle = body.jobTitle || "";
    experience = body.experience || "";
    tone = body.tone || "neutral";
    company = body.company || "";
    additionalInfo = body.additionalInfo || "";
  } catch {
    return NextResponse.json({ result: "Error al procesar tu solicitud." }, { status: 400 });
  }

  // Rate limiting
  const today = new Date().toISOString().split("T")[0];
  const isSameDay = profile?.lastGeneratedAt?.split("T")[0] === today;
  const letterCount = isSameDay ? profile.letterCount ?? 0 : 0;
  const plan = profile?.plan ?? "free";

  if (plan === "free" && letterCount >= 1) {
    return NextResponse.json(
      { result: "⚠️ Has alcanzado tu límite diario. Mejora tu plan para más usos." },
      { status: 429 }
    );
  }

  // Tone-specific instructions
  const toneInstructions = {
    formal: {
      greeting: "Estimado/a",
      closing: "Atentamente",
      style: "Lenguaje formal, sin contracciones, estructura clásica",
      examples: [
        "Me complace presentar mi candidatura",
        "En relación con la oferta publicada",
        "Quedo a su disposición para ampliar"
      ]
    },
    neutral: {
      greeting: "Estimado/a",
      closing: "Saludos cordiales",
      style: "Profesional pero accesible, puede usar algunas contracciones",
      examples: [
        "Me dirijo a ustedes para expresar mi interés",
        "En respuesta a su anuncio",
        "Estoy disponible para una entrevista"
      ]
    },
    casual: {
      greeting: "Hola",
      closing: "Un saludo",
      style: "Coloquial pero profesional, tono cercano",
      examples: [
        "Me encantaría unirme a su equipo como",
        "Acabo de ver su oferta y me parece ideal",
        "Estoy emocionado por esta oportunidad"
      ]
    }
  };

  // System prompt for consistent behavior
  const systemPrompt = `
Eres un experto en recursos humanos especializado en redacción de cartas de presentación en español.
Reglas estrictas:
1. SOLO genera cartas de presentación (nunca CVs)
2. Usa EXCLUSIVAMENTE etiquetas <p>
3. Estructura: Saludo → Introducción → Cuerpo → Cierre → Firma
4. Longitud: 3-4 párrafos bien desarrollados
5. Excluir: Listas, encabezados, datos de contacto, historial laboral detallado
6. Tono: ${toneInstructions[tone].style}
`.trim();

  // User prompt with context
  const userPrompt = `
Por favor genera una carta de presentación en español con estos detalles:

Candidato: ${name || "[Nombre]"}
Puesto solicitado: ${jobTitle || "[Puesto]"}
Empresa: ${company || "[Empresa]"}
Experiencia relevante: ${experience || "[Experiencia]"}
Información adicional: ${additionalInfo || "[Ninguna]"}

Instrucciones específicas:
- Saludo: ${toneInstructions[tone].greeting} [Nombre del reclutador o "equipo de selección"]
- Tono: ${tone} (${toneInstructions[tone].style})
- Ejemplos de frases adecuadas: ${toneInstructions[tone].examples.join(" | ")}
- Cierre: ${toneInstructions[tone].closing}, ${name || "[Nombre]"}
- Formato HTML: SOLO etiquetas <p> sin clases ni estilos
`.trim();

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7, // Slightly higher for creativity
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    let result = chat.choices[0].message.content?.trim() ?? "";
    
    // Clean output
    result = result
      .replace(/```html|```/g, "")
      .replace(/<(?!p\b)[^>]*>/g, "") // Remove all tags except <p>
      .replace(/\n{3,}/g, "\n\n") // Normalize line breaks
      .trim();

    // Save generation
    await supabase.from("generations").insert([
      { user_id: user.id, type: "cover", output: result },
    ]);

// Update profile stats
const updates: {
  lastGeneratedAt: string;
  letterCount: number;
  cvCount: number;
  email?: string;
} = { 
  lastGeneratedAt: new Date().toISOString(),
  letterCount: isSameDay ? letterCount + 1 : 1,
  cvCount: isSameDay ? profile?.cvCount ?? 0 : 0
};

if (!profile?.email && user.email) {
  updates.email = user.email;
}

await supabase.from("profiles").update(updates).eq("id", user.id);

    return NextResponse.json({ result });
  } catch (err: any) {
    console.error("❌ Error generando carta:", err);
    return NextResponse.json(
      { result: "Error al generar la carta. Intenta más tarde." }, 
      { status: 500 }
    );
  }
}