'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/types/supabase'
import BakuHantamList from '@/components/BakuHantamList'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { Share2, Copy } from 'lucide-react'

type Battle = Database['public']['Tables']['battles']['Row']

export default function BattleDetail() {
    const { id } = useParams()
    const [battle, setBattle] = useState<Battle | null>(null)
    const [userSide, setUserSide] = useState<'left' | 'right' | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isVoting, setIsVoting] = useState(false)
    const [copied, setCopied] = useState(false)

    // Load initial data
    useEffect(() => {
        if (!id) return

        const fetchBattleData = async () => {
            // 1. Fetch Battle
            const { data: battleData, error: battleError } = await supabase
                .from('battles')
                .select('*')
                .eq('id', id)
                .single()

            if (battleError) {
                console.error("Error fetching battle", battleError)
                setIsLoading(false)
                return
            }

            setBattle(battleData as Battle)

            // 2. Check User Vote
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: voteData } = await supabase
                    .from('votes')
                    .select('side')
                    .eq('battle_id', id)
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (voteData) {
                    setUserSide(voteData.side)
                }
            }

            setIsLoading(false)
        }

        fetchBattleData()

        // Realtime Subscription for Battle Totals
        const channel = supabase
            .channel(`battle-detail-${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'battles',
                    filter: `id=eq.${id}`,
                },
                (payload) => {
                    setBattle(payload.new as Battle)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [id])

    const handleVote = async (side: 'left' | 'right') => {
        if (!battle || isVoting) return
        setIsVoting(true)

        try {
            // Haptic feedback (if supported on mobile)
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(50)
            }

            // @ts-expect-error - RPC args
            const { data, error } = await supabase.rpc('vote_transaction', {
                p_battle_id: battle.id,
                p_side: side
            })

            if (error) throw error

            // Update local state immediately (optimistic)
            setUserSide(side)

            // Trigger Global Point Update with EXACT new balance from server
            const responseData = data as { new_balance?: number, success?: boolean }
            if (responseData && typeof responseData.new_balance === 'number') {
                window.dispatchEvent(new CustomEvent('kubu-points-sync', { detail: responseData.new_balance }))
            } else {
                // Fallback to fetch if data missing
                window.dispatchEvent(new CustomEvent('kubu-points-sync'))
            }

        } catch (error: any) {
            console.error("Vote failed", error)
            alert(error.message || "Failed to vote. Check console for details.")
        } finally {
            setIsVoting(false)
        }
    }

    const handleShare = () => {
        const url = window.location.href
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (isLoading) return <div className="flex h-screen items-center justify-center text-white">Initializing War Room...</div>
    if (!battle) return <div className="flex h-screen items-center justify-center text-red-500">Battle not found</div>

    const totalVotes = battle.pool_left + battle.pool_right
    const percentLeft = totalVotes === 0 ? 50 : Math.round((battle.pool_left / totalVotes) * 100)
    const percentRight = totalVotes === 0 ? 50 : 100 - percentLeft

    return (
        <div className="min-h-screen pb-20 pt-8">
            <div className="mx-auto max-w-6xl px-4 lg:px-8">

                {/* HEADLINE */}
                <div className="mb-10 text-center">
                    <h1 className="mb-2 text-3xl font-black uppercase tracking-tighter text-white md:text-5xl">{battle.title}</h1>
                    <p className="text-gray-400">{battle.description}</p>
                </div>

                {/* VISUAL BATTLEFIELD */}
                <div
                    className="relative mb-12 flex h-[300px] w-full items-stretch overflow-hidden rounded-3xl border border-white/10 bg-black/50 shadow-2xl md:h-[400px]"
                    style={{
                        '--color-left': '#00f3ff',
                        '--color-right': '#ff0055'
                    } as React.CSSProperties}
                >

                    {/* LEFT SIDE */}
                    <div className="group relative flex-1 bg-gradient-to-br from-black to-gray-900">
                        {/* Dynamic Opacity based on Dominance */}
                        <div className={`absolute inset-0 bg-[var(--color-left)] transition-opacity duration-1000 ${percentLeft > percentRight ? 'opacity-20' : 'opacity-5'}`}></div>

                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                            <h2 className="mb-4 text-center text-2xl font-black uppercase text-white md:text-4xl">{battle.left_side}</h2>
                            <div className="text-6xl font-black text-[var(--color-left)] md:text-8xl">{percentLeft}%</div>
                            <div className="mt-2 text-sm font-bold uppercase tracking-widest text-[#00f3ff]/60">{battle.pool_left.toLocaleString()} Points Staked</div>
                        </div>

                        <button
                            onClick={() => handleVote('left')}
                            disabled={isVoting || userSide === 'right'}
                            className={`
                                absolute bottom-8 left-1/2 -translate-x-1/2 transform rounded-full border-2 border-[var(--color-left)] px-10 py-4 text-xl font-bold uppercase tracking-widest backdrop-blur-md transition-all 
                                ${userSide === 'right'
                                    ? 'bg-black/50 text-gray-500 opacity-20 grayscale cursor-not-allowed border-gray-700'
                                    : userSide === 'left'
                                        ? 'bg-[var(--color-left)] text-black ring-4 ring-white/20 scale-105 shadow-[0_0_20px_var(--color-left)]'
                                        : 'bg-black/80 text-[var(--color-left)] hover:scale-105 hover:bg-[var(--color-left)] hover:text-black hover:shadow-[0_0_30px_rgba(0,243,255,0.6)]'
                                }
                            `}
                        >
                            {isVoting && userSide !== 'right' ? 'Voting...' : (userSide === 'left' ? 'BOOST (+2 PT)' : 'VOTE CYAN')}
                        </button>
                    </div>

                    {/* VS DIVIDER */}
                    <div className="relative z-10 flex w-0 items-center justify-center">
                        <div className="absolute h-[120%] w-[2px] bg-white/10 backdrop-blur-sm"></div>
                        <div className="absolute h-16 w-16 -rotate-12 rounded-xl border-2 border-white/20 bg-black text-2xl font-black italic leading-[4rem] text-white shadow-xl flex items-center justify-center">
                            VS
                        </div>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="group relative flex-1 bg-gradient-to-bl from-black to-gray-900">
                        {/* Dynamic Opacity based on Dominance */}
                        <div className={`absolute inset-0 bg-[var(--color-right)] transition-opacity duration-1000 ${percentRight > percentLeft ? 'opacity-20' : 'opacity-5'}`}></div>

                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                            <h2 className="mb-4 text-center text-2xl font-black uppercase text-white md:text-4xl">{battle.right_side}</h2>
                            <div className="text-6xl font-black text-[var(--color-right)] md:text-8xl">{percentRight}%</div>
                            <div className="mt-2 text-sm font-bold uppercase tracking-widest text-[#ff0055]/60">{battle.pool_right.toLocaleString()} Points Staked</div>
                        </div>

                        <button
                            onClick={() => handleVote('right')}
                            disabled={isVoting || userSide === 'left'}
                            className={`
                                absolute bottom-8 left-1/2 -translate-x-1/2 transform rounded-full border-2 border-[var(--color-right)] px-10 py-4 text-xl font-bold uppercase tracking-widest backdrop-blur-md transition-all 
                                ${userSide === 'left'
                                    ? 'bg-black/50 text-gray-500 opacity-20 grayscale cursor-not-allowed border-gray-700'
                                    : userSide === 'right'
                                        ? 'bg-[var(--color-right)] text-white ring-4 ring-white/20 scale-105 shadow-[0_0_20px_var(--color-right)]'
                                        : 'bg-black/80 text-[var(--color-right)] hover:scale-105 hover:bg-[var(--color-right)] hover:text-white hover:shadow-[0_0_30px_rgba(255,0,85,0.6)]'
                                }
                            `}
                        >
                            {isVoting && userSide !== 'left' ? 'Voting...' : (userSide === 'right' ? 'BOOST (+2 PT)' : 'VOTE RED')}
                        </button>
                    </div>
                </div>

                {/* PROGRESS BAR BOTTOM */}
                <div className="mb-16 h-2 w-full overflow-hidden rounded-full bg-gray-900">
                    <div className="flex h-full w-full">
                        <div className="h-full bg-[var(--color-left)] transition-all duration-1000" style={{ width: `${percentLeft}%` }}></div>
                        <div className="h-full bg-[var(--color-right)] transition-all duration-1000" style={{ width: `${percentRight}%` }}></div>
                    </div>
                </div>

                {/* GRID LAYOUT FOR DETAILS */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">



                    {/* LEFT COLUMN: STATS */}
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm h-fit">
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">Battle Intel</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Total Pool</span>
                                <span className="font-mono font-bold text-white">{totalVotes.toLocaleString()} pts</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Status</span>
                                <span className="font-bold text-green-400 uppercase">{battle.status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Ends In</span>
                                <span className="font-mono text-white">{new Date(battle.ends_at).toLocaleDateString()}</span>
                            </div>

                            <button
                                onClick={handleShare}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-white/10 bg-white/5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-white hover:text-black"
                            >
                                {copied ? <Copy className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                                {copied ? 'Link Copied' : 'Share Battle'}
                            </button>
                        </div>
                    </div>

                    {/* CENTER/RIGHT: BAKU HANTAM (CHAT) - Takes 2 cols */}
                    <div className="lg:col-span-2">
                        <BakuHantamList battleId={id as string} userSide={userSide} />
                    </div>

                </div>

            </div>
        </div>
    )
}
