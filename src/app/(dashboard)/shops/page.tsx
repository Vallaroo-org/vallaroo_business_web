'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { Store } from 'lucide-react';

// This is just a redirect helper or separate page if logic grows
export default function ShopsPage() {
    const router = useRouter();
    // Redirect to businesses page which handles both logic now
    useEffect(() => {
        router.replace('/businesses');
    }, [router]);

    return null;
}
