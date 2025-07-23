import type { Metadata } from 'next';
import FixMyResume from './ClientForm'; // Contains the form logic

export const metadata: Metadata = {
  title: 'Arregla tu CV con IA | CartaListo',
  description:
    'Mejora tu currículum al instante con inteligencia artificial. Optimiza tu redacción, formato y presentación para destacar en España.',
  openGraph: {
    title: 'Arregla tu CV con IA | CartaListo',
    description:
      'Redacta un currículum profesional y optimizado para ATS en segundos. Totalmente en español.',
    url: 'https://cartalisto.com/arregla-mi-curriculum',
    images: ['/og-image.jpg'],
    type: 'website',
  },
  alternates: {
    canonical: 'https://cartalisto.com/arregla-mi-curriculum',
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Arregla Mi Currículum</h1>
          <p className="text-muted-foreground">
            Mejora tu CV para destacar en tus postulaciones laborales.
          </p>
        </div>

        <FixMyResume />
      </div>
    </main>
  );
}
