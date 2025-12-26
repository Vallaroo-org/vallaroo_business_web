'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBusiness } from '@/hooks/use-business';
import { OnlineOrder } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState<OnlineOrder[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const supabase = createClient();
    const { selectedShop, isLoading: contextLoading } = useBusiness();
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const LIMIT = 50;
    const router = useRouter();

    // Statuses considered "History"
    const HISTORY_STATUSES = ['completed', 'cancelled', 'rejected'];

    useEffect(() => {
        if (!contextLoading && selectedShop) {
            fetchOrders(0);
        }
    }, [contextLoading, selectedShop]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchOrders = async (currentOffset: number) => {
        try {
            setDataLoading(true);
            if (!selectedShop) return;

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('shop_id', selectedShop.id)
                .in('status', HISTORY_STATUSES)
                .order('created_at', { ascending: false })
                .range(currentOffset, currentOffset + LIMIT - 1);

            if (error) throw error;

            const newOrders = data || [];

            if (currentOffset === 0) {
                setOrders(newOrders);
            } else {
                setOrders(prev => [...prev, ...newOrders]);
            }

            if (newOrders.length < LIMIT) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            setOffset(currentOffset + LIMIT);
        } catch (error) {
            console.error('Error loading order history:', JSON.stringify(error, null, 2));
        } finally {
            setDataLoading(false);
        }
    };

    const handleLoadMore = () => {
        fetchOrders(offset);
    };

    const handleViewInvoice = async (e: React.MouseEvent, orderId: string) => {
        e.stopPropagation();
        if (!selectedShop) return;

        try {
            const { data, error } = await supabase
                .from('bills')
                .select('id')
                .eq('shop_id', selectedShop.id)
                .contains('metadata', { order_id: orderId })
                .single();

            if (error || !data) {
                toast.error('Invoice not found for this order');
                return;
            }

            // Open in new tab? Or navigate?
            // Usually invoice viewing is better in new tab or same tab.
            // Let's navigate for now as per plan.
            router.push(`/bill-history/${data.id}`);
        } catch (error) {
            console.error('Error fetching invoice:', error);
            toast.error('Failed to load invoice');
        }
    };

    const isLoading = contextLoading || (dataLoading && offset === 0);
    const isLoadingMore = dataLoading && offset > 0;

    const filteredOrders = orders.filter(order => {
        const searchLower = searchTerm.toLowerCase();
        return order.customer_name?.toLowerCase().includes(searchLower) ||
            order.customer_phone?.includes(searchLower);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold text-foreground">Order History</h1>
            </div>

            <Card className="border-border bg-card">
                <div className="p-4 border-b border-border">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-8 bg-background border-input text-foreground"
                            placeholder="Search history..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <CardContent className="p-0 bg-card">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading history...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-12 text-center">
                            <h3 className="text-sm font-semibold text-foreground">No order history found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Completed or cancelled orders will appear here.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
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
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-foreground">{order.customer_name}</div>
                                                    <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                                                        ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            order.status === 'cancelled' || order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'}`}>
                                                        {order.status.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                                    {formatCurrency(order.total_amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Link href={`/orders/${order.id}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 pointer-events-auto mr-4">
                                                        View
                                                    </Link>
                                                    {order.status === 'completed' && (
                                                        <button
                                                            onClick={(e) => handleViewInvoice(e, order.id)}
                                                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 pointer-events-auto font-medium"
                                                        >
                                                            Invoice
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Load More Button */}
                            {hasMore && (
                                <div className="p-4 border-t border-border flex justify-center">
                                    <Button
                                        variant="outline"
                                        onClick={handleLoadMore}
                                        disabled={isLoadingMore}
                                        className="w-full sm:w-auto"
                                    >
                                        {isLoadingMore ? 'Loading...' : 'Load More History'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
