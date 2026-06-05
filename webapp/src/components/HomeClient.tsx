'use client';

import { useRouter } from 'next/navigation';
import PollCard from './PollCard';
import CreatePollModal from './CreatePollModal';
import { Poll } from '@/types';
import { Swords, Users, Flame, Zap } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface HomeClientProps {
    officialPoll: Poll | null;
    communityPolls: Poll[];
}

type TabType = 'all' | 'official' | 'community';

export default function HomeClient({ officialPoll, communityPolls }: HomeClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('all');

    const handlePollCreated = () => {
        // Refresh the page to show new poll
        router.refresh();
    };

    // Filter polls based on active tab
    const displayedPolls = (() => {
        if (activeTab === 'official') {
            return officialPoll ? [officialPoll] : [];
        }
        if (activeTab === 'community') {
            return communityPolls;
        }
        // 'all' tab
        const all = [];
        if (officialPoll) all.push(officialPoll);
        all.push(...communityPolls);
        return all;
    })();

    return (
        <>
            {/* Main Welcome Hero Section */}
            <section className="mb-12 md:mb-16 py-8 md:py-12 text-left relative overflow-hidden bg-gradient-to-b from-zinc-900/40 to-zinc-950/20 border border-brand-border/60 rounded-[32px] p-6 sm:p-10 lg:p-14 shadow-2xl backdrop-blur-xl">
                {/* Subtle visual ambient glows inside container */}
                <div className="absolute right-[-10%] top-[-10%] w-80 h-80 bg-choice-right/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute left-[-10%] bottom-[-10%] w-80 h-80 bg-choice-left/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                    <div className="lg:col-span-7 space-y-6">
                        {/* Glow Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-brand-border rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
                            Platform Opini &amp; Jajak Pendapat Publik
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.08] text-white">
                            Suarakan Opinimu.<br />
                            <span className="bg-gradient-to-r from-choice-left via-white to-choice-right bg-clip-text text-transparent">
                                Tentukan Kubumu.
                            </span>
                        </h1>

                        {/* Description */}
                        <p className="text-zinc-400 text-xs sm:text-sm md:text-base max-w-xl leading-relaxed font-medium">
                            Kubu adalah ruang jajak pendapat interaktif untuk menguji opini, memantau suara publik secara real-time, serta terlibat dalam diskusi sehat. Pilih kubu Anda, berikan suara, dan pantau dinamika opini secara instan.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-wrap gap-4 pt-2">
                            <button
                                onClick={() => {
                                    const element = document.getElementById('battlefield');
                                    element?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-6 py-3.5 bg-white hover:bg-zinc-200 text-black font-black rounded-xl transition-all shadow-md active:scale-95 duration-150 text-xs tracking-wider uppercase cursor-pointer"
                            >
                                Jelajahi Polling
                            </button>
                            <button
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('kubu-open-create-modal'));
                                }}
                                className="px-6 py-3.5 bg-zinc-900/60 hover:bg-zinc-800/80 border border-brand-border text-white font-black rounded-xl transition-all duration-150 flex items-center gap-2 cursor-pointer active:scale-95"
                            >
                                <Zap className="w-3.5 h-3.5 text-brand-blue" />
                                Buat Jajak Pendapat
                            </button>
                        </div>
                    </div>

                    {/* Right side visual: Interactive Stats & Mini Clash */}
                    <div className="lg:col-span-5 hidden lg:block bg-black/40 border border-brand-border/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
                        <div className="flex justify-between items-center mb-6 border-b border-brand-border/60 pb-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Status Arena</span>
                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/5 text-emerald-400 text-[8px] font-bold rounded-full uppercase tracking-wider border border-emerald-500/15">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                Real-Time
                            </span>
                        </div>

                        {/* Clashing Mockup */}
                        <div className="space-y-4">
                            <div className="text-[10px] font-bold text-zinc-300 text-center tracking-wider uppercase bg-zinc-900/50 py-2 px-3 rounded-lg border border-brand-border/60">
                                Kucing 🐱 vs Anjing 🐶
                            </div>
                            
                            {/* Battle progress bars */}
                            <div className="relative h-6 w-full bg-zinc-950 border border-brand-border/80 rounded-lg overflow-hidden flex items-center px-3 text-[9px] font-black justify-between select-none">
                                <div className="absolute left-0 top-0 h-full bg-choice-left/15 border-r border-choice-left/30" style={{ width: '58%' }} />
                                <div className="absolute right-0 top-0 h-full bg-choice-right/15" style={{ width: '42%' }} />
                                <span className="z-10 text-choice-left tracking-wider">Kubu A (58%)</span>
                                <span className="z-10 text-choice-right tracking-wider">Kubu B (42%)</span>
                            </div>

                            {/* Dashboard grid */}
                            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-brand-border/60 text-center">
                                <div className="bg-zinc-900/30 border border-brand-border/60 rounded-xl p-2.5">
                                    <Swords className="w-4 h-4 text-choice-left mx-auto mb-1" />
                                    <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Polling</div>
                                    <div className="text-xs font-black text-white mt-0.5">142+</div>
                                </div>
                                <div className="bg-zinc-900/30 border border-brand-border/60 rounded-xl p-2.5">
                                    <Flame className="w-4 h-4 text-brand-blue mx-auto mb-1" />
                                    <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Suara</div>
                                    <div className="text-xs font-black text-white mt-0.5">482K</div>
                                </div>
                                <div className="bg-zinc-900/30 border border-brand-border/60 rounded-xl p-2.5">
                                    <Users className="w-4 h-4 text-choice-right mx-auto mb-1" />
                                    <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Aktif</div>
                                    <div className="text-xs font-black text-white mt-0.5">12.5K</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tab Filter Navigation */}
            <div id="battlefield" className="flex items-center justify-between border-b border-brand-border/60 pb-3 mb-8 scroll-mt-24">
                <div className="flex gap-6 relative">
                    {(['all', 'official', 'community'] as const).map((tab) => {
                        const label = tab === 'all' ? 'Semua' : tab === 'official' ? 'Resmi' : 'Komunitas';
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative pb-3 text-xs font-black tracking-wider uppercase transition-colors duration-150 cursor-pointer ${
                                    isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                {label}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabUnderline"
                                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"
                                        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content List */}
            <div className="space-y-6">
                {displayedPolls.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {displayedPolls.map((poll) => (
                            <PollCard key={poll.id} poll={poll} isHero={poll.is_official} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-brand-card border border-brand-border rounded-2xl p-12 text-center shadow-lg">
                        <p className="text-zinc-400 text-sm font-bold">
                            {activeTab === 'official' 
                                ? 'Belum ada polling resmi hari ini. Silakan cek kembali nanti!' 
                                : activeTab === 'community'
                                ? 'Belum ada polling komunitas. Jadilah yang pertama membuat diskusi!'
                                : 'Belum ada jajak pendapat yang tersedia.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Create Poll Modal */}
            <CreatePollModal onPollCreated={handlePollCreated} />
        </>
    );
}
