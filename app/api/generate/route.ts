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

  try {
    const body = await req.json();
    resume = body.prompt || "";
    jobType = body.jobType || "";
    format = body.format || "Tradicional";
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

  const formatStyleMap: Record<string, string> = {
    Tradicional: "Diseño clásico y sobrio con encabezados en negrita y texto bien estructurado.",
    Moderno: "Diseño profesional, limpio, con secciones bien definidas y separación clara.",
    Creativo: "Diseño visualmente atractivo, uso de color sutil, encabezados destacados.",
  };

  const visualStyle = formatStyleMap[format] || formatStyleMap.Tradicional;

  const systemPrompt = `Eres un experto redactor de currículums con 15 años de experiencia en el mercado laboral español.`;

  const userPrompt = `
🔧 Tarea:
Usa el texto del usuario para generar un currículum profesional completo, bien estructurado, en HTML limpio y editable (usa solo <div>, <h1>, <h2>, <ul>, <li>, <p>).

🎯 Objetivo:
- No copies ni reformules el texto original — mejóralo, expándelo, y escribe como un experto.
- Si hay partes faltantes (perfil, experiencia, habilidades), complétalas de forma lógica y realista.
- Si el texto es pobre, genera algo útil de todas formas.
- Adapta el diseño al estilo solicitado.

🗂️ Formato solicitado: ${format} (${visualStyle})
📂 Tipo de empleo: ${jobType || "No especificado"}

📋 Texto proporcionado por el usuario:
${resume}

📝 Idioma: Solo responde en español. No uses ningún texto en inglés.
🔒 No incluyas etiquetas <html>, <head> o <body>. Solo el contenido editable del currículum.
`;

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.5,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const result = chat.choices[0].message.content?.trim() ?? "";

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
    console.error("❌ Error generando CV:", err);
    return NextResponse.json({ result: "Error al generar el CV. Intenta más tarde." }, { status: 500 });
  }
}
