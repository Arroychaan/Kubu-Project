import { Metadata } from 'next';
import NotificationsClient from './NotificationsClient';

export const metadata: Metadata = {
    title: 'Notifikasi - KUBU',
    description: 'Lihat interaksi terbaru dan aktivitas dari pengguna lain.',
};

import { Suspense } from 'react';

export default function NotificationsPage() {
    return (
        <Suspense fallback={null}>
            <NotificationsClient />
        </Suspense>
    );
}
