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

    const prompt = `Actúa como un redactor profesional de currículums con experiencia en el mercado laboral español. Genera un CV profesional en HTML limpio, editable en el navegador, y con diseño basado en este formato preferido: "${format}". Cambia sutilmente el estilo (fuentes, colores, disposición) en cada generación para que no todos los CVs se vean iguales.

Tu tarea:
1. Corregir errores y mejorar el texto
2. Aplicar diseño profesional, adaptable a PDF
3. Usar etiquetas HTML limpias, sin Markdown
4. Incluir: nombre, datos de contacto, perfil, experiencia, educación, habilidades, idiomas

Contenido del usuario:
${resume}

Tipo de empleo: ${jobType || 'No especificado'}

Estructura HTML esperada:
<div class="cv-container" style="font-family: ${
      format === 'Creativo'
        ? "'Courier New', monospace"
        : format === 'Moderno'
        ? "'Helvetica Neue', sans-serif"
        : "'Arial', sans-serif"
    }; max-width: 800px; margin: 0 auto; padding: 20px; color: #222;">
  <header style="text-align: center; margin-bottom: 1.5rem;">
    <h1 style="font-size: 24px;">[Nombre Completo]</h1>
    <p style="margin: 0;">📧 email@email.com | 📞 +34 600000000 | 📍 Ciudad</p>
  </header>

  <section>
    <h2 style="font-size: 18px; border-bottom: 2px solid #ccc;">Perfil Profesional</h2>
    <p>[Resumen del perfil profesional]</p>
  </section>

  <section>
    <h2 style="font-size: 18px; border-bottom: 2px solid #ccc;">Experiencia Laboral</h2>
    <p><strong>[Puesto]</strong><br /><em>[Empresa] – [Fechas]</em></p>
    <ul>
      <li>[Responsabilidad o logro]</li>
      <li>[Responsabilidad o logro]</li>
    </ul>
  </section>

  <section>
    <h2 style="font-size: 18px; border-bottom: 2px solid #ccc;">Educación</h2>
    <p><strong>[Título]</strong><br />[Institución] – [Año]</p>
  </section>

  <section>
    <h2 style="font-size: 18px; border-bottom: 2px solid #ccc;">Habilidades</h2>
    <ul>
      <li>[Habilidad #1]</li>
      <li>[Habilidad #2]</li>
    </ul>
  </section>

  <section>
    <h2 style="font-size: 18px; border-bottom: 2px solid #ccc;">Idiomas</h2>
    <ul>
      <li>[Idioma #1]</li>
      <li>[Idioma #2]</li>
    </ul>
  </section>
</div>`;

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
