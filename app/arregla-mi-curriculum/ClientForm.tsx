'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';


export default function FixMyResume() {
  const [resume, setResume] = useState('');
  const [jobType, setJobType] = useState('');
  const [format, setFormat] = useState('Tradicional');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<null | 'up' | 'down' | 'limit'>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [usageInfo, setUsageInfo] = useState<{ total: number; limit: number } | null>(null);

  const router = useRouter();
  const pathname = usePathname();

async function handleSubmit() {
  setLoading(true);
  setOutput('');
  setFeedback(null);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    setShowPopup(true);
    setLoading(false);
    return;
  }

  const visualStyleMap: Record<string, string> = {
    Tradicional: "Diseño clásico y sobrio, con encabezados claros, fuente estándar, sin colores ni adornos innecesarios.",
    Moderno: "Diseño limpio y contemporáneo, uso de tipografía profesional, separación clara entre secciones, estructura bien organizada.",
    Creativo: "Diseño visualmente atractivo con toques creativos, colores sutiles, íconos o emojis, y secciones estilizadas.",
  };

  const visualStyle = visualStyleMap[format] || visualStyleMap["Tradicional"];

// 👇 Everything else stays the same above...
// Replace only this prompt section inside your handleSubmit() function:

const prompt = `
Eres un redactor profesional de currículums con más de 15 años de experiencia. Tu tarea es generar un **currículum profesional completo en español neutro**, adaptado al formato seleccionado por el usuario, bien estructurado y visualmente claro, utilizando HTML limpio.

📌 Reglas clave:
- Mínimo **500 palabras**. Expande cada sección, especialmente si el contenido del usuario es escaso.
- Usa solo etiquetas HTML como: <p>, <ul>, <li>, <h2>, <strong>, <blockquote>. No uses <html>, <body>, ni markdown.
- Si el usuario no ha especificado datos como ciudad, email, teléfono, usa **{Tu ciudad}, {Tu email}**, etc.
- No incluyas frases de cierre como “Un cordial saludo”.
- Mejora el contenido del usuario: sé proactivo, profesional y realista. Escribe como si quisieras impresionar a un reclutador.
- El estilo visual y el tono **deben cambiar claramente según el formato**.

📋 El currículum debe contener estas secciones:
1. Información de Contacto
2. Perfil Profesional
3. Experiencia Laboral
4. Educación
5. Habilidades
6. Idiomas
7. Certificaciones, Logros y Voluntariado (si aplica)
8. Referencias o Intereses (si aplica)

🎨 Formato seleccionado: ${format}

🪶 **Tradicional**
- Usa solo <p> y <strong>. No uses listas.
- Escribe en un tono clásico, formal y sobrio.
- Las habilidades deben ir en párrafo completo, no en viñetas ni con comas sueltas.
- No uses emojis ni frases personales.
- Longitud ideal: 600–700 palabras.

📋 **Moderno**
- Usa <h2> para separar secciones.
- Usa <ul> y <li> para Experiencia y Habilidades.
- Expande cada viñeta con detalles o resultados. Evita frases genéricas.
- Incluye logros con métricas (ej. “↑25% eficiencia”).
- Longitud ideal: 550–650 palabras.
- Presentación limpia, profesional y escaneable.

🎨 **Creativo**
- Encabezados con emojis (ej: 🎯 Perfil Profesional).
- Usa <ul> y <li> con frases expresivas, no solo descriptivas.
- Empieza con una cita o lema profesional en un <blockquote>.
- Usa <strong> dentro de párrafos para destacar ideas clave.
- Tono personal, creativo, energético, pero sigue siendo profesional.
- Añade secciones opcionales como “🎨 Valores que me definen” o “🌟 Mi Estilo de Trabajo”.
- Ejemplo para habilidades: 
  → ❌ Puntual  
  → ✅ ⏱ Siempre llego antes de que el reloj marque
- Longitud ideal: 550–700 palabras.

💼 Tipo de empleo deseado: ${jobType || 'No especificado'}

📎 Datos personales (al inicio del CV, usa placeholders si están vacíos):
<p><strong>Nombre:</strong> {Tu nombre}</p>
<p><strong>Email:</strong> {Tu email}</p>
<p><strong>Teléfono:</strong> {Tu número}</p>
<p><strong>Dirección:</strong> {Tu ciudad o país}</p>

📝 Información ingresada por el usuario:
${resume}
`.trim();

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, type: 'cv' }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data?.error === 'Daily usage limit reached.') {
        setFeedback('limit');
        alert('🚫 Has alcanzado tu límite diario. Intenta mañana o mejora tu plan.');
      } else {
        alert('❌ Hubo un problema. Intenta de nuevo más tarde.');
      }
      setLoading(false);
      return;
    }

    setOutput(data.result);

    if (data?.usage) {
      setUsageInfo({
        total: data.usage.cvCount + data.usage.letterCount,
        limit: data.usage.limit,
      });
    }
  } catch (error) {
    setOutput('Hubo un problema al generar tu currículum. Intenta de nuevo más tarde.');
    console.error('❌ Error calling API:', error);
  }

  setLoading(false);
}

