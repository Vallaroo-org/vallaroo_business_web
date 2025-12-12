'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order } from '@/lib/types';
import { useBusiness } from '@/hooks/use-business';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, CheckCircle, XCircle, AlertCircle, Eye, Printer } from 'lucide-react';
import Link from 'next/link';

export default function PaymentReportsPage() {
    const { selectedShop } = useBusiness();
    const supabase = createClient();

    // State
    const [selectedTab, setSelectedTab] = useState<'paid' | 'unpaid' | 'partial'>('unpaid');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedShop) {
            fetchOrders();
        }
    }, [selectedShop, selectedTab]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('bills')
                .select('*')
                .eq('shop_id', selectedShop!.id)
                .is('deleted_at', null)
                .eq('payment_status', selectedTab)
                .order('issued_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatusIcon = ({ status }: { status: string }) => {
        switch (status) {
            case 'paid': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'unpaid': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'partial': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold font-heading">Payment Reports</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit">
                {['unpaid', 'partial', 'paid'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setSelectedTab(tab as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedTab === tab
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-lg">
                        {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Bills
                        <span className="ml-2 text-sm font-normal text-muted-foreground">({orders.length})</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading...</div>
                    ) : orders.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No {selectedTab} bills found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Bill #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Customer</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Paid</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Balance</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {new Date(order.issued_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {order.bill_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {order.customer_name || 'Walking Customer'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                                ₹{order.total}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-green-600">
                                                ₹{order.paid_amount || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-red-600">
                                                ₹{(order.total - (order.paid_amount || 0)).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/bill-history/${order.id}`}>
                                                        <Button variant="ghost" size="icon" title="View Details">
                                                            <Eye className="w-4 h-4 text-muted-foreground" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/bill-history/${order.id}/invoice`}>
                                                        <Button variant="ghost" size="icon" title="Print Invoice">
                                                            <Printer className="w-4 h-4 text-muted-foreground" />
                                                        </Button>
                                                    </Link>
                                                </div>
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
