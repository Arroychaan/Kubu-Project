'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import PollCard from './PollCard';
import { Poll } from '@/types';
import { Flame, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
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

    return (
        <SocialLayout activeTab={activeTab === 'panas' ? 'Topik Panas' : 'Beranda'}>
            {/* Onboarding Wizard Modal overlay */}
            {user && showOnboarding && (
                <OnboardingWizard userId={user.id} onComplete={() => setShowOnboarding(false)} />
            )}

            {/* Short & Sharp Hero Section */}
            <section className="mb-6 py-5 md:py-6 text-left relative overflow-hidden bg-gradient-to-b from-zinc-900/10 to-zinc-950/5 border border-brand-border/30 rounded-2xl p-5 sm:p-6 shadow-sm backdrop-blur-sm select-none">
                <div className="space-y-4 relative z-10 max-w-2xl text-left">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-none text-white uppercase">
                        Pilih sisi. Bela opinimu.
                    </h1>

                    <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-bold">
                        KUBU adalah tempat kamu ikut topik yang lagi ramai, memilih kubu, lalu melihat argumen mana yang paling kuat.
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 pt-1">
                        <button
                            onClick={() => {
                                const element = document.getElementById('opinion-feed');
                                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-black rounded-xl transition-all shadow-md active:scale-95 duration-150 text-[10px] sm:text-xs tracking-wider uppercase cursor-pointer text-center"
                        >
                            Pilih Kubumu
                        </button>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider select-none">
                            Mulai dari topik ringan, isu viral, sampai debat sehari-hari.
                        </span>
                    </div>
                </div>
            </section>

            {/* Cycling Activity Ticker */}
            {recentActivities.length > 0 && (
                <div className="mb-6 px-4 py-2.5 bg-zinc-950/20 border border-brand-border/60 rounded-xl flex items-center gap-3 overflow-hidden text-xs select-none">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-900 border border-brand-border/80 text-[8px] font-black uppercase tracking-wider text-zinc-500 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Aktivitas Terkini
                    </span>
                    <div className="flex-1 relative h-4 overflow-hidden">
                        <AnimatePresence mode="wait">
                            {recentActivities.map((act, index) => {
                                if (index !== activityIndex) return null;
                                const timeStr = new Date(act.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.35 }}
                                        className="absolute inset-0 flex items-center text-[10px] sm:text-xs font-semibold text-zinc-400 gap-1.5 truncate text-left"
                                    >
                                        <strong className="text-zinc-300">@{act.username}</strong>
                                        {act.type === 'vote' ? (
                                            <>
                                                <span>memilih</span>
                                                <span className={act.choice === 'a' ? 'text-choice-left font-extrabold' : 'text-choice-right font-extrabold'}>
                                                    {act.choice === 'a' ? act.option_a : act.option_b}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span>menulis argumen:</span>
                                                <span className="text-zinc-300 font-semibold italic truncate">
                                                    "{act.text}"
                                                </span>
                                            </>
                                        )}
                                        <span className="text-[8px] text-zinc-600 font-bold ml-auto shrink-0 select-none">
                                            {timeStr}
                                            {act.type === 'comment' ? ' 💬' : ' 🗳️'}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Custom Tabs (Untuk Kamu & Terbaru) */}
            <div className="flex items-center gap-6 border-b border-brand-border/60 pb-3 mb-5 select-none text-left">
                <button
                    onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.delete('tab');
                        router.push(`/?${params.toString()}`);
                    }}
                    className={`text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                        activeTab === 'terbaru' ? 'text-white border-b-2 border-brand-blue pb-3 -mb-3.5' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    Untuk Kamu
                </button>
                <button
                    onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set('tab', 'panas');
                        router.push(`/?${params.toString()}`);
                    }}
                    className={`text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                        activeTab === 'panas' ? 'text-white border-b-2 border-brand-blue pb-3 -mb-3.5' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    Terbaru
                </button>
            </div>

            {/* Feed List */}
            <div id="opinion-feed" className="space-y-6 scroll-mt-6">
                {/* Official Poll Section (Topbar highlight) */}
                {officialPoll && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-zinc-500 font-black text-[9px] uppercase tracking-widest select-none text-left">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                            Pilihan Utama Hari Ini
                        </div>
                        <PollCard poll={officialPoll} isHero={true} />
                    </div>
                )}

                {/* Community Feed Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-brand-border/40 pb-2 mb-1 select-none">
                        <div className="flex items-center gap-2 text-zinc-500 font-black text-[9px] uppercase tracking-widest text-left">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                            Feed Opini Publik
                        </div>
                        <span className="text-[9px] text-zinc-600 font-bold uppercase">
                            {filteredPolls.length} Topik Panas
                        </span>
                    </div>

                    {filteredPolls.length > 0 ? (
                        <div className="grid grid-cols-1 gap-5">
                            {filteredPolls.map((poll) => (
                                <PollCard key={poll.id} poll={poll} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-brand-card/30 border border-brand-border/60 rounded-2xl p-10 text-center shadow-lg select-none flex flex-col items-center gap-3">
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
