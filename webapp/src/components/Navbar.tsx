'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, LogOut, Shield, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUserTitle } from '@/components/LeaderboardClient';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { user, profile } = useAuthStore();

    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSearch = searchParams.get('search') || '';
    const [prevSearch, setPrevSearch] = useState(currentSearch);
    const [searchQuery, setSearchQuery] = useState(currentSearch);

    // Sync state with URL search param on URL change (during render)
    if (currentSearch !== prevSearch) {
        setPrevSearch(currentSearch);
        setSearchQuery(currentSearch);
    }

    // Handle debounced search URL updates
    useEffect(() => {
        const currentSearchParam = searchParams.get('search') || '';
        if (searchQuery === currentSearchParam) return;

        const delayDebounceFn = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (searchQuery) {
                params.set('search', searchQuery);
            } else {
                params.delete('search');
            }
            // Always redirect to home page on search to show results
            router.push(`/?${params.toString()}`);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, router, searchParams]);

    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const fetchNotifications = async () => {
        const { success, data } = await getNotifications();
        if (success && data) {
            setNotifications(data as any[]);
            setUnreadCount((data as any[]).filter((n: any) => !n.is_read).length);
        }
    };

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        fetchNotifications();

        // Subscribe to real-time notification inserts for the logged-in user
        const channel = supabase
            .channel(`realtime-notifications-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    // Re-fetch notifications to get fully populated relation data
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // Close dropdown on click outside
    useEffect(() => {
        if (!isNotificationsOpen) return;
        const handleOutsideClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.bell-notifications-container')) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [isNotificationsOpen]);

    // Handle marking a notification as read and navigating to the poll
    const handleNotifClick = async (notif: any) => {
        if (!notif.is_read) {
            // Update UI optimistically
            setNotifications(prev =>
                prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(c => Math.max(0, c - 1));
            
            // Call server action
            await markNotificationAsRead(notif.id);
        }
        
        setIsNotificationsOpen(false);
        
        if (notif.poll_id) {
            // Scroll to the poll card on the homepage
            router.push(`/#poll-${notif.poll_id}`);
            
            // If we are already on the homepage, the hash route may not trigger scroll automatically.
            // Scroll to the element manually if it exists.
            setTimeout(() => {
                const element = document.getElementById(`poll-${notif.poll_id}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Briefly highlight the target card
                    element.classList.add('border-brand-blue');
                    setTimeout(() => {
                        element.classList.remove('border-brand-blue');
                    }, 2000);
                }
            }, 250);
        }
    };

    // Handle marking all notifications as read
    const handleMarkAllRead = async () => {
        // Update UI optimistically
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        
        // Call server action
        await markAllNotificationsAsRead();
    };

    // Helper: Format message text to bold actor name and poll title
    const formatNotifMessage = (msg: string) => {
        const parts = msg.split('"');
        if (parts.length >= 3) {
            const firstWordEnd = parts[0].indexOf(' ');
            if (firstWordEnd > 0) {
                const actorName = parts[0].substring(0, firstWordEnd);
                const actionText = parts[0].substring(firstWordEnd);
                return (
                    <>
                        <strong className="text-white font-extrabold">{actorName}</strong>
                        {actionText}
                        <strong className="text-white font-extrabold">"{parts[1]}"</strong>
                        {parts[2]}
                    </>
                );
            }
        }
        return msg;
    };

    // Helper: Format relative timestamp
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins}m yang lalu`;
        if (diffHours < 24) return `${diffHours}j yang lalu`;
        if (diffDays < 7) return `${diffDays}h yang lalu`;
        return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
        router.refresh();
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-brand-border/60 md:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group select-none">
                        <div className="relative w-8 h-8 flex items-center justify-center bg-white border border-brand-border/80 rounded-xl overflow-hidden shrink-0 transition-transform group-hover:scale-[1.03]">
                            <Image
                                src="/kubulogo.png"
                                alt="Kubu Logo"
                                fill
                                sizes="32px"
                                className="object-contain p-1.5"
                                priority
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-black tracking-wider text-white leading-none">
                                KUBU
                            </span>
                            <span className="text-[8px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5">
                                Ruang Publik Polling &amp; Opini
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Search */}
                    <div className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Cari jajak pendapat..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-brand-card/50 border border-brand-border rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-brand-card focus:ring-1 focus:ring-white/10 transition-all text-xs font-medium"
                            />
                        </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            href="/leaderboard"
                            className="flex items-center gap-1.5 px-3 py-2 bg-brand-card/60 hover:bg-zinc-800/80 text-zinc-300 hover:text-white font-bold text-xs rounded-xl border border-brand-border/80 transition-all"
                        >
                            🏆 Peringkat
                        </Link>

                        {profile?.is_admin && (
                            <Link
                                href="/admin"
                                className="flex items-center gap-1.5 px-3 py-2 bg-brand-card/60 hover:bg-zinc-800/80 text-zinc-300 hover:text-white font-bold text-xs rounded-xl border border-brand-border/80 transition-all"
                            >
                                <Shield className="w-3.5 h-3.5 text-brand-blue" />
                                Admin
                            </Link>
                        )}
                        
                        {user ? (
                            <div className="flex items-center gap-2.5">
                                <div className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/5 border border-amber-500/15 rounded-xl text-amber-500 font-black text-xs select-none">
                                    🪙 {(profile?.points ?? 50).toLocaleString()}
                                </div>

                                {/* Desktop Notification Bell */}
                                <div className="relative bell-notifications-container">
                                    <button
                                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                        className={`relative p-2 bg-brand-card/60 hover:bg-zinc-800/80 text-zinc-300 hover:text-white rounded-xl border border-brand-border/80 transition-all cursor-pointer ${
                                            isNotificationsOpen ? 'bg-zinc-850 text-white' : ''
                                        }`}
                                        title="Notifikasi"
                                    >
                                        <Bell className="w-4 h-4" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 w-2 h-2 bg-brand-blue rounded-full ring-2 ring-background animate-pulse" />
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {isNotificationsOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 mt-2.5 w-80 bg-zinc-950/95 backdrop-blur-2xl border border-brand-border rounded-2xl shadow-2xl overflow-hidden z-50 text-left"
                                            >
                                                {/* Header */}
                                                <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border/60 bg-brand-card/30">
                                                    <span className="text-xs text-white font-black">Notifikasi</span>
                                                    {unreadCount > 0 && (
                                                        <button
                                                            onClick={handleMarkAllRead}
                                                            className="text-[10px] text-brand-blue hover:text-blue-400 font-bold transition-colors cursor-pointer"
                                                        >
                                                            Tandai semua dibaca
                                                        </button>
                                                    )}
                                                </div>

                                                {/* List */}
                                                <div className="max-h-[300px] overflow-y-auto divide-y divide-brand-border/40">
                                                    {notifications.length > 0 ? (
                                                        notifications.map((n) => (
                                                            <div
                                                                key={n.id}
                                                                onClick={() => handleNotifClick(n)}
                                                                className={`p-3.5 hover:bg-zinc-900/60 cursor-pointer transition-all flex items-start gap-3 relative ${
                                                                    !n.is_read ? 'bg-brand-blue/5' : ''
                                                                }`}
                                                            >
                                                                {!n.is_read && (
                                                                    <span className="absolute left-2.5 top-5 w-1.5 h-1.5 bg-brand-blue rounded-full" />
                                                                )}
                                                                <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-brand-border flex items-center justify-center text-[10px] font-black text-white uppercase select-none shrink-0 mt-0.5">
                                                                    {n.actor?.username?.[0] || 'U'}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[11px] text-zinc-300 leading-normal break-words font-medium">
                                                                        {formatNotifMessage(n.message)}
                                                                    </p>
                                                                    <span className="text-[8px] text-zinc-600 font-bold block mt-1">
                                                                        {formatTime(n.created_at)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center gap-2 select-none">
                                                            <Bell className="w-8 h-8 text-zinc-700 stroke-[1.5]" />
                                                            <span className="text-[10px] font-bold">Belum ada notifikasi baru</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-brand-card/60 rounded-xl border border-brand-border/80">
                                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-choice-left/90 to-choice-right/90 flex items-center justify-center text-[10px] font-black text-white uppercase select-none">
                                        {profile?.username?.[0] || 'U'}
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[11px] text-white font-bold leading-none">
                                            {profile?.username || 'User'}
                                        </span>
                                        <span className="text-[8px] text-zinc-500 font-bold mt-0.5 select-none uppercase tracking-wider">
                                            {getUserTitle(profile?.points ?? 50).name}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="p-2 text-zinc-400 hover:text-choice-left transition-colors cursor-pointer"
                                    title="Keluar"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/auth/login"
                                className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-black text-xs rounded-xl transition-all shadow-md active:scale-95 duration-150"
                            >
                                Masuk
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center gap-2">
                        {user && (
                            /* Mobile Notification Bell */
                            <div className="relative bell-notifications-container">
                                <button
                                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                    className="p-2 text-zinc-300 hover:text-white transition-colors relative cursor-pointer"
                                >
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-brand-blue rounded-full ring-2 ring-background animate-pulse" />
                                    )}
                                </button>
                                
                                <AnimatePresence>
                                    {isNotificationsOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-2.5 w-72 bg-zinc-950/95 backdrop-blur-2xl border border-brand-border rounded-2xl shadow-2xl overflow-hidden z-50 text-left"
                                        >
                                            {/* Header */}
                                            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-brand-border/60 bg-brand-card/30">
                                                <span className="text-xs text-white font-black">Notifikasi</span>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={handleMarkAllRead}
                                                        className="text-[9px] text-brand-blue hover:text-blue-400 font-bold transition-colors cursor-pointer"
                                                    >
                                                        Tandai semua dibaca
                                                    </button>
                                                )}
                                            </div>

                                            {/* List */}
                                            <div className="max-h-[250px] overflow-y-auto divide-y divide-brand-border/40">
                                                {notifications.length > 0 ? (
                                                    notifications.map((n) => (
                                                        <div
                                                            key={n.id}
                                                            onClick={() => handleNotifClick(n)}
                                                            className={`p-3 hover:bg-zinc-900/60 cursor-pointer transition-all flex items-start gap-2.5 relative ${
                                                                !n.is_read ? 'bg-brand-blue/5' : ''
                                                            }`}
                                                        >
                                                            {!n.is_read && (
                                                                <span className="absolute left-2 top-4 w-1.5 h-1.5 bg-brand-blue rounded-full" />
                                                            )}
                                                            <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-brand-border flex items-center justify-center text-[9px] font-black text-white uppercase select-none shrink-0 mt-0.5">
                                                                {n.actor?.username?.[0] || 'U'}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] text-zinc-300 leading-normal break-words font-medium">
                                                                    {formatNotifMessage(n.message)}
                                                                </p>
                                                                <span className="text-[8px] text-zinc-600 font-bold block mt-0.5">
                                                                    {formatTime(n.created_at)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-6 text-center text-zinc-500 flex flex-col items-center justify-center gap-2 select-none">
                                                        <Bell className="w-6 h-6 text-zinc-700 stroke-[1.5]" />
                                                        <span className="text-[9px] font-bold">Belum ada notifikasi baru</span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="p-2 text-zinc-300 hover:text-white transition-colors"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 text-zinc-300 hover:text-white transition-colors"
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Search */}
                <AnimatePresence>
                    {isSearchOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden overflow-hidden pb-4"
                        >
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Cari jajak pendapat..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-brand-card border border-brand-border rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 text-xs font-medium"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden bg-background/95 backdrop-blur-xl border-t border-brand-border/60 overflow-hidden"
                    >
                        <div className="px-4 py-4 space-y-3">
                            <Link
                                href="/leaderboard"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-2.5 p-3 text-zinc-300 hover:text-white bg-brand-card/50 rounded-xl border border-brand-border/80"
                            >
                                <span>🏆</span>
                                <span className="font-bold text-xs">Papan Peringkat</span>
                            </Link>

                            {profile?.is_admin && (
                                <Link
                                    href="/admin"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-2.5 p-3 text-zinc-300 hover:text-white bg-brand-card/50 rounded-xl border border-brand-border/80"
                                >
                                    <Shield className="w-4 h-4 text-brand-blue" />
                                    <span className="font-bold text-xs">Admin Panel</span>
                                </Link>
                            )}

                            {user ? (
                                <>
                                    <div className="flex items-center justify-between p-3 bg-brand-card/50 rounded-xl border border-brand-border/80">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-choice-left to-choice-right flex items-center justify-center text-sm font-black text-white uppercase select-none">
                                                {profile?.username?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-white text-xs font-bold leading-none">{profile?.username || 'User'}</p>
                                                <p className="text-zinc-500 text-[8px] font-bold mt-1 select-none uppercase tracking-wider">
                                                    {getUserTitle(profile?.points ?? 50).name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="px-2.5 py-1.5 bg-amber-500/5 border border-amber-500/15 rounded-xl text-amber-500 font-black text-xs select-none">
                                            🪙 {(profile?.points ?? 50).toLocaleString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-2 p-3 text-choice-left hover:bg-brand-card/30 rounded-xl transition-colors font-bold text-xs"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Keluar
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/auth/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block w-full text-center px-4 py-3 bg-white hover:bg-zinc-200 text-black font-black text-xs rounded-xl transition-colors"
                                >
                                    Masuk ke KUBU
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
