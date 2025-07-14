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

const prompt = `
Actúa como un redactor experto de currículums con 15 años de experiencia en el mercado laboral de habla hispana. Tu tarea es crear un currículum **completo, profesional y listo para usar**.

🎯 Objetivo: Transformar el contenido proporcionado por el usuario en un CV convincente, bien redactado, visualmente claro y redactado en **español neutro**.

✅ Instrucciones generales:
- Si la información del usuario es breve o poco clara, interpreta y expande razonablemente el contenido.
- Si faltan secciones clave (perfil, experiencia, educación, habilidades), **genéralas tú mismo** de forma coherente y profesional.
- Mejora todo el lenguaje. Usa frases completas, vocabulario profesional y evita repetir exactamente lo que el usuario escribió.
- ❗️**No incluyas frases de despedida como “Un cordial saludo” ni firmas** — este no es una carta de presentación.
- Devuelve solo HTML **editable** bien estructurado, usando <div>, <h1>, <h2>, <ul>, <li>, <p> y <strong>. No uses etiquetas <html> o <body>.

💼 Tipo de empleo (si se proporcionó): ${jobType || 'No especificado'}
📄 Formato seleccionado: ${format}

---

🎨 Instrucciones por formato:

- Tradicional:
  - Diseño clásico con bloques de texto.
  - No uses listas ni íconos.
  - Usa párrafos y títulos con <strong>, sin adornos visuales.
  - Ideal para puestos más conservadores.

- Moderno:
  - Usa listas con <ul> y <li> para experiencia, habilidades, etc.
  - Muestra datos de contacto al principio: nombre, teléfono, email, LinkedIn.
  - Usa subtítulos claros, y formato más estructurado.

---

📝 Datos del usuario:
${resume}

❗ Devuelve solo HTML limpio. No uses comillas invertidas ni bloques de código Markdown.
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


  async function downloadPDF() {
    const element = document.getElementById('pdf-content');
    if (!element) return;

    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default;

    const opt = {
      margin: 0.5,
      filename: 'curriculum-mejorado.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    html2pdf().set(opt).from(element).save();
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
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Arregla Mi Currículum</h1>
      <p style={{ color: '#555' }}>
        Mejora tu CV para destacar en tus postulaciones laborales.
      </p>

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
        <p style={{ color: '#777', fontSize: '0.9rem' }}>🕒 El límite se reinicia cada día a medianoche.</p>
      </div>

      {output && (
        <div style={{ marginTop: '2rem' }}>
          <div
            id="pdf-content"
            contentEditable={true}
            suppressContentEditableWarning={true}
            dangerouslySetInnerHTML={{ __html: output }}
            style={{
              backgroundColor: '#ffffff',
              padding: '2rem',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontFamily: 'Georgia, serif',
              fontSize: '14px',
              color: '#222',
              lineHeight: '1.6',
              whiteSpace: 'normal',
              wordWrap: 'break-word',
            }}
            lang="es"
          ></div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={downloadPDF}
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
