import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useNewOrdersCount(shopId: string | undefined) {
    const [count, setCount] = useState(0);
    const supabase = createClient();
    const ACTIVE_STATUSES = ['pending', 'accepted', 'ready', 'out_for_delivery'];

    useEffect(() => {
        if (!shopId) return;

        const fetchCount = async () => {
            const { count, error } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('shop_id', shopId)
                .in('status', ACTIVE_STATUSES);

            if (!error && count !== null) {
                setCount(count);
            }
        };

        fetchCount();

        // Subscribe to changes
        const channel = supabase
            .channel('orders-count-sidebar')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `shop_id=eq.${shopId}`,
                },
                () => {
                    // Re-fetch count on any change to be safe and accurate
                    fetchCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [shopId]);

    return count;
}
