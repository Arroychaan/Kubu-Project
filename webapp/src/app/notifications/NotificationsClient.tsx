'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import SocialLayout from '@/components/SocialLayout';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions';
import { Loader2, Bell, MessageSquare, Heart, Star, CheckCheck, User, Shield } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface NotificationItem {
    id: string;
    type: string;
    poll_id: string | null;
    actor_id: string | null;
    message: string;
    is_read: boolean;
    created_at: string;
    actor?: {
        username: string | null;
        avatar_url: string | null;
    } | null;
    poll?: {
        question: string;
    } | null;
}

export default function NotificationsClient() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getNotifications();
            if (res.success && res.data) {
                setNotifications(res.data as NotificationItem[]);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAllRead = async () => {
        const hasUnread = notifications.some(n => !n.is_read);
        if (!hasUnread) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        
        startTransition(async () => {
            await markAllNotificationsAsRead();
            router.refresh();
        });
    };

    const handleNotificationClick = async (notif: NotificationItem) => {
        if (!notif.is_read) {
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            // Mark as read in background
            markNotificationAsRead(notif.id).then(() => {
                router.refresh();
            });
        }

        // Navigate
        if (notif.poll_id) {
            router.push(`/?pollId=${notif.poll_id}`);
        }
    };

    const getIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'comment':
            case 'reply':
                return <MessageSquare className="w-5 h-5 text-blue-500" />;
            case 'support':
            case 'like':
                return <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />;
            case 'vote':
                return <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />;
            case 'system':
                return <Shield className="w-5 h-5 text-brand-blue" />;
            default:
                return <Bell className="w-5 h-5 text-zinc-500" />;
        }
    };

    return (
        <SocialLayout activeTab="Notifikasi">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-brand-border">
                <div className="px-4 py-3 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-white">Notifikasi</h1>
                    {notifications.some(n => !n.is_read) && (
                        <button
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full text-xs font-bold transition-colors cursor-pointer border border-zinc-800"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Tandai semua dibaca
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="min-h-[50vh]">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="divide-y divide-brand-border/40">
                        {notifications.map((notif) => (
                            <div 
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-4 flex gap-4 cursor-pointer transition-colors ${
                                    notif.is_read 
                                        ? 'bg-transparent hover:bg-zinc-900/30' 
                                        : 'bg-brand-blue/5 hover:bg-brand-blue/10 border-l-2 border-l-brand-blue'
                                }`}
                            >
                                <div className="shrink-0 flex flex-col items-end gap-2 pt-1 w-8">
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {notif.actor && (
                                            <div className="relative w-7 h-7 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700 shrink-0">
                                                {notif.actor.avatar_url ? (
                                                    <Image src={notif.actor.avatar_url} alt="Avatar" fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <User className="w-3.5 h-3.5 text-zinc-500" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex-1 text-sm text-zinc-400">
                                            {notif.actor && (
                                                <span className="font-bold text-white pr-1">
                                                    {notif.actor.username || 'Pengguna'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[15px] text-zinc-200 mb-1.5 leading-snug">
                                        {notif.message}
                                    </p>
                                    {notif.poll && (
                                        <p className="text-[13px] text-zinc-500 truncate mb-2">
                                            Topik: <span className="text-zinc-400">"{notif.poll.question}"</span>
                                        </p>
                                    )}
                                    <span className="text-xs text-zinc-500 font-medium">
                                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: idLocale })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                            <Bell className="w-8 h-8 text-zinc-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Belum ada notifikasi</h3>
                        <p className="text-zinc-500 max-w-[250px]">
                            Interaksi seperti komentar dan dukungan opini akan muncul di sini.
                        </p>
                    </div>
                )}
            </div>
        </SocialLayout>
    );
}
