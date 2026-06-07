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

  // Fetch Database Statistics
  let { count: countPolls } = await supabase
    .from('polls')
    .select('*', { count: 'exact', head: true });
    
  if (!countPolls || countPolls === 0) {
    const { seedInitialTopics } = await import('./actions');
    await seedInitialTopics();
    
    const { count: newCount } = await supabase
      .from('polls')
      .select('*', { count: 'exact', head: true });
    countPolls = newCount;
  }
    
  const { count: countVotes } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true });

  const { count: countUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const stats = {
    totalPolls: countPolls ?? 0,
    totalVotes: countVotes ?? 0,
    totalUsers: countUsers ?? 0
  };

  // Fetch Recent Activities (votes + comments) for static ticker
  const { data: recentComments } = await supabase
    .from('comments')
    .select('created_at, text, choice, poll:polls(question, option_a, option_b), profile:profiles(username)')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: recentVotes } = await supabase
    .from('votes')
    .select('created_at, choice, poll:polls(question, option_a, option_b), profile:profiles(username)')
    .order('created_at', { ascending: false })
    .limit(5);

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
  let officialPoll: Poll | null = null;
  const { data: officialData } = await supabase
    .from('polls')
    .select('id, question, option_a, option_b, is_official, created_at, is_featured, is_hidden_from_home, creator:profiles(username, points)')
    .eq('is_official', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (officialData) {
    const poll = officialData as any;

    // Fetch stats for official poll
    const { data: statsData } = await supabase
      .from('poll_stats')
      .select('count_a, count_b')
      .eq('poll_id', poll.id)
      .single();

    const pollStats = statsData as RawPollStats | null;

    officialPoll = {
      id: poll.id,
      question: poll.question,
      option_a: poll.option_a,
      option_b: poll.option_b,
      is_official: poll.is_official ?? false,
      created_at: poll.created_at,
      is_featured: poll.is_featured ?? false,
      is_hidden_from_home: poll.is_hidden_from_home ?? false,
      creator: poll.creator,
      stats: {
        count_a: pollStats?.count_a ?? 0,
        count_b: pollStats?.count_b ?? 0,
      },
    };
  }

  // Fetch Community Polls
  const communityPolls: Poll[] = [];
  let query = supabase
    .from('polls')
    .select('id, question, option_a, option_b, is_official, created_at, is_featured, is_hidden_from_home, creator:profiles(username, points)')
    .eq('is_official', false);

  if (searchQuery) {
    query = query.ilike('question', `%${searchQuery}%`);
  }

  const { data: communityData } = await query
    .order('created_at', { ascending: false })
    .limit(30); // fetch more to allow filtering

  if (communityData && Array.isArray(communityData) && communityData.length > 0) {
    const polls = communityData as any[];
    
    // Programmatic filter for hidden polls + curation
    const filteredPolls = polls.filter(p => p.is_hidden_from_home !== true);

    // Fetch stats for all community polls
    const pollIds = filteredPolls.map(p => p.id);
    
    let allStats: RawPollStats[] = [];
    if (pollIds.length > 0) {
      const { data: allStatsData } = await supabase
        .from('poll_stats')
        .select('poll_id, count_a, count_b')
        .in('poll_id', pollIds);
      allStats = (allStatsData ?? []) as RawPollStats[];
    }

    for (const poll of filteredPolls) {
      const stat = allStats.find(s => s.poll_id === poll.id);
      communityPolls.push({
        id: poll.id,
        question: poll.question,
        option_a: poll.option_a,
        option_b: poll.option_b,
        is_official: poll.is_official ?? false,
        created_at: poll.created_at,
        is_featured: poll.is_featured ?? false,
        is_hidden_from_home: poll.is_hidden_from_home ?? false,
        creator: poll.creator,
        stats: {
          count_a: stat?.count_a ?? 0,
          count_b: stat?.count_b ?? 0,
        },
      });
    }

    // Sort: is_featured DESC, created_at DESC
    communityPolls.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    });
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">


      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <HomeClient 
          officialPoll={officialPoll} 
          communityPolls={communityPolls} 
          stats={stats}
          recentActivities={recentActivities}
        />
      </div>
    </main>
  );
}
