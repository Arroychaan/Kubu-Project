import { Metadata } from 'next';
import NotificationsClient from './NotificationsClient';

export const metadata: Metadata = {
    title: 'Notifikasi - KUBU',
    description: 'Lihat interaksi terbaru dan aktivitas dari pengguna lain.',
};

export default function NotificationsPage() {
    return <NotificationsClient />;
}
