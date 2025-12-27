'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBusiness } from '@/hooks/use-business';
import { OnlineOrder } from '@/lib/types';
import { toast } from 'sonner';

export default function NewOrdersPage() {
    const [orders, setOrders] = useState<OnlineOrder[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const supabase = createClient();
    const { selectedShop, isLoading: contextLoading } = useBusiness();

    // Statuses considered "New" or "Active"
    const ACTIVE_STATUSES = ['pending', 'accepted', 'ready', 'out_for_delivery'];

    useEffect(() => {
        if (!contextLoading && selectedShop) {
            fetchOrders();

            // Subscribe to Realtime changes
            const channel = supabase
                .channel('orders-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'orders',
                        filter: `shop_id=eq.${selectedShop.id}`,
                    },
                    (payload) => {
                        console.log('Realtime Order Update:', payload);
                        if (payload.eventType === 'INSERT') {
                            // Only add if it's an active status
                            const newOrder = payload.new as OnlineOrder;
                            if (ACTIVE_STATUSES.includes(newOrder.status)) {
                                setOrders(prev => [newOrder, ...prev]);
                                toast.info(`New Order received from ${newOrder.customer_name}!`);
                                // Optional: Play sound
                            }
                        } else if (payload.eventType === 'UPDATE') {
                            const updatedOrder = payload.new as OnlineOrder;
                            setOrders(prev => {
                                // If status is no longer active (e.g., completed), remove it
                                if (!ACTIVE_STATUSES.includes(updatedOrder.status)) {
                                    return prev.filter(o => o.id !== updatedOrder.id);
                                }
                                // Otherwise update it in place
                                return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
                            });
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [contextLoading, selectedShop]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchOrders = async () => {
        try {
            setDataLoading(true);
            if (!selectedShop) return;

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('shop_id', selectedShop.id)
                .in('status', ACTIVE_STATUSES)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error loading online orders:', JSON.stringify(error, null, 2));
        } finally {
            setDataLoading(false);
        }
    };

    const isLoading = contextLoading || dataLoading;

    const filteredOrders = orders.filter(order => {
        const searchLower = searchTerm.toLowerCase();
        return order.customer_name?.toLowerCase().includes(searchLower) ||
            order.customer_phone?.includes(searchLower);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    New Orders
                    {filteredOrders.length > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                            {filteredOrders.length} Live
                        </span>
                    )}
                </h1>
            </div>

            <Card className="border-border bg-card">
                <div className="p-4 border-b border-border">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-8 pr-8 bg-background border-input text-foreground"
                            placeholder="Search active orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            maxLength={50}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
                <CardContent className="p-0 bg-card">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-12 text-center">
                            <h3 className="text-sm font-semibold text-foreground">No active orders</h3>
                            <p className="mt-1 text-sm text-muted-foreground">New orders will appear here automatically.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-card divide-y divide-border">
                                        {filteredOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-muted/50 transition-colors group cursor-pointer" onClick={() => window.location.href = `/orders/${order.id}`}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-foreground">{order.customer_name}</div>
                                                    <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                                                        ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
                                                            order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-green-100 text-green-800'}`}>
                                                        {order.status.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                                    {formatCurrency(order.total_amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Link href={`/orders/${order.id}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 pointer-events-auto">
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

