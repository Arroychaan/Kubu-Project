'use client';

import { motion, AnimatePresence } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { MouseEvent } from "react";

interface ChoiceBarProps {
    countA: number;
    countB: number;
    onVote?: (option: 'a' | 'b') => void;
    hasVoted?: boolean;
    labelA?: string;
    labelB?: string;
    className?: string;
}

export default function ChoiceBar({
    countA,
    countB,
    onVote,
    hasVoted = false,
    labelA = 'A',
    labelB = 'B',
    className
}: ChoiceBarProps) {
    // Calculate percentages
    const total = countA + countB;
    const percentA = total === 0 ? 50 : (countA / total) * 100;
    const percentB = total === 0 ? 50 : (countB / total) * 100;

    // Before vote: 50/50, After vote: actual percentages
    const displayPercentA = hasVoted ? percentA : 50;
    const displayPercentB = hasVoted ? percentB : 50;

    const handleVote = (e: MouseEvent, option: 'a' | 'b') => {
        e.stopPropagation();
        if (!hasVoted && onVote) {
            onVote(option);
        }
    };

    return (
        <div className={twMerge("w-full relative h-24 sm:h-28 select-none", className)}>
            {/* Main Container */}
            <div className="relative w-full h-full rounded-xl overflow-hidden bg-zinc-950 border border-brand-border/80 flex">
                
                {/* ===== OPTION A (Left Side) ===== */}
                <motion.div
                    className="h-full relative flex items-center justify-start overflow-hidden border-r border-brand-border/60"
                    initial={{ width: "50%" }}
                    animate={{ width: `${displayPercentA}%` }}
                    transition={{
                        type: "spring",
                        stiffness: 80,
                        damping: 22
                    }}
                    style={{
                        backgroundColor: hasVoted ? 'rgba(244, 63, 94, 0.08)' : 'transparent'
                    }}
                >
                    {/* A Content */}
                    <div className="z-10 pl-6 md:pl-8 text-left w-full">
                        <AnimatePresence mode="wait">
                            {hasVoted ? (
                                <motion.div
                                    key="voted-a"
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col"
                                >
                                    <span className="text-2xl md:text-3xl font-black text-choice-left tracking-tight">
                                        {Math.round(displayPercentA)}%
                                    </span>
                                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest truncate max-w-[90%]">
                                        {labelA}
                                    </span>
                                </motion.div>
                            ) : (
                                <motion.button
                                    key="vote-a"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    whileHover={{ scale: 1.01, borderColor: 'rgba(244, 63, 94, 0.4)' }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={(e) => handleVote(e, 'a')}
                                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs rounded-lg border border-brand-border shadow-sm cursor-pointer transition-colors duration-150 active:scale-95"
                                >
                                    Pilih {labelA}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* ===== OPTION B (Right Side) ===== */}
                <motion.div
                    className="h-full flex-1 relative flex items-center justify-end overflow-hidden"
                    style={{
                        backgroundColor: hasVoted ? 'rgba(14, 165, 233, 0.08)' : 'transparent'
                    }}
                >
                    {/* B Content */}
                    <div className="z-10 pr-6 md:pr-8 text-right w-full flex justify-end">
                        <AnimatePresence mode="wait">
                            {hasVoted ? (
                                <motion.div
                                    key="voted-b"
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-end"
                                >
                                    <span className="text-2xl md:text-3xl font-black text-choice-right tracking-tight">
                                        {Math.round(displayPercentB)}%
                                    </span>
                                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest truncate max-w-[90%]">
                                        {labelB}
                                    </span>
                                </motion.div>
                            ) : (
                                <motion.button
                                    key="vote-b"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    whileHover={{ scale: 1.01, borderColor: 'rgba(14, 165, 233, 0.4)' }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={(e) => handleVote(e, 'b')}
                                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs rounded-lg border border-brand-border shadow-sm cursor-pointer transition-colors duration-150 active:scale-95"
                                >
                                    Pilih {labelB}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* ===== VS BADGE (Center) ===== */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="bg-zinc-900 text-zinc-400 text-[9px] font-black px-2.5 py-1 rounded-md border border-brand-border shadow-md tracking-wider uppercase">
                        VS
                    </div>
                </div>

                {/* ===== TOTAL SUARA BADGE ===== */}
                {hasVoted && total > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                    >
                        <span className="text-[8px] font-bold text-zinc-500 bg-zinc-950 px-2 py-0.5 border border-brand-border/60 rounded uppercase tracking-wider">
                            {total.toLocaleString()} suara
                        </span>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
