'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, Users, Trophy, MessageSquare } from 'lucide-react';
import { getCommunityPolls, getLeaderboard } from '@/app/actions';
import { Poll } from '@/types';
import { getUserTitle } from './LeaderboardClient';

export default function RightPanel() {
    const [hotTopics, setHotTopics] = useState<Poll[]>([]);
    const [influentialUsers, setInfluentialUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch hot topics (first 3 from community polls)
                const { success: pollsSuccess, data: pollsData } = await getCommunityPolls(5, 0);
                if (pollsSuccess && pollsData) {
                    const polls = (pollsData as Poll[]).filter(p => !p.is_official).slice(0, 3);
                    setHotTopics(polls);
                }

                // Fetch top 3 users from leaderboard
                const { success: leaderboardSuccess, data: leaderboardData } = await getLeaderboard(3);
                if (leaderboardSuccess && leaderboardData) {
                    setInfluentialUsers(leaderboardData as any[]);
                }
            } catch (err) {
                console.error('Error fetching RightPanel data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Helper: Scroll to topic card
    const scrollToTopic = (id: string) => {
        const element = document.getElementById(`poll-${id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('border-brand-blue');
            setTimeout(() => {
                element.classList.remove('border-brand-blue');
            }, 2000);
        }
    };

    return (
        <div className="space-y-6 text-left select-none">
            {/* 1. Hot Topics Section */}
            <div className="bg-zinc-950/20 border border-brand-border/60 rounded-[20px] p-4.5 space-y-3.5">
                <div className="flex items-center gap-2 text-zinc-400 font-black text-[10px] uppercase tracking-widest border-b border-brand-border/40 pb-2">
                    <Flame className="w-4 h-4 text-rose-500" />
                    <span>Lagi Panas</span>
                </div>

                <div className="space-y-3">
                    {isLoading ? (
                        <div className="space-y-2 py-2">
                            <div className="h-3.5 bg-zinc-900 border border-brand-border rounded animate-pulse w-3/4" />
                            <div className="h-3.5 bg-zinc-900 border border-brand-border rounded animate-pulse w-5/6" />
                        </div>
                    ) : hotTopics.length > 0 ? (
                        hotTopics.map((topic) => {
                            const total = (topic.stats?.count_a || 0) + (topic.stats?.count_b || 0);
                            return (
                                <div
                                    key={topic.id}
                                    onClick={() => scrollToTopic(topic.id)}
                                    className="block group cursor-pointer text-left py-1"
                                >
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-0.5 group-hover:text-brand-blue transition-colors">
                                        Topik Terkini
                                    </span>
                                    <h4 className="text-xs font-semibold text-white leading-snug group-hover:underline line-clamp-2">
                                        {topic.question}
                                    </h4>
                                    <span className="text-[9px] text-zinc-500 font-bold block mt-1">
                                        🔥 {total.toLocaleString()} suara masuk
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-[10px] text-zinc-500 font-bold italic py-2">Belum ada topik panas.</p>
                    )}
                </div>
            </div>

            {/* 2. Leading Sides Section */}
            {hotTopics.length > 0 && (
                <div className="bg-zinc-950/20 border border-brand-border/60 rounded-[20px] p-4.5 space-y-3.5">
                    <div className="flex items-center gap-2 text-zinc-400 font-black text-[10px] uppercase tracking-widest border-b border-brand-border/40 pb-2">
                        <Users className="w-4 h-4 text-emerald-500" />
                        <span>Kubu yang sedang unggul</span>
                    </div>

                    <div className="space-y-3">
                        {hotTopics.slice(0, 2).map((topic) => {
                            const countA = topic.stats?.count_a || 0;
                            const countB = topic.stats?.count_b || 0;
                            const total = countA + countB;
                            const percentA = total === 0 ? 50 : Math.round((countA / total) * 100);
                            const percentB = total === 0 ? 50 : Math.round((countB / total) * 100);

                            const leadingSide = percentA > percentB 
                                ? { name: topic.option_a, percent: percentA, isLeft: true }
                                : percentB > percentA 
                                ? { name: topic.option_b, percent: percentB, isLeft: false }
                                : { name: 'Seimbang', percent: 50, isLeft: null };

                            return (
                                <div key={topic.id} className="space-y-1.5 py-1">
                                    <h5 className="text-[11px] font-bold text-white leading-tight truncate">
                                        {topic.question}
                                    </h5>
                                    <div className="flex items-center justify-between text-[9px] font-black uppercase">
                                        <span className={leadingSide.isLeft ? 'text-choice-left' : leadingSide.isLeft === false ? 'text-choice-right' : 'text-zinc-400'}>
                                            {leadingSide.name}
                                        </span>
                                        <span className="text-white">{leadingSide.percent}% unggul</span>
                                    </div>
                                    {/* Mini percentage bar */}
                                    <div className="w-full h-1 bg-zinc-900 border border-brand-border/40 rounded-full overflow-hidden flex">
                                        <div 
                                            className="h-full bg-choice-left transition-all duration-300"
                                            style={{ width: `${percentA}%` }}
                                        />
                                        <div 
                                            className="h-full bg-choice-right transition-all duration-300"
                                            style={{ width: `${percentB}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 3. Influential Users Section */}
            <div className="bg-zinc-950/20 border border-brand-border/60 rounded-[20px] p-4.5 space-y-3.5">
                <div className="flex items-center gap-2 text-zinc-400 font-black text-[10px] uppercase tracking-widest border-b border-brand-border/40 pb-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Orang Paling Berpengaruh</span>
                </div>

                <div className="space-y-3">
                    {isLoading ? (
                        <div className="space-y-2 py-2">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-zinc-900 border border-brand-border rounded animate-pulse" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 bg-zinc-900 border border-brand-border rounded animate-pulse w-3/4" />
                                    <div className="h-2.5 bg-zinc-900 border border-brand-border rounded animate-pulse w-1/2" />
                                </div>
                            </div>
                        </div>
                    ) : influentialUsers.length > 0 ? (
                        influentialUsers.map((user, idx) => {
                            const titleInfo = getUserTitle(user.points || 0);
                            return (
                                <Link 
                                    key={user.id} 
                                    href={`/profile?username=${user.username}`} 
                                    className="flex items-center gap-3 py-1 group"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-brand-border flex items-center justify-center text-[10px] font-black text-slate-300 uppercase shrink-0">
                                        {user.username?.[0] || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-white group-hover:underline truncate">
                                                @{user.username || 'Anonymous'}
                                            </span>
                                            <span className="text-[8px] text-zinc-500 font-bold shrink-0">
                                                #{idx + 1}
                                            </span>
                                        </div>
                                        <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block mt-0.5">
                                            {titleInfo.name}
                                        </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-[10px] font-black text-white">
                                            🪙 {(user.points || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        <p className="text-[10px] text-zinc-500 font-bold italic py-2">Belum ada pengguna berpengaruh.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
