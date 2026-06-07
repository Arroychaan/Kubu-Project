'use client';

import { useRouter } from 'next/navigation';
import PollCard from './PollCard';
import CreatePollModal from './CreatePollModal';
import { Poll } from '@/types';
import { MessageSquare, Users, Flame, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [activityIndex, setActivityIndex] = useState(0);

    useEffect(() => {
        if (recentActivities.length <= 1) return;
        const interval = setInterval(() => {
            setActivityIndex((prev) => (prev + 1) % recentActivities.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [recentActivities.length]);

    const handlePollCreated = () => {
        // Refresh the page to show new poll
        router.refresh();
    };

    return (
        <>
            {/* Main Welcome Hero Section (Compact & Focused) */}
            <section className="mb-8 py-6 md:py-10 text-left relative overflow-hidden bg-gradient-to-b from-zinc-900/30 to-zinc-950/10 border border-brand-border/40 rounded-2xl p-6 sm:p-8 md:p-10 shadow-xl backdrop-blur-md">
                {/* Subtle visual ambient glows inside container */}
                <div className="absolute right-[-10%] top-[-10%] w-60 h-60 bg-choice-right/5 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute left-[-10%] bottom-[-10%] w-60 h-60 bg-choice-left/5 rounded-full blur-[80px] pointer-events-none" />

                <div className="space-y-5 relative z-10 max-w-2xl">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/80 border border-brand-border rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                        Platform Diskusi Opini Publik
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.1] text-white">
                        Suarakan Opinimu.<br />
                        <span className="bg-gradient-to-r from-choice-left via-white to-choice-right bg-clip-text text-transparent">
                            Tentukan Kubumu.
                        </span>
                    </h1>

                    {/* Description */}
                    <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-semibold">
                        KUBU adalah tempat kamu suarakan opini secara bebas, dukung kubu pilihanmu dengan argumen terkuat, dan lihat pergeseran suara publik secara jujur dan transparan.
                        {stats.totalVotes > 0 && (
                            <span className="block mt-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                🗳️ Telah memproses {stats.totalVotes.toLocaleString()} suara di {stats.totalPolls.toLocaleString()} topik diskusi terkini.
                            </span>
                        )}
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-wrap gap-3 pt-1">
                        <button
                            onClick={() => {
                                const element = document.getElementById('opinion-feed');
                                element?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-black rounded-xl transition-all shadow-md active:scale-95 duration-150 text-[10px] sm:text-xs tracking-wider uppercase cursor-pointer"
                        >
                            Ikut Berpendapat
                        </button>
                        <button
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent('kubu-open-create-modal'));
                            }}
                            className="px-5 py-2.5 bg-zinc-900/60 hover:bg-zinc-800/80 border border-brand-border text-white font-black rounded-xl transition-all duration-150 flex items-center gap-2 cursor-pointer active:scale-95 text-[10px] sm:text-xs uppercase tracking-wider"
                        >
                            <Zap className="w-3.5 h-3.5 text-brand-blue" />
                            Buat Topik Baru
                        </button>
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
                                                <span>menulis opini:</span>
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

            {/* Feed List (Feed-First structure) */}
            <div id="opinion-feed" className="space-y-8 scroll-mt-24">
                {/* Official Poll Section */}
                {officialPoll && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-zinc-500 font-black text-[10px] uppercase tracking-widest select-none text-left">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                            Pilihan Utama Hari Ini
                        </div>
                        <PollCard poll={officialPoll} isHero={true} />
                    </div>
                )}

                {/* Community Polls Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-brand-border/60 pb-2.5 mb-2 select-none">
                        <div className="flex items-center gap-2 text-zinc-500 font-black text-[10px] uppercase tracking-widest text-left">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                            Diskusi Komunitas
                        </div>
                        <span className="text-[9px] text-zinc-600 font-bold uppercase">
                            {communityPolls.length} Topik Aktif
                        </span>
                    </div>

                    {communityPolls.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6">
                            {communityPolls.map((poll) => (
                                <PollCard key={poll.id} poll={poll} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-brand-card/30 border border-brand-border/60 rounded-2xl p-10 text-center shadow-lg select-none">
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                                Belum ada topik diskusi komunitas saat ini.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Poll Modal */}
            <CreatePollModal onPollCreated={handlePollCreated} />
        </>
    );
}
