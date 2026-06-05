'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;

                if (data.session) {
                    router.push('/');
                } else {
                    setMessage('Check your email to confirm your account.');
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                router.push('/');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Something went wrong.';
            setMessage(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-neon-dark relative overflow-hidden flex items-center justify-center px-4">
            <div className="absolute inset-0 pointer-events-none -z-10">
                <div className="absolute -top-24 left-1/4 w-[500px] h-[500px] bg-neon-pink/15 rounded-full blur-[140px]" />
                <div className="absolute -bottom-24 right-1/4 w-[520px] h-[520px] bg-neon-cyan/10 rounded-full blur-[140px]" />
            </div>

            <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl">
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-neon-pink via-white to-neon-cyan bg-clip-text text-transparent">
                        {isSignUp ? 'Join KUBU' : 'Welcome Back'}
                    </h1>
                    <p className="text-white/50 text-sm mt-2">
                        {isSignUp ? 'Create your account to start wars.' : 'Login to vote and start wars.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-white/60 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition-all"
                            placeholder="you@domain.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-white/60 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-pink/50 focus:ring-1 focus:ring-neon-pink/20 transition-all"
                            placeholder="••••••••"
                            minLength={6}
                            required
                        />
                    </div>

                    {message && (
                        <div className="text-sm text-center text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-3 py-2">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                        {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 flex items-center justify-between text-sm">
                    <button
                        onClick={() => setIsSignUp((prev) => !prev)}
                        className="text-white/60 hover:text-white transition-colors"
                    >
                        {isSignUp ? 'Already have an account? Login' : 'New here? Create an account'}
                    </button>
                    <Link href="/" className="text-neon-cyan hover:underline">
                        Back to home
                    </Link>
                </div>
            </div>
        </main>
    );
}
