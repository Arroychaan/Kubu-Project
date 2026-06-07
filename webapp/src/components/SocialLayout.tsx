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
            <div className="w-full flex-1 flex justify-center relative items-start">
                
                {/* 1. Left Navigation Sidebar (Desktop only) */}
                {/* On very large screens, flex-grow pushes it to center, but we can just use a fixed max-width container */}
                <header className="hidden md:flex w-[88px] xl:w-[275px] shrink-0 sticky top-0 h-screen justify-end">
                    <div className="w-[88px] xl:w-[275px] h-full flex flex-col">
                        <LeftSidebar activeTab={activeTab} />
                    </div>
                </header>

                {/* 2. Middle Main Feed Column */}
                <main className="w-full max-w-[600px] shrink-0 min-w-0 pt-16 md:pt-0 pb-24 md:pb-6 border-x-0 md:border-x border-brand-border min-h-screen">
                    {children}
                </main>

                {/* 3. Right Panel Sidebar (Desktop/Tablet only, lg breakpoint) */}
                <aside className="hidden lg:block w-[350px] shrink-0 py-2 pl-8">
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
