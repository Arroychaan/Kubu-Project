import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Poll } from '@/types';
import ProfileClient from './ProfileClient';

interface ProfilePageProps {
    searchParams: Promise<{ username?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ProfilePage(props: ProfilePageProps) {
    const searchParams = await props.searchParams;
    const targetUsername = searchParams.username || '';
    const supabase = await createSupabaseServerClient();

    // 1. Get Logged-in User Session
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    let profileData = null;
    let isOwnProfile = false;

    if (targetUsername) {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', targetUsername)
            .single();
        profileData = data;
        
        if (currentUser && profileData && currentUser.id === profileData.id) {
            isOwnProfile = true;
        }
    } else {
        if (!currentUser) {
            redirect('/auth/login');
        }
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        profileData = data;
        isOwnProfile = true;
    }

    if (!profileData) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">Pengguna Tidak Ditemukan</h3>
                    <p className="text-zinc-500 mb-6">Profil dengan username tersebut tidak terdaftar di KUBU.</p>
                    <a href="/" className="px-5 py-2.5 bg-brand-blue text-white text-sm font-bold rounded-full">
                        Kembali ke Beranda
                    </a>
                </div>
            </div>
        );
    }

    const userId = profileData.id;
    const points = profileData.points ?? 50;

    // 2. Fetch User Stats
    const { count: totalPolls } = await supabase
        .from('polls')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);

    const { count: totalComments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

    const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

    // 3. Fetch Initial Tab Data (Topik)
    const { data: rawCreatedPolls } = await supabase
        .from('polls')
        .select('id, question, option_a, option_b, is_official, created_at, creator:profiles(username, points)')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

    const initialPolls: Poll[] = [];
    if (rawCreatedPolls && rawCreatedPolls.length > 0) {
        const pollIds = rawCreatedPolls.map(p => p.id);
        const { data: statsData } = await supabase
            .from('poll_stats')
            .select('poll_id, count_a, count_b')
            .in('poll_id', pollIds);

        for (const poll of rawCreatedPolls as any[]) {
            const stat = statsData?.find(s => s.poll_id === poll.id);
            initialPolls.push({
                id: poll.id,
                question: poll.question,
                option_a: poll.option_a,
                option_b: poll.option_b,
                is_official: poll.is_official ?? false,
                created_at: poll.created_at,
                creator: poll.creator,
                stats: {
                    count_a: stat?.count_a ?? 0,
                    count_b: stat?.count_b ?? 0
                }
            });
        }
    }

    // 4. Check Following Status (if looking at someone else's profile)
    let isFollowingInitial = false;
    if (!isOwnProfile && currentUser) {
        const { count } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', currentUser.id)
            .eq('following_id', userId);
        isFollowingInitial = (count || 0) > 0;
    }

    // Bio
    let bioText = isOwnProfile 
        ? "Pemantik diskusi teknologi dan kehidupan kampus."
        : `Pengamat aktif di KUBU dengan spesialisasi opini terpercaya.`;

    if (profileData.username === 'analis_opini') bioText = 'Analis opini publik yang menyukai data kuantitatif.';
    if (profileData.username === 'budi_wicaksono') bioText = 'Pemantik diskusi teknologi dan kehidupan kampus.';
    if (profileData.username === 'siti_rahma') bioText = 'Menyuarakan isu hubungan, karir, dan kehidupan sosial.';

    return (
        <ProfileClient 
            profileData={profileData}
            isOwnProfile={isOwnProfile}
            stats={{
                points,
                totalPolls: totalPolls || 0,
                totalComments: totalComments || 0,
                followers: followersCount || 0,
                following: followingCount || 0
            }}
            initialPolls={initialPolls}
            isFollowingInitial={isFollowingInitial}
            bioText={bioText}
        />
    );
}
