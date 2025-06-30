'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function CoverLetterForm() {
  const [name, setName] = useState('');
  const [experience, setExperience] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<null | 'up' | 'down'>(null);

  const supabase = createBrowserClient();
  const router = useRouter();

  async function handleSubmit() {
    setLoading(true);
    setOutput('');
    setFeedback(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    const prompt = `Eres un experto redactor de cartas de presentación para el mercado laboral español. Con la información siguiente, redacta una carta formal, concisa y profesional, dirigida a un reclutador, para acompañar una solicitud de empleo al puesto de "${jobTitle}". Utiliza un tono respetuoso, evita repetir el currículum, y enfócate en cómo el candidato puede aportar valor.

Información:
- Nombre: ${name}
- Experiencia relevante: ${experience}

Escribe la carta en español, estructurada correctamente, en un solo bloque de texto, sin encabezados ni firma final.`;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error('OpenAI API failed');
      const data = await response.json();
      setOutput(data.result);
    } catch (error) {
      setOutput('Hubo un problema al generar tu carta. Intenta de nuevo más tarde.');
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
    setOutput('');
    setFeedback(null);
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
          style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', marginBottom: '1rem' }}
        />

        <label><strong>Tu experiencia relevante:</strong></label>
        <textarea
          rows={4}
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="Ejemplo: 5 años liderando campañas digitales en España..."
          style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
        />

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
      </div>

      {output && (
        <div style={{ marginTop: '2rem' }}>
          <div
            id="pdf-content"
            style={{
              background: '#ffffff',
              padding: '1rem',
              borderRadius: '6px',
              whiteSpace: 'pre-wrap',
              border: '1px solid #ccc',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              ✅ Carta Generada
            </h2>
            <div
              style={{
                fontFamily: 'inherit',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              }}
              lang="es"
            >
              {output}
            </div>
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

          <div style={{ marginTop: '1rem', textAlign: 'center', color: '#666' }}>
            <p>¿Te fue útil?</p>
            <div style={{ fontSize: '1.5rem', cursor: 'pointer' }}>
              <span
                onClick={() => setFeedback('up')}
                style={{ marginRight: '1rem', opacity: feedback === 'up' ? 1 : 0.4 }}
              >
                👍
              </span>
              <span
                onClick={() => setFeedback('down')}
                style={{ opacity: feedback === 'down' ? 1 : 0.4 }}
              >
                👎
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
