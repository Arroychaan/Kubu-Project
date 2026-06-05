'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

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

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-neon-dark/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <motion.span
                            className="text-2xl md:text-3xl font-black italic tracking-tighter bg-gradient-to-r from-neon-pink via-white to-neon-cyan bg-clip-text text-transparent"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            KUBU
                        </motion.span>
                        <span className="hidden sm:block text-[10px] text-white/40 font-mono uppercase tracking-widest">
                            Pick Your Side
                        </span>
                    </Link>

                    {/* Desktop Search */}
                    <div className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                                type="text"
                                placeholder="Search wars..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition-all text-sm"
                            />
                        </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-pink to-neon-cyan flex items-center justify-center text-xs font-bold text-white">
                                        {profile?.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <span className="text-sm text-white/80 font-medium">
                                        {profile?.username || 'User'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="p-2 text-white/50 hover:text-neon-pink transition-colors"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/auth/login"
                                className="px-4 py-2 bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-neon-pink/20"
                            >
                                Login
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center gap-2">
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="p-2 text-white/70 hover:text-white transition-colors"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 text-white/70 hover:text-white transition-colors"
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
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Search wars..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50 text-sm"
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
                        className="md:hidden bg-neon-dark/95 border-t border-white/5 overflow-hidden"
                    >
                        <div className="px-4 py-4 space-y-3">
                            {user ? (
                                <>
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-pink to-neon-cyan flex items-center justify-center text-lg font-bold text-white">
                                            {profile?.username?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{profile?.username || 'User'}</p>
                                            <p className="text-white/50 text-xs">Logged in</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-2 p-3 text-neon-pink hover:bg-white/5 rounded-xl transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/auth/login"
                                    className="block w-full text-center px-4 py-3 bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-bold rounded-xl"
                                >
                                    Login to Vote
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
