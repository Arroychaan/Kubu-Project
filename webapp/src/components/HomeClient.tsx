'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import PollCard from './PollCard';
import { Poll } from '@/types';
import { Flame, Zap, Image as ImageIcon, BarChart2, Smile, Calendar, MapPin } from 'lucide-react';
import { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import SocialLayout from './SocialLayout';
import OnboardingWizard from './OnboardingWizard';

interface HomeClientProps {
    officialPoll: Poll | null;
    communityPolls: Poll[];
    stats: {
        totalPolls: number;
        totalVotes: number;
        totalUsers: number;
    };
    recentActivities: any[];
}

export default function HomeClient({ officialPoll, communityPolls, stats, recentActivities }: HomeClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') === 'panas' ? 'panas' : 'terbaru';

    const [activityIndex, setActivityIndex] = useState(0);
    const { user } = useAuthStore();
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Check for onboarding status on client mount
    useEffect(() => {
        if (user) {
            const completed = localStorage.getItem(`kubu_onboarding_completed_${user.id}`);
            if (completed !== 'true') {
                setShowOnboarding(true);
            }
        }
    }, [user]);

    useEffect(() => {
        if (recentActivities.length <= 1) return;
        const interval = setInterval(() => {
            setActivityIndex((prev) => (prev + 1) % recentActivities.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [recentActivities.length]);

    // Filter community polls based on activeTab
    const filteredPolls = activeTab === 'panas'
        ? [...communityPolls].sort((a, b) => {
              const totalA = (a.stats?.count_a || 0) + (a.stats?.count_b || 0);
              const totalB = (b.stats?.count_a || 0) + (b.stats?.count_b || 0);
              return totalB - totalA; // Hot topics have most votes
          })
        : communityPolls;

    const [isPending, startTransition] = useTransition();
    const [optimisticTab, setOptimisticTab] = useState(activeTab);

    useEffect(() => {
        setOptimisticTab(activeTab);
    }, [activeTab]);

    const handleTabChange = (newTab: 'terbaru' | 'panas') => {
        if (optimisticTab === newTab) return;
        setOptimisticTab(newTab);
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (newTab === 'terbaru') params.delete('tab');
            else params.set('tab', 'panas');
            router.push(`/?${params.toString()}`);
        });
    };

    return (
        <SocialLayout activeTab={optimisticTab === 'panas' ? 'Topik Panas' : 'Beranda'}>
            {/* Onboarding Wizard Modal overlay */}
            {user && showOnboarding && (
                <OnboardingWizard userId={user.id} onComplete={() => setShowOnboarding(false)} />
            )}

            {/* Custom Tabs (Untuk Kamu & Terbaru) */}
            <div className="flex w-full border-b border-brand-border sticky top-0 bg-background/80 backdrop-blur-md z-20">
                <button
                    onClick={() => handleTabChange('terbaru')}
                    className="flex-1 flex justify-center hover:bg-zinc-900/40 transition-colors cursor-pointer"
                >
                    <div className={`py-4 text-[15px] font-bold relative ${
                        optimisticTab === 'terbaru' ? 'text-white' : 'text-zinc-500 font-medium'
                    }`}>
                        Untuk Kamu
                        {optimisticTab === 'terbaru' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue rounded-t-full" />
                        )}
                    </div>
                </button>
                <button
                    onClick={() => handleTabChange('panas')}
                    className="flex-1 flex justify-center hover:bg-zinc-900/40 transition-colors cursor-pointer"
                >
                    <div className={`py-4 text-[15px] font-bold relative ${
                        optimisticTab === 'panas' ? 'text-white' : 'text-zinc-500 font-medium'
                    }`}>
                        Topik Panas
                        {optimisticTab === 'panas' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue rounded-t-full" />
                        )}
                    </div>
                </button>
            </div>


            {/* Compose Section (Twitter Style) */}
            <section className="px-4 py-4 sm:py-5 border-b border-brand-border bg-background flex gap-3 sm:gap-4">
                {/* Avatar */}
                <div className="shrink-0">
                    <div 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-choice-left to-choice-right p-[1.5px] cursor-pointer shadow-md" 
                        onClick={() => router.push(user ? '/profile' : '/auth/login')}
                    >
                        <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-white font-black text-lg uppercase select-none">
                            {user?.user_metadata?.username?.[0] || user?.email?.[0] || 'U'}
                        </div>
                    </div>
                </div>
                
                {/* Compose Input & Actions */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div 
                        onClick={() => router.push('/create')}
                        className="w-full text-left py-2 sm:py-3 text-lg sm:text-xl text-zinc-500 font-medium cursor-text"
                    >
                        Apa topik yang sedang terjadi?
                    </div>

                    <div className="flex items-center justify-between mt-2 sm:mt-3 pt-1">
                        {/* Icons */}
                        <div className="flex items-center gap-1 sm:gap-1.5 text-brand-blue -ml-2">
                            <button className="p-2 hover:bg-brand-blue/10 rounded-full transition-colors hidden sm:block" onClick={() => router.push('/create')}>
                                <ImageIcon className="w-[18px] h-[18px]" />
                            </button>
                            <button className="p-2 hover:bg-brand-blue/10 rounded-full transition-colors hidden sm:block" onClick={() => router.push('/create')}>
                                <div className="w-[18px] h-[18px] border-[1.5px] border-current rounded-sm flex items-center justify-center font-bold text-[9px]">GIF</div>
                            </button>
                            <button className="p-2 hover:bg-brand-blue/10 rounded-full transition-colors" onClick={() => router.push('/create')}>
                                <BarChart2 className="w-[18px] h-[18px]" />
                            </button>
                            <button className="p-2 hover:bg-brand-blue/10 rounded-full transition-colors" onClick={() => router.push('/create')}>
                                <Smile className="w-[18px] h-[18px]" />
                            </button>
                            <button className="p-2 hover:bg-brand-blue/10 rounded-full transition-colors hidden sm:block" onClick={() => router.push('/create')}>
                                <Calendar className="w-[18px] h-[18px]" />
                            </button>
                            <button className="p-2 hover:bg-brand-blue/10 rounded-full transition-colors hidden sm:block" onClick={() => router.push('/create')}>
                                <MapPin className="w-[18px] h-[18px]" />
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button 
                            onClick={() => router.push('/create')}
                            className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-[13px] sm:text-[15px] transition-colors shadow-sm"
                        >
                            Lempar Topik
                        </button>
                    </div>
                </div>
            </section>


            {/* Feed List */}
            <div id="opinion-feed" className="space-y-6 scroll-mt-6">
                {/* Official Poll Section (Topbar highlight) */}
                {officialPoll && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-zinc-500 font-black text-[9px] uppercase tracking-widest select-none text-left px-4 md:px-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                            Pilihan Utama Hari Ini
                        </div>
                        <PollCard poll={officialPoll} isHero={true} />
                    </div>
                )}

                {/* Community Feed Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-brand-border/40 pb-2 mb-1 select-none px-4 md:px-0">
                        <div className="flex items-center gap-2 text-zinc-500 font-black text-[9px] uppercase tracking-widest text-left">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                            Feed Opini Publik
                        </div>
                        <span className="text-[9px] text-zinc-600 font-bold uppercase">
                            {filteredPolls.length} Topik Panas
                        </span>
                    </div>

                    {isPending ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filteredPolls.length > 0 ? (
                        <div className="flex flex-col md:gap-5 divide-y divide-brand-border/40 md:divide-y-0">
                            {filteredPolls.map((poll) => (
                                <PollCard key={poll.id} poll={poll} />
                            ))}
                        </div>
                    ) : (
                        <div className="mx-4 md:mx-0 bg-brand-card/30 border border-brand-border/60 rounded-2xl p-10 text-center shadow-lg select-none flex flex-col items-center gap-3">
                            <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                                Belum ada topik panas hari ini.
                            </p>
                            <p className="text-zinc-500 text-[10px] font-semibold">
                                Jadilah orang pertama yang memantik diskusi.
                            </p>
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('kubu-open-create-modal'))}
                                className="px-5 py-2.5 bg-brand-blue hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-brand-blue/15"
                            >
                                Lempar Topik Pertama
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </SocialLayout>
    );
}
