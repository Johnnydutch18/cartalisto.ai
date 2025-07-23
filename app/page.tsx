import Link from 'next/link';
import { Sparkles, FileText, Download, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CartaListo | Optimiza tu CV y Carta de Presentación con IA',
  description: 'Optimiza tu currículum y crea cartas personalizadas con IA en minutos. Herramientas en español para destacar en tus postulaciones.',
  openGraph: {
    title: 'CartaListo - Currículum y Cartas con IA',
    description: 'Herramientas en español para mejorar tu CV y redactar cartas de presentación profesionales en segundos.',
    url: 'https://cartalisto.com/',
    images: ['/og-image.jpg'],
    type: 'website',
  },
  alternates: {
    canonical: 'https://cartalisto.com/',
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans">

      {/* Hero Section */}
      <section className="text-center py-20 px-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Optimiza tu CV y Carta de Presentación con IA
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Optimiza tu currículum y crea cartas personalizadas en minutos con inteligencia artificial. Fácil, rápido y en español.
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <Link href="/arregla-mi-curriculum" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition">
            <FileText className="w-5 h-5" /> Optimiza tu CV
          </Link>
          <Link href="/carta-de-presentacion" className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition">
            <Sparkles className="w-5 h-5" /> Genera tu Carta
          </Link>
        </div>
      </section>

      {/* Cómo Funciona Section */}
      <section className="bg-card text-card-foreground py-16 px-6 border-t">
        <h2 className="text-3xl font-bold text-center mb-12">¿Cómo Funciona?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="text-center">
            <Sparkles className="w-10 h-10 mx-auto mb-3 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Elige tu herramienta</h3>
            <p className="text-muted-foreground">CV o carta de presentación. Ambas están en español y listas para usar.</p>
          </div>
          <div className="text-center">
            <ArrowRight className="w-10 h-10 mx-auto mb-3 text-green-600" />
            <h3 className="text-xl font-semibold mb-2">Completa los datos</h3>
            <p className="text-muted-foreground">Responde unas preguntas simples para personalizar tu resultado.</p>
          </div>
          <div className="text-center">
            <Download className="w-10 h-10 mx-auto mb-3 text-indigo-600" />
            <h3 className="text-xl font-semibold mb-2">Descarga al instante</h3>
            <p className="text-muted-foreground">Recibe tu documento listo en PDF en segundos.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-muted-foreground py-6 border-t">
        © {new Date().getFullYear()} CartaListo.com — Hecho con IA.
      </footer>
    </main>
  );
}
