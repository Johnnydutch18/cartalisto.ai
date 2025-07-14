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

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return NextResponse.json({ result: "No estás autenticado." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, cvCount, letterCount, lastGeneratedAt, email")
    .eq("id", user.id)
    .single();

  let type: "cv" | "cover" = "cv";
  let resume = "";
  let jobType = "";
  let format = "Tradicional";
  let tone = "formal";
  let name = "";
  let phone = "";
  let email = "";
  let address = "";
  let summary = "";
  let experience = "";
  let education = "";
  let skills = "";
  let languages = "";

  try {
    const body = await req.json();
    resume = body.prompt || "";
    jobType = body.jobType || "";
    format = body.format || "Tradicional";
    tone = body.tone || "formal";
    name = body.name || "";
    phone = body.phone || "";
    email = body.email || "";
    address = body.address || "";
    summary = body.summary || "";
    experience = body.experience || "";
    education = body.education || "";
    skills = body.skills || "";
    languages = body.languages || "";

    const rawType = (body.type || "").toLowerCase().trim();
    if (rawType.includes("letter") || rawType === "cover") {
      type = "cover";
    }
  } catch {
    return NextResponse.json({ result: "Error al procesar tu solicitud." }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];
  const isSameDay = profile?.lastGeneratedAt?.split("T")[0] === today;
  const cvCount = isSameDay ? profile.cvCount ?? 0 : 0;
  const letterCount = isSameDay ? profile.letterCount ?? 0 : 0;
  const plan = profile?.plan ?? "free";

  if (plan === "free" && cvCount + letterCount >= 1) {
    return NextResponse.json(
      { result: "⚠️ Has alcanzado tu límite diario. Mejora tu plan para más usos." },
      { status: 429 }
    );
  }

  let userPrompt = "";

  if (type === "cover") {
    const coverLetterToneMap: Record<string, string> = {
      formal: `Eres un experto redactor de cartas de presentación en español para el mercado laboral. Escribe una carta de presentación formal y profesional, con un tono serio y respetuoso. Usa frases largas y elegantes. No uses encabezados ni listas, solo texto estructurado. La carta debe dirigirse a "Estimados miembros del equipo de selección" y terminar con "Atentamente, [Nombre]". Usa el siguiente contenido como base, pero mejóralo completamente:

Nombre: ${name}
Puesto: ${jobType}
Resumen: ${summary}
Experiencia: ${experience}

Redacta la carta con fluidez, sin repetir información innecesaria.`,

      neutral: `Eres un redactor profesional de cartas de presentación en español. Escribe una carta de presentación neutra, clara y profesional. Usa un lenguaje directo, sin adornos excesivos ni demasiada informalidad. La carta debe ir dirigida a "Estimados/as" o "Estimado equipo de selección" y terminar con "Atentamente, [Nombre]". Evita frases demasiado largas o rebuscadas. Basado en estos datos:

Nombre: ${name}
Puesto: ${jobType}
Resumen: ${summary}
Experiencia: ${experience}

Reescribe con buena estructura y estilo claro.`,

      casual: `Actúa como un redactor creativo de cartas de presentación. Escribe una carta con un tono cercano, accesible y algo informal (pero aún profesional). Usa frases más cortas, lenguaje más natural, y permite mostrar un poco de personalidad o entusiasmo. Comienza con "Hola equipo" o similar, y termina con "Saludos" o "Gracias por su tiempo". Basado en esta información:

Nombre: ${name}
Puesto: ${jobType}
Resumen: ${summary}
Experiencia: ${experience}

Haz que la carta suene auténtica, diferente y humana.`,
    };

    userPrompt = coverLetterToneMap[tone] || coverLetterToneMap.formal;
  } else {
    // CV generation prompt (existing logic)
    userPrompt = `Genera un currículum en HTML limpio usando estos datos:
Nombre: ${name}
Teléfono: ${phone}
Email: ${email}
Dirección: ${address}
Resumen: ${summary}
Experiencia: ${experience}
Educación: ${education}
Habilidades: ${skills}
Idiomas: ${languages}
Formato: ${format}
Idioma: Español

Devuelve solo HTML estructurado con <h2>, <ul>, <li>. No uses <html> ni <body>. Mejora el contenido si es débil.`;
  }

  const systemPrompt = type === "cover"
    ? "Eres un experto redactor de cartas de presentación laborales en español."
    : "Eres un experto redactor de currículums con 15 años de experiencia en el mercado laboral español.";

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    let result = chat.choices[0].message.content?.trim() ?? "";
    result = result.replace(/```html|```/g, "").trim();

    await supabase.from("generations").insert([
      { user_id: user.id, type, output: result },
    ]);

    const updates: any = { lastGeneratedAt: new Date().toISOString() };
    if (type === "cv") {
      updates.cvCount = isSameDay ? cvCount + 1 : 1;
      updates.letterCount = isSameDay ? letterCount : 0;
    } else {
      updates.letterCount = isSameDay ? letterCount + 1 : 1;
      updates.cvCount = isSameDay ? cvCount : 0;
    }
    if (!profile?.email && user.email) updates.email = user.email;

    await supabase.from("profiles").update(updates).eq("id", user.id);

    return NextResponse.json({ result });
  } catch (err: any) {
    console.error("❌ Error generando contenido:", err);
    return NextResponse.json({ result: "Error al generar contenido. Intenta más tarde." }, { status: 500 });
  }
}
