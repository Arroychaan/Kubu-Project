import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables');
}

// Create client without strict Database typing to avoid 'never' inference issues
// Type assertions are used at the query level instead
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
