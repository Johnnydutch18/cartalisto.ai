'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function FixMyResume() {
  const [resume, setResume] = useState('');
  const [jobType, setJobType] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<null | 'up' | 'down' | 'limit'>(null);
  const [showPopup, setShowPopup] = useState(false);

  const router = useRouter();

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

    const prompt = `Actúa como un experto redactor de currículums con experiencia en el mercado laboral español. Tu tarea es:

1. Corregir errores gramaticales y mejorar la redacción.
2. Reorganizar la información para mayor claridad y fluidez.
3. Aplicar un formato profesional, claro y moderno.
4. Incluir mejoras compatibles con sistemas ATS (palabras clave, estructura).

Conserva todos los datos importantes proporcionados por el usuario, pero expresa las ideas con mayor impacto profesional.

CV original:
${resume}

Tipo de empleo (si se indicó): ${jobType}`;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'cv' }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setFeedback('limit');
        setOutput(data.result);
      } else {
        setOutput(data.result);
      }
    } catch (error) {
      setOutput('Hubo un problema al generar tu currículum. Intenta de nuevo más tarde.');
      console.error('❌ Error calling API:', error);
    }

    setLoading(false);
  }

  function handleRedirect(path: string) {
    const returnTo = '/arregla-mi-curriculum';
    router.push(`${path}?next=${encodeURIComponent(returnTo)}`);
  }

  function resetForm() {
    setResume('');
    setJobType('');
    setOutput('');
    setFeedback(null);
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
              ✅ Versión Mejorada
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
              onClick={async () => {
                const element = document.getElementById('pdf-content');
                if (!element) return;
                const html2pdfModule = await import('html2pdf.js');
                html2pdfModule.default().from(element).save();
              }}
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
            {feedback === 'limit' ? (
              <>
                <p><strong>⚠️ Has alcanzado el límite diario.</strong></p>
                <p>
                  <a href="/planes" style={{ color: '#0070f3', textDecoration: 'underline' }}>
                    Mejora tu plan aquí
                  </a>
                </p>
              </>
            ) : (
              <>
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
              </>
            )}
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
          🔒 Por favor inicia sesión o crea una cuenta para continuar.
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => handleRedirect('/login')}
              style={{
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
              onClick={() => handleRedirect('/signup')}
              style={{
                backgroundColor: 'white',
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
        </div>
      )}
    </main>
  );
}
