'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getDeviceHash } from '@/lib/utils/fingerprint'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Swords, Flame, Hammer, User, Zap, Trophy } from 'lucide-react'

export default function Header() {
    const [points, setPoints] = useState<number>(0)
    const [userId, setUserId] = useState<string | null>(null)
    const [filterCol, setFilterCol] = useState<'id' | 'device_hash'>('device_hash')
    const pathname = usePathname()

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                setUserId(user.id)
                setFilterCol('id')
                const { data } = await supabase
                    .from('users')
                    .select('points')
                    .eq('id', user.id)
                    .single()

                if (data) setPoints((data as { points: number }).points)
            } else {
                const deviceId = await getDeviceHash()
                setUserId(deviceId)
                setFilterCol('device_hash')

                const { data } = await supabase
                    .from('users')
                    .select('points')
                    .eq('device_hash', deviceId)
                    .single()

                if (data) {
                    setPoints((data as { points: number }).points)
                } else {
                    setPoints(50)
                }
            }
        }

        fetchUserData()

        // Custom Event Listener for Instant Updates from other components
        // This receives the EXACT new balance from the server response, 
        // avoiding fetch delays.
        const handleSync = (e: Event) => {
            const customEvent = e as CustomEvent<number>
            if (typeof customEvent.detail === 'number') {
                console.log("Instant point sync:", customEvent.detail)
                setPoints(customEvent.detail)
            } else {
                // Fallback if no specific number provided
                fetchUserData()
            }
        }

        window.addEventListener('kubu-points-sync', handleSync)

        return () => {
            window.removeEventListener('kubu-points-sync', handleSync)
        }
    }, [])

    useEffect(() => {
        if (!userId) return

        console.log("Subscribing to points updates for:", userId)

        const channel = supabase
            .channel(`points-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `${filterCol}=eq.${userId}`,
                },
                (payload) => {
                    console.log("Points update received!", payload)
                    const newUser = payload.new as { points?: number }
                    if (newUser.points !== undefined) {
                        setPoints(newUser.points)
                    }
                }
            )
            .subscribe((status) => {
                console.log("Subscription status:", status)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, filterCol])

    const navLinks = [
        { href: '/', label: 'Battlefield', icon: <Swords className="w-4 h-4" /> },
        { href: '/trending', label: 'Trending', icon: <Flame className="w-4 h-4" /> },
        { href: '/leaderboard', label: 'Rankings', icon: <Trophy className="w-4 h-4" /> },
        { href: '/create', label: 'Forge', icon: <Hammer className="w-4 h-4" /> },
    ]

    return (
        <header className="sticky top-0 z-50 flex h-[var(--header-height)] items-center justify-between border-b border-card-border bg-background/80 px-5 backdrop-blur-md">
            <div className="flex items-center gap-8">
                <Link href="/" className="text-2xl font-black tracking-tighter text-foreground flex items-center gap-2">
                    <span className="text-[var(--color-left)]">KU</span>BU
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`
                                flex items-center gap-2 rounded px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all
                                ${pathname === link.href
                                    ? 'bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }
                            `}
                        >
                            <span className={`${pathname === link.href ? 'opacity-100' : 'opacity-70'}`}>{link.icon}</span>
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="flex items-center gap-4">
                {/* Mobile Nav Toggle could go here */}

                <div className="flex items-center gap-2 rounded-full border border-card-border bg-card-bg px-4 py-2 font-mono">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs font-bold text-muted">NYAWA</span>
                    <span className="font-bold text-success drop-shadow-[0_0_5px_rgba(0,255,136,0.3)]">{points}</span>
                    <Link href="/topup" className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#00f3ff] text-black hover:bg-white hover:scale-110 transition-all">
                        <span className="text-xs font-bold">+</span>
                    </Link>
                </div>

                <Link href="/profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg hover:bg-white/10 hover:border-white/30 transition-all text-gray-400 hover:text-white">
                    <User className="w-5 h-5" />
                </Link>
            </div>
        </header>
    )
}
