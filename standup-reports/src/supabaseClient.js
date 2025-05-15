import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfyxudmjeytmdtigxmfc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmeXh1ZG1qZXl0bWR0aWd4bWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNTM4MzMsImV4cCI6MjA2MjgyOTgzM30.bs6no7SqD6OcZ_Qsr2jZTGd6v_TSC98Im17gjewjTBs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
