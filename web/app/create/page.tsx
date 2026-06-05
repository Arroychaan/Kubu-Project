'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, AlertTriangle } from 'lucide-react'

export default function CreateBattlePage() {
    const router = useRouter()

    // States
    const [isLoading, setIsLoading] = useState(true)
    const [votesCast, setVotesCast] = useState(0)
    const [userTier, setUserTier] = useState<'free' | 'elite'>('free')

    // Form States
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [sideA, setSideA] = useState('')
    const [sideB, setSideB] = useState('')
    // Elite Colors
    const [colorA, setColorA] = useState('#00f3ff')
    const [colorB, setColorB] = useState('#ff0055')
    const [duration, setDuration] = useState(24)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const VOTES_REQUIRED = 10

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                // Redirect or show login (for now assume protected or handled by global auth)
                // router.push('/login')
                setIsLoading(false)
                return
            }

            // Fetch User Profile & Stats
            const { count, error: countError } = await supabase
                .from('votes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)

            if (countError) {
                console.error(countError)
            } else {
                setVotesCast(count || 0)
            }

            // Fetch User Tier
            const { data: profile } = await supabase
                .from('users')
                .select('tier')
                .eq('id', user.id)
                .single()

            if (profile) {
                // @ts-expect-error - Supabase types mismatch
                setUserTier(profile.tier)
            }

            setIsLoading(false)
        }

        checkUser()
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg('')
        setIsSubmitting(true)

        // Validation
        if (title.length > 30) {
            setErrorMsg("Title must be max 30 chars")
            setIsSubmitting(false)
            return
        }
        if (description.length > 100) {
            setErrorMsg("Description must be max 100 chars")
            setIsSubmitting(false)
            return
        }

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // @ts-expect-error - RPC args mismatch
            const { error } = await supabase.rpc('create_battle', {
                p_title: title,
                p_description: description,
                p_left_side: sideA,
                p_right_side: sideB,
                p_duration_hours: duration
            })

            if (error) throw error

            // Success
            router.push('/') // Redirect to home/dashboard

        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error) {
                setErrorMsg(err.message)
            } else {
                setErrorMsg("Failed to create battle")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return <div className="flex min-h-screen items-center justify-center text-white font-mono animate-pulse">Scanning User Clearance...</div>
    }

    // INCUBATION GATE
    if (votesCast < VOTES_REQUIRED) {
        const progress = (votesCast / VOTES_REQUIRED) * 100
        const needed = VOTES_REQUIRED - votesCast

        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-black/80 p-8 text-center shadow-[0_0_50px_rgba(255,0,0,0.1)] backdrop-blur-md">
                    <div className="mb-6 flex justify-center text-red-500">
                        <Lock className="h-16 w-16" />
                    </div>
                    <h1 className="mb-2 text-3xl font-black uppercase text-red-500">Access Denied</h1>
                    <p className="mb-8 text-gray-400">
                        The Forge is locked. Prove your worth on the battlefield first at the dashboard.
                    </p>

                    <div className="mb-2 flex justify-between text-xs font-bold uppercase text-gray-500">
                        <span>Incubation Progress</span>
                        <span>{votesCast}/{VOTES_REQUIRED} Votes</span>
                    </div>
                    <div className="mb-8 h-4 w-full overflow-hidden rounded-full bg-gray-900 border border-white/10">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <p className="mb-8 font-mono text-sm text-yellow-500 flex items-center justify-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        You need {needed} more votes to unlock battle creation.
                    </p>

                    <Link
                        href="/"
                        className="inline-block rounded bg-white px-8 py-3 font-bold uppercase tracking-widest text-black transition-transform hover:scale-105"
                    >
                        Go to Battlefield
                    </Link>
                </div>
            </div>
        )
    }

    // THE FORGE (FORM)
    return (
        <div className="min-h-screen px-4 py-12 md:px-8">
            <div className="mx-auto max-w-3xl">
                <header className="mb-12 border-b border-white/10 pb-8">
                    <h1 className="flex items-center gap-3 text-4xl font-black uppercase tracking-tighter text-white">
                        <span className="text-[var(--color-left)]">The</span> Forge
                    </h1>
                    <p className="mt-2 text-gray-400">Create a new conflict and watch the world choose sides.</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* General Info */}
                    <div className="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
                        <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-gray-500">Battle Intelligence</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase text-white">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    maxLength={30}
                                    className="w-full rounded border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-gray-600 focus:border-[var(--color-left)] focus:outline-none focus:ring-1 focus:ring-[var(--color-left)]"
                                    placeholder="e.g. REACT VS VUE"
                                    required
                                />
                                <div className="mt-1 text-right text-[10px] text-gray-600">{title.length}/30</div>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase text-white">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    maxLength={100}
                                    rows={3}
                                    className="w-full rounded border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-gray-600 focus:border-[var(--color-left)] focus:outline-none focus:ring-1 focus:ring-[var(--color-left)]"
                                    placeholder="Brief context for the war..."
                                    required
                                />
                                <div className="mt-1 text-right text-[10px] text-gray-600">{description.length}/100</div>
                            </div>

                            {/* Duration Selector */}
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase text-white">Battle Duration</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDuration(3)}
                                        className={`rounded border px-2 py-3 text-center transition-all ${duration === 3 ? 'border-[#00f3ff] bg-[#00f3ff]/20 text-[#00f3ff]' : 'border-white/10 bg-black/50 text-gray-500 hover:border-white/30'}`}
                                    >
                                        <div className="text-xl">⚡</div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider">Blitz</div>
                                        <div className="text-[9px] opacity-70">3 Hours</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDuration(24)}
                                        className={`rounded border px-2 py-3 text-center transition-all ${duration === 24 ? 'border-orange-500 bg-orange-500/20 text-orange-500' : 'border-white/10 bg-black/50 text-gray-500 hover:border-white/30'}`}
                                    >
                                        <div className="text-xl">🔥</div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider">Standard</div>
                                        <div className="text-[9px] opacity-70">24 Hours</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDuration(72)}
                                        className={`rounded border px-2 py-3 text-center transition-all ${duration === 72 ? 'border-yellow-500 bg-yellow-500/20 text-yellow-500' : 'border-white/10 bg-black/50 text-gray-500 hover:border-white/30'}`}
                                    >
                                        <div className="text-xl">👑</div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider">Epic</div>
                                        <div className="text-[9px] opacity-70">3 Days</div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contenders */}
                    <div className="flex flex-col gap-6 md:flex-row">
                        {/* LEFT SIDE */}
                        <div className="flex-1 rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
                            <h2 className="mb-6 flex items-center justify-between text-sm font-bold uppercase tracking-widest text-[var(--color-left)]">
                                <span>Contender A (Left)</span>
                                {userTier === 'elite' && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">ELITE UNLOCKED</span>}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase text-gray-400">Name</label>
                                    <input
                                        type="text"
                                        value={sideA}
                                        onChange={(e) => setSideA(e.target.value)}
                                        className="w-full rounded border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-gray-600 focus:border-[var(--color-left)] focus:outline-none"
                                        placeholder="e.g. Neon Samurai"
                                        required
                                    />
                                </div>

                                {userTier === 'elite' && (
                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase text-gray-400">Battle Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={colorA}
                                                onChange={(e) => setColorA(e.target.value)}
                                                className="h-10 w-full cursor-pointer rounded border border-white/10 bg-black/50 p-1"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT SIDE */}
                        <div className="flex-1 rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
                            <h2 className="mb-6 flex items-center justify-between text-sm font-bold uppercase tracking-widest text-[var(--color-right)]">
                                <span>Contender B (Right)</span>
                                {userTier === 'elite' && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">ELITE UNLOCKED</span>}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase text-gray-400">Name</label>
                                    <input
                                        type="text"
                                        value={sideB}
                                        onChange={(e) => setSideB(e.target.value)}
                                        className="w-full rounded border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-gray-600 focus:border-[var(--color-right)] focus:outline-none"
                                        placeholder="e.g. Crimson Mech"
                                        required
                                    />
                                </div>

                                {userTier === 'elite' && (
                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase text-gray-400">Battle Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={colorB}
                                                onChange={(e) => setColorB(e.target.value)}
                                                className="h-10 w-full cursor-pointer rounded border border-white/10 bg-black/50 p-1"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="rounded border border-red-500 bg-red-500/10 p-4 text-center text-sm font-bold text-red-500">
                            {errorMsg}
                        </div>
                    )}

                    <div className="flex flex-col items-end gap-2 pt-4">
                        <div className="text-xs font-mono text-gray-500 uppercase">
                            Cost to Create: <span className="text-red-500 font-bold">10 PTS</span>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 md:w-auto"
                        >
                            {isSubmitting ? 'Forging...' : 'Initiate Battle Sequence'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
