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
            <div className="space-y-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group px-4 py-2 hover:bg-zinc-900/50 rounded-full w-fit transition-colors">
                    <div className="relative w-8 h-8 flex items-center justify-center bg-white rounded-full overflow-hidden shrink-0">
                        <Image
                            src="/logo.png"
                            alt="Kubu Logo"
                            fill
                            sizes="32px"
                            className="object-contain p-1.5"
                            priority
                        />
                    </div>
                </Link>

                {/* Nav Links */}
                <nav className="space-y-1 mt-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-4 px-4 py-3 rounded-full transition-all duration-200 w-fit group ${
                                    item.active
                                        ? 'font-bold text-white'
                                        : 'font-normal text-zinc-300 hover:bg-zinc-900/60'
                                }`}
                            >
                                <Icon className={`w-6 h-6 ${item.active ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`} strokeWidth={item.active ? 2.5 : 2} />
                                <span className="text-xl pr-4">{item.name}</span>
                            </Link>
                        );
                    })}

                    {profile?.is_admin && (
                        <Link
                            href="/admin"
                            className={`flex items-center gap-4 px-4 py-3 rounded-full transition-all duration-200 w-fit group ${
                                pathname === '/admin' ? 'font-bold text-white' : 'font-normal text-zinc-300 hover:bg-zinc-900/60'
                            }`}
                        >
                            <Shield className="w-6 h-6 text-brand-blue" />
                            <span className="text-xl pr-4">Admin Panel</span>
                        </Link>
                    )}
                </nav>

                {/* Lempar Topik Button */}
                {user && (
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('kubu-open-create-modal'));
                        }}
                        className="w-[90%] mt-4 flex items-center justify-center gap-2 py-3.5 bg-brand-blue hover:bg-[#1a8cd8] active:scale-[0.98] text-white font-bold rounded-full transition-all text-[15px] cursor-pointer"
                    >
                        <span>Lempar Topik</span>
                    </button>
                )}
            </div>

            {/* Profile Info */}
            <div className="pt-4 mb-4">
                {user && profile ? (
                    <div className="flex items-center justify-between p-3 rounded-full hover:bg-zinc-900/60 transition-all cursor-pointer group">
                        <Link href="/profile" className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
                                {profile.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <span className="block text-sm font-bold text-white truncate leading-tight">
                                    {profile.username || 'User'}
                                </span>
                                <span className="block text-[13px] text-zinc-500 truncate leading-tight">
                                    @{profile.username || 'user'}
                                </span>
                            </div>
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="p-2 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Keluar"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <Link
                        href="/auth/login"
                        className="flex items-center justify-center w-[90%] py-3.5 bg-white hover:bg-zinc-200 text-black font-bold text-[15px] rounded-full transition-all cursor-pointer"
                    >
                        <span>Masuk</span>
                    </Link>
                )}
            </div>
        </div>
    );
}
