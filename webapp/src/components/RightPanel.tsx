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

        <div className="space-y-4 text-left">
            {/* 1. Hot Topics Section */}
            <div className="bg-zinc-900/40 border border-brand-border rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-lg text-white">Sedang Tren</h3>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="space-y-2 py-2">
                            <div className="h-3.5 bg-zinc-800 rounded animate-pulse w-3/4" />
                            <div className="h-3.5 bg-zinc-800 rounded animate-pulse w-5/6" />
                        </div>
                    ) : hotTopics.length > 0 ? (
                        hotTopics.map((topic, idx) => {
                            const total = (topic.stats?.count_a || 0) + (topic.stats?.count_b || 0);
                            return (
                                <div
                                    key={topic.id}
                                    onClick={() => scrollToTopic(topic.id)}
                                    className="block group cursor-pointer text-left"
                                >
                                    <span className="text-[13px] text-zinc-500 block mb-0.5">
                                        Tren {idx + 1}
                                    </span>
                                    <h4 className="text-[15px] font-bold text-white leading-snug group-hover:text-brand-blue line-clamp-2">
                                        {topic.question}
                                    </h4>
                                    <span className="text-[13px] text-zinc-500 block mt-0.5">
                                        {total.toLocaleString()} suara
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-[14px] text-zinc-500">Belum ada topik panas.</p>
                    )}
                </div>
            </div>

            {/* 2. Leading Sides Section */}
            {hotTopics.length > 0 && (
                <div className="bg-zinc-900/40 border border-brand-border rounded-2xl p-4 space-y-3">
                    <h3 className="font-bold text-lg text-white">Posisi Teratas</h3>

                    <div className="space-y-4">
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
                                <div key={topic.id} className="space-y-1.5">
                                    <h5 className="text-[14px] font-bold text-white leading-tight line-clamp-2">
                                        {topic.question}
                                    </h5>
                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className={leadingSide.isLeft ? 'text-choice-left font-bold' : leadingSide.isLeft === false ? 'text-choice-right font-bold' : 'text-zinc-500'}>
                                            {leadingSide.name}
                                        </span>
                                        <span className="text-zinc-400">{leadingSide.percent}%</span>
                                    </div>
                                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden flex mt-1">
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
            <div className="bg-zinc-900/40 border border-brand-border rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-lg text-white">Pengguna Berpengaruh</h3>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="space-y-2 py-2">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-zinc-800 rounded-full animate-pulse" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 bg-zinc-800 rounded animate-pulse w-3/4" />
                                    <div className="h-2.5 bg-zinc-800 rounded animate-pulse w-1/2" />
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
                                    className="flex items-center gap-3 group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
                                        {user.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[15px] font-bold text-white group-hover:underline truncate">
                                                {user.username || 'Anonymous'}
                                            </span>
                                            {idx === 0 && <span className="text-amber-500 text-xs">⭐</span>}
                                        </div>
                                        <span className="text-[13px] text-zinc-500 block truncate">
                                            @{user.username || 'anonymous'} • {titleInfo.name}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        <p className="text-[14px] text-zinc-500">Belum ada pengguna berpengaruh.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
