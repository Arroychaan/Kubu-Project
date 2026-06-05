import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  // 2. Fetch admin check from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    redirect('/');
  }

  // 3. Fetch app settings
  const { data: limitData } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'daily_poll_limit')
    .single();

  const dailyPollLimit = Number(limitData?.value || '2');

  // 4. Fetch all polls
  const { data: pollsData } = await supabase
    .from('polls')
    .select('id, question, option_a, option_b, is_official, created_at')
    .order('created_at', { ascending: false });

  // 5. Fetch audit logs
  const { data: auditData } = await supabase
    .from('audit_logs')
    .select('id, actor_id, actor_role, action, target_table, details, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <main className="min-h-screen bg-background relative overflow-hidden pt-6">
      {/* Subtle Atmospheric Gradient Overlay */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-choice-right/5 rounded-full blur-[120px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.4] -z-10"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      <AdminClient
        initialPolls={pollsData || []}
        initialLimit={dailyPollLimit}
        initialLogs={auditData || []}
      />
    </main>
  );
}
