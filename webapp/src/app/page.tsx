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

  // Fetch Official Poll
  let officialPoll: Poll | null = null;
  const { data: officialData } = await supabase
    .from('polls')
    .select('id, question, option_a, option_b, is_official, created_at')
    .eq('is_official', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (officialData) {
    const poll = officialData as RawPoll;

    // Fetch stats for official poll
    const { data: statsData } = await supabase
      .from('poll_stats')
      .select('count_a, count_b')
      .eq('poll_id', poll.id)
      .single();

    const stats = statsData as RawPollStats | null;

    officialPoll = {
      id: poll.id,
      question: poll.question,
      option_a: poll.option_a,
      option_b: poll.option_b,
      is_official: poll.is_official ?? false,
      stats: {
        count_a: stats?.count_a ?? 0,
        count_b: stats?.count_b ?? 0,
      },
    };
  }

  // Fetch Community Polls
  const communityPolls: Poll[] = [];
  let query = supabase
    .from('polls')
    .select('id, question, option_a, option_b, is_official, created_at')
    .eq('is_official', false);

  if (searchQuery) {
    query = query.ilike('question', `%${searchQuery}%`);
  }

  const { data: communityData } = await query
    .order('created_at', { ascending: false })
    .limit(10);

  if (communityData && Array.isArray(communityData) && communityData.length > 0) {
    const polls = communityData as RawPoll[];

    // Fetch stats for all community polls
    const pollIds = polls.map(p => p.id);
    const { data: allStatsData } = await supabase
      .from('poll_stats')
      .select('poll_id, count_a, count_b')
      .in('poll_id', pollIds);

    const allStats = (allStatsData ?? []) as RawPollStats[];

    for (const poll of polls) {
      const stat = allStats.find(s => s.poll_id === poll.id);
      communityPolls.push({
        id: poll.id,
        question: poll.question,
        option_a: poll.option_a,
        option_b: poll.option_b,
        is_official: poll.is_official ?? false,
        stats: {
          count_a: stat?.count_a ?? 0,
          count_b: stat?.count_b ?? 0,
        },
      });
    }
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle Atmospheric Gradient Overlays */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-choice-right/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-choice-left/5 rounded-full blur-[100px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.4] -z-10"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <HomeClient officialPoll={officialPoll} communityPolls={communityPolls} />
      </div>
    </main>
  );
}
