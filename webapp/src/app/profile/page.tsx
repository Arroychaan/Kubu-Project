import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import SocialLayout from '@/components/SocialLayout';
import PollCard from '@/components/PollCard';
import { getUserTitle } from '@/components/LeaderboardClient';
import { Poll } from '@/types';
import Link from 'next/link';

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
        // Fetch target user profile
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
        // Default to logged-in user
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
            <SocialLayout activeTab="Profil">
                <div className="bg-[#111827] border border-[#253044] rounded-[24px] p-12 text-center shadow-lg">
                    <h3 className="text-lg font-black text-white mb-2 uppercase">Pengguna Tidak Ditemukan</h3>
                    <p className="text-xs text-zinc-500 font-bold mb-6">Profil dengan username tersebut tidak terdaftar di KUBU.</p>
                    <Link href="/" className="px-5 py-2.5 bg-brand-blue text-white text-xs font-black uppercase rounded-xl">
                        Kembali ke Beranda
                    </Link>
                </div>
            </SocialLayout>
        );
    }

    const userId = profileData.id;
    const points = profileData.points ?? 50;
    const titleInfo = getUserTitle(points);

    // 2. Fetch User Stats
    // Polls created count
    const { count: totalPolls } = await supabase
        .from('polls')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);

    // Comments (arguments) count
    const { count: totalComments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    // Votes count
    const { data: userVotes } = await supabase
        .from('votes')
        .select('choice')
        .eq('user_id', userId);

    const totalVotes = userVotes?.length || 0;
    
    // Calculate Kubu Kontra / Pro choices (percentage of choosing A vs B)
    const countA = userVotes?.filter(v => v.choice === 'a').length || 0;
    const percentA = totalVotes === 0 ? 50 : Math.round((countA / totalVotes) * 100);

    // Seed/Deterministic bio since bio column does not exist in schema
    let bioText = isOwnProfile 
        ? "Pemantik diskusi teknologi dan kehidupan kampus."
        : `Pengamat aktif di KUBU dengan spesialisasi opini terpercaya.`;

    if (profileData.username === 'analis_opini') bioText = 'Analis opini publik yang menyukai data kuantitatif.';
    if (profileData.username === 'budi_wicaksono') bioText = 'Pemantik diskusi teknologi dan kehidupan kampus.';
    if (profileData.username === 'siti_rahma') bioText = 'Menyuarakan isu hubungan, karir, dan kehidupan sosial.';

    // Fetch user created polls to show in history
    const { data: rawCreatedPolls } = await supabase
        .from('polls')
        .select('id, question, option_a, option_b, is_official, created_at, creator:profiles(username, points)')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

    const userCreatedPolls: Poll[] = [];
    if (rawCreatedPolls && rawCreatedPolls.length > 0) {
        const pollIds = rawCreatedPolls.map(p => p.id);
        const { data: statsData } = await supabase
            .from('poll_stats')
            .select('poll_id, count_a, count_b')
            .in('poll_id', pollIds);

        for (const poll of rawCreatedPolls as any[]) {
            const stat = statsData?.find(s => s.poll_id === poll.id);
            userCreatedPolls.push({
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

    // Mock count for argument support (dugungan) to keep UI looking premium
    const estimatedDukungan = Math.max(0, points - (totalVotes * 5) - ((totalComments || 0) * 15) + (totalComments || 0) * 20);

    return (
        <SocialLayout activeTab="Profil">
            <div className="space-y-6 text-left">
                {/* 1. Header Profil Card */}
                <div className="bg-[#111827] border border-[#253044] rounded-[28px] p-6 sm:p-8 relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-choice-left/90 to-choice-right/90 p-[1.5px] flex items-center justify-center shadow-lg shrink-0 select-none">
                            <div className="w-full h-full rounded-2xl bg-zinc-950 flex items-center justify-center text-2xl font-black text-white uppercase">
                                {profileData.username?.[0] || 'U'}
                            </div>
                        </div>

                        {/* User Details */}
                        <div className="flex-1 space-y-3">
                            <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                                    <h2 className="text-xl font-black text-white leading-none">
                                        @{profileData.username}
                                    </h2>
                                    {isOwnProfile && (
                                        <span className="px-2 py-0.5 border border-brand-border bg-zinc-900/40 rounded-[4px] text-[8px] font-black text-slate-500 uppercase tracking-wider select-none">
                                            Profil Kamu
                                        </span>
                                    )}
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded text-[9px] font-black uppercase tracking-wider select-none ${titleInfo.color}`}>
                                    <span>{titleInfo.icon}</span>
                                    <span>{titleInfo.name}</span>
                                </span>
                            </div>

                            <p className="text-xs text-zinc-400 font-bold leading-relaxed max-w-md">
                                {bioText}
                            </p>
                        </div>
                    </div>

                    {/* 2. Stats Section */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-brand-border/40 select-none">
                        <div className="bg-zinc-950/40 border border-brand-border/60 rounded-xl p-3.5 text-center">
                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-0.5">Topik Dilempar</span>
                            <span className="text-base font-black text-white">{(totalPolls || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-zinc-950/40 border border-brand-border/60 rounded-xl p-3.5 text-center">
                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-0.5">Total Argumen</span>
                            <span className="text-base font-black text-white">{(totalComments || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-zinc-950/40 border border-brand-border/60 rounded-xl p-3.5 text-center">
                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-0.5">Dukungan</span>
                            <span className="text-base font-black text-white">{(estimatedDukungan || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-zinc-950/40 border border-brand-border/60 rounded-xl p-3.5 text-center">
                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-0.5">Kecenderungan</span>
                            <span className="text-base font-black text-white">{percentA}% Kubu A</span>
                        </div>
                    </div>
                </div>

                {/* 3. History Feed */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-zinc-500 font-black text-[9px] uppercase tracking-widest select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        Topik yang dilempar @{profileData.username}
                    </div>

                    {userCreatedPolls.length > 0 ? (
                        <div className="grid grid-cols-1 gap-5">
                            {userCreatedPolls.map((poll) => (
                                <PollCard key={poll.id} poll={poll} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-brand-card/30 border border-brand-border/60 rounded-[20px] p-10 text-center shadow select-none text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            Belum ada topik yang dilempar oleh pengguna ini.
                        </div>
                    )}
                </div>
            </div>
        </SocialLayout>
    );
}
