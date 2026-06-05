'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  ArrowLeft
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setMode('register');
    } else {
      setMode('login');
    }
  }, [searchParams]);

  // Check for error param from callback
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'auth_failed') {
      setMessage({ text: 'Terjadi kesalahan saat proses masuk. Silakan coba lagi.', type: 'error' });
    }
  }, [searchParams]);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status state
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch {
      setMessage({ text: 'Koneksi bermasalah. Silakan coba beberapa saat lagi.', type: 'error' });
      setLoadingGoogle(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Konfirmasi kata sandi tidak cocok.');
        }
        if (password.length < 6) {
          throw new Error('Kata sandi minimal 6 karakter.');
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });

        if (error) {
          if (error.message.includes('already registered') || error.message.includes('User already exists')) {
            setMessage({
              text: 'Email ini sudah terdaftar di KUBU. Silakan masuk.',
              type: 'error'
            });
            setLoading(false);
            return;
          }
          throw error;
        }

        if (data.session) {
          router.push('/');
          router.refresh();
        } else {
          setMessage({
            text: 'Registrasi berhasil! Silakan periksa kotak masuk email Anda untuk melakukan aktivasi akun.',
            type: 'success'
          });
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setMessage({
              text: 'Email atau kata sandi tidak sesuai. Silakan periksa kembali.',
              type: 'error'
            });
            setLoading(false);
            return;
          }
          if (error.message.includes('Email not confirmed')) {
            setMessage({
              text: 'Email Anda belum diverifikasi. Silakan cek kotak masuk email Anda.',
              type: 'error'
            });
            setLoading(false);
            return;
          }
          throw error;
        }

        router.push('/');
        router.refresh();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage === 'Failed to fetch') {
        setMessage({ text: 'Gagal terhubung ke server. Periksa koneksi internet Anda.', type: 'error' });
      } else {
        setMessage({ text: errorMessage || 'Terjadi kesalahan. Periksa kembali input Anda.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (!email.trim()) {
        throw new Error('Masukkan alamat email Anda.');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setMessage({
        text: 'Tautan untuk mengatur ulang kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk (dan folder spam).',
        type: 'success'
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage === 'Failed to fetch') {
        setMessage({ text: 'Gagal terhubung ke server. Periksa koneksi internet Anda.', type: 'error' });
      } else {
        setMessage({ text: errorMessage || 'Terjadi kesalahan saat mengirim email reset.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Card title and subtitle
  const getCardHeader = () => {
    if (mode === 'forgot') {
      return {
        title: 'Atur Ulang Kata Sandi',
        subtitle: 'Masukkan email yang terdaftar untuk menerima tautan pengaturan ulang kata sandi.'
      };
    }
    if (mode === 'register') {
      return {
        title: 'Daftar Akun Baru',
        subtitle: 'Buat akun dalam beberapa detik untuk mulai berdiskusi.'
      };
    }
    return {
      title: 'Masuk ke KUBU',
      subtitle: 'Lanjutkan debat opini dan lihat pergeseran suara publik.'
    };
  };

  const { title, subtitle } = getCardHeader();

  return (
    <main className="fixed inset-0 z-[100] overflow-y-auto bg-background text-foreground flex flex-col justify-center items-center font-sans select-none px-4 py-8">
      
      {/* Ambient Gradient Overlays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-brand-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[500px] h-[500px] bg-choice-left/5 rounded-full blur-[120px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none opacity-[0.6] -z-10"
      />

      {/* Back to Home Link */}
      <Link
        href="/"
        className="absolute top-6 left-6 text-xs font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5 z-25 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
        Kembali ke Beranda
      </Link>

      {/* Center Container */}
      <div className="w-full max-w-[440px] flex flex-col items-center z-10">

        {/* App Logo & Brand Branding */}
        <Link href="/" className="flex flex-col items-center gap-3 mb-8 group">
          <div className="relative w-12 h-12 flex items-center justify-center bg-white border border-brand-border/80 rounded-2xl overflow-hidden shadow-2xl transition-transform group-hover:scale-[1.03] duration-300">
            <Image
              src="/logo.png"
              alt="Kubu Logo"
              fill
              sizes="48px"
              className="object-contain p-2"
              priority
            />
          </div>
          <div className="text-center">
            <span className="text-lg font-black tracking-widest text-white block">
              KUBU
            </span>
            <span className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase mt-1 block">
              Suara Kamu, Pilihanmu
            </span>
          </div>
        </Link>

        {/* Glassmorphic Form Card */}
        <div className="w-full bg-zinc-950/60 border border-brand-border/85 rounded-[32px] p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all duration-300">
          
          {/* Subtle top highlights */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Header text */}
          <div className="mb-6 text-center">
            <h2 className="text-xl font-black tracking-tight text-white mb-1">
              {title}
            </h2>
            <p className="text-zinc-400 text-xs font-bold leading-normal max-w-[300px] mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Toast Notification */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl text-xs font-bold leading-relaxed border ${message.type === 'success'
              ? 'bg-green-500/5 text-green-400 border-green-500/15'
              : 'bg-red-500/5 text-red-400 border-red-500/15'
              }`}>
              {message.text}
            </div>
          )}

          {mode === 'forgot' ? (
            /* --- FORGOT PASSWORD FORM --- */
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900/40 border border-brand-border rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-700 focus:bg-zinc-900/60 focus:ring-1 focus:ring-white/5 transition-all font-bold disabled:opacity-60"
                  placeholder="Alamat Email Anda"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-white hover:bg-zinc-200 active:scale-[0.98] text-black font-black rounded-xl transition-all text-xs tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md duration-150"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Mengirim...</span>
                  </div>
                ) : (
                  <span>Kirim Tautan Reset</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setMessage(null); }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-zinc-500 hover:text-white font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Halaman Masuk
              </button>
            </form>
          ) : (
            /* --- EMAIL LOGIN / REGISTER FORM --- */
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  disabled={loading || loadingGoogle}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900/40 border border-brand-border rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-700 focus:bg-zinc-900/60 focus:ring-1 focus:ring-white/5 transition-all font-bold disabled:opacity-60"
                  placeholder="Alamat Email Anda"
                  required
                />
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    disabled={loading || loadingGoogle}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 bg-zinc-900/40 border border-brand-border rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-700 focus:bg-zinc-900/60 focus:ring-1 focus:ring-white/5 transition-all font-bold disabled:opacity-60"
                    placeholder="Kata Sandi"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    disabled={loading || loadingGoogle}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    disabled={loading || loadingGoogle}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-900/40 border border-brand-border rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-700 focus:bg-zinc-900/60 focus:ring-1 focus:ring-white/5 transition-all font-bold disabled:opacity-60"
                    placeholder="Ulangi Kata Sandi"
                    minLength={6}
                    required
                  />
                </div>
              )}

              {mode === 'login' && (
                <div className="text-right pb-1">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setMessage(null); }}
                    className="text-xs text-zinc-500 hover:text-white transition-colors font-bold cursor-pointer"
                  >
                    Lupa kata sandi?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || loadingGoogle}
                className="w-full py-3 bg-white hover:bg-zinc-200 active:scale-[0.98] text-black font-black rounded-xl transition-all text-xs tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md duration-150"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>{mode === 'login' ? 'Masuk...' : 'Daftar...'}</span>
                  </div>
                ) : (
                  <span>{mode === 'login' ? 'Masuk ke KUBU' : 'Daftar Akun Baru'}</span>
                )}
              </button>
            </form>
          )}

          {/* Separator */}
          {mode !== 'forgot' && (
            <>
              <div className="my-5 flex items-center gap-4 select-none">
                <div className="h-[1px] flex-1 bg-brand-border/60" />
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Atau</span>
                <div className="h-[1px] flex-1 bg-brand-border/60" />
              </div>

              {/* Google OAuth Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading || loadingGoogle}
                className="w-full py-3 bg-zinc-900/50 hover:bg-zinc-800/80 border border-brand-border active:scale-[0.98] text-white font-bold rounded-xl transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer duration-150"
              >
                {loadingGoogle ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-zinc-500" />
                    <span className="text-zinc-500">Menghubungkan...</span>
                  </div>
                ) : (
                  <>
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
                    <span>Masuk dengan Google</span>
                  </>
                )}
              </button>
            </>
          )}

          <p className="mt-5 text-center text-[10px] text-zinc-500 font-bold leading-relaxed max-w-[340px] mx-auto select-text">
            Dengan melanjutkan, Anda menyetujui <Link href="#" className="hover:text-zinc-300 underline transition-colors">Syarat &amp; Ketentuan</Link> serta <Link href="#" className="hover:text-zinc-300 underline transition-colors">Kebijakan Privasi</Link> KUBU.
          </p>

          {/* Mode Switcher */}
          {mode !== 'forgot' && (
            <div className="mt-5 pt-4 border-t border-brand-border/60 text-center">
              {mode === 'login' ? (
                <div>
                  <span className="text-xs text-zinc-500 font-bold">Belum memiliki akun?</span>
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setMessage(null); }}
                    className="w-full mt-2 py-2 bg-transparent hover:bg-zinc-900 border border-brand-border text-white font-bold rounded-xl transition-all text-xs text-center block cursor-pointer duration-150 hover:border-zinc-700"
                  >
                    Daftar Akun Baru
                  </button>
                </div>
              ) : (
                <div>
                  <span className="text-xs text-zinc-500 font-bold">Sudah memiliki akun?</span>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setMessage(null); }}
                    className="w-full mt-2 py-2 bg-transparent hover:bg-zinc-900 border border-brand-border text-white font-bold rounded-xl transition-all text-xs text-center block cursor-pointer duration-150 hover:border-zinc-700"
                  >
                    Masuk ke KUBU
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background text-white select-none">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand-blue" />
          <p className="font-semibold text-sm text-slate-400">Memuat halaman masuk...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
