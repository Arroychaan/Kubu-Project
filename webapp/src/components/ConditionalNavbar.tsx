'use client';

import { usePathname } from 'next/navigation';

interface ConditionalNavbarProps {
    children: React.ReactNode;
    paddingOnly?: boolean;
}

export default function ConditionalNavbar({ children, paddingOnly = false }: ConditionalNavbarProps) {
    const pathname = usePathname();
    const isAuthPage = pathname.startsWith('/auth');

    if (paddingOnly) {
        // For the main content wrapper: add pt-16 padding only on non-auth pages
        return (
            <div className={isAuthPage ? '' : 'md:pt-0 pt-16'}>
                {children}
            </div>
        );
    }

    // For the navbar itself: hide on auth pages
    if (isAuthPage) {
        return null;
    }

    return <>{children}</>;
}
