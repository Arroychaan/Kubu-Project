'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Home, Flame, Trophy, User, Plus, LogOut, Shield, Compass, Bell } from 'lucide-react';
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
            name: 'Jelajah',
            href: '/explore',
            icon: Compass,
            active: pathname.startsWith('/explore')
        },
        {
            name: 'Notifikasi',
            href: '/notifications',
            icon: Bell,
            active: pathname.startsWith('/notifications')
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
        <div className="flex flex-col h-screen justify-between select-none items-end xl:items-start overflow-y-auto no-scrollbar pb-8">
            <div className="space-y-2 xl:space-y-4 w-full xl:w-[250px] flex flex-col items-center xl:items-start pt-2">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center xl:justify-start gap-3 group p-3 hover:bg-zinc-900/50 rounded-full w-fit transition-colors xl:ml-2">
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
                <nav className="space-y-1 mt-2 w-full flex flex-col items-center xl:items-start">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-4 p-3 xl:px-4 xl:py-3 rounded-full transition-all duration-200 w-fit group ${
                                    item.active
                                        ? 'font-bold text-white'
                                        : 'font-normal text-zinc-300 hover:bg-zinc-900/60'
                                }`}
                                title={item.name}
                            >
                                <Icon className={`w-7 h-7 ${item.active ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`} strokeWidth={item.active ? 2.5 : 2} />
                                <span className="hidden xl:inline text-xl pr-4">{item.name}</span>
                            </Link>
                        );
                    })}

                    {profile?.is_admin && (
                        <Link
                            href="/admin"
                            className={`flex items-center gap-4 p-3 xl:px-4 xl:py-3 rounded-full transition-all duration-200 w-fit group ${
                                pathname === '/admin' ? 'font-bold text-white' : 'font-normal text-zinc-300 hover:bg-zinc-900/60'
                            }`}
                            title="Admin Panel"
                        >
                            <Shield className="w-7 h-7 text-brand-blue" />
                            <span className="hidden xl:inline text-xl pr-4">Admin Panel</span>
                        </Link>
                    )}
                </nav>

                {/* Lempar Topik Button */}
                {user && (
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('kubu-open-create-modal'));
                        }}
                        className="mt-4 flex items-center justify-center p-3 xl:py-3.5 xl:px-8 bg-brand-blue hover:bg-[#1a8cd8] active:scale-[0.98] text-white font-bold rounded-full transition-all cursor-pointer w-12 h-12 xl:w-[225px] xl:h-auto xl:ml-2"
                        title="Lempar Topik"
                    >
                        <span className="hidden xl:inline text-[17px]">Lempar Topik</span>
                        <Plus className="w-6 h-6 xl:hidden stroke-[2.5]" />
                    </button>
                )}
            </div>

            {/* Profile Info */}
            <div className="pt-4 mb-4 w-full flex justify-center xl:justify-start">
                {user && profile ? (
                    <div className="flex items-center justify-center xl:justify-between p-2 xl:p-3 rounded-full hover:bg-zinc-900/60 transition-all cursor-pointer group w-fit xl:w-[240px]">
                        <Link href="/profile" className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
                                {profile.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="hidden xl:flex flex-col min-w-0 mr-3">
                                <span className="text-[15px] font-bold text-white truncate leading-tight">
                                    {profile.username || user.email?.split('@')[0]}
                                </span>
                                <span className="text-[15px] text-zinc-500 truncate leading-tight">
                                    @{profile.username || user.email?.split('@')[0]}
                                </span>
                            </div>
                            {/* Remove points display from Left Sidebar to match X profile look */}
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="hidden xl:block p-2 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Keluar"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <a
                        href="/auth/login"
                        className="flex items-center justify-center p-3 xl:py-3.5 xl:px-8 bg-white hover:bg-zinc-200 text-black font-bold rounded-full transition-all cursor-pointer w-12 h-12 xl:w-[225px] xl:h-auto xl:ml-2"
                        title="Masuk"
                    >
                        <span className="hidden xl:inline text-[15px]">Masuk</span>
                        <LogOut className="w-5 h-5 xl:hidden" />
                    </a>
                )}
            </div>
        </div>
    );
}
