// app/login/page.tsx (Server Component approach)
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const supabase = createClient();
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // If user is already logged in, redirect to home
    if (session && session.user && session.access_token && !error) {
      redirect('/');
    }
  } catch (error) {
    console.error('Session check failed:', error);
    // Continue to show login form if session check fails
  }

  // Show login form for unauthenticated users
  return <LoginForm />;
}