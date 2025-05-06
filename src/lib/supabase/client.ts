import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = 'https://hphlqfqvrjaahgscfeml.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwaGxxZnF2cmphYWhnc2NmZW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NzU1MDQsImV4cCI6MjA2MjA1MTUwNH0.Xm0G2-cY6qzwhr-kYWbBgrb3vZUGMoTl-MI2tSsVkh0'

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-client',
    },
  },
}) 