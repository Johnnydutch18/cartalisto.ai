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

  try {
    const body = await req.json();
    resume = body.prompt || "";
    jobType = body.jobType || "";
    format = body.format || "Tradicional";
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

  if (format === "Moderno") {
    userPrompt = `
Eres un generador de currículum moderno en HTML. Solo devuelves HTML limpio y estructurado. 
No expliques nada. No uses párrafos largos. Usa solo encabezados (<h1>, <h2>) y listas (<ul><li>). 
Tono profesional, conciso, y orientado a resultados.

Utiliza la siguiente información del usuario:

Nombre: ${name}
Teléfono: ${phone}
Email: ${email}
Dirección: ${address}
Idiomas: ${languages}
Habilidades: ${skills}
Experiencia Laboral: ${experience}
Educación: ${education}
Perfil Profesional: ${summary}

Devuelve el CV en este formato:

<h1>Currículum Vitae</h1>

<h2>Datos Personales</h2>
<p><strong>Nombre:</strong> ${name}<br>
<strong>Teléfono:</strong> ${phone}<br>
<strong>Email:</strong> ${email}<br>
<strong>Dirección:</strong> ${address}</p>

<h2>Perfil Profesional</h2>
<ul>
  [Resume el perfil del usuario en 3–4 puntos]
</ul>

<h2>Experiencia Laboral</h2>
<h3>[Puesto] – [Empresa] ([Fechas])</h3>
<ul>
  [3 logros o responsabilidades por experiencia]
</ul>

<h2>Educación</h2>
<ul>
  [Cada formación como una <li> con fechas y título]
</ul>

<h2>Habilidades</h2>
<ul>
  [Cada habilidad como una <li>]
</ul>

<h2>Idiomas</h2>
<ul>
  [Cada idioma del campo "${languages}" como una <li>]
</ul>

<h2>Referencias</h2>
<p>Disponibles a solicitud.</p>
`;
  } else {
    const formatStyleMap: Record<string, string> = {
      Tradicional: "Diseño clásico y sobrio con encabezados en negrita y texto bien estructurado.",
      Moderno: "Diseño profesional, limpio, con secciones bien definidas y separación clara mediante listas.",
      Creativo: "Diseño visualmente atractivo, uso de color sutil, estructura destacada y original.",
    };

    const toneStyleMap: Record<string, string> = {
      Tradicional: "Usa un tono formal, serio y profesional. Evita contracciones y lenguaje casual.",
      Moderno: "Usa un tono claro, moderno y directo. Evita frases largas o rebuscadas. Sé preciso y profesional.",
      Creativo: "Usa un tono dinámico, motivador y ligeramente informal. Está bien mostrar entusiasmo o aspiraciones.",
    };

    const visualStyle = formatStyleMap[format] || formatStyleMap.Tradicional;
    const tone = toneStyleMap[format] || toneStyleMap.Tradicional;

    userPrompt = `
🔧 Tarea:
Usa el siguiente texto para generar un Currículum Vitae completo, profesional y reescrito. Aunque el texto sea muy corto o poco claro, debes mejorarlo, expandirlo y completarlo de forma lógica.

🎯 Objetivo:
- No copies ni repitas el texto original.
- Corrige errores, mejora la redacción, y completa secciones faltantes como perfil, experiencia o habilidades.
- Adapta el contenido al estilo visual y tono especificados.

🎨 Estilo visual solicitado: ${format} (${visualStyle})
🗣️ Estilo de redacción: ${tone}
📂 Tipo de empleo: ${jobType || "No especificado"}

📋 Texto proporcionado por el usuario:
---
${resume}
---

📝 Idioma: Español
💡 Formato: Devuelve solo HTML limpio y editable usando etiquetas como <h2>, <p>, <ul>, <li>, <div>.
❌ No incluyas <html>, <head> ni <body>.
`.trim();

    if (format === "Creativo") {
      userPrompt += `
📌 Usa viñetas (<ul><li>) para habilidades y logros si ayuda a la presentación.
✨ Puedes incluir frases personales o creativas que hagan destacar el CV.
🎭 Está bien mostrar algo de personalidad o motivación (sin perder profesionalismo).
`.trim();
    }
  }

  const systemPrompt = `Eres un experto redactor de currículums con 15 años de experiencia en el mercado laboral español.`;

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.5,
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
    console.error("❌ Error generando CV:", err);
    return NextResponse.json({ result: "Error al generar el CV. Intenta más tarde." }, { status: 500 });
  }
}
