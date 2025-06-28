import type { Metadata } from 'next';
import CoverLetterForm from './ClientForm';

export const metadata: Metadata = {
  title: 'Carta de Presentación con IA | CartaListo',
  description: 'Genera cartas de presentación personalizadas y profesionales al instante con inteligencia artificial. Rápido, sencillo y en español.',
  openGraph: {
    title: 'Carta de Presentación con IA | CartaListo',
    description: 'Redacta una carta de presentación que impresione a cualquier reclutador en segundos.',
    url: 'https://cartalisto.com/carta-de-presentacion',
    images: ['/og-image.jpg'],
    type: 'website',
  },
  alternates: {
    canonical: 'https://cartalisto.com/carta-de-presentacion',
  },
};

export default function Page() {
  return <CoverLetterForm />;
}
