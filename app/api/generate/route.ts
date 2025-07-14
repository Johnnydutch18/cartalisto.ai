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
  let name = "";
  let phone = "";
  let email = "";
  let address = "";
  let summary = "";
  let experience = "";
  let education = "";
  let skills = "";
  let languages = "";
  let tone = "";

  try {
    const body = await req.json();
    resume = body.prompt || "";
    jobType = body.jobType || "";
    format = body.format || "Tradicional";
    tone = body.tone || "Formal";
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
    const toneInstructions: Record<string, string> = {
      Formal: `Tono: Formal. Usa lenguaje muy profesional, serio y cortés. No uses contracciones. Frases largas, lenguaje impersonal. Evita entusiasmo o informalidad.`,
      Neutral: `Tono: Neutral. Profesional y claro. Frases directas pero educadas. Sin exageración, sin informalidad.`,
      Casual: `Tono: Casual. Cercano, natural, algo coloquial. Puedes usar frases más cortas, mostrar entusiasmo y expresarte de forma relajada.`
    };

    userPrompt = `
Eres un generador experto de cartas de presentación en español. Tu tarea es redactar una carta desde cero, bien escrita, clara y orientada al puesto de Coordinadora de Proyectos. NO repitas el texto original del usuario.

Tu objetivo es producir un texto:
- Adaptado al tono solicitado.
- Que destaque habilidades reales.
- Que sea útil para enviar en una postulación laboral.
- En HTML limpio (sin etiquetas <html>, solo <p>, <br> o <div> si hace falta).

${toneInstructions[tone] || toneInstructions.Formal}

Detalles de la persona:
Nombre: ${name}
Puesto deseado: Coordinadora de Proyectos
Resumen/experiencia: ${resume}
`.trim();
  } else {
    // [Keep previous CV logic untouched for now.]
  }

  const systemPrompt = `Eres un experto redactor profesional de CVs y cartas de presentación con 15 años de experiencia en el mercado laboral español.`;

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.8,
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
    console.error("❌ Error generando salida:", err);
    return NextResponse.json({ result: "Error al generar contenido. Intenta más tarde." }, { status: 500 });
  }
}
