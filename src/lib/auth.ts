import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function getServerSession() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('[Auth] Error getting session:', error.message);
    return null;
  }
  
  return session;
} 