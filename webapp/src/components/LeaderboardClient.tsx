'use client';

import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, ArrowLeft, Swords } from 'lucide-react';
import Link from 'next/link';

interface LeaderboardUser {
    id: string;
    username: string | null;
    avatar_url: string | null;
    points: number | null;
    is_admin: boolean | null;
}

interface LeaderboardClientProps {
    users: LeaderboardUser[];
}

export function getUserTitle(points: number) {
    if (points >= 1000) return { name: 'Battle Master', icon: '👑', color: 'text-amber-500 border-amber-500/10 bg-amber-500/5' };
    if (points >= 300) return { name: 'Elite Warrior', icon: '🔥', color: 'text-rose-500 border-rose-500/10 bg-rose-500/5' };
    if (points >= 100) return { name: 'Pro Voter', icon: '⚡', color: 'text-blue-500 border-blue-500/10 bg-blue-500/5' };
    return { name: 'Rookie', icon: '🔰', color: 'text-zinc-400 border-zinc-500/10 bg-zinc-500/5' };
}

export default function LeaderboardClient({ users }: LeaderboardClientProps) {
    const topThree = users.slice(0, 3);
    const standardUsers = users.slice(3);

    // Helper for top 3 styling
    const podiumStyles = [
        {
            bg: 'bg-gradient-to-b from-amber-500/5 to-zinc-950/20 border-amber-500/25',
            text: 'text-amber-400',
            shadow: 'shadow-2xl shadow-amber-500/5',
            badge: '🥇',
            medalColor: 'text-amber-400',
            order: 'order-2 lg:scale-105 lg:-translate-y-2' // Rank 1 in middle on desktop
        },
        {
            bg: 'bg-gradient-to-b from-zinc-400/5 to-zinc-950/20 border-zinc-500/25',
            text: 'text-zinc-300',
            shadow: 'shadow-2xl shadow-zinc-500/5',
            badge: '🥈',
            medalColor: 'text-zinc-300',
            order: 'order-1' // Rank 2 on left
        },
        {
            bg: 'bg-gradient-to-b from-amber-700/5 to-zinc-950/20 border-amber-700/25',
            text: 'text-amber-600',
            shadow: 'shadow-2xl shadow-amber-700/5',
            badge: '🥉',
            medalColor: 'text-amber-700',
            order: 'order-3' // Rank 3 on right
        }
    ];

    // Rearrange podium for visual layout: [Rank 2, Rank 1, Rank 3] on desktop
    const podiumList = [];
    if (topThree[1]) podiumList.push({ user: topThree[1], rank: 2, style: podiumStyles[1] });
    if (topThree[0]) podiumList.push({ user: topThree[0], rank: 1, style: podiumStyles[0] });
    if (topThree[2]) podiumList.push({ user: topThree[2], rank: 3, style: podiumStyles[2] });

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div>
                    <Link 
                        href="/" 
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-white transition-colors mb-2 select-none group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                        Kembali ke Beranda
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5 uppercase select-none">
                        <Trophy className="w-7 h-7 text-amber-400 shrink-0 animate-pulse" />
                        Papan Peringkat
                    </h1>
                    <p className="text-zinc-400 text-xs sm:text-sm mt-1 font-semibold leading-normal">
                        Daftar ksatria opini teraktif dengan poin terbanyak di platform KUBU.
                    </p>
                </div>
            </div>

            {/* Podium (Top 3 Users) */}
            {topThree.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 items-end">
                    {podiumList.map(({ user, rank, style }) => {
                        const titleInfo = getUserTitle(user.points || 0);
                        return (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: rank * 0.15 }}
                                className={`bg-zinc-900/40 border rounded-3xl p-6 flex flex-col items-center text-center shadow-xl backdrop-blur-md relative overflow-hidden h-fit ${style.bg} ${style.shadow} ${style.order}`}
                            >
                                {/* Glow element */}
                                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />

                                {/* Rank Badge */}
                                <div className="absolute top-4 right-4 text-xl font-black select-none">
                                    {style.badge}
                                </div>

                                {/* Avatar */}
                                <div className="relative mb-4 mt-2">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-choice-left/80 to-choice-right/80 p-[1.5px] flex items-center justify-center shadow-md">
                                        <div className="w-full h-full rounded-2xl bg-zinc-950 flex items-center justify-center text-lg font-black text-white uppercase select-none">
                                            {user.username?.[0] || 'U'}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg bg-zinc-950 border border-brand-border flex items-center justify-center text-[10px] shadow-md select-none">
                                        {style.badge}
                                    </div>
                                </div>

                                {/* Username */}
                                <h3 className="text-base font-black text-white truncate max-w-full">
                                    {user.username || 'Anonymous'}
                                </h3>

                                {/* Title */}
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 border rounded text-[9px] font-bold tracking-wider uppercase select-none ${titleInfo.color}`}>
                                    <span>{titleInfo.icon}</span>
                                    <span>{titleInfo.name}</span>
                                </span>

                                {/* Points display */}
                                <div className="mt-5 bg-black/40 border border-brand-border/60 rounded-2xl py-2 px-6 w-full max-w-[200px]">
                                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Total Skor</span>
                                    <span className="text-lg font-black text-white mt-0.5 block">
                                        🪙 {(user.points || 0).toLocaleString()}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Standard User Rankings */}
            <div className="bg-brand-card/30 border border-brand-border/80 rounded-[24px] overflow-hidden shadow-2xl backdrop-blur-xl">
                <div className="px-6 py-3.5 border-b border-brand-border/60 flex items-center justify-between bg-black/40 select-none">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Peringkat Arena</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Reputasi &amp; Poin</span>
                </div>

                <div className="divide-y divide-brand-border/40">
                    {standardUsers.length > 0 ? (
                        standardUsers.map((user, index) => {
                            const rank = index + 4; // Starts from Rank 4
                            const titleInfo = getUserTitle(user.points || 0);
                            return (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, x: -15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.5) }}
                                    className="px-6 py-4 flex items-center justify-between hover:bg-zinc-900/25 transition-colors border-b border-brand-border/40 last:border-0"
                                >
                                    {/* Left info (Rank, Name, Title) */}
                                    <div className="flex items-center gap-4 min-w-0">
                                        {/* Rank number */}
                                        <span className="w-6 text-xs font-black text-zinc-500 text-center">
                                            #{rank}
                                        </span>

                                        {/* Avatar */}
                                        <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-brand-border/80 flex items-center justify-center text-xs font-bold text-zinc-300 uppercase shrink-0 select-none">
                                            {user.username?.[0] || 'U'}
                                        </div>

                                        {/* Name & Title */}
                                        <div className="min-w-0">
                                            <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-[150px] sm:max-w-xs">
                                                {user.username || 'Anonymous'}
                                            </h4>
                                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 mt-0.5 border rounded text-[7px] font-black uppercase select-none ${titleInfo.color}`}>
                                                <span>{titleInfo.icon}</span>
                                                <span>{titleInfo.name}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Points score */}
                                    <div className="text-right shrink-0">
                                        <span className="text-xs sm:text-sm font-black text-white flex items-center gap-1 justify-end">
                                            🪙 {(user.points || 0).toLocaleString()}
                                        </span>
                                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block mt-0.5">
                                            Skor Poin
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        users.length <= 3 && (
                            <div className="px-6 py-12 text-center text-zinc-500 font-bold select-none text-xs">
                                Belum ada ksatria opini lain di arena ini.
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
