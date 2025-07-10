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
    .select('email, plan')
    .eq('id', session.user.id)
    .single();

  const { data: generations } = await supabase
    .from('generations')
    .select('id, type, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Mi Cuenta</h1>

      <div className="mb-6 p-4 bg-white rounded-xl shadow">
        <p><strong>Email:</strong> {profile?.email ?? "No disponible"}</p>
        <p><strong>Plan actual:</strong> {profile?.plan ?? "No disponible"}</p>
        <form action="/api/create-billing-portal-session" method="POST">
          <button
            type="submit"
            className="mt-4 bg-black text-white px-4 py-2 rounded"
          >
            Gestionar suscripción
          </button>
        </form>
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
