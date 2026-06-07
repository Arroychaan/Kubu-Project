'use client';

import { useState, useTransition, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChoiceBar from './ChoiceBar';
import { vote, checkUserVote, getComments, addComment, reportContent } from '@/app/actions';
import { Poll } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { MessageCircle, Share2, Info, Flag, AlertTriangle, X } from 'lucide-react';
import { getUserTitle } from './LeaderboardClient';

const formatTime = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins}m yang lalu`;
        if (diffHours < 24) return `${diffHours}j yang lalu`;
        if (diffDays < 7) return `${diffDays}h yang lalu`;
        return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    } catch {
        return 'Baru saja';
    }
};

function CommentCard({ 
    comment, 
    isLeft, 
    onReply, 
    canReply,
    onReport
}: { 
    comment: any; 
    isLeft: boolean; 
    onReply?: () => void; 
    canReply?: boolean;
    onReport?: () => void;
}) {
    const profile = comment.profiles || {};
    const username = profile.username || 'Anonymous';
    const points = profile.points ?? 50;
    const titleInfo = getUserTitle(points);
    const formattedDate = new Date(comment.created_at).toLocaleDateString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className={`p-3 bg-zinc-950/40 border rounded-xl relative ${
            isLeft 
                ? 'border-choice-left/15 hover:border-choice-left/35' 
                : 'border-choice-right/15 hover:border-choice-right/35'
        } transition-all`}>
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-brand-border flex items-center justify-center text-[9px] font-black text-white uppercase select-none">
                        {username[0]}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-white font-bold">{username}</span>
                            <span className={`inline-flex items-center px-1.5 py-0.25 border rounded-[3px] text-[7px] font-black uppercase tracking-wider ${titleInfo.color}`}>
                                {titleInfo.name}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[8px] text-zinc-600 font-semibold">{formattedDate}</span>
                    {onReport && (
                        <button 
                            onClick={onReport}
                            className="text-[9px] text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-0.5 select-none cursor-pointer border-none bg-transparent"
                            title="Laporkan Opini"
                        >
                            <Flag className="w-2.5 h-2.5" />
                            <span>Laporkan</span>
                        </button>
                    )}
                </div>
            </div>
            <p className="text-xs text-zinc-300 font-medium leading-relaxed pl-8 pr-12 break-words">
                {comment.is_toxic ? '🤡' : comment.text}
            </p>
            {canReply && onReply && (
                <button
                    onClick={onReply}
                    className="absolute bottom-2 right-3 text-[9px] text-zinc-500 hover:text-white font-black uppercase tracking-wider transition-colors cursor-pointer select-none"
                >
                    Balas
                </button>
            )}
        </div>
    );
}

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

    const [commentsA, setCommentsA] = useState<any[]>([]);
    const [commentsB, setCommentsB] = useState<any[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [commentSectionTab, setCommentSectionTab] = useState<'a' | 'b'>('a');
    const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
    const [reportTarget, setReportTarget] = useState<{ type: 'poll' | 'comment'; id: string; name?: string } | null>(null);

    const handleReportClick = (type: 'poll' | 'comment', id: string, name?: string) => {
        if (!user) {
            setMessage({ type: 'error', text: 'Silakan masuk terlebih dahulu untuk melaporkan konten.' });
            setTimeout(() => setMessage(null), 4000);
            return;
        }
        setReportTarget({ type, id, name });
    };

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

    const fetchPollComments = () => {
        setIsLoadingComments(true);
        getComments(poll.id).then((result) => {
            if (result.success && result.data) {
                const data = result.data as { commentsA: any[]; commentsB: any[] };
                setCommentsA(data.commentsA);
                setCommentsB(data.commentsB);
            }
            setIsLoadingComments(false);
        });
    };

    useEffect(() => {
        fetchPollComments();
    }, [poll.id, hasVoted]);

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || isSubmittingComment) return;

        setIsSubmittingComment(true);
        const result = await addComment(poll.id, commentText, replyTo?.id);

        if (result.success) {
            setMessage({ type: 'success', text: result.message });
            setCommentText('');
            setReplyTo(null);
            fetchPollComments();
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: result.message });
            setTimeout(() => setMessage(null), 4000);
        }
        setIsSubmittingComment(false);
    };

    const handleVote = (choice: 'a' | 'b') => {
        if (!user) {
            setMessage({ type: 'error', text: 'Silakan masuk terlebih dahulu untuk ikut berpendapat.' });
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
                setMessage({ type: 'success', text: 'Pilihan kamu berhasil disimpan!' });
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

    const creatorName = poll.creator?.username || '@pengguna_kubu';
    const creatorPoints = poll.creator?.points ?? 50;
    const creatorTitleInfo = getUserTitle(creatorPoints);
    const formattedTime = poll.created_at ? formatTime(poll.created_at) : 'Baru saja';

    const topCommentA = commentsA.find(c => !c.parent_id);
    const topCommentB = commentsB.find(c => !c.parent_id);

    return (
        <motion.div
            id={`poll-${poll.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={`w-full bg-brand-card/50 border border-brand-border/80 rounded-2xl overflow-hidden transition-all duration-300 hover:border-zinc-700/60 hover:bg-brand-card ${
                isHero ? 'p-6 md:p-8 border-brand-blue/35' : 'p-5 md:p-6'
            }`}
        >
            {/* Header Kreator */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border/40 select-none">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-brand-border/80 flex items-center justify-center text-xs font-black text-zinc-400 uppercase">
                        {creatorName[0] || 'P'}
                    </div>
                    <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white leading-none">{creatorName}</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 border rounded-[3px] text-[7px] font-black uppercase tracking-wider ${creatorTitleInfo.color}`}>
                                {creatorTitleInfo.name}
                            </span>
                        </div>
                        <span className="text-[9px] text-zinc-500 font-semibold mt-1">
                            {formattedTime}
                        </span>
                    </div>
                </div>
                {poll.is_official && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-blue/5 border border-brand-blue/20 text-brand-blue text-[9px] font-black rounded uppercase tracking-wider">
                        ⚡ Pilihan Resmi
                    </span>
                )}
            </div>

            {/* Question */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className={`font-bold text-white leading-snug tracking-tight ${
                        isHero ? 'text-lg md:text-xl font-black' : 'text-sm md:text-base'
                    }`}>
                        {poll.question}
                    </h3>
                </div>
            </div>

            {/* Choice Bar comparison */}
            <div className={isHero ? 'my-6' : 'my-4'}>
                <ChoiceBar
                    countA={countA}
                    countB={countB}
                    onVote={handleVote}
                    hasVoted={hasVoted}
                    labelA={poll.option_a}
                    labelB={poll.option_b}
                    className={isHero ? 'h-28 sm:h-32' : ''}
                />
            </div>

            {/* Pratinjau Argumen Sebelum Vote (Hanya tampil jika ada opini) */}
            {!hasVoted && (topCommentA || topCommentB) && (
                <div className="mt-4 p-3 bg-zinc-950/30 border border-brand-border/60 rounded-xl space-y-2.5">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">
                        Opini Warga Terkini
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {topCommentA && (
                            <div className="p-2.5 bg-zinc-950/40 border border-choice-left/10 rounded-lg text-left">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <div className="w-4 h-4 rounded bg-zinc-900 flex items-center justify-center text-[8px] font-black text-zinc-400 uppercase">
                                        {(topCommentA.profiles?.username || 'U')[0]}
                                    </div>
                                    <span className="text-[9px] text-zinc-400 font-bold truncate max-w-[80px]">
                                        @{topCommentA.profiles?.username || 'pengguna'}
                                    </span>
                                    <span className="text-[8px] text-choice-left bg-choice-left/5 px-1 rounded uppercase tracking-wider font-extrabold">
                                        Pilih {poll.option_a}
                                    </span>
                                </div>
                                <p className="text-[10px] text-zinc-300 font-medium line-clamp-2 leading-relaxed">
                                    "{topCommentA.is_toxic ? '🤡' : topCommentA.text}"
                                </p>
                            </div>
                        )}
                        {topCommentB && (
                            <div className="p-2.5 bg-zinc-950/40 border border-choice-right/10 rounded-lg text-left">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <div className="w-4 h-4 rounded bg-zinc-900 flex items-center justify-center text-[8px] font-black text-zinc-400 uppercase">
                                        {(topCommentB.profiles?.username || 'U')[0]}
                                    </div>
                                    <span className="text-[9px] text-zinc-400 font-bold truncate max-w-[80px]">
                                        @{topCommentB.profiles?.username || 'pengguna'}
                                    </span>
                                    <span className="text-[8px] text-choice-right bg-choice-right/5 px-1 rounded uppercase tracking-wider font-extrabold">
                                        Pilih {poll.option_b}
                                    </span>
                                </div>
                                <p className="text-[10px] text-zinc-300 font-medium line-clamp-2 leading-relaxed">
                                    "{topCommentB.is_toxic ? '🤡' : topCommentB.text}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors cursor-pointer select-none border-none bg-transparent"
                    >
                        <Share2 className="w-3.5 h-3.5" />
                        Bagikan
                    </button>
                    <button
                        onClick={() => handleReportClick('poll', poll.id, 'polling ini')}
                        className="flex items-center gap-1.5 hover:text-red-400 text-zinc-500 transition-colors cursor-pointer select-none border-none bg-transparent"
                    >
                        <Flag className="w-3.5 h-3.5" />
                        Laporkan
                    </button>
                </div>
            </div>

            {/* Segmented Comments Section */}
            {hasVoted && (() => {
                const parentsA = commentsA.filter((c: any) => !c.parent_id);
                const parentsB = commentsB.filter((c: any) => !c.parent_id);
                const allComments = [...commentsA, ...commentsB];
                const hasUserCommented = allComments.some((c: any) => c.user_id === user?.id);

                return (
                    <div className="border-t border-brand-border/60 mt-5 pt-5 text-left">
                        {/* Comment Form */}
                        {!hasUserCommented ? (
                            <form onSubmit={handleSendComment} className="mb-6">
                                {replyTo && (
                                    <div className="flex items-center justify-between px-3 py-1.5 bg-brand-blue/5 border border-brand-blue/20 rounded-lg mb-3">
                                        <span className="text-[10px] text-brand-blue font-bold">
                                            Membalas <span className="underline">@{replyTo.username}</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setReplyTo(null)}
                                            className="text-[10px] text-zinc-500 hover:text-white font-bold select-none cursor-pointer flex items-center gap-1"
                                        >
                                            Batal <span className="text-zinc-600">✕</span>
                                        </button>
                                    </div>
                                )}
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {replyTo 
                                        ? `Tulis balasan untuk @${replyTo.username}`
                                        : `Kenapa kamu memilih ${userChoice === 'a' ? poll.option_a : poll.option_b}?`
                                    }
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder={replyTo 
                                            ? `Tulis balasan opini...`
                                            : `Tulis alasan memilih ${userChoice === 'a' ? poll.option_a : poll.option_b}...`
                                        }
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        maxLength={500}
                                        className="flex-1 px-4 py-2.5 bg-zinc-950 border border-brand-border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-blue/60 transition-all font-semibold text-xs"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmittingComment}
                                        className="px-4 py-2.5 bg-brand-blue hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 duration-150 shrink-0"
                                    >
                                        {isSubmittingComment ? 'Mengirim...' : 'Kirim'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="mb-6 p-3 bg-zinc-950/20 border border-brand-border/60 rounded-xl text-center text-[10px] text-zinc-400 font-bold uppercase tracking-wider select-none">
                                Terima kasih telah menyuarakan opini kamu di topik ini!
                            </div>
                        )}

                        {/* Comments Display */}
                        <div className="flex flex-col space-y-4">
                            {/* Mobile Tab Header (hidden on md) */}
                            <div className="flex border-b border-brand-border md:hidden">
                                <button
                                    type="button"
                                    onClick={() => setCommentSectionTab('a')}
                                    className={`flex-1 pb-2 text-[10px] font-black uppercase tracking-wider border-b-2 text-center transition-all ${
                                        commentSectionTab === 'a' 
                                            ? 'border-choice-left text-choice-left' 
                                            : 'border-transparent text-zinc-500'
                                    }`}
                                >
                                    Alasan {poll.option_a} ({commentsA.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCommentSectionTab('b')}
                                    className={`flex-1 pb-2 text-[10px] font-black uppercase tracking-wider border-b-2 text-center transition-all ${
                                        commentSectionTab === 'b' 
                                            ? 'border-choice-right text-choice-right' 
                                            : 'border-transparent text-zinc-500'
                                    }`}
                                >
                                    Alasan {poll.option_b} ({commentsB.length})
                                </button>
                            </div>

                            {/* Dual columns for desktop & toggle for mobile */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Column A */}
                                <div className={`space-y-3 ${commentSectionTab === 'a' ? 'block' : 'hidden md:block'}`}>
                                    <h4 className="hidden md:flex items-center gap-2 text-xs font-black text-choice-left uppercase tracking-wider border-b border-brand-border/60 pb-2 mb-3">
                                        <span className="w-1.5 h-1.5 rounded-full bg-choice-left" />
                                        Alasan memilih {poll.option_a} ({commentsA.length})
                                    </h4>
                                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                                        {isLoadingComments ? (
                                            <p className="text-zinc-600 text-xs italic text-center py-6 font-medium">Memuat opini...</p>
                                        ) : parentsA.length > 0 ? (
                                            parentsA.map((comment: any) => {
                                                const childReplies = allComments.filter((c: any) => c.parent_id === comment.id);
                                                return (
                                                    <div key={comment.id} className="space-y-2">
                                                        <CommentCard 
                                                            comment={comment} 
                                                            isLeft={true} 
                                                            canReply={!!user && !hasUserCommented}
                                                            onReply={() => setReplyTo({ id: comment.id, username: comment.profiles?.username || 'Anonymous' })}
                                                            onReport={() => handleReportClick('comment', comment.id, comment.profiles?.username)}
                                                        />
                                                        {childReplies.length > 0 && (
                                                            <div className="ml-6 pl-4 border-l border-brand-border/40 space-y-2">
                                                                {childReplies.map((reply: any) => (
                                                                    <CommentCard 
                                                                        key={reply.id} 
                                                                        comment={reply} 
                                                                        isLeft={true} 
                                                                        canReply={false}
                                                                        onReport={() => handleReportClick('comment', reply.id, reply.profiles?.username)}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-zinc-600 text-xs italic text-center py-6 font-medium">Belum ada opini untuk kubu ini.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Column B */}
                                <div className={`space-y-3 ${commentSectionTab === 'b' ? 'block' : 'hidden md:block'}`}>
                                    <h4 className="hidden md:flex items-center gap-2 text-xs font-black text-choice-right uppercase tracking-wider border-b border-brand-border/60 pb-2 mb-3">
                                        <span className="w-1.5 h-1.5 rounded-full bg-choice-right" />
                                        Alasan memilih {poll.option_b} ({commentsB.length})
                                    </h4>
                                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                                        {isLoadingComments ? (
                                            <p className="text-zinc-600 text-xs italic text-center py-6 font-medium">Memuat opini...</p>
                                        ) : parentsB.length > 0 ? (
                                            parentsB.map((comment: any) => {
                                                const childReplies = allComments.filter((c: any) => c.parent_id === comment.id);
                                                return (
                                                    <div key={comment.id} className="space-y-2">
                                                        <CommentCard 
                                                            comment={comment} 
                                                            isLeft={false} 
                                                            canReply={!!user && !hasUserCommented}
                                                            onReply={() => setReplyTo({ id: comment.id, username: comment.profiles?.username || 'Anonymous' })}
                                                            onReport={() => handleReportClick('comment', comment.id, comment.profiles?.username)}
                                                        />
                                                        {childReplies.length > 0 && (
                                                            <div className="ml-6 pl-4 border-l border-brand-border/40 space-y-2">
                                                                {childReplies.map((reply: any) => (
                                                                    <CommentCard 
                                                                        key={reply.id} 
                                                                        comment={reply} 
                                                                        isLeft={false} 
                                                                        canReply={false}
                                                                        onReport={() => handleReportClick('comment', reply.id, reply.profiles?.username)}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-zinc-600 text-xs italic text-center py-6 font-medium">Belum ada opini untuk kubu ini.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Report Modal */}
            <AnimatePresence>
                {reportTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl p-6 relative"
                        >
                            <button 
                                onClick={() => setReportTarget(null)}
                                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                <h3 className="text-base font-black text-white uppercase tracking-wider">
                                    Laporkan Konten
                                </h3>
                            </div>
                            
                            <p className="text-xs text-zinc-400 mb-6">
                                Kamu melaporkan {reportTarget.type === 'poll' ? 'topik' : 'opini'} ini karena melanggar aturan komunitas. Pilih alasan yang paling sesuai.
                            </p>
                            
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const reason = formData.get('reason') as any;
                                const details = formData.get('details') as string;
                                
                                if (!reason) {
                                    alert('Pilih alasan pelaporan.');
                                    return;
                                }
                                
                                const res = await reportContent(reportTarget.type, reportTarget.id, reason, details);
                                
                                if (res.success) {
                                    setMessage({ type: 'success', text: 'Laporan berhasil dikirim!' });
                                    setReportTarget(null);
                                    setTimeout(() => setMessage(null), 3000);
                                } else {
                                    alert(res.message);
                                }
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Alasan Pelaporan
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { value: 'spam', label: 'Spam / Iklan tidak diinginkan' },
                                            { value: 'ujaran_kebencian', label: 'Ujaran Kebencian / SARA' },
                                            { value: 'pelecehan', label: 'Pelecehan / Hinaan' },
                                            { value: 'informasi_menyesatkan', label: 'Hoaks / Informasi Menyesatkan' },
                                            { value: 'konten_tidak_pantas', label: 'Pornografi / Konten Tidak Pantas' },
                                            { value: 'lainnya', label: 'Lainnya' }
                                        ].map((opt) => (
                                            <label 
                                                key={opt.value} 
                                                className="flex items-center gap-3 p-3 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all text-xs text-zinc-300 font-semibold"
                                            >
                                                <input 
                                                    type="radio" 
                                                    name="reason" 
                                                    value={opt.value} 
                                                    required 
                                                    className="accent-brand-blue"
                                                />
                                                <span>{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Keterangan Tambahan (Opsional)
                                    </label>
                                    <textarea 
                                        name="details" 
                                        placeholder="Tulis detail tambahan untuk membantu moderator..." 
                                        rows={3}
                                        maxLength={300}
                                        className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-blue/60 transition-all font-semibold resize-none"
                                    />
                                </div>
                                
                                <div className="flex gap-3 pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setReportTarget(null)}
                                        className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 duration-150 cursor-pointer border-none"
                                    >
                                        Kirim Laporan
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
