'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleIcon } from 'lucide-react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');

  const [mode, setMode] = useState<'signin' | 'signup'>(
    (searchParams.get('mode') as 'signin' | 'signup') || 'signin'
  );

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-orange-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'signin' ? 'Iniciar sesión' : 'Crear una cuenta'}
        </h2>
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={() => setMode('signin')}
            className={`px-4 py-2 rounded ${
              mode === 'signin' ? 'bg-orange-600 text-white' : 'bg-white border'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`px-4 py-2 rounded ${
              mode === 'signup' ? 'bg-orange-600 text-white' : 'bg-white border'
            }`}
          >
            Crear cuenta
          </button>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-6">
          <input type="hidden" name="redirect" value={redirect || ''} />
          <input type="hidden" name="priceId" value={priceId || ''} />
          <input type="hidden" name="inviteId" value={inviteId || ''} />

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>

          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2 px-4 rounded bg-orange-600 text-white font-medium"
            >
              {mode === 'signin' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
