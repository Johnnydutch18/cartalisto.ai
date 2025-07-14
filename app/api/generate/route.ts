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

  const systemPrompt = `Eres un experto redactor de currículums con 15 años de experiencia en el mercado laboral español.`;

  let userPrompt = `
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

if (format === "Moderno") {
  userPrompt += `
Estructura moderna obligatoria. No uses perfiles ni bloques introductorios. No uses párrafos largos. Devuelve únicamente el siguiente HTML, completado con contenido profesional generado a partir del texto del usuario:

<div>
  <h2>Nombre</h2>
  <p>Laura García</p>

  <h2>Información de Contacto</h2>
  <ul>
    <li>Teléfono: (+34) 600 123 456</li>
    <li>Email: correo@ejemplo.com</li>
    <li>Ubicación: Madrid, España</li>
  </ul>

  <h2>Experiencia Laboral</h2>
  <ul>
    <li><strong>Especialista en Atención al Cliente - Empresa XYZ</strong> (Marzo 2018 - Presente)<br>
    - Gestioné más de 50 consultas diarias con soluciones efectivas.<br>
    - Implementé mejoras que aumentaron la satisfacción en un 20%.</li>

    <li><strong>Representante - Empresa ABC</strong> (Ene 2013 - Feb 2018)<br>
    - Resolví reclamaciones complejas.<br>
    - Reduje tiempos de espera mediante colaboración con el equipo técnico.</li>
  </ul>

  <h2>Educación</h2>
  <ul>
    <li><strong>Grado en Administración y Dirección de Empresas</strong><br>
    Universidad Complutense de Madrid, 2008–2012</li>
  </ul>

  <h2>Habilidades</h2>
  <ul>
    <li>Comunicación efectiva</li>
    <li>Gestión de conflictos</li>
    <li>Manejo de herramientas CRM</li>
    <li>Adaptabilidad</li>
  </ul>

  <h2>Idiomas</h2>
  <ul>
    <li>Español — Nativo</li>
    <li>Inglés — Intermedio</li>
  </ul>

  <h2>Referencias</h2>
  <p>Disponibles a solicitud.</p>
</div>

⚠️ No modifiques el orden ni los encabezados. Si algún dato no está presente en el input, rellena con ejemplos profesionales o texto lógico.
💡 Devuelve solo el bloque HTML resultante, sin explicaciones ni etiquetas adicionales.
`.trim();
}



  if (format === "Creativo") {
    userPrompt += `
📌 Usa viñetas (<ul><li>) para habilidades y logros si ayuda a la presentación.
✨ Puedes incluir frases personales o creativas que hagan destacar el CV.
🎭 Está bien mostrar algo de personalidad o motivación (sin perder profesionalismo).
`.trim();
  }

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
    result = result.replace(/```html|```/g, "").trim(); // Strip markdown fences

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
