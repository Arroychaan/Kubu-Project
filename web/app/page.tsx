'use client'

import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/types/supabase'
import BattleCard from "@/components/BattleCard";
import FeaturedBattle from "@/components/FeaturedBattle";
import { useQuery } from "@tanstack/react-query";
import { useState } from 'react';

import Link from 'next/link';
import { Hammer } from 'lucide-react';

type Battle = Database['public']['Tables']['battles']['Row']

async function fetchBattles(): Promise<Battle[]> {
  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Battle[]) || []
}

export default function Home() {
  const [filter, setFilter] = useState<'trending' | 'new' | 'ending'>('trending')

  const { data: battles = [], isLoading } = useQuery<Battle[]>({
    queryKey: ['battles'],
    queryFn: fetchBattles
  })

  // 1. Determine Featured Battle (Always the Highest Total Votes)
  const featuredBattle = battles.length > 0
    ? battles.reduce((prev, current) =>
      ((prev.pool_left + prev.pool_right) > (current.pool_left + current.pool_right)) ? prev : current
    )
    : null

  // 2. Filter & Sort the Rest (Skirmishes)
  const skirmishes = battles
    .filter(b => b.id !== featuredBattle?.id)
    .sort((a, b) => {
      if (filter === 'new') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (filter === 'ending') return new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime()
      // trending
      return (b.pool_left + b.pool_right) - (a.pool_left + a.pool_right)
    })

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">

      {isLoading && (
        <div className="flex h-[500px] items-center justify-center text-muted animate-pulse">
          Loading Global Events...
        </div>
      )}

      {/* Hero Section: Featured Global Event */}
      {!isLoading && featuredBattle && (
        <section className="mb-16">
          <FeaturedBattle
            id={featuredBattle.id}
            title={featuredBattle.title}
            endsAt={featuredBattle.ends_at}
            totalVotes={(featuredBattle.pool_left || 0) + (featuredBattle.pool_right || 0)}
            leftSide={{
              name: featuredBattle.left_side,
              votes: featuredBattle.pool_left || 0,
              color: 'var(--color-left)'
            }}
            rightSide={{
              name: featuredBattle.right_side,
              votes: featuredBattle.pool_right || 0,
              color: 'var(--color-right)'
            }}
          />
        </section>
      )}

      {/* Live Skirmishes Section */}
      <section>
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          {/* Section Title */}
          <div className="flex items-center gap-3 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-[#00f3ff]/10 text-[#00f3ff]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <h2 className="text-2xl font-black uppercase tracking-wide">Live Skirmishes</h2>
          </div>

          {/* Filters */}
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-1">
            {(['trending', 'new', 'ending'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                            rounded px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all
                            ${filter === f
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                  }
                        `}
              >
                {f === 'ending' ? 'Ending Soon' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {!isLoading && skirmishes.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {skirmishes.map((battle) => (
              <BattleCard
                key={battle.id}
                id={battle.id}
                description={battle.description || battle.title}
                optionA={battle.left_side}
                optionB={battle.right_side}
                votesA={battle.pool_left || 0}
                votesB={battle.pool_right || 0}
              />
            ))}
          </div>
        ) : (
          !isLoading && (
            <div className="py-20 text-center text-zinc-500">
              No active skirmishes found. Start one?
            </div>
          )
        )}
      </section>

      {/* Floating Forge Button */}
      <Link
        href="/create"
        className="group fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-[#00f3ff] text-black shadow-[0_0_30px_rgba(0,243,255,0.4)] transition-all hover:scale-110 hover:bg-white hover:shadow-[0_0_50px_rgba(255,255,255,0.6)]"
      >
        <Hammer className="h-8 w-8 transition-transform duration-300 group-hover:rotate-45" />
        <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-lg">+</span>
      </Link>

    </div >
  );
}
