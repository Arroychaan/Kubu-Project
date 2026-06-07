'use client';

import { useEffect } from 'react';
import LeftSidebar from './LeftSidebar';
import RightPanel from './RightPanel';
import MobileBottomNav from './MobileBottomNav';
import CreatePollModal from './CreatePollModal';
import { useAuthStore } from '@/store/useAuthStore';

interface SocialLayoutProps {
    children: React.ReactNode;
    activeTab?: string;
}

export default function SocialLayout({ children, activeTab = 'beranda' }: SocialLayoutProps) {
    const { checkSession } = useAuthStore();

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative">
            {/* Grid Pattern Overlay */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.3] -z-10"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)`,
                    backgroundSize: '48px 48px'
                }}
            />

            {/* Atmosphere Ambient Glows */}
            <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-choice-right/5 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-choice-left/5 rounded-full blur-[100px]" />
            </div>

            {/* Container for content */}
            <div className="max-w-[1200px] mx-auto w-full flex-1 flex gap-6 px-4 sm:px-6 relative items-start">
                
                {/* 1. Left Navigation Sidebar (Desktop only) */}
                <aside className="hidden md:block w-[240px] shrink-0 sticky top-0 h-screen py-6 border-r border-brand-border/40 pr-4">
                    <LeftSidebar activeTab={activeTab} />
                </aside>

                {/* 2. Middle Main Feed Column */}
                <main className="flex-1 max-w-[660px] w-full min-w-0 py-6 pb-24 md:pb-6 mx-auto">
                    {children}
                </main>

                {/* 3. Right Panel Sidebar (Desktop/Tablet only, lg breakpoint) */}
                <aside className="hidden lg:block w-[300px] shrink-0 sticky top-0 h-screen py-6 border-l border-brand-border/40 pl-6">
                    <RightPanel />
                </aside>
                
            </div>

            {/* 4. Mobile Bottom Navigation (Mobile only) */}
            <div className="md:hidden">
                <MobileBottomNav activeTab={activeTab} />
            </div>

            {/* 5. Global Creator Modal */}
            <CreatePollModal onPollCreated={() => {
                // Refresh client routes
                window.location.reload();
            }} />
        </div>
    );
}
