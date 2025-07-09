// app/login/page.tsx
import { Suspense } from 'react';
import LoginPage from './LoginPage'; // ✅ Make sure this file exists

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div className="text-center mt-20">Cargando...</div>}>
      <LoginPage />
    </Suspense>
  );
}
