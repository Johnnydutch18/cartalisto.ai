import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function CuentaPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect('/login?redirect=/cuenta');

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, plan, cvCount, letterCount, lastGeneratedAt')
    .eq('id', session.user.id)
    .single();

  const { data: generations } = await supabase
    .from('generations')
    .select('id, type, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  const today = new Date().toISOString().split('T')[0];
  const lastDate = profile?.lastGeneratedAt?.split('T')[0] ?? '';
  const isToday = today === lastDate;
  const cv = isToday ? profile?.cvCount ?? 0 : 0;
  const letter = isToday ? profile?.letterCount ?? 0 : 0;

  const rawPlan = profile?.plan?.toLowerCase() || 'gratuito';

  // Normalize for display (force all to Spanish)
  const plan = rawPlan === 'standard' ? 'estandar' : rawPlan;

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Mi Cuenta</h1>

      <div className="mb-6 p-4 bg-white rounded-xl shadow text-sm">
        <p className="mb-2"><strong>Email:</strong> {profile?.email ?? "No disponible"}</p>

        {/* ✅ DEBUG: Confirm Plan */}
        <div className="mb-4 p-2 text-xs bg-yellow-50 text-yellow-900 border border-yellow-200 rounded">
          Debug: plan = <code>{plan}</code>
        </div>

        {/* ✅ PLAN BLOCKS */}
        {plan === 'gratuito' && (
          <div className="rounded-lg bg-gray-100 p-4 text-gray-800">
            <p><strong>Tu plan actual:</strong> Gratuito</p>
            <p className="mt-1">1 generación por día · GPT‑4o‑mini · Descarga en PDF</p>
            <p className="mt-2 text-sm text-gray-600">
              Has usado {cv + letter}/1 generación hoy.
            </p>
            <a
              href="/planes"
              className="mt-3 inline-block rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800 transition"
            >
              Mejorar al plan Estándar →
            </a>
          </div>
        )}

        {plan === 'estandar' && (
          <div className="rounded-lg bg-green-100 p-4 text-green-900">
            <p><strong>Tu plan actual:</strong> Estándar</p>
            <p className="mt-1">Generaciones ilimitadas · GPT‑4o · PDF + Copiar · Selector de tono</p>
            <form action="/api/create-billing-portal-session" method="POST">
              <button
                type="submit"
                className="mt-3 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
              >
                Administrar suscripción
              </button>
            </form>
          </div>
        )}

        {plan === 'pro' && (
          <div className="rounded-lg bg-purple-100 p-4 text-purple-900">
            <p><strong>Tu plan actual:</strong> Pro</p>
            <p className="mt-1">GPT‑4.1 · Generaciones ilimitadas · Historial de documentos · Soporte prioritario</p>
            <form action="/api/create-billing-portal-session" method="POST">
              <button
                type="submit"
                className="mt-3 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
              >
                Administrar suscripción
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Historial de generaciones</h2>
        <ul className="space-y-2 text-sm">
          {generations?.length === 0 && (
            <li>No hay generaciones todavía.</li>
          )}
          {generations?.map((gen) => (
            <li key={gen.id} className="border-b pb-1">
              {gen.type === 'cv' ? 'Currículum' : 'Carta'} —{' '}
              {new Date(gen.created_at).toLocaleString('es-ES')} —{' '}
              <Link
                href={`/ver?id=${gen.id}`}
                className="text-blue-600 hover:underline"
              >
                Ver
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
