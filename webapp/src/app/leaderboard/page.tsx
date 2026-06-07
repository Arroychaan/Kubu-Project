import { getLeaderboard } from '@/app/actions';
import LeaderboardClient from '@/components/LeaderboardClient';
import SocialLayout from '@/components/SocialLayout';

export const metadata = {
    title: 'KUBU - Peringkat Pengaruh',
    description: 'Lihat siapa yang opininya paling banyak menggerakkan diskusi minggu ini.',
};

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
    const result = await getLeaderboard(50);
    const users = result.success && Array.isArray(result.data) ? result.data : [];

    return (
        <SocialLayout activeTab="Peringkat">
            <LeaderboardClient users={users} />
        </SocialLayout>
    );
}
