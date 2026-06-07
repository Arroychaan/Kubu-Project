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


            {/* Container for content */}
            <div className="max-w-[1200px] mx-auto w-full flex-1 flex md:gap-6 px-0 md:px-6 relative items-start">
                
                {/* 1. Left Navigation Sidebar (Desktop only) */}
                <aside className="hidden md:block w-[240px] shrink-0 sticky top-0 h-screen py-6 border-r border-brand-border/40 pr-4">
                    <LeftSidebar activeTab={activeTab} />
                </aside>

                {/* 2. Middle Main Feed Column */}
                <main className="flex-1 max-w-[660px] w-full min-w-0 pt-16 md:pt-6 pb-24 md:pb-6 mx-auto border-x-0 md:border-x border-brand-border/40 min-h-screen">
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
