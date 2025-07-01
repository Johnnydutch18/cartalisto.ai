'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import LoginForm from './LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionExists, setSessionExists] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setSessionExists(true);
        router.replace('/'); // 🔁 Redirect client-side
      } else {
        setSessionExists(false);
      }

      setLoading(false);
    };

    checkSession();
  }, [router]);

  if (loading || sessionExists) return null; // Avoid flash of content

  return <LoginForm />;
}
