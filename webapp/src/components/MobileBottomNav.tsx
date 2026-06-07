'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Compass, Plus, Trophy, User, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface MobileBottomNavProps {
    activeTab: string;
}

export default function MobileBottomNav({ activeTab }: MobileBottomNavProps) {
    const { user } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user) {
            import('@/app/actions').then(({ getUnreadNotificationCount }) => {
                getUnreadNotificationCount().then(res => {
                    if (res.success && typeof res.data === 'number') {
                        setUnreadCount(res.data);
                    }
                });
            });
        }
    }, [user, pathname]);

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
            name: 'Jelajah',
            icon: Compass,
            href: '/explore',
            active: pathname.startsWith('/explore')
        },
        {
            name: 'Buat',
            icon: Plus,
            href: '#',
            onClick: handleCreateClick,
            isCenter: true
        },
        {
            name: 'Notifikasi',
            icon: Bell,
            href: '/notifications',
            active: pathname.startsWith('/notifications'),
            badge: unreadCount > 0 ? unreadCount : null
        },
        {
            name: 'Profil',
            icon: User,
            href: user ? '/profile' : '/auth/login',
            active: pathname.startsWith('/profile')
        }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-t border-brand-border h-[60px] px-2 flex items-center justify-around select-none">
            {items.map((item, idx) => {
                const Icon = item.icon;
                
                if (item.isCenter) {
                    return (
                        <button
                            key={idx}
                            onClick={item.onClick}
                            className="w-11 h-11 rounded-full bg-brand-blue flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer shrink-0"
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
                        className={`flex flex-col items-center justify-center py-2 px-4 transition-colors ${
                            item.active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <div className="relative">
                            <Icon className="w-6 h-6" strokeWidth={item.active ? 2.5 : 2} />
                            {item.badge && (
                                <div className="absolute -top-1 -right-1 bg-brand-blue text-white text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border-2 border-background">
                                    {item.badge > 9 ? '9+' : item.badge}
                                </div>
                            )}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
