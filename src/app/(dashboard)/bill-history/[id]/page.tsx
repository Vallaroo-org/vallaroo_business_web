'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Order } from '@/lib/types';
import { ArrowLeft, Loader2, Printer, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddPaymentDialog } from '@/components/dashboard/add-payment-dialog';
import BillActionsMenu from '@/components/dashboard/bill-actions-menu';

import { formatCurrency } from '@/lib/utils';

export default function BillDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params?.id as string;
    const supabase = createClient();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);

    const fetchOrder = async () => {
        try {
            const { data, error } = await supabase
                .from('bills')
                .select('*, items:bill_items(*)')
                .eq('id', orderId)
                .single();

            if (error) throw error;
            setOrder(data);

            // Fetch transactions
            const { data: txData, error: txError } = await supabase
                .from('bill_transactions')
                .select('*')
                .eq('bill_id', orderId)
                .order('recorded_at', { ascending: false });

            if (txError) throw txError;
            setTransactions(txData || []);

        } catch (error) {
            console.error('Error fetching bill:', error);
            // alert('Bill not found');
            // router.push('/bill-history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) fetchOrder();
    }, [orderId, supabase]);

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
    }

    if (!order) return null;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/bill-history" className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Bill #{order.bill_number}</h1>
                        <p className="text-sm text-muted-foreground">{new Date(order.issued_at).toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <Link href={`/bill-history/${orderId}/invoice`}>
                        <Button variant="outline">
                            <Printer className="w-4 h-4 mr-2" />
                            View Invoice
                        </Button>
                    </Link>
                    {order && (
                        <BillActionsMenu
                            bill={order}
                            currentBusinessName={'Vallaroo Business'}
                            onDeleteSuccess={() => {
                                window.location.href = '/bill-history';
                            }}
                        />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Items */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="bg-card border-border h-fit">
                        <CardHeader>
                            <CardTitle>Items</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Item</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Qty</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Price</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border bg-card">
                                        {order.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                    {item.name}
                                                    {item.name_ml && <span className="block text-xs text-muted-foreground">{item.name_ml}</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground text-right">
                                                    {item.quantity} {item.unit}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground text-right">
                                                    {formatCurrency(item.price)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground text-right">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-muted/50">
                                        <tr>
                                            <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Subtotal</td>
                                            <td className="px-6 py-3 text-right text-sm font-medium text-foreground">{formatCurrency(order.subtotal)}</td>
                                        </tr>
                                        {order.discount > 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Discount</td>
                                                <td className="px-6 py-3 text-right text-sm font-medium text-green-600">-{formatCurrency(order.discount)}</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td colSpan={3} className="px-6 py-3 text-right text-base font-bold text-foreground">Total</td>
                                            <td className="px-6 py-3 text-right text-base font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(order.total)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment History Table */}
                    <Card className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Payment History</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {transactions.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-border">
                                        <thead>
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Method</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border bg-card">
                                            {transactions.map((tx) => (
                                                <tr key={tx.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                        {new Date(tx.recorded_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground capitalize">
                                                        {tx.payment_method}
                                                        {tx.note && <span className="block text-xs text-muted-foreground">{tx.note}</span>}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                                                        +{formatCurrency(tx.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-6 text-center text-sm text-muted-foreground">
                                    No payments recorded yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Status & Customer */}
                <div className="space-y-6">
                    {/* Payment Status Card */}
                    <Card className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg">Payment Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                    ${!order.payment_status || order.payment_status === 'unpaid' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                        order.payment_status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                                    {order.payment_status || 'unpaid'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Amount Paid</span>
                                <span className="font-medium">{formatCurrency(order.paid_amount || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Balance</span>
                                <span className="font-medium text-red-600 dark:text-red-400">
                                    {formatCurrency(order.total - (order.paid_amount || 0))}
                                </span>
                            </div>

                            <div className="pt-4">
                                {order.payment_status !== 'paid' && (order.total > (order.paid_amount || 0)) && (
                                    <AddPaymentDialog bill={order} onPaymentAdded={fetchOrder} />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Details Card */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-lg">Customer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {order.customer_name ? (
                                <>
                                    <div className="font-medium text-foreground">{order.customer_name}</div>
                                    {order.customer_phone && (
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Phone className="w-4 h-4 mr-2" />
                                            {order.customer_phone}
                                        </div>
                                    )}
                                    {order.customer_address && (
                                        <div className="flex items-start text-sm text-muted-foreground">
                                            <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                                            {order.customer_address}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-sm text-muted-foreground italic">Walking Customer</div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div >
    );
}
