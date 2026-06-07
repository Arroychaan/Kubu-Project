'use client';

import { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import SocialLayout from '@/components/SocialLayout';
import PollCard from '@/components/PollCard';
import { Poll } from '@/types';
import { Search, X, User, Trophy, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getCommunityPolls, searchProfiles } from '@/app/actions';
import Image from 'next/image';

interface Profile {
    id: string;
    username: string | null;
    avatar_url: string | null;
    points: number;
    is_admin: boolean;
}

export default function ExploreClient() {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'topik' | 'pengguna'>('topik');
    
    const [polls, setPolls] = useState<Poll[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    const fetchResults = useCallback(async () => {
        setIsLoading(true);
        startTransition(async () => {
            try {
                if (activeTab === 'topik') {
                    const res = await getCommunityPolls(20, 0, debouncedQuery);
                    if (res.success && res.data) {
                        setPolls(res.data as Poll[]);
                    } else {
                        setPolls([]);
                    }
                } else {
                    const res = await searchProfiles(debouncedQuery, 20);
                    if (res.success && res.data) {
                        setProfiles(res.data as Profile[]);
                    } else {
                        setProfiles([]);
                    }
                }
            } catch (error) {
                console.error("Fetch error", error);
            } finally {
                setIsLoading(false);
            }
        });
    }, [activeTab, debouncedQuery]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    const handleClear = () => {
        setQuery('');
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    return (
        <SocialLayout activeTab="Jelajah">
            {/* Header / Search Bar */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-brand-border">
                <div className="p-3 md:p-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-brand-blue transition-colors" />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={activeTab === 'topik' ? "Cari topik..." : "Cari pengguna..."}
                            className="block w-full pl-11 pr-10 py-3 bg-zinc-900/50 border border-transparent focus:border-brand-blue focus:bg-background focus:ring-1 focus:ring-brand-blue rounded-full text-white placeholder-zinc-500 transition-all outline-none"
                        />
                        {query && (
                            <button
                                onClick={handleClear}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex w-full">
                    <button
                        onClick={() => setActiveTab('topik')}
                        className="flex-1 flex justify-center hover:bg-zinc-900/40 transition-colors cursor-pointer"
                    >
                        <div className={`py-4 text-[15px] font-bold relative ${
                            activeTab === 'topik' ? 'text-white' : 'text-zinc-500 font-medium'
                        }`}>
                            Topik
                            {activeTab === 'topik' && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue rounded-t-full" />
                            )}
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('pengguna')}
                        className="flex-1 flex justify-center hover:bg-zinc-900/40 transition-colors cursor-pointer"
                    >
                        <div className={`py-4 text-[15px] font-bold relative ${
                            activeTab === 'pengguna' ? 'text-white' : 'text-zinc-500 font-medium'
                        }`}>
                            Pengguna
                            {activeTab === 'pengguna' && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue rounded-t-full" />
                            )}
                        </div>
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="min-h-[50vh]">
                {(isLoading || isPending) ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {activeTab === 'topik' ? (
                            polls.length > 0 ? (
                                <div className="divide-y divide-brand-border/40">
                                    {polls.map((poll) => (
                                        <div key={poll.id} className="pt-2">
                                            <PollCard poll={poll} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                        <Search className="w-8 h-8 text-zinc-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Tidak ada topik ditemukan</h3>
                                    <p className="text-zinc-500">Coba gunakan kata kunci lain untuk mencari topik.</p>
                                </div>
                            )
                        ) : (
                            profiles.length > 0 ? (
                                <div className="divide-y divide-brand-border/40">
                                    {profiles.map((profile) => (
                                        <Link 
                                            key={profile.id} 
                                            href={`/profile?id=${profile.id}`}
                                            className="flex items-center justify-between p-4 hover:bg-zinc-900/30 transition-colors group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700/50 group-hover:border-brand-blue/50 transition-colors">
                                                    {profile.avatar_url ? (
                                                        <Image
                                                            src={profile.avatar_url}
                                                            alt={profile.username || 'User avatar'}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <User className="w-6 h-6 text-zinc-500" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[15px] font-bold text-white group-hover:underline decoration-brand-blue underline-offset-2">
                                                        {profile.username || 'Pengguna Anonim'}
                                                    </span>
                                                    <span className="text-[14px] text-zinc-500">
                                                        @{profile.username || profile.id.slice(0,8)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                                                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                                                <span className="text-xs font-bold text-zinc-300">{profile.points} pts</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                        <User className="w-8 h-8 text-zinc-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Pengguna tidak ditemukan</h3>
                                    <p className="text-zinc-500">Coba cari dengan nama pengguna yang lain.</p>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </SocialLayout>
    );
}
