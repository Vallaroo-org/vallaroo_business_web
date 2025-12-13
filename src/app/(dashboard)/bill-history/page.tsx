'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order } from '@/lib/types';
import Link from 'next/link';
import { Search, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

import { useBusiness } from '@/hooks/use-business';

export default function BillHistoryPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Order; direction: 'asc' | 'desc' } | null>(null);
    const supabase = createClient();
    const { selectedShop, isLoading: contextLoading } = useBusiness();
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 50;

    useEffect(() => {
        if (!contextLoading && selectedShop) {
            // Initial load
            fetchOrders(0);
        }
    }, [contextLoading, selectedShop]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchOrders = async (currentOffset: number) => {
        try {
            setDataLoading(true);
            if (!selectedShop) return;

            const { data: bills, error } = await supabase
                .from('bills')
                .select('*')
                .eq('shop_id', selectedShop.id)
                .order('issued_at', { ascending: false })
                .range(currentOffset, currentOffset + LIMIT - 1);

            if (error) throw error;

            const newBills = bills || [];

            if (currentOffset === 0) {
                setOrders(newBills);
            } else {
                setOrders(prev => [...prev, ...newBills]);
            }

            if (newBills.length < LIMIT) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            setOffset(currentOffset + LIMIT);

        } catch (error) {
            console.error('Error loading bill history:', JSON.stringify(error, null, 2));
        } finally {
            setDataLoading(false);
        }
    };

    const handleLoadMore = () => {
        fetchOrders(offset);
    };

    const handleSort = (key: keyof Order) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const isLoading = contextLoading || (dataLoading && offset === 0);
    const isLoadingMore = dataLoading && offset > 0;

    const filteredOrders = orders.filter(order => {
        const searchLower = searchTerm.toLowerCase();
        return order.bill_number.toLowerCase().includes(searchLower) ||
            order.customer_name?.toLowerCase().includes(searchLower) ||
            order.customer_phone?.includes(searchLower);
    }).sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        const aValue = a[key] ?? '';
        const bValue = b[key] ?? '';

        if (aValue < bValue) {
            return direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const SortIcon = ({ column }: { column: keyof Order }) => {
        if (sortConfig?.key !== column) return <div className="w-4 h-4 ml-1 inline-block" />;
        return sortConfig.direction === 'asc'
            ? <span className="ml-1 inline-block">↑</span>
            : <span className="ml-1 inline-block">↓</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold text-foreground">Bill History</h1>
                <Link href="/new-bill">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Plus className="w-4 h-4 mr-2" />
                        New Bill
                    </Button>
                </Link>
            </div>

            <Card className="border-border bg-card">
                <div className="p-4 border-b border-border">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-8 bg-background border-input text-foreground"
                            placeholder="Search by Bill #, Customer Name or Phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <CardContent className="p-0 bg-card">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-12 text-center">
                            <h3 className="text-sm font-semibold text-foreground">No orders found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Sales you make will appear here.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
                                                onClick={() => handleSort('issued_at')}
                                            >
                                                Date <SortIcon column="issued_at" />
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
                                                onClick={() => handleSort('bill_number')}
                                            >
                                                Bill # <SortIcon column="bill_number" />
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
                                                onClick={() => handleSort('customer_name')}
                                            >
                                                Customer <SortIcon column="customer_name" />
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
                                                onClick={() => handleSort('payment_status')}
                                            >
                                                Status <SortIcon column="payment_status" />
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
                                                onClick={() => handleSort('total')}
                                            >
                                                Total <SortIcon column="total" />
                                            </th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-card divide-y divide-border">
                                        {filteredOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => window.location.href = `/bill-history/${order.id}`}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                    {new Date(order.issued_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                                    {order.bill_number}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-foreground">{order.customer_name || 'Walking Customer'}</div>
                                                    {order.customer_phone && <div className="text-xs text-muted-foreground">{order.customer_phone}</div>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                        ${!order.payment_status || order.payment_status === 'unpaid' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                            order.payment_status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                                                        {order.payment_status || 'unpaid'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                                    ₹{order.total}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Link href={`/bill-history/${order.id}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </Link>
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
                                        {isLoadingMore ? 'Loading...' : 'Load More Bills'}
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
