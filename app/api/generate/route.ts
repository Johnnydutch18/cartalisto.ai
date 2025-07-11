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

  try {
    const body = await req.json();
    prompt = body.prompt;
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

  // ✅ Define visual and tonal style for each format
  const formatStyleMap: Record<string, string> = {
    Tradicional: `
      Usa un tono profesional y serio, como si el CV fuera para un trabajo administrativo o corporativo. 
      Utiliza HTML limpio con títulos destacados, párrafos bien espaciados y listas con viñetas. 
      Usa fuentes como Georgia o Times New Roman. 
      Añade margen interno y estructura clásica. 
      Secciones deben incluir Perfil Profesional, Experiencia, Formación, Habilidades e Idiomas. 
      Si falta algo, infiere contenido útil y realista.
    `,
    Moderno: `
      Usa un tono claro y directo. 
      Estructura el CV con columnas visuales limpias si es posible, títulos claros y buena separación entre secciones. 
      Utiliza fuentes sans-serif, un diseño limpio y ordenado. 
      Mantén el HTML limpio y responsive. 
      Agrega secciones faltantes si no están presentes (Perfil, Habilidades, etc).
    `,
    Creativo: `
      Usa un tono amigable y profesional, como si el CV fuera para una startup, agencia creativa o empresa internacional.
      Juega con el color de títulos, tipografías modernas y destaca los logros o talentos. 
      Usa encabezados llamativos, bloques de color suaves y estilos ligeros sin exagerar. 
      Infiere contenido que destaque la personalidad del candidato.
    `,
  };

  const tonePrompt = formatStyleMap[format] || formatStyleMap["Tradicional"];

  const systemPrompt =
    type === "cover"
      ? `Eres un experto en redacción laboral. Genera una carta de presentación en HTML editable, con tono profesional. Usa solo <div>, <h1-3>, <p>, <ul>, <li>. No uses etiquetas HTML innecesarias.`
      : `Eres un experto en redacción de CVs con 15 años de experiencia. Genera un currículum en HTML editable que luzca profesional, bien estructurado, y adaptado al formato "${format}". Usa solo HTML limpio (<div>, <h1-3>, <p>, <ul>, <li>) y estilos inline básicos. No uses <html>, <head>, ni <style>. Asegúrate de que el contenido sea realista, completo y bien redactado incluso si el input del usuario es limitado. Usa este estilo: ${tonePrompt}`;

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
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

    return NextResponse.json({ result });
  } catch (err: any) {
    console.error("❌ OpenAI error:", err);
    return NextResponse.json(
      { result: "Error al generar. Intenta más tarde." },
      { status: 500 }
    );
  }
}
