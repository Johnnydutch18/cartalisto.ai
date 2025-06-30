'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function CoverLetterForm() {
  const [name, setName] = useState('');
  const [experience, setExperience] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<null | 'up' | 'down'>(null);
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

      const data = await response.json();
      setOutput(data.result);
    } catch (error) {
      setOutput('Hubo un problema al generar tu carta. Intenta de nuevo más tarde.');
    }

    setLoading(false);
  }

  function handleRedirect(path: string) {
    const returnTo = '/carta-de-presentacion';
    router.push(`${path}?next=${encodeURIComponent(returnTo)}`);
  }

  return (
    <main style={{ maxWidth: '650px', margin: '2rem auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Carta de Presentación</h1>
      <p style={{ color: '#555' }}>Crea una carta profesional para acompañar tu solicitud de empleo.</p>

      {/* Form Inputs */}
      <div style={{ marginTop: '1rem' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre completo" />
        <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Puesto deseado" />
        <textarea value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Tu experiencia relevante" />

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? '✍️ Generando...' : 'Crear Carta'}
        </button>
        <button onClick={() => { setName(''); setJobTitle(''); setExperience(''); setOutput(''); }}>
          Limpiar
        </button>
      </div>

      {/* Output */}
      {output && <div id="pdf-content">{output}</div>}

      {/* Login/Signup Popup */}
      {showPopup && (
        <div style={{ background: '#fff', padding: '1rem', border: '1px solid #ccc', position: 'fixed', top: 50, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
          <p>🔒 Por favor inicia sesión o crea una cuenta para usar esta función.</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={() => handleRedirect('/login')}>Iniciar sesión</button>
            <button onClick={() => handleRedirect('/signup')}>Crear cuenta</button>
          </div>
        </div>
      )}
    </main>
  );
}
