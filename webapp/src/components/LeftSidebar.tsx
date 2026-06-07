'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Home, Flame, Trophy, User, Plus, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { getUserTitle } from './LeaderboardClient';

interface LeftSidebarProps {
    activeTab: string;
}

export default function LeftSidebar({ activeTab }: LeftSidebarProps) {
    const { user, profile } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isHotTab = searchParams.get('tab') === 'panas';

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
        router.refresh();
    };

    const navItems = [
        {
            name: 'Beranda',
            href: '/',
            icon: Home,
            active: pathname === '/' && !isHotTab
        },
        {
            name: 'Topik Panas',
            href: '/?tab=panas',
            icon: Flame,
            active: pathname === '/' && isHotTab
        },
        {
            name: 'Peringkat',
            href: '/leaderboard',
            icon: Trophy,
            active: pathname === '/leaderboard'
        },
        {
            name: 'Profil',
            href: user ? `/profile` : '/auth/login',
            icon: User,
            active: pathname.startsWith('/profile')
        }
    ];

    const titleInfo = profile ? getUserTitle(profile.points ?? 50) : null;

    return (
        <div className="flex flex-col h-full justify-between select-none">
            <div className="space-y-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group px-2">
                    <div className="relative w-9 h-9 flex items-center justify-center bg-white border border-brand-border/80 rounded-xl overflow-hidden shrink-0 transition-transform group-hover:scale-[1.03]">
                        <Image
                            src="/logo.png"
                            alt="Kubu Logo"
                            fill
                            sizes="36px"
                            className="object-contain p-1.5"
                            priority
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-base font-black tracking-wider text-white leading-none">
                            KUBU
                        </span>
                        <span className="text-[8px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5">
                            Media Sosial Opini
                        </span>
                    </div>
                </Link>

                {/* Nav Links */}
                <nav className="space-y-1.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl border font-bold text-sm transition-all duration-200 ${
                                    item.active
                                        ? 'bg-zinc-900 border-zinc-800 text-white shadow-sm'
                                        : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-zinc-900/40'
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${item.active ? 'text-brand-blue' : 'text-slate-500'}`} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}

                    {profile?.is_admin && (
                        <Link
                            href="/admin"
                            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl border border-transparent font-bold text-sm text-slate-400 hover:text-white hover:bg-zinc-900/40 transition-all duration-200 ${
                                pathname === '/admin' ? 'bg-zinc-900 border-zinc-800 text-white' : ''
                            }`}
                        >
                            <Shield className="w-5 h-5 text-brand-blue" />
                            <span>Admin Panel</span>
                        </Link>
                    )}
                </nav>

                {/* Lempar Topik Button */}
                {user && (
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('kubu-open-create-modal'));
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-brand-blue hover:bg-blue-600 active:scale-[0.98] text-white font-black rounded-xl transition-all duration-150 text-xs tracking-wider uppercase cursor-pointer shadow-md shadow-brand-blue/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Lempar Topik</span>
                    </button>
                )}
            </div>

            {/* Profile Info */}
            <div className="pt-4 border-t border-brand-border/60">
                {user && profile ? (
                    <div className="flex flex-col gap-3">
                        {/* User Card */}
                        <Link href="/profile" className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950/40 border border-brand-border/60 hover:bg-zinc-900/20 hover:border-zinc-800 transition-all duration-200">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-choice-left/90 to-choice-right/90 flex items-center justify-center text-xs font-black text-white uppercase select-none shrink-0">
                                {profile.username?.[0] || 'U'}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <span className="block text-xs font-bold text-white truncate leading-none">
                                    {profile.username || 'User'}
                                </span>
                                <span className="inline-block text-[8px] text-zinc-500 font-bold mt-1 uppercase tracking-wider leading-none">
                                    {titleInfo?.name || 'Suara Baru'}
                                </span>
                            </div>
                            <div className="px-1.5 py-1 bg-amber-500/5 border border-amber-500/15 rounded-lg text-amber-500 font-black text-[10px] shrink-0 select-none">
                                🪙
                            </div>
                        </Link>

                        {/* Sign Out */}
                        <button
                            onClick={handleSignOut}
                            className="flex items-center justify-center gap-2 w-full py-2 bg-transparent hover:bg-zinc-900/40 text-slate-500 hover:text-choice-left font-bold text-xs rounded-xl border border-transparent hover:border-zinc-800/40 transition-all cursor-pointer"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Keluar</span>
                        </button>
                    </div>
                ) : (
                    <Link
                        href="/auth/login"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-white hover:bg-zinc-200 text-black font-black text-xs rounded-xl transition-all shadow-md active:scale-95 duration-150 uppercase tracking-wider"
                    >
                        <span>Masuk ke KUBU</span>
                    </Link>
                )}
            </div>
        </div>
    );
}
