// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Add some debugging
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Missing Supabase environment variables:', { url: !!url, key: !!key })
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient(url, key)
}