async function downloadPDFClean() {
  const original = document.getElementById("pdf-content");
  if (!original) {
    console.error("❌ Element with id 'pdf-content' not found.");
    return;
  }

  try {
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;

    // Clone and prepare wrapper
    const clone = original.cloneNode(true) as HTMLElement;
    const wrapper = document.createElement("div");
    wrapper.className = "pdf-export-wrapper";
    wrapper.appendChild(clone);

    // Clean ALL inline styles that contain oklch(...) or var(...)
    wrapper.querySelectorAll<HTMLElement>("*").forEach((el) => {
      const style = el.getAttribute("style");
      if (style && /oklch\(/i.test(style)) {
        el.setAttribute("style", style.replace(/oklch\([^)]+\)/gi, "#000000"));
      }
      if (style && /var\(/i.test(style)) {
        el.setAttribute("style", style.replace(/var\([^)]+\)/gi, "#000000"));
      }
    });

    // Append off-screen
    wrapper.style.position = "absolute";
    wrapper.style.left = "-9999px";
    document.body.appendChild(wrapper);

    const canvas = await html2canvas(wrapper, {
      backgroundColor: "#ffffff",
      scale: 2,
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("curriculum.pdf");

    document.body.removeChild(wrapper);
  } catch (error) {
    console.error("❌ PDF export failed:", error);
    alert("❌ Error al generar el PDF.");
  }
}



function resetForm() {
  setResume('');
  setJobType('');
  setFormat('Tradicional');
  setOutput('');
  setFeedback(null);
  setUsageInfo(null);
}

return (
  <main style={{ maxWidth: '650px', margin: '2rem auto', padding: '1rem' }}>
    <div style={{ marginTop: '1rem' }}>
      <label htmlFor="resume"><strong>Currículum actual:</strong></label>
      <textarea
        id="resume"
        rows={8}
        value={resume}
        onChange={(e) => setResume(e.target.value)}
        placeholder="Ejemplo: Experiencia laboral, educación, habilidades..."
        style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
      />

      <label htmlFor="jobType" style={{ marginTop: '1rem', display: 'block' }}>
        <strong>Tipo de empleo (opcional):</strong>
      </label>
      <textarea
        id="jobType"
        rows={2}
        value={jobType}
        onChange={(e) => setJobType(e.target.value)}
        placeholder="Ejemplo: Administrativo, Marketing, Atención al cliente..."
        style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
      />

      <label htmlFor="format" style={{ marginTop: '1rem', display: 'block' }}>
        <strong>Formato preferido:</strong>
      </label>
      <select
        id="format"
        value={format}
        onChange={(e) => setFormat(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
      >
        <option value="Tradicional">Tradicional</option>
        <option value="Moderno">Moderno</option>
        <option value="Creativo">Creativo</option>
      </select>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.75rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          {loading ? '✍️ Generando con IA...' : 'Mejorar con IA'}
        </button>
        <button
          onClick={resetForm}
          style={{
            padding: '0.75rem',
            backgroundColor: '#999',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Limpiar
        </button>
      </div>

      {loading && (
        <p style={{ color: '#888', marginTop: '0.5rem' }}>
          ⏳ Esto puede tardar unos segundos... tu CV está siendo mejorado por IA.
        </p>
      )}

      {usageInfo && (
        <p style={{ marginTop: '1rem', color: '#777' }}>
          📊 Usado hoy: {usageInfo.total} / {usageInfo.limit}
        </p>
      )}
      <p style={{ color: '#777', fontSize: '0.9rem' }}>
        🕒 El límite se reinicia cada día a medianoche.
      </p>
    </div>

    {output && (
  <div style={{ marginTop: '2rem' }}>
    <div
      id="pdf-content"
      dangerouslySetInnerHTML={{ __html: output }}
      contentEditable={true}
      suppressContentEditableWarning={true}
      lang="es"
    />

    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
      <button
  onClick={downloadPDFClean}
  style={{
    flex: 1,
    padding: '0.5rem',
    backgroundColor: '#333',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  }}
>
  Descargar PDF
</button>


      <button
        onClick={handleSubmit}
        style={{
          flex: 1,
          padding: '0.5rem',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Regenerar
      </button>
    </div>
  </div>
)}


    {showPopup && (
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#f44336',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '6px',
          zIndex: 1000,
          boxShadow: '0px 2px 10px rgba(0,0,0,0.3)',
        }}
      >
        Por favor inicia sesión para continuar.
        <button
          onClick={() => router.push(`/login?next=${pathname}`)}
          style={{
            marginLeft: '1rem',
            backgroundColor: 'white',
            color: '#f44336',
            border: 'none',
            borderRadius: '4px',
            padding: '0.25rem 0.75rem',
            cursor: 'pointer',
          }}
        >
          Iniciar sesión
        </button>
        <button
          onClick={() => router.push(`/signup?next=${pathname}`)}
          style={{
            marginLeft: '0.5rem',
            backgroundColor: '#ffffff',
            color: '#f44336',
            border: 'none',
            borderRadius: '4px',
            padding: '0.25rem 0.75rem',
            cursor: 'pointer',
          }}
        >
          Crear cuenta
        </button>
      </div>
    )}
  </main>
);
}