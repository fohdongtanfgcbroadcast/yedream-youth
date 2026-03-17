import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ucqcgstrduwrcrhgbcdt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjcWNnc3RyZHV3cmNyaGdiY2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjU5MjYsImV4cCI6MjA4OTMwMTkyNn0.6y6CBPVZnQtmeRQ8domZ4PXp1Wo_kOFmrHL0SzUp1IA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});
