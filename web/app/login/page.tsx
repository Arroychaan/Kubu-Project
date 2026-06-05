'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Mode: 'login' or 'register'
    const [mode, setMode] = useState<'login' | 'register'>('login')

    useEffect(() => {
        if (searchParams.get('mode') === 'register') {
            setMode('register')
        }
    }, [searchParams])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    // Form Data
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleGoogleLogin = async () => {
        setLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        })
        if (error) {
            setMessage(error.message)
            setLoading(false)
        }
    }

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        if (mode === 'register') {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                }
            })
            if (error) {
                setMessage(error.message)
            } else {
                setMessage('Check your email for the confirmation link!')
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) {
                setMessage(error.message)
            } else {
                router.refresh()
                router.push('/profile')
            }
        }
        setLoading(false)
    }

    return (
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">

                {/* Visual Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
                        <span className="text-[var(--color-left)]">KUBU</span> ACCESS
                    </h1>
                    <p className="mt-2 text-gray-400">
                        {mode === 'login' ? 'Identify yourself, soldier.' : 'Join the ranks. Choose your side.'}
                    </p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-2xl">

                    {/* Toggle */}
                    <div className="flex border-b border-white/5">
                        <button
                            onClick={() => { setMode('login'); setMessage('') }}
                            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${mode === 'login' ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => { setMode('register'); setMessage('') }}
                            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${mode === 'register' ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Register
                        </button>
                    </div>

                    <div className="p-8">
                        {/* Google Button */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="mb-6 flex w-full items-center justify-center gap-3 rounded bg-white px-4 py-3 font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            {mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
                        </button>

                        <div className="mb-6 flex items-center gap-4">
                            <div className="h-px flex-1 bg-white/10"></div>
                            <span className="text-xs font-bold uppercase text-gray-600">OR</span>
                            <div className="h-px flex-1 bg-white/10"></div>
                        </div>

                        {/* Email Form */}
                        <form onSubmit={handleEmailAuth} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-gray-600 focus:border-[var(--color-left)] focus:outline-none"
                                    placeholder="soldier@kubu.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-gray-600 focus:border-[var(--color-left)] focus:outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {message && (
                                <div className={`rounded p-3 text-xs font-bold ${message.includes('Check') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded bg-[var(--color-left)] px-4 py-4 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(0,243,255,0.3)] disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : (mode === 'login' ? 'Establish Link' : 'Initialize Account')}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-8 text-center text-[10px] text-gray-600">
                    By accessing KUBU, you agree to the <a href="#" className="underline hover:text-white">Protocol Terms</a> and <a href="#" className="underline hover:text-white">Privacy Directive</a>.
                </div>
            </div>
        </div>
    )
}
