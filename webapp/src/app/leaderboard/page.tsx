import { getLeaderboard } from '@/app/actions';
import LeaderboardClient from '@/components/LeaderboardClient';

export const metadata = {
    title: 'KUBU - Papan Peringkat',
    description: 'Papan peringkat teratas para pejuang jajak pendapat sosial KUBU.',
};

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
    const result = await getLeaderboard(50);
    const users = result.success && Array.isArray(result.data) ? result.data : [];

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

            {/* Content Container */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <LeaderboardClient users={users} />
            </div>
        </main>
    );
}
