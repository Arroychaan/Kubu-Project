'use client';

import { useState, useTransition, useEffect } from 'react';
import { motion } from 'framer-motion';
import BattleBar from './BattleBar';
import { vote, checkUserVote } from '@/app/actions';
import { Poll } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { MessageCircle, Share2 } from 'lucide-react';

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
    const [message, setMessage] = useState<string | null>(null);

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
            setMessage('Please login to vote!');
            setTimeout(() => setMessage(null), 3000);
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
                setMessage(result.message);
                setTimeout(() => setMessage(null), 3000);
            }
        });
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'KUBU - ' + poll.question,
                text: `Vote now: ${poll.option_a} vs ${poll.option_b}`,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            setMessage('Link copied!');
            setTimeout(() => setMessage(null), 2000);
        }
    };

    const total = countA + countB;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden ${isHero ? 'p-6 md:p-8' : 'p-4 md:p-6'
                }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    {poll.is_official && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-neon-pink to-neon-cyan text-white text-[10px] font-bold rounded-full uppercase tracking-wider mb-2">
                            ⚡ Official War
                        </span>
                    )}
                    <h3 className={`font-bold text-white leading-tight ${isHero ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'
                        }`}>
                        {poll.question}
                    </h3>
                </div>
            </div>

            {/* Battle Bar */}
            <div className={isHero ? 'my-6' : 'my-4'}>
                <BattleBar
                    countA={countA}
                    countB={countB}
                    colorA="bg-neon-pink"
                    colorB="bg-neon-cyan"
                    onVote={handleVote}
                    hasVoted={hasVoted}
                    labelA={poll.option_a}
                    labelB={poll.option_b}
                    className={isHero ? 'h-32 md:h-40' : ''}
                />
            </div>

            {/* Message Toast */}
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm text-center"
                >
                    {message}
                </motion.div>
            )}

            {/* Footer Stats */}
            <div className="flex items-center justify-between text-white/40 text-xs md:text-sm">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {total.toLocaleString()} votes
                    </span>
                    {userChoice && (
                        <span className={`font-medium ${userChoice === 'a' ? 'text-neon-pink' : 'text-neon-cyan'}`}>
                            You voted: {userChoice === 'a' ? poll.option_a : poll.option_b}
                        </span>
                    )}
                </div>
                <button
                    onClick={handleShare}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                >
                    <Share2 className="w-4 h-4" />
                    Share
                </button>
            </div>
        </motion.div>
    );
}
