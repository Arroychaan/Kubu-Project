'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, MessageCircle, Share2, Copy } from 'lucide-react'

interface BattlePayload {
    pool_left: number
    pool_right: number
}

interface BattleCardProps {
    id: string
    optionA: string
    optionB: string
    votesA: number
    votesB: number
    description: string
    imageA?: string
    imageB?: string
    isGrandBattle?: boolean
}

export default function BattleCard({
    id,
    optionA,
    optionB,
    votesA: initialVotesA,
    votesB: initialVotesB,
    description,
    imageA,
    imageB,
    isGrandBattle = false
}: BattleCardProps) {
    const [votesA, setVotesA] = useState(initialVotesA)
    const [votesB, setVotesB] = useState(initialVotesB)
    const [isShaking, setIsShaking] = useState(false)
    const [copied, setCopied] = useState(false)
    const [userVote, setUserVote] = useState<'left' | 'right' | null>(null)

    // Calculate percentages
    const totalVotes = votesA + votesB
    const percentA = totalVotes === 0 ? 50 : Math.round((votesA / totalVotes) * 100)
    const percentB = totalVotes === 0 ? 50 : 100 - percentA

    useEffect(() => {
        const initData = async () => {
            // Check User Vote
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('votes')
                    .select('side')
                    .eq('battle_id', id)
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (data) setUserVote((data as { side: string }).side as 'left' | 'right')
            }
        }
        initData()

        // Real-time subscription for vote updates (pool changes)
        const channel = supabase
            .channel(`battle-${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'battles',
                    filter: `id=eq.${id}`,
                },
                (payload) => {
                    const newBattle = payload.new as BattlePayload
                    setVotesA(newBattle.pool_left)
                    setVotesB(newBattle.pool_right)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [id])

    const handleVote = async (side: 'A' | 'B') => {
        if (userVote) return // Prevent multiple votes

        const dbSide = side === 'A' ? 'left' : 'right'

        try {
            // @ts-expect-error - Supabase types mismatch
            const { data, error } = await supabase.rpc('vote_transaction', {
                p_battle_id: id,
                p_side: dbSide
            })

            if (error) {
                console.error('Vote failed:', error)
                setIsShaking(true)
                setTimeout(() => setIsShaking(false), 500)
                // Revert optimistic update if it was applied (though here it's not yet)
                // if (userVote) setUserVote(userVote) // This line is tricky if userVote is null initially
                alert(error.message || "Failed to vote")
            } else {
                console.log(`Voted for ${dbSide} in battle ${id}`)
                setUserVote(dbSide) // Optimistic update

                // Trigger Global Point Update
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
            setTimeout(() => setIsShaking(false), 500)
            alert(err.message || "Failed to vote due to an unexpected error")
        }
    }

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const url = `${window.location.origin}/battles/${id}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div
            className={`
                group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-[#121212] shadow-lg transition-transform hover:-translate-y-1
                ${isGrandBattle ? 'border-2 border-[var(--color-left)] shadow-[0_0_20px_rgba(0,243,255,0.2)]' : ''}
                ${isShaking ? 'animate-shake' : ''}
            `}
        >
            {/* Tag/Badge Area (Optional) */}
            {isGrandBattle && (
                <div className="absolute right-0 top-0 z-20 rounded-bl-lg bg-[var(--color-left)] px-3 py-1 text-[10px] font-black uppercase text-black">
                    Elite Tier
                </div>
            )}

            {/* Visual Area (Split) */}
            <div className="relative flex h-32 w-full">
                {/* VS Bubble */}
                <div className="absolute left-1/2 top-1/2 z-20 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black border border-white/10 text-[0.6rem] font-black text-white shadow-xl">
                    VS
                </div>

                {/* Left Side Visual */}
                <Link href={`/battles/${id}`} className="relative flex-1 bg-gradient-to-br from-gray-800 to-gray-900 transition-opacity hover:opacity-90">
                    {imageA ? (
                        <Image src={imageA} alt={optionA} fill className="object-cover opacity-80" />
                    ) : (
                        <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black opacity-50"></div>
                    )}
                </Link>

                {/* Right Side Visual */}
                <Link href={`/battles/${id}`} className="relative flex-1 bg-gradient-to-bl from-gray-800 to-gray-900 transition-opacity hover:opacity-90">
                    {imageB ? (
                        <Image src={imageB} alt={optionB} fill className="object-cover opacity-80" />
                    ) : (
                        <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black opacity-50"></div>
                    )}
                </Link>
            </div>

            {/* Info Area */}
            <div className="flex-1 p-4 pb-2">
                <div className="mb-4 flex items-end justify-between">
                    {/* Left Info */}
                    <div className="text-left">
                        <Link href={`/battles/${id}`} className="hover:underline">
                            <h4 className="max-w-[120px] truncate text-xs font-bold uppercase tracking-wider text-white">{optionA}</h4>
                        </Link>
                        <span className="text-[10px] font-medium text-[var(--color-left)]">{votesA.toLocaleString()} Votes</span>
                    </div>

                    {/* Right Info */}
                    <div className="text-right">
                        <Link href={`/battles/${id}`} className="hover:underline">
                            <h4 className="max-w-[120px] truncate text-xs font-bold uppercase tracking-wider text-white">{optionB}</h4>
                        </Link>
                        <span className="text-[10px] font-medium text-[var(--color-right)]">{votesB.toLocaleString()} Votes</span>
                    </div>
                </div>

                {/* Percentages Bar */}
                <div className="mb-1 flex justify-between text-[10px] font-black text-white/50">
                    <span>{percentA}%</span>
                    <span>{percentB}%</span>
                </div>
                <div className="relative mb-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                    <div className="absolute left-0 top-0 h-full bg-[var(--color-left)] transition-all duration-500" style={{ width: `${percentA}%` }}></div>
                    <div className="absolute right-0 top-0 h-full bg-[var(--color-right)] transition-all duration-500" style={{ width: `${percentB}%` }}></div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-3">
                    <button
                        onClick={() => handleVote('A')}
                        disabled={!!userVote}
                        className={`flex flex-1 items-center justify-center gap-1 rounded border py-3 text-[10px] font-bold uppercase tracking-widest transition-all
                            ${userVote === 'left'
                                ? 'bg-[var(--color-left)] text-black border-transparent opacity-100'
                                : userVote
                                    ? 'bg-white/5 text-gray-600 border-white/5 opacity-50 cursor-not-allowed'
                                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-[var(--color-left)] hover:text-black hover:border-transparent active:scale-95'}
                        `}
                    >
                        {userVote === 'left' ? 'VOTED' : 'Vote'} {optionA.substring(0, 3)}
                    </button>
                    <button
                        onClick={() => handleVote('B')}
                        disabled={!!userVote}
                        className={`flex flex-1 items-center justify-center gap-1 rounded border py-3 text-[10px] font-bold uppercase tracking-widest transition-all
                            ${userVote === 'right'
                                ? 'bg-[var(--color-right)] text-white border-transparent opacity-100'
                                : userVote
                                    ? 'bg-white/5 text-gray-600 border-white/5 opacity-50 cursor-not-allowed'
                                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-[var(--color-right)] hover:text-white hover:border-transparent active:scale-95'}
                        `}
                    >
                        {userVote === 'right' ? 'VOTED' : 'Vote'} {optionB.substring(0, 3)}
                    </button>
                </div>

                {/* Social Actions */}
                <div className="flex items-center justify-between border-t border-white/5 pt-2">
                    <Link href={`/battles/${id}`} className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-colors">
                        <MessageCircle className="w-3 h-3" />
                        <span>Debate</span>
                    </Link>

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-500 hover:text-[var(--color-left)] transition-colors"
                    >
                        {copied ? <Copy className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                        <span>{copied ? 'Copied' : 'Share'}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
