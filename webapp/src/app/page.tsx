export const dynamic = 'force-dynamic';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { Poll } from '@/types';
import HomeClient from '@/components/HomeClient';

// Type for raw poll data from Supabase
interface RawPoll {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  is_official: boolean | null;
  created_at: string;
}

// Type for poll stats from Supabase
interface RawPollStats {
  poll_id: string;
  count_a: number;
  count_b: number;
}

export default async function Home(props: {
  searchParams: Promise<{ search?: string }>;
}) {
  const searchParams = await props.searchParams;
  const searchQuery = searchParams.search || '';
  const supabase = await createSupabaseServerClient();

  // === PARALLEL BATCH 1: All independent counts + recent data ===
  const [
    { count: countPolls },
    { count: countVotes },
    { count: countUsers },
    { data: recentComments },
    { data: recentVotes },
    { data: officialData },
  ] = await Promise.all([
    supabase.from('polls').select('*', { count: 'exact', head: true }),
    supabase.from('votes').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('comments')
      .select('created_at, text, choice, poll:polls(question, option_a, option_b), profile:profiles(username)')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('votes')
      .select('created_at, choice, poll:polls(question, option_a, option_b), profile:profiles(username)')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('polls')
      .select('id, question, option_a, option_b, is_official, created_at, creator_id')
      .eq('is_official', true)
      .order('created_at', { ascending: false }).limit(1).single(),
  ]);

  // Seed if empty (rare, first-time only)
  let finalCountPolls = countPolls;
  if (!countPolls || countPolls === 0) {
    const { seedInitialTopics } = await import('./actions');
    await seedInitialTopics();
    const { count: newCount } = await supabase.from('polls').select('*', { count: 'exact', head: true });
    finalCountPolls = newCount;
  }

  const stats = {
    totalPolls: finalCountPolls ?? 0,
    totalVotes: countVotes ?? 0,
    totalUsers: countUsers ?? 0
  };

  const commentActivities = (recentComments ?? []).map((c: any) => ({
    type: 'comment',
    created_at: c.created_at,
    username: c.profile?.username || 'Warga Kubu',
    choice: c.choice,
    question: c.poll?.question || 'Topik Opini',
    option_a: c.poll?.option_a,
    option_b: c.poll?.option_b,
    text: c.text
  }));

  const voteActivities = (recentVotes ?? []).map((v: any) => ({
    type: 'vote',
    created_at: v.created_at,
    username: v.profile?.username || 'Warga Kubu',
    choice: v.choice,
    question: v.poll?.question || 'Topik Opini',
    option_a: v.poll?.option_a,
    option_b: v.poll?.option_b
  }));

  const recentActivities = [...commentActivities, ...voteActivities]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Fetch Official Poll
  // === PARALLEL BATCH 2: Community polls + Official poll stats ===
  let communityQuery = supabase
    .from('polls')
    .select('id, question, option_a, option_b, is_official, created_at, creator_id')
    .eq('is_official', false);

  if (searchQuery) {
    communityQuery = communityQuery.ilike('question', `%${searchQuery}%`);
  }

  const officialPollId = (officialData as any)?.id;

  const [communityResult, officialStatsResult] = await Promise.all([
    communityQuery.order('created_at', { ascending: false }).limit(20),
    officialPollId
      ? supabase.from('poll_stats').select('count_a, count_b').eq('poll_id', officialPollId).single()
      : Promise.resolve({ data: null }),
  ]);

  // Build official poll
  let officialPoll: Poll | null = null;
  if (officialData) {
    const poll = officialData as any;
    const pollStats = officialStatsResult.data as RawPollStats | null;
    officialPoll = {
      id: poll.id,
      question: poll.question,
      option_a: poll.option_a,
      option_b: poll.option_b,
      is_official: true,
      created_at: poll.created_at,
      stats: { count_a: pollStats?.count_a ?? 0, count_b: pollStats?.count_b ?? 0 },
    };
  }

  // Build community polls
  const communityPolls: Poll[] = [];
  const communityData = communityResult.data;

  if (communityData && communityData.length > 0) {
    const pollIds = communityData.map((p: any) => p.id);

    // Single batch stats fetch
    const { data: allStatsData } = pollIds.length > 0
      ? await supabase.from('poll_stats').select('poll_id, count_a, count_b').in('poll_id', pollIds)
      : { data: [] };
    const allStats = (allStatsData ?? []) as RawPollStats[];

    for (const poll of communityData as any[]) {
      const stat = allStats.find(s => s.poll_id === poll.id);
      communityPolls.push({
        id: poll.id,
        question: poll.question,
        option_a: poll.option_a,
        option_b: poll.option_b,
        is_official: false,
        created_at: poll.created_at,
        stats: { count_a: stat?.count_a ?? 0, count_b: stat?.count_b ?? 0 },
      });
    }
  }

  return (
    <main className="min-h-screen bg-background relative w-full">
      <HomeClient 
        officialPoll={officialPoll} 
        communityPolls={communityPolls} 
        stats={stats}
        recentActivities={recentActivities}
      />
    </main>
  );
}
