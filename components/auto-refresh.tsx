'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AutoRefresh() {
    const router = useRouter();

    useEffect(() => {
        // Refresh every 3 seconds to get latest download status
        const interval = setInterval(() => {
            router.refresh();
        }, 1000);

        return () => clearInterval(interval);
    }, [router]);

    return null;
}
