'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBusiness } from '@/hooks/use-business';

// Only defining what we need for list view
interface OnlineOrder {
    id: string;
    shop_id: string;
    customer_name: string;
    customer_phone: string;
    customer_address?: string;
    total_amount: number;
    status: string;
    created_at: string;
}

export default function OnlineOrdersPage() {
    const [orders, setOrders] = useState<OnlineOrder[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const supabase = createClient();
    const { selectedShop, isLoading: contextLoading } = useBusiness();

    useEffect(() => {
        if (!contextLoading && selectedShop) {
            fetchOrders();
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
                <h1 className="text-2xl font-bold text-foreground">Online Orders</h1>
            </div>

            <Card className="border-border bg-card">
                <div className="p-4 border-b border-border">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-8 bg-background border-input text-foreground"
                            placeholder="Search by Name or Phone..."
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
                            <h3 className="text-sm font-semibold text-foreground">No online orders found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Orders from the customer app will appear here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {filteredOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-foreground">{order.customer_name}</div>
                                                <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                                ₹{order.total_amount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
