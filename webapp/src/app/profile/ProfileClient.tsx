'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus, UserCheck, Calendar, MapPin, Link as LinkIcon, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import SocialLayout from '@/components/SocialLayout';
import PollCard from '@/components/PollCard';
import { getUserTitle } from '@/components/LeaderboardClient';
import { Poll } from '@/types';
import { followUser, unfollowUser, getUserComments, getUserVotes } from '@/app/actions';

interface ProfileData {
    id: string;
    username: string | null;
    points: number | null;
    is_admin: boolean | null;
    created_at?: string;
}

interface ProfileStats {
    points: number;
    totalPolls: number;
    totalComments: number;
    followers: number;
    following: number;
}

interface ProfileClientProps {
    profileData: ProfileData;
    isOwnProfile: boolean;
    stats: ProfileStats;
    initialPolls: Poll[];
    isFollowingInitial: boolean;
    bioText: string;
}

type TabType = 'topik' | 'argumen' | 'suara';

export default function ProfileClient({ 
    profileData, 
    isOwnProfile, 
    stats, 
    initialPolls, 
    isFollowingInitial,
    bioText
}: ProfileClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    
    // States
    const [activeTab, setActiveTab] = useState<TabType>('topik');
    const [isFollowing, setIsFollowing] = useState(isFollowingInitial);
    const [followerCount, setFollowerCount] = useState(stats.followers);
    
    // Tab data states
    const [polls] = useState<Poll[]>(initialPolls);
    const [comments, setComments] = useState<any[]>([]);
    const [votes, setVotes] = useState<any[]>([]);
    const [isLoadingTab, setIsLoadingTab] = useState(false);

    const titleInfo = getUserTitle(profileData.points ?? 50);
    const joinedDate = profileData.created_at ? new Date(profileData.created_at) : new Date();

    const handleFollowToggle = async () => {
        if (isPending) return;
        
        // Optimistic UI update
        const newState = !isFollowing;
        setIsFollowing(newState);
        setFollowerCount(prev => newState ? prev + 1 : prev - 1);

        startTransition(async () => {
            const action = newState ? followUser : unfollowUser;
            const res = await action(profileData.id);
            if (!res.success) {
                // Revert if failed
                setIsFollowing(!newState);
                setFollowerCount(prev => !newState ? prev + 1 : prev - 1);
            }
            router.refresh();
        });
    };

    const handleTabChange = async (tab: TabType) => {
        setActiveTab(tab);
        
        if (tab === 'argumen' && comments.length === 0) {
            setIsLoadingTab(true);
            const res = await getUserComments(profileData.id);
            if (res.success && res.data) setComments(res.data as any[]);
            setIsLoadingTab(false);
        } else if (tab === 'suara' && votes.length === 0) {
            setIsLoadingTab(true);
            const res = await getUserVotes(profileData.id);
            if (res.success && res.data) setVotes(res.data as any[]);
            setIsLoadingTab(false);
        }
    };

    return (
        <SocialLayout activeTab="Profil">
            <div className="bg-background min-h-screen pb-20 sm:pb-0 relative">
                
                {/* 1. Header Navigation (X Style) */}
                <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-brand-border">
                    <div className="px-4 py-2 flex items-center gap-6 h-[53px]">
                        <button 
                            onClick={() => router.back()} 
                            className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-lg font-bold text-white leading-tight">
                                {profileData.username || 'Anonymous'}
                            </h2>
                            <span className="text-xs text-zinc-500">
                                {stats.totalPolls} Topik
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Banner / Cover Photo */}
                <div className="h-32 sm:h-48 w-full bg-gradient-to-r from-brand-blue/20 via-indigo-900/40 to-brand-blue/20 relative">
                    {/* Placeholder for future cover image */}
                </div>

                {/* 3. Profile Info Section */}
                <div className="px-4 pb-4">
                    {/* Avatar & Action Button Row */}
                    <div className="flex justify-between items-start relative">
                        {/* Overlapping Avatar */}
                        <div className="relative -mt-12 sm:-mt-16 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
                            <div className="w-full h-full bg-gradient-to-br from-choice-left to-choice-right flex items-center justify-center text-4xl sm:text-5xl font-black text-white uppercase shadow-inner">
                                {profileData.username?.[0] || 'U'}
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="pt-3">
                            {isOwnProfile ? (
                                <button className="px-4 py-1.5 border border-zinc-600 rounded-full text-white font-bold text-sm hover:bg-zinc-900 transition-colors">
                                    Edit profil
                                </button>
                            ) : (
                                <button 
                                    onClick={handleFollowToggle}
                                    disabled={isPending}
                                    className={`px-4 py-1.5 rounded-full font-bold text-sm transition-colors flex items-center gap-1.5 ${
                                        isFollowing 
                                            ? 'bg-transparent border border-zinc-600 text-white hover:border-red-500 hover:text-red-500 hover:bg-red-500/10' 
                                            : 'bg-white text-black hover:bg-zinc-200'
                                    }`}
                                >
                                    {isFollowing ? (
                                        <>Mengikuti</>
                                    ) : (
                                        <>Ikuti</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Name & Bio */}
                    <div className="mt-3">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-white leading-tight">
                                {profileData.username || 'Anonymous'}
                            </h1>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${titleInfo.color}`}>
                                {titleInfo.icon} {titleInfo.name}
                            </span>
                        </div>
                        <p className="text-[15px] text-zinc-500 mt-0.5">
                            @{profileData.username || 'anonymous'}
                        </p>
                    </div>

                    <div className="mt-3 text-[15px] text-zinc-100 leading-snug">
                        {bioText}
                    </div>

                    {/* Metadata (Joined Date, etc) */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-zinc-500">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Bergabung {format(joinedDate, 'MMMM yyyy', { locale: idLocale })}</span>
                        </div>
                    </div>

                    {/* Stats (Following/Followers) */}
                    <div className="flex items-center gap-5 mt-3 text-sm">
                        <div className="flex items-center gap-1 hover:underline cursor-pointer">
                            <span className="font-bold text-white">{stats.following}</span>
                            <span className="text-zinc-500">Mengikuti</span>
                        </div>
                        <div className="flex items-center gap-1 hover:underline cursor-pointer">
                            <span className="font-bold text-white">{followerCount}</span>
                            <span className="text-zinc-500">Pengikut</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-white">{stats.points}</span>
                            <span className="text-zinc-500">Poin</span>
                        </div>
                    </div>
                </div>

                {/* 4. Tabs */}
                <div className="flex w-full border-b border-brand-border mt-2">
                    <button 
                        onClick={() => handleTabChange('topik')}
                        className={`flex-1 hover:bg-zinc-900/50 transition-colors py-3.5 text-[15px] font-medium relative ${activeTab === 'topik' ? 'text-white font-bold' : 'text-zinc-500'}`}
                    >
                        Topik
                        {activeTab === 'topik' && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-brand-blue rounded-t-full" />
                        )}
                    </button>
                    <button 
                        onClick={() => handleTabChange('argumen')}
                        className={`flex-1 hover:bg-zinc-900/50 transition-colors py-3.5 text-[15px] font-medium relative ${activeTab === 'argumen' ? 'text-white font-bold' : 'text-zinc-500'}`}
                    >
                        Argumen
                        {activeTab === 'argumen' && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-brand-blue rounded-t-full" />
                        )}
                    </button>
                    <button 
                        onClick={() => handleTabChange('suara')}
                        className={`flex-1 hover:bg-zinc-900/50 transition-colors py-3.5 text-[15px] font-medium relative ${activeTab === 'suara' ? 'text-white font-bold' : 'text-zinc-500'}`}
                    >
                        Suara
                        {activeTab === 'suara' && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-brand-blue rounded-t-full" />
                        )}
                    </button>
                </div>

                {/* 5. Tab Content */}
                <div className="min-h-[50vh]">
                    {isLoadingTab ? (
                        <div className="p-8 flex justify-center">
                            <div className="w-6 h-6 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {activeTab === 'topik' && (
                                polls.length > 0 ? (
                                    <div className="divide-y divide-brand-border/40">
                                        {polls.map((poll) => (
                                            <div key={poll.id} className="p-4 sm:p-5 hover:bg-zinc-900/20 transition-colors">
                                                <PollCard poll={poll} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-10 text-center text-zinc-500 text-[15px]">
                                        Belum ada topik yang dilempar.
                                    </div>
                                )
                            )}

                            {activeTab === 'argumen' && (
                                comments.length > 0 ? (
                                    <div className="divide-y divide-brand-border/40">
                                        {comments.map((comment) => (
                                            <div key={comment.id} className="p-4 sm:p-5 hover:bg-zinc-900/30 transition-colors cursor-pointer" onClick={() => router.push(`/?pollId=${comment.poll.id}`)}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded">Berargumen pada topik:</span>
                                                    <span className="text-[13px] text-brand-blue font-semibold truncate flex-1">
                                                        "{comment.poll.question}"
                                                    </span>
                                                </div>
                                                <p className="text-[15px] text-white leading-relaxed">
                                                    {comment.content}
                                                </p>
                                                <div className="mt-2 text-xs text-zinc-500">
                                                    {format(new Date(comment.created_at), 'd MMM', { locale: idLocale })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-10 text-center text-zinc-500 text-[15px]">
                                        Belum ada argumen yang diberikan.
                                    </div>
                                )
                            )}

                            {activeTab === 'suara' && (
                                votes.length > 0 ? (
                                    <div className="divide-y divide-brand-border/40">
                                        {votes.map((vote, idx) => (
                                            <div key={idx} className="p-4 sm:p-5 hover:bg-zinc-900/30 transition-colors cursor-pointer flex flex-col gap-2" onClick={() => router.push(`/?pollId=${vote.poll.id}`)}>
                                                <div className="text-[13px] text-zinc-400">
                                                    Memberikan suara pada topik:
                                                </div>
                                                <div className="text-[15px] font-bold text-white leading-snug">
                                                    "{vote.poll.question}"
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-zinc-800 text-white">
                                                        Kubu {vote.choice.toUpperCase()}
                                                    </span>
                                                    <span className="text-xs text-zinc-500">
                                                        • {format(new Date(vote.created_at), 'd MMM', { locale: idLocale })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-10 text-center text-zinc-500 text-[15px]">
                                        Belum ada suara yang diberikan.
                                    </div>
                                )
                            )}
                        </>
                    )}
                </div>

            </div>
        </SocialLayout>
    );
}
