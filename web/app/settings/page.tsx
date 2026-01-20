'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Bell, Shield, LogOut, Save, Smartphone, Zap } from 'lucide-react'

export default function SettingsPage() {
    const router = useRouter()

    // User State
    const [userId, setUserId] = useState<string | null>(null)
    const [title, setTitle] = useState('')
    const [email, setEmail] = useState('')

    // Preferences State (Persisted in LocalStorage/State)
    const [notifications, setNotifications] = useState(true)
    const [reduceMotion, setReduceMotion] = useState(false)
    const [soundEnabled, setSoundEnabled] = useState(true)

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            setUserId(user.id)
            setEmail(user.email || '')

            // Fetch Profile Data
            const { data: profile } = await supabase
                .from('users')
                .select('title')
                .eq('id', user.id)
                .single()

            if (profile) {
                setTitle((profile as any).title || '')
            }

            // Load Local Preferences
            const localMotion = localStorage.getItem('kubu_reduce_motion')
            if (localMotion) setReduceMotion(localMotion === 'true')

            const localSound = localStorage.getItem('kubu_sound')
            if (localSound) setSoundEnabled(localSound === 'true')

            setIsLoading(false)
        }

        init()
    }, [router])

    const handleSaveProfile = async () => {
        setIsSaving(true)
        setMessage('')

        try {
            if (title.length < 3) throw new Error("Agent Name must be at least 3 chars")

            if (!userId) throw new Error("User ID not found")

            // Update Supabase
            const { error } = await (supabase as any)
                .from('users')
                .update({ title: title, updated_at: new Date().toISOString() })
                .eq('id', userId)

            if (error) throw error

            // Save Local Preferences
            localStorage.setItem('kubu_reduce_motion', String(reduceMotion))
            localStorage.setItem('kubu_sound', String(soundEnabled))

            setMessage('Settings Protocol Updated Successfully.')

            // Auto hide message
            setTimeout(() => setMessage(''), 3000)

        } catch (err: any) {
            console.error(err)
            setMessage(err.message || 'Update Failed')
        } finally {
            setIsSaving(false)
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (isLoading) return <div className="flex min-h-screen items-center justify-center animate-pulse text-xs font-mono uppercase">Loading Config...</div>

    return (
        <div className="min-h-screen px-4 py-8 md:px-8">
            <div className="mx-auto max-w-2xl">

                <header className="mb-12 border-b border-white/10 pb-6">
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white">System Configuration</h1>
                    <p className="text-gray-500 text-sm">Manage identity protocols and interface preferences.</p>
                </header>

                <div className="space-y-8">

                    {/* SECTION 1: IDENTITY */}
                    <section className="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#00f3ff]/20 text-[#00f3ff]">
                                <User className="h-4 w-4" />
                            </div>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Agent Identity</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Agent Codename (Display Name)</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    maxLength={20}
                                    className="w-full rounded border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-gray-700 focus:border-[#00f3ff] focus:outline-none focus:ring-1 focus:ring-[#00f3ff]"
                                />
                                <div className="mt-1 text-right text-[10px] text-gray-600">{title.length}/20</div>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Comms Link (Email)</label>
                                <input
                                    type="text"
                                    value={email}
                                    disabled
                                    className="w-full cursor-not-allowed rounded border border-white/5 bg-white/5 px-4 py-3 text-gray-500"
                                />
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2: INTERFACE */}
                    <section className="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-500/20 text-purple-500">
                                <Smartphone className="h-4 w-4" />
                            </div>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Interface Override</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded border border-white/5 bg-black/20 p-4">
                                <div className="flex items-center gap-3">
                                    <Bell className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <div className="text-sm font-bold text-gray-200">Notifications</div>
                                        <div className="text-[10px] text-gray-600">Receive alerts for winning battles</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setNotifications(!notifications)}
                                    className={`relative h-6 w-10 rounded-full transition-colors ${notifications ? 'bg-green-500' : 'bg-gray-700'}`}
                                >
                                    <div className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${notifications ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between rounded border border-white/5 bg-black/20 p-4">
                                <div className="flex items-center gap-3">
                                    <Zap className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <div className="text-sm font-bold text-gray-200">Reduce Motion</div>
                                        <div className="text-[10px] text-gray-600">Minimize animations for performance</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setReduceMotion(!reduceMotion)}
                                    className={`relative h-6 w-10 rounded-full transition-colors ${reduceMotion ? 'bg-[#00f3ff]' : 'bg-gray-700'}`}
                                >
                                    <div className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${reduceMotion ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* ACTIONS */}
                    <div className="flex flex-col gap-4 text-center">
                        {message && (
                            <div className={`rounded p-3 text-xs font-bold uppercase tracking-widest ${message.includes('Failed') ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                {message}
                            </div>
                        )}

                        <button
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="w-full rounded bg-white py-4 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-gray-200 hover:scale-[1.01] disabled:opacity-50"
                        >
                            {isSaving ? 'Rewriting Protocol...' : 'Save Configuration'}
                        </button>

                        <button
                            onClick={handleSignOut}
                            className="mt-8 flex w-full items-center justify-center gap-2 rounded border border-red-900/30 py-3 text-xs font-bold uppercase tracking-widest text-red-700 transition-colors hover:bg-red-900/10 hover:text-red-500"
                        >
                            <LogOut className="h-3 w-3" /> Terminate Session (Logout)
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
