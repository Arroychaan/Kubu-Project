'use client';

import { motion, AnimatePresence } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { MouseEvent } from "react";

interface KubuBarProps {
    countA: number;
    countB: number;
    colorA?: string; // Tailwind bg class
    colorB?: string; // Tailwind bg class
    onVote?: (option: 'a' | 'b') => void;
    hasVoted?: boolean;
    labelA?: string;
    labelB?: string;
    className?: string;
}

export default function KubuBar({
    countA,
    countB,
    colorA = 'bg-choice-left',
    colorB = 'bg-choice-right',
    onVote,
    hasVoted = false,
    labelA = 'A',
    labelB = 'B',
    className
}: KubuBarProps) {
    // Calculate percentages
    const total = countA + countB;
    const percentA = total === 0 ? 50 : (countA / total) * 100;
    const percentB = total === 0 ? 50 : (countB / total) * 100;

    // Before vote: 50/50, After vote: actual percentages
    const displayPercentA = hasVoted ? percentA : 50;
    const displayPercentB = hasVoted ? percentB : 50;

    // Skew angle for diagonal split (in degrees)
    const SKEW_DEG = 12;

    const handleVote = (e: MouseEvent, option: 'a' | 'b') => {
        e.stopPropagation();
        if (!hasVoted && onVote) {
            onVote(option);
        }
    };

    return (
        <div className={twMerge("w-full relative h-28 md:h-32 select-none", className)}>
            {/* Main Container */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-950 border border-brand-border/80">

                {/* ===== OPTION B (Right Side - Background Layer) ===== */}
                <div
                    className={twMerge(
                        "absolute inset-0 flex items-center justify-end bg-gradient-to-br from-choice-right to-sky-600/90"
                    )}
                >
                    {/* B Content - Always visible on right */}
                    <div className="z-10 pr-6 md:pr-10 text-right">
                        <AnimatePresence mode="wait">
                            {hasVoted ? (
                                <motion.div
                                    key="voted-b"
                                    initial={{ opacity: 0, scale: 0.85, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 220, damping: 18 }}
                                    className="flex flex-col items-end"
                                >
                                    <span className="text-3xl md:text-4xl font-black text-white drop-shadow-md tracking-tight">
                                        {Math.round(displayPercentB)}%
                                    </span>
                                    <span className="text-[10px] font-black text-white/80 uppercase tracking-widest truncate max-w-[120px] md:max-w-[180px]">
                                        {labelB}
                                    </span>
                                </motion.div>
                            ) : (
                                <motion.button
                                    key="vote-b"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => handleVote(e, 'b')}
                                    className="px-5 py-2.5 bg-black/50 hover:bg-black/75 text-white font-black text-xs md:text-sm rounded-xl border border-white/10 hover:border-white/25 uppercase tracking-widest transition-all shadow-lg cursor-pointer backdrop-blur-md duration-150 active:scale-95"
                                >
                                    Pilih {labelB}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ===== OPTION A (Left Side - Foreground with Diagonal Clip) ===== */}
                <motion.div
                    className={twMerge(
                        "absolute top-0 bottom-0 left-0 h-full flex items-center justify-start overflow-hidden bg-gradient-to-br from-choice-left to-rose-600/90"
                    )}
                    initial={{ width: "50%" }}
                    animate={{ width: `${displayPercentA}%` }}
                    transition={{
                        type: "spring",
                        stiffness: 70,
                        damping: 20,
                        mass: 1
                    }}
                    style={{
                        // Diagonal cut using clip-path
                        clipPath: `polygon(0 0, 100% 0, calc(100% - 20px) 100%, 0 100%)`,
                    }}
                >
                    {/* A Content */}
                    <div className="z-10 pl-6 md:pl-10 text-left">
                        <AnimatePresence mode="wait">
                            {hasVoted ? (
                                <motion.div
                                    key="voted-a"
                                    initial={{ opacity: 0, scale: 0.85, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 220, damping: 18 }}
                                    className="flex flex-col items-start"
                                >
                                    <span className="text-3xl md:text-4xl font-black text-white drop-shadow-md tracking-tight">
                                        {Math.round(displayPercentA)}%
                                    </span>
                                    <span className="text-[10px] font-black text-white/80 uppercase tracking-widest truncate max-w-[120px] md:max-w-[180px]">
                                        {labelA}
                                    </span>
                                </motion.div>
                            ) : (
                                <motion.button
                                    key="vote-a"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => handleVote(e, 'a')}
                                    className="px-5 py-2.5 bg-black/50 hover:bg-black/75 text-white font-black text-xs md:text-sm rounded-xl border border-white/10 hover:border-white/25 uppercase tracking-widest transition-all shadow-lg cursor-pointer backdrop-blur-md duration-150 active:scale-95"
                                >
                                    Pilih {labelA}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Subtle Shimmer Overlay */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                        initial={{ x: "-100%", skewX: -20 }}
                        animate={{ x: "200%" }}
                        transition={{
                            repeat: Infinity,
                            duration: 3,
                            ease: "easeInOut",
                            repeatDelay: 1.5
                        }}
                    />
                </motion.div>

                {/* ===== DIAGONAL GLOW INTERSECTION ===== */}
                <motion.div
                    className="absolute top-0 bottom-0 w-[1.5px] bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.6)] pointer-events-none z-15"
                    initial={{ left: "calc(50% - 10px)" }}
                    animate={{ left: `calc(${displayPercentA}% - 10px)` }}
                    transition={{ type: "spring", stiffness: 70, damping: 20 }}
                    style={{
                        transform: `skewX(-${SKEW_DEG}deg)`,
                    }}
                />

                {/* ===== VS BADGE (Center) ===== */}
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: -8 }}
                    transition={{ type: "spring", stiffness: 220, damping: 12, delay: 0.15 }}
                >
                    <div className="bg-zinc-950/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-xl border border-zinc-800/80 shadow-2xl tracking-widest uppercase">
                        VS
                    </div>
                </motion.div>

                {/* ===== TOTAL SUARA BADGE ===== */}
                {hasVoted && total > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                    >
                        <span className="text-[9px] font-black text-zinc-400 bg-black/85 px-2.5 py-0.5 border border-brand-border/60 rounded-md tracking-wider uppercase">
                            {total.toLocaleString()} suara
                        </span>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
