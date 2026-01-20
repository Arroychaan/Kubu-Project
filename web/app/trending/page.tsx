'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BattleCard from "@/components/BattleCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/types/supabase'
import { Flame } from 'lucide-react'

type Battle = Database['public']['Tables']['battles']['Row']

async function fetchTrendingBattles(): Promise<Battle[]> {
    // In a real app, this would be a complex query or RPC function 'get_trending_battles'
    // For now, fetch active battles and sort by total pool size descending client side
    const { data, error } = await supabase
        .from('battles')
        .select('*')
        .eq('status', 'active')
        .limit(20) // Get top 20 candidates

    if (error) throw error

    const battles = (data as Battle[]) || []
    // Sort by Total Pool (descending)
    return battles.sort((a, b) => (b.pool_left + b.pool_right) - (a.pool_left + a.pool_right)).slice(0, 10)
}

const POPULAR_HASHTAGS = [
    { tag: '#TechWar', count: '1.2M' },
    { tag: '#AnimeBestGirl', count: '890K' },
    { tag: '#PoliticalDrama', count: '560K' },
    { tag: '#FoodFight', count: '340K' },
    { tag: '#Crypto', count: '120K' }
]

export default function TrendingPage() {
    const router = useRouter()

    // We use the same 'trending' filter logic basically
    const { data: battles, isLoading } = useQuery<Battle[]>({
        queryKey: ['trending-battles'],
        queryFn: fetchTrendingBattles
    })

    const handleHashtagClick = (tag: string) => {
        // Hypothetical filter navigation
        router.push(`/?search=${encodeURIComponent(tag)}`)
    }

    return (
        <div className="min-h-screen px-4 py-8 md:px-8">
            <div className="mx-auto max-w-6xl">

                <header className="mb-12">
                    <h1 className="mb-2 text-4xl font-black uppercase tracking-tighter text-white">
                        <span className="text-red-500">Trending</span> Zone
                    </h1>
                    <p className="text-gray-400">The hottest conflicts dominating the network right now.</p>
                </header>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">

                    {/* LEFT: Hashtags sidebar */}
                    <div className="order-2 lg:order-1 lg:col-span-1">
                        <div className="sticky top-24 rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
                            <h3 className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                                <Flame className="h-4 w-4 text-orange-500" /> Virality Index
                            </h3>
                            <div className="space-y-4">
                                {POPULAR_HASHTAGS.map((item) => (
                                    <button
                                        key={item.tag}
                                        onClick={() => handleHashtagClick(item.tag)}
                                        className="group flex w-full items-center justify-between rounded p-2 text-left hover:bg-white/5"
                                    >
                                        <span className="font-bold text-white group-hover:text-[var(--color-left)] transition-colors">{item.tag}</span>
                                        <span className="font-mono text-[10px] text-gray-600">{item.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Battle Feed */}
                    <div className="order-1 lg:order-2 lg:col-span-3">
                        {isLoading ? (
                            <div className="flex h-64 items-center justify-center text-gray-500 animate-pulse">Scanning social sentiment...</div>
                        ) : (
                            <div className="space-y-6">
                                {battles?.map((battle, index) => (
                                    <div key={battle.id} className="relative">
                                        {/* Rank Indicator */}
                                        <div className="absolute -left-4 -top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black font-black text-white shadow-xl">
                                            {index + 1}
                                        </div>
                                        <BattleCard
                                            id={battle.id}
                                            description={battle.description || battle.title}
                                            optionA={battle.left_side}
                                            optionB={battle.right_side}
                                            votesA={battle.pool_left}
                                            votesB={battle.pool_right}
                                        />
                                    </div>
                                ))}

                                {(!battles || battles.length === 0) && (
                                    <div className="text-center text-gray-500">No trending battles found.</div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
