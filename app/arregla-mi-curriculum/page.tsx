import type { Metadata } from 'next';
import FixMyResume from './ClientForm';
import { requireSessionOrRedirect } from '@/lib/supabase/require-session';

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

export default async function Page() {
  await requireSessionOrRedirect();

  return <FixMyResume />;
}
