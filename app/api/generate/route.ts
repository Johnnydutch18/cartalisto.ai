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
  let prompt: string;
  let format = "Tradicional";
  let jobType = "";
  let resume = "";

  try {
    const body = await req.json();
    prompt = body.prompt;
    resume = body.resume || "";
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
  const isFree = plan === "free";

  if (isFree && cvCount + letterCount >= 1) {
    return NextResponse.json(
      { result: "⚠️ Has alcanzado tu límite diario. Mejora tu plan para más usos." },
      { status: 429 }
    );
  }

  const formatStyles: Record<string, string> = {
    Tradicional: "Un diseño clásico y formal, con encabezados sobrios, sin colores llamativos, ideal para sectores conservadores como administración o derecho.",
    Moderno: "Un diseño limpio con buena jerarquía visual, tipografía profesional y estructura clara. Ideal para trabajos de oficina, marketing, tecnología o atención al cliente.",
    Creativo: "Un diseño atractivo y llamativo, con colores sutiles, íconos y secciones diferenciadas. Adecuado para industrias creativas como diseño gráfico, moda o medios.",
  };

  const visualStyle = formatStyles[format] || formatStyles["Tradicional"];

  const systemPrompt =
    type === "cover"
      ? "Eres un experto en cartas de presentación. Genera solo una carta en HTML limpio, usando <div>, <h1>, <h2>, <p>, <ul>, <li>. No uses <html>, <head>, ni <style>."
      : "Eres un experto redactor de currículums con 15 años de experiencia en el mercado laboral español. Transforma entradas básicas en un currículum completo en HTML limpio. Usa solo <div>, <h1-3>, <p>, <ul>, <li>. Nada más.";

  const userPrompt = `
🧠 Tu objetivo es generar un currículum profesional completo en español, listo para editar y exportar en PDF.

✅ Instrucciones:
- No repitas literalmente lo que escribió el usuario. Reescribe con tono profesional y humano.
- Detecta el idioma de entrada y responde en español.
- Auto-completa cualquier sección faltante con contenido lógico y relevante.
- Usa buena jerarquía visual: títulos claros, secciones separadas, saltos de línea, viñetas si es necesario.
- Solo genera contenido HTML válido y simple: <div>, <h1-3>, <p>, <ul>, <li>. Nada más.
- Estilo visual solicitado: ${visualStyle}

📂 Tipo de empleo objetivo: ${jobType || "No especificado"}
📋 Información proporcionada por el usuario:
${resume}
`;

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
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

    return NextResponse.json({ result, usage: { cvCount: updates.cvCount, letterCount: updates.letterCount, limit: isFree ? 1 : 999 } });
  } catch (err: any) {
    console.error("❌ OpenAI error:", err);
    return NextResponse.json(
      { result: "Error al generar. Intenta más tarde." },
      { status: 500 }
    );
  }
}
