import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'Arregla tu CV con IA | CartaListo',
  description: 'Mejora tu currículum al instante con inteligencia artificial. Optimiza tu redacción, formato y presentación para destacar en España.',
  openGraph: {
    title: 'Arregla tu CV con IA | CartaListo',
    description: 'Redacta un currículum profesional y optimizado para ATS en segundos. Totalmente en español.',
    url: 'https://cartalisto.com/arregla-mi-curriculum',
    images: ['/og-image.jpg'],
    type: 'website',
  },
  alternates: {
    canonical: 'https://cartalisto.com/arregla-mi-curriculum',
  },
};

const FixMyResume = dynamic(() => import('./ClientForm'), { ssr: false });

export default function Page() {
  return <FixMyResume />;
}
