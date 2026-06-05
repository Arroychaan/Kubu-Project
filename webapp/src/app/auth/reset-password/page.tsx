'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

function ResetPasswordForm() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [isSessionReady, setIsSessionReady] = useState(false);

    useEffect(() => {
        // Supabase will fire PASSWORD_RECOVERY event when user arrives via reset link
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsSessionReady(true);
            }
        });

        // Also check if session already exists (user might have refreshed)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setIsSessionReady(true);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        try {
            if (password.length < 6) {
                throw new Error('Kata sandi minimal 6 karakter.');
            }
            if (password !== confirmPassword) {
                throw new Error('Konfirmasi kata sandi tidak cocok.');
            }

            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                if (error.message.includes('same_password')) {
                    throw new Error('Kata sandi baru tidak boleh sama dengan kata sandi lama.');
                }
                throw error;
            }

            setMessage({
                text: 'Kata sandi berhasil diperbarui! Anda akan dialihkan ke halaman utama...',
                type: 'success'
            });

            setTimeout(() => {
                router.push('/');
                router.refresh();
            }, 2000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengatur ulang kata sandi.';
            setMessage({ text: errorMessage, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isSessionReady) {
        return (
            <main className="fixed inset-0 z-[100] flex items-center justify-center bg-background text-foreground font-sans select-none">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-blue" />
                    <p className="font-semibold text-sm text-slate-400">Memverifikasi tautan reset...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="fixed inset-0 z-[100] overflow-y-auto bg-background bg-[radial-gradient(circle_at_20%_40%,rgba(0,82,255,0.06),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(0,82,255,0.03),transparent_55%)] text-foreground flex items-center justify-center font-sans select-none">

            {/* Grid Pattern Overlay */}
            <div
                className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-[0.8] -z-10"
            />

            <div className="w-full max-w-[420px] mx-auto px-6">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8 select-none">
                    <div className="relative w-10 h-10 flex items-center justify-center bg-white border border-brand-border rounded-xl overflow-hidden shrink-0">
                        <Image
                            src="/logo.png"
                            alt="Kubu Logo"
                            fill
                            sizes="40px"
                            className="object-contain p-1.5"
                            priority
                        />
                    </div>
                    <span className="text-2xl font-black tracking-tight text-white">KUBU</span>
                </div>

                {/* Card */}
                <div className="bg-brand-card border border-brand-border rounded-2xl p-7 sm:p-8 shadow-2xl">
                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-black tracking-tight text-white mb-1.5">
                            Kata Sandi Baru
                        </h2>
                        <p className="text-slate-400 text-sm font-medium">
                            Masukkan kata sandi baru untuk akun KUBU Anda.
                        </p>
                    </div>

                    {message && (
                        <div className={`mb-6 p-4 rounded-xl text-sm font-semibold leading-relaxed border flex items-start gap-2 ${message.type === 'success'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                            {message.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                disabled={loading}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-4 pr-11 py-3 bg-background border border-brand-border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-blue/60 focus:ring-1 focus:ring-brand-blue/60 transition-all font-medium disabled:opacity-60"
                                placeholder="Kata Sandi Baru"
                                minLength={6}
                                required
                            />
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-60"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        <div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                disabled={loading}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-background border border-brand-border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-blue/60 focus:ring-1 focus:ring-brand-blue/60 transition-all font-medium disabled:opacity-60"
                                placeholder="Konfirmasi Kata Sandi Baru"
                                minLength={6}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-brand-blue hover:bg-blue-600 active:scale-[0.98] text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                                    <span>Memperbarui...</span>
                                </>
                            ) : (
                                <span>Perbarui Kata Sandi</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-background text-white select-none">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-blue" />
                    <p className="font-semibold text-sm text-slate-400">Memuat...</p>
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
