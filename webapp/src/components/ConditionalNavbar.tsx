'use client';

import { usePathname } from 'next/navigation';

interface ConditionalNavbarProps {
    children: React.ReactNode;
    paddingOnly?: boolean;
}

export default function ConditionalNavbar({ children, paddingOnly = false }: ConditionalNavbarProps) {
    const pathname = usePathname();
    const isCustomLayoutPage = pathname.startsWith('/auth') || pathname.startsWith('/help');

    if (paddingOnly) {
        // For the main content wrapper: add pt-16 padding only on non-custom layout pages
        return (
            <div className={isCustomLayoutPage ? '' : 'md:pt-0 pt-16'}>
                {children}
            </div>
        );
    }

    // For the navbar itself: hide on custom layout pages
    if (isCustomLayoutPage) {
        return null;
    }

    return <>{children}</>;
}
