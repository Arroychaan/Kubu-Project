'use client';

import { motion, AnimatePresence } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { MouseEvent } from "react";

interface BattleBarProps {
    countA: number;
    countB: number;
    colorA?: string; // Tailwind bg class, defaults to neon-pink
    colorB?: string; // Tailwind bg class, defaults to neon-cyan
    onVote?: (option: 'a' | 'b') => void;
    hasVoted?: boolean;
    labelA?: string;
    labelB?: string;
    className?: string;
}

export default function BattleBar({
    countA,
    countB,
    colorA = 'bg-neon-pink',
    colorB = 'bg-neon-cyan',
    onVote,
    hasVoted = false,
    labelA = 'A',
    labelB = 'B',
    className
}: BattleBarProps) {
    // Calculate percentages
    const total = countA + countB;
    const percentA = total === 0 ? 50 : (countA / total) * 100;
    const percentB = total === 0 ? 50 : (countB / total) * 100;

    // Before vote: 50/50, After vote: actual percentages
    const displayPercentA = hasVoted ? percentA : 50;
    const displayPercentB = hasVoted ? percentB : 50;

    // Skew angle for diagonal split (in degrees)
    const SKEW_DEG = 15;

    // Handler
    const handleVote = (e: MouseEvent, option: 'a' | 'b') => {
        e.stopPropagation();
        if (!hasVoted && onVote) {
            onVote(option);
        }
    };

    return (
        <div className={twMerge("w-full relative h-28 md:h-32 select-none", className)}>
            {/* Main Container */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-gray-950 border border-white/10">

                {/* ===== OPTION B (Right Side - Background Layer) ===== */}
                <div
                    className={twMerge(
                        "absolute inset-0 flex items-center justify-end",
                        colorB
                    )}
                >
                    {/* B Content - Always visible on right */}
                    <div className="z-10 pr-6 md:pr-8 text-right">
                        <AnimatePresence mode="wait">
                            {hasVoted ? (
                                <motion.div
                                    key="voted-b"
                                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="flex flex-col items-end"
                                >
                                    <span className="text-3xl md:text-4xl font-black text-black drop-shadow-sm">
                                        {Math.round(displayPercentB)}%
                                    </span>
                                    <span className="text-xs md:text-sm font-bold text-black/70 uppercase tracking-wider truncate max-w-[80px] md:max-w-[120px]">
                                        {labelB}
                                    </span>
                                </motion.div>
                            ) : (
                                <motion.button
                                    key="vote-b"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => handleVote(e, 'b')}
                                    className="px-4 md:px-6 py-2 md:py-3 bg-black/20 hover:bg-black/30 text-black font-black text-sm md:text-base rounded-xl border-2 border-black/20 hover:border-black/40 uppercase tracking-widest transition-colors shadow-lg cursor-pointer"
                                >
                                    {labelB}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ===== OPTION A (Left Side - Foreground with Diagonal Clip) ===== */}
                <motion.div
                    className={twMerge(
                        "absolute top-0 bottom-0 left-0 h-full flex items-center justify-start overflow-hidden",
                        colorA
                    )}
                    initial={{ width: "50%" }}
                    animate={{ width: `${displayPercentA}%` }}
                    transition={{
                        type: "spring",
                        stiffness: 50,
                        damping: 12,
                        mass: 1
                    }}
                    style={{
                        // Diagonal cut using clip-path
                        // Creates a slanted edge on the right side
                        clipPath: `polygon(0 0, 100% 0, calc(100% - 24px) 100%, 0 100%)`,
                    }}
                >
                    {/* A Content */}
                    <div className="z-10 pl-6 md:pl-8 text-left">
                        <AnimatePresence mode="wait">
                            {hasVoted ? (
                                <motion.div
                                    key="voted-a"
                                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="flex flex-col items-start"
                                >
                                    <span className="text-3xl md:text-4xl font-black text-white drop-shadow-md">
                                        {Math.round(displayPercentA)}%
                                    </span>
                                    <span className="text-xs md:text-sm font-bold text-white/70 uppercase tracking-wider truncate max-w-[80px] md:max-w-[120px]">
                                        {labelA}
                                    </span>
                                </motion.div>
                            ) : (
                                <motion.button
                                    key="vote-a"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => handleVote(e, 'a')}
                                    className="px-4 md:px-6 py-2 md:py-3 bg-white/20 hover:bg-white/30 text-white font-black text-sm md:text-base rounded-xl border-2 border-white/20 hover:border-white/40 uppercase tracking-widest transition-colors shadow-lg cursor-pointer"
                                >
                                    {labelA}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Shimmer Effect Overlay */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"
                        initial={{ x: "-100%", skewX: -20 }}
                        animate={{ x: "200%" }}
                        transition={{
                            repeat: Infinity,
                            duration: 2.5,
                            ease: "easeInOut",
                            repeatDelay: 1
                        }}
                    />
                </motion.div>

                {/* ===== DIAGONAL EDGE GLOW EFFECT ===== */}
                <motion.div
                    className="absolute top-0 bottom-0 w-1 bg-white/50 blur-sm pointer-events-none z-15"
                    initial={{ left: "calc(50% - 12px)" }}
                    animate={{ left: `calc(${displayPercentA}% - 12px)` }}
                    transition={{ type: "spring", stiffness: 50, damping: 12 }}
                    style={{
                        transform: `skewX(-${SKEW_DEG}deg)`,
                    }}
                />

                {/* ===== VS BADGE (Center) ===== */}
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: -12 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                >
                    <div className="bg-gray-950 text-white text-xs md:text-sm font-black px-3 py-1.5 rounded-md border-2 border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                        ⚡ VS
                    </div>
                </motion.div>

                {/* ===== TOTAL VOTES INDICATOR ===== */}
                {hasVoted && total > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20"
                    >
                        <span className="text-[10px] font-mono text-white/40 bg-black/50 px-2 py-0.5 rounded-full">
                            {total.toLocaleString()} votes
                        </span>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
