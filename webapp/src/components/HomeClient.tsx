'use client';

import { useRouter } from 'next/navigation';
import PollCard from './PollCard';
import CreatePollModal from './CreatePollModal';
import { Poll } from '@/types';

interface HomeClientProps {
    officialPoll: Poll | null;
    communityPolls: Poll[];
}

export default function HomeClient({ officialPoll, communityPolls }: HomeClientProps) {
    const router = useRouter();

    const handlePollCreated = () => {
        // Refresh the page to show new poll
        router.refresh();
    };

    return (
        <>
            {/* Hero Section - Official Daily War */}
            <section className="mb-12 md:mb-16">
                <div className="text-center mb-8">
                    <h2 className="text-sm md:text-base font-bold text-neon-pink uppercase tracking-[0.3em] mb-2">
                        Today&apos;s Battle
                    </h2>
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-4 bg-gradient-to-r from-neon-pink via-white to-neon-cyan bg-clip-text text-transparent">
                        THE OFFICIAL WAR
                    </h1>
                    <p className="text-white/50 text-sm md:text-base max-w-md mx-auto">
                        Pick your side. Watch the dominance unfold in real-time.
                    </p>
                </div>

                {officialPoll ? (
                    <PollCard poll={officialPoll} isHero={true} />
                ) : (
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center">
                        <p className="text-white/50 text-lg">No official war today. Check back soon!</p>
                    </div>
                )}
            </section>

            {/* Community Polls Section */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white">Community Wars</h2>
                        <p className="text-white/40 text-sm">Battles started by the people</p>
                    </div>
                </div>

                {communityPolls.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {communityPolls.map((poll) => (
                            <PollCard key={poll.id} poll={poll} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center">
                        <p className="text-white/50">No community polls yet. Be the first to start a war!</p>
                    </div>
                )}
            </section>

            {/* Create Poll Modal */}
            <CreatePollModal onPollCreated={handlePollCreated} />
        </>
    );
}
