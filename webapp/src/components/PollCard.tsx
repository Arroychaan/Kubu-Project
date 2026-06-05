'use client';

import { useState, useTransition, useEffect } from 'react';
import { motion } from 'framer-motion';
import BattleBar from './BattleBar';
import { vote, checkUserVote } from '@/app/actions';
import { Poll } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { MessageCircle, Share2, Info } from 'lucide-react';

interface PollCardProps {
    poll: Poll;
    isHero?: boolean;
}

export default function PollCard({ poll, isHero = false }: PollCardProps) {
    const [countA, setCountA] = useState(poll.stats?.count_a || 0);
    const [countB, setCountB] = useState(poll.stats?.count_b || 0);
    const [hasVoted, setHasVoted] = useState(false);
    const [userChoice, setUserChoice] = useState<'a' | 'b' | null>(null);
    const [, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'info' | 'error' | 'success'; text: string } | null>(null);

    const { user } = useAuthStore();
    const [prevUser, setPrevUser] = useState(user);
    const [prevStats, setPrevStats] = useState(poll.stats);

    // Sync state when user changes (during render)
    if (user !== prevUser) {
        setPrevUser(user);
        if (!user) {
            setHasVoted(false);
            setUserChoice(null);
        }
    }

    // Sync countA and countB with updated poll.stats props (during render)
    if (poll.stats?.count_a !== prevStats?.count_a || poll.stats?.count_b !== prevStats?.count_b) {
        setPrevStats(poll.stats);
        setCountA(poll.stats?.count_a || 0);
        setCountB(poll.stats?.count_b || 0);
    }

    // Check if user has voted on this poll
    useEffect(() => {
        if (user) {
            checkUserVote(poll.id).then((result) => {
                if (result.success && result.data) {
                    const data = result.data as { hasVoted: boolean; choice: 'a' | 'b' | null };
                    setHasVoted(data.hasVoted);
                    setUserChoice(data.choice);
                }
            });
        }
    }, [poll.id, user]);

    const handleVote = (choice: 'a' | 'b') => {
        if (!user) {
            setMessage({ type: 'error', text: 'Silakan masuk ke akun Anda terlebih dahulu untuk memberikan suara.' });
            setTimeout(() => setMessage(null), 4000);
            return;
        }

        if (hasVoted) return;

        // Optimistic update
        if (choice === 'a') setCountA(c => c + 1);
        else setCountB(c => c + 1);
        setHasVoted(true);
        setUserChoice(choice);

        startTransition(async () => {
            const result = await vote(poll.id, choice);

            if (!result.success) {
                // Revert optimistic update
                if (choice === 'a') setCountA(c => c - 1);
                else setCountB(c => c - 1);
                setHasVoted(false);
                setUserChoice(null);
                setMessage({ type: 'error', text: result.message });
                setTimeout(() => setMessage(null), 4000);
            } else {
                setMessage({ type: 'success', text: 'Suara Anda berhasil disimpan!' });
                setTimeout(() => setMessage(null), 3000);
            }
        });
    };

    const handleShare = () => {
        const shareText = `Ikuti jajak pendapat: "${poll.question}"\nKubu A: ${poll.option_a} vs Kubu B: ${poll.option_b}`;
        if (navigator.share) {
            navigator.share({
                title: 'KUBU - Jajak Pendapat Sosial',
                text: shareText,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            setMessage({ type: 'info', text: 'Tautan berhasil disalin ke papan klip!' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const total = countA + countB;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={`w-full bg-brand-card/50 border border-brand-border/80 rounded-2xl overflow-hidden transition-all duration-300 hover:border-zinc-700/60 hover:bg-brand-card ${
                isHero ? 'p-6 md:p-8 border-brand-blue/35' : 'p-5 md:p-6'
            }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    {poll.is_official && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-blue/5 border border-brand-blue/20 text-brand-blue text-[9px] font-black rounded-md uppercase tracking-wider mb-3 select-none">
                            ⚡ Polling Resmi
                        </span>
                    )}
                    <h3 className={`font-bold text-white leading-snug tracking-tight ${
                        isHero ? 'text-lg md:text-xl font-black' : 'text-sm md:text-base'
                    }`}>
                        {poll.question}
                    </h3>
                </div>
            </div>

            {/* Battle Bar comparison */}
            <div className={isHero ? 'my-6' : 'my-4'}>
                <BattleBar
                    countA={countA}
                    countB={countB}
                    colorA="bg-choice-left"
                    colorB="bg-choice-right"
                    onVote={handleVote}
                    hasVoted={hasVoted}
                    labelA={poll.option_a}
                    labelB={poll.option_b}
                    className={isHero ? 'h-32 md:h-40' : ''}
                />
            </div>

            {/* Toast feedback inside card */}
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-4 p-3 border border-brand-border/60 rounded-xl text-[10px] font-bold flex items-center gap-2 bg-zinc-950/45 ${
                        message.type === 'error'
                            ? 'text-red-400 border-red-500/15'
                            : message.type === 'success'
                            ? 'text-green-400 border-green-500/15'
                            : 'text-zinc-300 border-brand-blue/15'
                    }`}
                >
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>{message.text}</span>
                </motion.div>
            )}

            {/* Footer details */}
            <div className="flex items-center justify-between text-zinc-500 text-[11px] font-bold pt-2 select-none">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                        <MessageCircle className="w-3.5 h-3.5 text-zinc-500" />
                        {total.toLocaleString()} suara masuk
                    </span>
                    
                    {userChoice && (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            userChoice === 'a' 
                                ? 'bg-choice-left/10 text-choice-left border border-choice-left/15' 
                                : 'bg-choice-right/10 text-choice-right border border-choice-right/15'
                        }`}>
                            Pilihan: {userChoice === 'a' ? poll.option_a : poll.option_b}
                        </span>
                    )}
                </div>
                
                <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors cursor-pointer select-none"
                >
                    <Share2 className="w-3.5 h-3.5" />
                    Bagikan
                </button>
            </div>
        </motion.div>
    );
}
