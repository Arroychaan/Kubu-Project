'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Crown, Medal, Trophy, Shield, Star, Zap } from 'lucide-react'

interface LeaderboardUser {
    id: string
    title: string | null
    points: number
    stats: {
        wins: number
        losses: number
        votes_cast: number
    }
    tier?: 'free' | 'elite'
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const { data } = await supabase
                .from('users')
                .select('id, title, points, stats, tier')
                .order('points', { ascending: false })
                .limit(50)

            const formatted = (data as any[])?.map(u => ({
                ...u,
                stats: u.stats || { wins: 0, losses: 0, votes_cast: 0 }
            })) || []

            setLeaderboard(formatted)
            setIsLoading(false)
        }

        fetchLeaderboard()
    }, [])

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Trophy className="h-12 w-12 animate-bounce text-yellow-500" />
                    <span className="font-mono text-sm uppercase tracking-widest text-gray-500 animate-pulse">Calculating Global Rankings...</span>
                </div>
            </div>
        )
    }

    const top3 = leaderboard.slice(0, 3)
    const rest = leaderboard.slice(3)

    return (
        <div className="min-h-screen px-4 py-12 md:px-8">
            <div className="mx-auto max-w-5xl">

                <header className="mb-16 text-center">
                    <div className="mb-4 inline-flex items-center justify-center rounded-full border border-yellow-500/20 bg-yellow-500/5 px-6 py-2">
                        <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-500">Global Elite</span>
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white sm:text-6xl">
                        Hall of <span className="text-yellow-500 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Fame</span>
                    </h1>
                </header>

                {/* PODIUM SECTION */}
                <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3 md:items-end">

                    {/* 2ND PLACE */}
                    {top3[1] && (
                        <div className="order-2 md:order-1 relative overflow-hidden rounded-2xl border border-gray-400/20 bg-gradient-to-b from-gray-900 to-black p-6 text-center transform hover:-translate-y-2 transition-transform duration-300">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gray-400"></div>
                            <div className="mb-4 flex justify-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gray-400 bg-gray-400/10">
                                    <Medal className="h-8 w-8 text-gray-400" />
                                </div>
                            </div>
                            <h3 className="mb-1 text-xl font-bold text-white truncate">{top3[1].title || 'Unknown'}</h3>
                            <p className="mb-4 text-xs font-mono text-gray-500 uppercase tracking-widest">Rank #2</p>
                            <div className="text-2xl font-black text-gray-300">{top3[1].points.toLocaleString()}</div>
                            <div className="mt-2 text-[10px] text-gray-600">
                                {top3[1].stats.wins} Wins
                            </div>
                        </div>
                    )}

                    {/* 1ST PLACE */}
                    {top3[0] && (
                        <div className="order-1 md:order-2 relative z-10 overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-yellow-900/20 to-black p-8 text-center shadow-[0_0_50px_rgba(234,179,8,0.1)] transform hover:scale-105 transition-transform duration-300">
                            <div className="absolute top-0 right-0 p-4">
                                <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
                            </div>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300"></div>
                            <div className="mb-6 flex justify-center scale-125">
                                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-yellow-500 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                                    <Crown className="h-10 w-10 text-yellow-500" />
                                    <div className="absolute bottom-0 translate-y-1/2 rounded bg-yellow-500 px-2 py-0.5 text-[10px] font-black text-black">KING</div>
                                </div>
                            </div>
                            <h3 className="mb-1 text-2xl font-black text-white truncate tracking-tight">{top3[0].title || 'Unknown'}</h3>
                            <p className="mb-6 text-xs font-mono text-yellow-500/80 uppercase tracking-widest">THE UNTOUCHABLE</p>
                            <div className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">{top3[0].points.toLocaleString()}</div>
                            <div className="mt-4 flex justify-center gap-4 text-xs font-bold text-gray-500">
                                <span className="text-green-500">{top3[0].stats.wins} W</span>
                                <span className="text-red-500">{top3[0].stats.losses} L</span>
                            </div>
                        </div>
                    )}

                    {/* 3RD PLACE */}
                    {top3[2] && (
                        <div className="order-3 relative overflow-hidden rounded-2xl border border-orange-700/20 bg-gradient-to-b from-gray-900 to-black p-6 text-center transform hover:-translate-y-2 transition-transform duration-300">
                            <div className="absolute top-0 left-0 w-full h-1 bg-orange-700"></div>
                            <div className="mb-4 flex justify-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-orange-700 bg-orange-700/10">
                                    <Medal className="h-8 w-8 text-orange-700" />
                                </div>
                            </div>
                            <h3 className="mb-1 text-xl font-bold text-white truncate">{top3[2].title || 'Unknown'}</h3>
                            <p className="mb-4 text-xs font-mono text-gray-500 uppercase tracking-widest">Rank #3</p>
                            <div className="text-2xl font-black text-orange-700">{top3[2].points.toLocaleString()}</div>
                            <div className="mt-2 text-[10px] text-gray-600">
                                {top3[2].stats.wins} Wins
                            </div>
                        </div>
                    )}

                </div>

                {/* THE REST LIST */}
                <div className="space-y-3">
                    {rest.map((user, index) => (
                        <div
                            key={user.id}
                            className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-6 py-4 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/10 hover:scale-[1.01]"
                        >
                            <div className="flex items-center gap-6">
                                <div className="flex h-8 w-8 items-center justify-center rounded font-mono font-bold text-gray-500 group-hover:text-white">
                                    #{index + 4}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-200 group-hover:text-white transition-colors">{user.title || 'Anonymous'}</span>
                                        {user.tier === 'elite' && <Shield className="h-3 w-3 text-yellow-500" />}
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                        <span>Win Rate: {Math.round((user.stats.wins / (user.stats.wins + user.stats.losses || 1)) * 100)}%</span>
                                        <span>•</span>
                                        <span>{user.stats.votes_cast} Battles</span>
                                    </div>
                                </div>
                            </div>
                            <div className="font-mono font-bold text-gray-400 group-hover:text-white">
                                {user.points.toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center text-[10px] text-gray-600 uppercase tracking-widest">
                    Live Rankings • Updates Instantly
                </div>

            </div>
        </div>
    )
}
