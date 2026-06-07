import { Metadata } from 'next';
import ExploreClient from './ExploreClient';

export const metadata: Metadata = {
    title: 'Jelajah - KUBU',
    description: 'Jelajahi topik panas dan temukan pengguna di KUBU.',
};

import { Suspense } from 'react';

export default function ExplorePage() {
    return (
        <Suspense fallback={null}>
            <ExploreClient />
        </Suspense>
    );
}
