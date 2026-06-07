'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, Plus, Trophy, User } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface MobileBottomNavProps {
    activeTab: string;
}

export default function MobileBottomNav({ activeTab }: MobileBottomNavProps) {
    const { user } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    const handleCreateClick = () => {
        if (!user) {
            router.push('/auth/login');
            return;
        }
        window.dispatchEvent(new CustomEvent('kubu-open-create-modal'));
    };

    const items = [
        {
            name: 'Beranda',
            icon: Home,
            href: '/',
            active: pathname === '/'
        },
        {
            name: 'Cari',
            icon: Search,
            href: '/search',
            active: pathname === '/search'
        },
        {
            name: 'Buat',
            icon: Plus,
            href: '#',
            onClick: handleCreateClick,
            isCenter: true
        },
        {
            name: 'Peringkat',
            icon: Trophy,
            href: '/leaderboard',
            active: pathname === '/leaderboard'
        },
        {
            name: 'Profil',
            icon: User,
            href: user ? '/profile' : '/auth/login',
            active: pathname.startsWith('/profile')
        }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-t border-brand-border/60 h-16 px-4 flex items-center justify-around select-none">
            {items.map((item, idx) => {
                const Icon = item.icon;
                
                if (item.isCenter) {
                    return (
                        <button
                            key={idx}
                            onClick={item.onClick}
                            className="relative -top-4 w-12 h-12 rounded-full bg-brand-blue border border-brand-blue/30 shadow-lg shadow-brand-blue/20 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer shrink-0"
                            title="Lempar Topik"
                        >
                            <Plus className="w-6 h-6 stroke-[2.5]" />
                        </button>
                    );
                }

                return (
                    <Link
                        key={idx}
                        href={item.href}
                        className={`flex flex-col items-center justify-center py-2 px-3 text-center transition-colors ${
                            item.active ? 'text-brand-blue' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="text-[8px] font-bold mt-1 uppercase tracking-wider">{item.name}</span>
                    </Link>
                );
            })}
        </div>
    );
}
