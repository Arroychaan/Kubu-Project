'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'

import Link from 'next/link'

interface FeaturedBattleProps {
    id: string
    title: string,
    endsAt: string
    totalVotes: number
    leftSide: {
        name: string
        votes: number
        image?: string
        color: string
    }
    rightSide: {
        name: string
        votes: number
        image?: string
        color: string
    }
}

export default function FeaturedBattle({
    id,
    title,
    endsAt,
    totalVotes: initialTotalVotes,
    leftSide,
    rightSide
}: FeaturedBattleProps) {
    const [votesA, setVotesA] = useState(leftSide.votes)
    const [votesB, setVotesB] = useState(rightSide.votes)
    const [isShaking, setIsShaking] = useState(false)
    const [userVote, setUserVote] = useState<'left' | 'right' | null>(null)

    // Derived state
    const totalVotes = votesA + votesB
    const percentA = totalVotes === 0 ? 50 : Math.round((votesA / totalVotes) * 100)
    const percentB = totalVotes === 0 ? 50 : 100 - percentA

    const [timeLeftDisplay, setTimeLeftDisplay] = useState("Loading...")

    useEffect(() => {
        const updateTimer = () => {
            const end = new Date(endsAt).getTime()
            const now = new Date().getTime()
            const dist = end - now

            if (dist < 0) {
                setTimeLeftDisplay("ENDED")
                return
            }

            const h = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const m = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60))
            const s = Math.floor((dist % (1000 * 60)) / 1000)
            const d = Math.floor(dist / (1000 * 60 * 60 * 24))

            const timeStr = d > 0
                ? `${d}D ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                : `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`

            setTimeLeftDisplay(timeStr)
        }

        updateTimer() // Initial call
        const timer = setInterval(updateTimer, 1000)

        return () => clearInterval(timer)
    }, [endsAt])

    useEffect(() => {
        const checkVote = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('votes').select('side').eq('battle_id', id).eq('user_id', user.id).maybeSingle()
                if (data) setUserVote((data as { side: string }).side as 'left' | 'right')
            }
        }
        checkVote()

        const channel = supabase
            .channel(`battle-featured-${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'battles',
                    filter: `id=eq.${id}`,
                },
                (payload) => {
                    const newBattle = payload.new as { pool_left: number, pool_right: number }
                    setVotesA(newBattle.pool_left)
                    setVotesB(newBattle.pool_right)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [id])

    const handleVote = async (e: React.MouseEvent, side: 'left' | 'right') => {
        e.preventDefault() // Stop Link navigation
        e.stopPropagation()

        try {
            // @ts-expect-error - Supabase types mismatch with generated DB types
            const { data, error } = await supabase.rpc('vote_transaction', {
                p_battle_id: id,
                p_side: side
            })

            if (error) {
                console.error('Vote failed:', error)
                setIsShaking(true)
                alert(error.message || "Vote failed")
                setTimeout(() => setIsShaking(false), 500)
            } else {
                setUserVote(side) // Optimistic update

                // Trigger Global Point Update with EXACT new balance from server
                const responseData = data as { new_balance?: number, success?: boolean }
                if (responseData && typeof responseData.new_balance === 'number') {
                    window.dispatchEvent(new CustomEvent('kubu-points-sync', { detail: responseData.new_balance }))
                } else {
                    window.dispatchEvent(new CustomEvent('kubu-points-sync'))
                }
            }
        } catch (err: any) {
            console.error('Unexpected error voting:', err)
            setIsShaking(true)
            alert(err.message || "Vote failed")
            setTimeout(() => setIsShaking(false), 500)
        }
    }

    return (
        <div className={`relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl ${isShaking ? 'animate-shake' : ''}`}>
            {/* Header Bar */}
            <div className="flex items-center justify-between border-b border-white/5 bg-black/40 px-6 py-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
                    <span className="text-sm font-bold tracking-widest text-white/90">FEATURED GLOBAL EVENT</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-sm text-[var(--color-left)]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className="tracking-widest" suppressHydrationWarning>ENDS IN {timeLeftDisplay}</span>
                </div>
            </div>

            {/* Main Content Area */}
            <Link href={`/battles/${id}`} className="relative block h-[400px] w-full cursor-pointer overflow-hidden sm:h-[500px]">
                <div className="flex h-full w-full items-stretch">

                    {/* VS Badge (Center) */}
                    <div className="absolute left-1/2 top-1/2 z-30 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-black/50 backdrop-blur-sm" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}>
                        <span className="text-3xl font-black italic tracking-tighter text-white">VS</span>
                    </div>

                    {/* Left Side (Cyan) */}
                    <div className="group relative flex-1 overflow-hidden">
                        {/* Background Image / Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-[#00f3ff]/10 to-transparent opacity-50 transition-all duration-500 group-hover:via-[#00f3ff]/20"></div>
                        {/* Character Image Placeholder */}
                        {leftSide.image ? (
                            <div className="absolute inset-0 opacity-80 mix-blend-luminosity transition-all duration-500 group-hover:scale-105 group-hover:mix-blend-normal">
                                <Image src={leftSide.image} alt={leftSide.name} fill className="object-cover object-top" />
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black opacity-80 transition-all duration-500 group-hover:scale-105"></div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>

                        <div className="absolute bottom-0 left-0 p-8 sm:p-12">
                            <h2 className="mb-4 max-w-[80%] text-4xl font-black uppercase leading-none tracking-tighter text-white sm:text-5xl">{leftSide.name}</h2>
                            <button
                                onClick={(e) => handleVote(e, 'left')}
                                disabled={userVote === 'right'}
                                className={`group/btn relative overflow-hidden rounded-none px-8 py-3 font-black uppercase tracking-wider transition-all 
                                ${userVote === 'right' ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' : 'bg-[var(--color-left)] text-black hover:bg-[#00c2cc] hover:shadow-[0_0_20px_rgba(0,243,255,0.4)]'}
                            `}
                            >
                                <span className="relative z-10">{userVote === 'left' ? 'BOOST CYAN' : 'VOTE CYAN'}</span>
                                {userVote !== 'right' && <div className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-300 group-hover/btn:translate-x-0"></div>}
                            </button>
                        </div>

                        <div className="absolute bottom-8 right-12 z-20 sm:bottom-12 sm:right-16">
                            <span className="text-6xl font-black text-[var(--color-left)] opacity-80 sm:text-7xl">{percentA}%</span>
                        </div>
                    </div>

                    {/* Right Side (Red) */}
                    <div className="group relative flex-1 overflow-hidden text-right">
                        {/* Background Image / Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-l from-black via-[#ff0055]/10 to-transparent opacity-50 transition-all duration-500 group-hover:via-[#ff0055]/20"></div>
                        {/* Character Image Placeholder */}
                        {rightSide.image ? (
                            <div className="absolute inset-0 opacity-80 mix-blend-luminosity transition-all duration-500 group-hover:scale-105 group-hover:mix-blend-normal">
                                <Image src={rightSide.image} alt={rightSide.name} fill className="object-cover object-top" />
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black opacity-80 transition-all duration-500 group-hover:scale-105"></div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>

                        <div className="absolute bottom-0 right-0 flex flex-col items-end p-8 sm:p-12">
                            <h2 className="mb-4 max-w-[80%] text-4xl font-black uppercase leading-none tracking-tighter text-white sm:text-5xl">{rightSide.name}</h2>
                            <button
                                onClick={(e) => handleVote(e, 'right')}
                                disabled={userVote === 'left'}
                                className={`group/btn relative overflow-hidden rounded-none px-8 py-3 font-black uppercase tracking-wider transition-all 
                                ${userVote === 'left' ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' : 'bg-[var(--color-right)] text-white hover:bg-[#cc0044] hover:shadow-[0_0_20px_rgba(255,0,85,0.4)]'}
                            `}
                            >
                                <span className="relative z-10">{userVote === 'right' ? 'BOOST RED' : 'VOTE RED'}</span>
                                {userVote !== 'left' && <div className="absolute inset-0 translate-x-full bg-white/30 transition-transform duration-300 group-hover/btn:-translate-x-0"></div>}
                            </button>
                        </div>

                        <div className="absolute bottom-8 left-12 z-20 sm:bottom-12 sm:left-16">
                            <span className="text-6xl font-black text-[var(--color-right)] opacity-80 sm:text-7xl">{percentB}%</span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Progress Bar Footer */}
            <div className="relative h-4 w-full bg-gray-900">
                <div className="flex h-full w-full">
                    <div className="h-full bg-[var(--color-left)] transition-all duration-1000 ease-out" style={{ width: `${percentA}%` }}>
                        <div className="h-full w-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    </div>
                    <div className="h-full bg-[var(--color-right)] transition-all duration-1000 ease-out" style={{ width: `${percentB}%` }}>
                        <div className="h-full w-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    </div>
                </div>
            </div>

            {/* Footer Meta */}
            <div className="flex justify-between bg-black px-6 py-2 text-[10px] uppercase tracking-widest text-[#666]">
                <span>Total Votes: {totalVotes.toLocaleString()}</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Live Updating</span>
            </div>
        </div>
    )
}
