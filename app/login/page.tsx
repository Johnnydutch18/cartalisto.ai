// app/login/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import LoginForm from './LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shouldShowLogin, setShouldShowLogin] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace('/'); // Already logged in → redirect
      } else {
        setShouldShowLogin(true); // Show login form
      }

      setLoading(false);
    };

    checkSession();
  }, [router]);

  if (loading) return null; // Or a spinner/loading state
  if (!shouldShowLogin) return null;

  return <LoginForm />;
}
