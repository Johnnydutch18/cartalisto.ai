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
Actúa como un redactor profesional de currículums con más de 15 años de experiencia ayudando a candidatos hispanohablantes a destacar. Tu tarea es generar un **currículum completo, profesional, bien estructurado y visualmente claro** a partir de la información proporcionada.

📌 **Instrucciones clave**:
- Escribe en **español neutro**
- Devuelve solo HTML limpio usando <div>, <p>, <ul>, <li>, <strong>, <h2>, etc.
- ❗️ No uses etiquetas <html>, <body>, ni markdown (```)

📏 **Requisitos mínimos**:
- El currículum debe tener **mínimo 500 palabras**
- Si el usuario proporciona poca información, completa y mejora con contenido coherente y profesional
- Incluye las secciones esenciales: Datos personales, Perfil profesional, Experiencia laboral, Educación, Habilidades, Idiomas, y otras relevantes
- No incluyas cierres como “Un cordial saludo” o firmas

📎 **Datos personales obligatorios (editable):**
<p><strong>Nombre:</strong> {Tu nombre}</p>
<p><strong>Email:</strong> {Tu correo electrónico}</p>
<p><strong>Teléfono:</strong> {Tu número de contacto}</p>
<p><strong>Dirección:</strong> {Tu ciudad o país}</p>

🎨 **Aplica uno de los siguientes formatos visuales según la preferencia del usuario**:

---

🪶 Tradicional:
- Estilo sobrio y clásico
- Párrafos largos usando <p>, sin listas
- Encabezados simples como <strong>Perfil Profesional</strong>, <strong>Educación</strong>
- Ideal para trabajos administrativos o formales

📄 Ejemplo:
<strong>Perfil Profesional</strong>
<p>Soy un profesional responsable con experiencia en logística...</p>

---

📋 Moderno:
- Diseño limpio con secciones bien separadas
- Usa listas <ul> y <li> para experiencia, habilidades, etc.
- Encabezados claros como <h2> o <strong>
- Añade referencias al final
- Ideal para entornos profesionales modernos

📄 Ejemplo:
<h2>Habilidades</h2>
<ul>
  <li>Gestión de inventarios</li>
  <li>Trabajo en equipo</li>
  <li>Comunicación efectiva</li>
</ul>

---

🎨 Creativo:
- Estilo visualmente atractivo con emojis y estructura expresiva
- Usa negritas, saltos de línea y frases originales
- Ideal para marketing, diseño, atención al cliente

📄 Ejemplo:
<h2>🎯 Perfil Profesional</h2>
<p>Apasionado por la creatividad con enfoque innovador...</p>

---

💼 Tipo de empleo deseado (si se proporcionó): ${jobType || 'No especificado'}  
🧩 Formato preferido: ${format}  
📝 Información del usuario:  
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
