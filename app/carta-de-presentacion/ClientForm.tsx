'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

export default function ClientForm() {
  const [name, setName] = useState('');
  const [experience, setExperience] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [tone, setTone] = useState('formal');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<null | 'up' | 'down' | 'limit'>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [usageInfo, setUsageInfo] = useState<{ total: number; limit: number } | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const toneMap: Record<string, string> = {
    formal: 'Usa un tono formal, profesional y respetuoso. Dirige la carta con cortesía y evita lenguaje coloquial.',
    neutral: 'Usa un tono profesional y claro, sin sonar demasiado rígido ni demasiado informal.',
    casual: 'Usa un tono cercano, positivo y amistoso, sin dejar de ser profesional.',
  };

  const toneLabel = tone?.toLowerCase() ?? 'neutral';
  const toneStyle = toneMap[toneLabel] || toneMap.neutral;

  const prompt = `
Eres un generador de cartas de presentación en HTML para el mercado laboral español.

🎯 Objetivo:
- Crear una carta personalizada, concisa y bien redactada, que complemente un currículum.
- No repitas el contenido del CV.
- No uses títulos ni listas. Solo usa párrafos <p>.
- Devuelve solo HTML limpio. No incluyas <html>, <body>, ni encabezados <h1>, <h2>, etc.

📌 Datos del usuario:
Nombre: ${name || 'Nombre del candidato'}
Puesto deseado: ${jobTitle || 'No especificado'}
Experiencia relevante: ${experience || 'No especificado'}
Tono: ${toneLabel} — ${toneStyle}

📄 Estructura de salida:
1. Introducción breve con saludo.
2. Un párrafo explicando la motivación y cómo encaja con el puesto.
3. Un párrafo destacando experiencia clave.
4. Un cierre con disponibilidad y agradecimiento.
5. Una despedida profesional como "Atentamente", "Un cordial saludo", etc., seguida del nombre del candidato si está disponible.

❗ Devuelve solo el contenido HTML, usando párrafos <p>. No incluyas etiquetas <html>, <body> ni ningún marcador de código. No uses comillas invertidas ni bloques de código.
`.trim();

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

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'letter' }),
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
      setOutput('Hubo un problema al generar tu carta. Intenta de nuevo más tarde.');
      console.error('❌ Error calling API:', error);
    }

    setLoading(false);
  }

  async function downloadPDF() {
    const element = document.getElementById('editable-letter');
    if (!element) return;

    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default;

    const opt = {
      margin: 0.5,
      filename: 'carta-presentacion.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    html2pdf().set(opt).from(element).save();
  }

  function resetForm() {
    setName('');
    setExperience('');
    setJobTitle('');
    setTone('formal');
    setOutput('');
    setFeedback(null);
    setUsageInfo(null);
  }

  return (
    <main style={{ maxWidth: '650px', margin: '2rem auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Carta de Presentación</h1>
      <p style={{ color: '#555' }}>
        Crea una carta profesional para acompañar tu solicitud de empleo.
      </p>

      <div style={{ marginTop: '1rem' }}>
        <label><strong>Nombre:</strong></label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre completo"
          style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', marginBottom: '1rem' }}
        />

        <label><strong>Puesto deseado:</strong></label>
        <input
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Ejemplo: Gerente de Marketing"
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        />

        <label><strong>Tu experiencia relevante:</strong></label>
        <textarea
          rows={4}
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="Ejemplo: 5 años liderando campañas digitales en España..."
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        />

        <label><strong>Tono preferido:</strong></label>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        >
          <option value="formal">Formal</option>
          <option value="neutral">Neutro</option>
          <option value="casual">Casual</option>
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
            {loading ? '✍️ Generando...' : 'Crear Carta'}
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
            ⏳ Esto puede tardar unos segundos... generando carta con IA.
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
            style={{
              background: '#ffffff',
              padding: '1rem',
              borderRadius: '6px',
              whiteSpace: 'pre-wrap',
              border: '1px solid #ccc',
            }}
          >
            <div
              id="editable-letter"
              contentEditable
              suppressContentEditableWarning
              style={{
                fontFamily: 'inherit',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                outline: 'none',
                minHeight: '300px',
              }}
              lang="es"
              dangerouslySetInnerHTML={{ __html: output }}
            ></div>
          </div>

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
