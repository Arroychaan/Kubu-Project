'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/types/supabase'
import { Skull, User, Crown, Medal, Award, TrendingUp, TrendingDown, Lock, Settings } from 'lucide-react'

// Types
type Profile = Database['public']['Tables']['users']['Row']
type PTransaction = Database['public']['Tables']['point_transactions']['Row']

interface LeaderboardUser {
    id: string
    title: string | null
    points: number
    stats: {
        wins: number
        losses: number
        votes_cast: number
    }
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [transactions, setTransactions] = useState<PTransaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const run = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                setIsAuthenticated(true)
                const { data: userProfile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (userProfile) {
                    setProfile(userProfile as Profile)
                }

                const { data: txs } = await supabase
                    .from('point_transactions')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(20)

                setTransactions(txs as PTransaction[] || [])
            } else {
                setIsAuthenticated(false)
            }

            setIsLoading(false)
        }

        run()
    }, [router])

    if (isLoading) return <div className="flex min-h-screen items-center justify-center font-mono text-xs text-white uppercase animate-pulse">Synchronizing Neural Link...</div>

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-8 text-center shadow-2xl">
                    <div className="mb-6 flex justify-center text-5xl opacity-50">
                        <User className="h-16 w-16" />
                    </div>
                    <h1 className="mb-2 text-2xl font-black uppercase text-white">Identity Unverified</h1>
                    <p className="mb-8 text-sm text-gray-400">
                        You must be logged in to view your service record.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 rounded bg-white px-8 py-3 font-bold uppercase tracking-widest text-black transition-transform hover:scale-105"
                    >
                        <Lock className="h-4 w-4" /> Authenticate
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen px-4 py-8 md:px-8">
            <div className="mx-auto max-w-6xl">

                {/* Header Profile Summary */}
                {profile && (
                    <div className="mb-12 flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-gray-900 to-black p-8 shadow-2xl md:flex-row md:items-center">
                        <div className="flex items-center gap-6">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10 text-4xl shadow-inner text-white/50">
                                {profile.tier === 'elite' ? <Skull className="h-10 w-10 text-[var(--color-left)]" /> : <User className="h-10 w-10" />}
                            </div>
                            <div>
                                <div className="mb-1 flex items-center gap-2">
                                    <h1 className="text-3xl font-black uppercase text-white tracking-tighter">
                                        {profile.title || 'Anonymous Drifter'}
                                    </h1>
                                    {profile.tier === 'elite' && (
                                        <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-yellow-500 border border-yellow-500/50">Elite</span>
                                    )}
                                </div>
                                <p className="font-mono text-xs text-gray-500">Device ID: {profile.device_hash?.substring(0, 12)}...</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 text-right">
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Current Balance</div>
                                <div className="text-4xl font-black text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]">{profile.points.toLocaleString()}</div>
                            </div>
                            <div className="h-12 w-px bg-white/10 hidden md:block"></div>
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Win Rate</div>
                                <div className="text-4xl font-black text-white">
                                    {/* Calculate Win Rate */}
                                    {(() => {
                                        const stats = profile.stats as { wins: number, losses: number }
                                        const total = (stats.wins || 0) + (stats.losses || 0)
                                        return total === 0 ? '0%' : Math.round((stats.wins / total) * 100) + '%'
                                    })()}
                                </div>
                            </div>

                            <div className="h-12 w-px bg-white/10 hidden md:block"></div>

                            <Link href="/settings" className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-all hover:bg-white hover:text-black hover:scale-110">
                                <Settings className="h-5 w-5 transition-transform duration-500 group-hover:rotate-90" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Stats & History */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* LEFT: Stats Visualizer */}
                    <div className="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
                        <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-gray-400">Combat Statistics</h3>
                        {profile && (() => {
                            const stats = profile.stats as { wins: number, losses: number, votes_cast: number }
                            const total = (stats.wins || 0) + (stats.losses || 0)

                            return (
                                <div className="space-y-6">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-bold text-white uppercase">Total Battles</span>
                                        <span className="font-mono text-white">{stats.votes_cast}</span>
                                    </div>

                                    {/* Simple Visual Bar */}
                                    <div>
                                        <div className="mb-2 flex justify-between text-[10px] uppercase text-gray-500">
                                            <span>Wins ({stats.wins})</span>
                                            <span>Losses ({stats.losses})</span>
                                        </div>
                                        <div className="flex h-4 overflow-hidden rounded bg-black/50">
                                            <div className="bg-green-500" style={{ width: `${total ? (stats.wins / total) * 100 : 0}%` }}></div>
                                            <div className="bg-red-500" style={{ width: `${total ? (stats.losses / total) * 100 : 0}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <div className="rounded bg-black/30 p-4 text-center">
                                            <div className="text-2xl font-black text-green-500">{stats.wins}</div>
                                            <div className="text-[10px] uppercase text-gray-600">Victories</div>
                                        </div>
                                        <div className="rounded bg-black/30 p-4 text-center">
                                            <div className="text-2xl font-black text-red-500">{stats.losses}</div>
                                            <div className="text-[10px] uppercase text-gray-600">Defeats</div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })()}
                    </div>

                    {/* RIGHT: Transaction History */}
                    <div className="lg:col-span-2 rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
                        <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-gray-400">Transaction Log</h3>
                        <div className="space-y-2 overflow-y-auto max-h-[500px] pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between rounded border border-white/5 bg-black/20 p-3 transition-colors hover:bg-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-8 w-8 items-center justify-center rounded font-bold text-xs ${tx.amount >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                            {tx.amount >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-200 capitalize">{tx.type.replace('_', ' ')}</div>
                                            <div className="text-[10px] text-gray-500">{tx.description || 'No details'}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-mono font-bold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                                        </div>
                                        <div className="text-[10px] text-gray-600">{new Date(tx.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                            {transactions.length === 0 && (
                                <div className="py-8 text-center text-sm text-gray-600 italic">No transactions found. Start voting!</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
