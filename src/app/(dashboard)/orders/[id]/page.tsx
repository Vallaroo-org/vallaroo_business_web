'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { OnlineOrder } from '@/lib/types';
import { ArrowLeft, Loader2, Phone, MapPin, CheckCircle, XCircle, Truck, Package, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

import { GenerateBillDialog } from '../_components/generate-bill-dialog';

export default function OrderDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params?.id as string;
    const supabase = createClient();

    const [order, setOrder] = useState<OnlineOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showBillDialog, setShowBillDialog] = useState(false);

    const [linkedBill, setLinkedBill] = useState<any | null>(null);

    useEffect(() => {
        const fetchOrderAndBill = async () => {
            try {
                // 1. Fetch Order
                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .select('*, items:order_items(*, product:products(name))')
                    .eq('id', orderId)
                    .single();

                if (orderError) throw orderError;
                setOrder(orderData);

                // 2. Fetch Linked Bill (using metadata->>order_id)
                // Since we store order_id in metadata, we query for it.
                // Note: Indexing on metadata->>order_id would be good for performance, but fine for now.
                const { data: billData } = await supabase
                    .from('bills')
                    .select('*')
                    .eq('metadata->>order_id', orderId)
                    .maybeSingle(); // Use maybeSingle as it might not exist yet

                if (billData) {
                    setLinkedBill(billData);
                }

            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Order not found');
                router.push('/orders');
            } finally {
                setLoading(false);
            }
        };
        if (orderId) fetchOrderAndBill();
    }, [orderId, router, supabase]);

    const updateStatus = async (newStatus: string) => {
        try {
            setUpdating(true);
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId)
                .select();

            if (error) {
                console.error('Full Error Object:', error);
                console.error('Error Details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            setOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
            toast.success(`Order status updated to ${newStatus}`);
        } catch (error: any) {
            console.error('Caught Error updating status:', error);
            toast.error('Failed to update status. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
    }

    if (!order) return null;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/orders" className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Order Details</h1>
                        <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`px-4 py-2 rounded-full text-sm font-bold capitalize
                    ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' || order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'}`}>
                    {order.status.replace(/_/g, ' ')}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Items */}
                <Card className="md:col-span-2 bg-card border-border h-fit">
                    <CardHeader>
                        <CardTitle>Order Items</CardTitle>
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
                                    {order.items.map((item: any, idx) => (
                                        <tr key={idx}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                {item.product?.name || 'Unknown Item'}
                                                {/* Variant name handling if applicable */}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground text-right">
                                                {item.quantity}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground text-right">
                                                {formatCurrency(item.price_at_time || 0)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground text-right">
                                                {formatCurrency(item.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-muted/50">
                                    {order.delivery_charge && order.delivery_charge > 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Delivery Charge</td>
                                            <td className="px-6 py-3 text-right text-sm font-medium text-foreground">{formatCurrency(order.delivery_charge)}</td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td colSpan={3} className="px-6 py-3 text-right text-base font-bold text-foreground">Total</td>
                                        <td className="px-6 py-3 text-right text-base font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(order.total_amount)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Actions & Customer */}
                <div className="space-y-6">

                    {/* Actions Card */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {order.status === 'pending' && (
                                <>
                                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => updateStatus('accepted')} disabled={updating}>
                                        <CheckCircle className="w-4 h-4 mr-2" /> Accept Order
                                    </Button>
                                    <Button variant="destructive" className="w-full" onClick={() => updateStatus('rejected')} disabled={updating}>
                                        <XCircle className="w-4 h-4 mr-2" /> Reject Order
                                    </Button>
                                </>
                            )}
                            {order.status === 'accepted' && (
                                <Button className="w-full" onClick={() => updateStatus('ready')} disabled={updating}>
                                    <Package className="w-4 h-4 mr-2" /> Mark as Ready
                                </Button>
                            )}
                            {order.status === 'ready' && (
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowBillDialog(true)} disabled={updating}>
                                    <CheckCircle className="w-4 h-4 mr-2" /> Complete & Generate Bill
                                </Button>
                            )}
                            {order.status === 'completed' && linkedBill && (
                                <Link href={`/bill-history/${linkedBill.id}/invoice`} className="w-full">
                                    <Button variant="outline" className="w-full">
                                        <Package className="w-4 h-4 mr-2" /> View/Print Invoice
                                    </Button>
                                </Link>
                            )}
                            {['cancelled', 'rejected'].includes(order.status) && (
                                <div className="text-center text-sm text-muted-foreground">
                                    Order is {order.status}. No actions available.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Customer Info */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle>Customer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="font-medium text-foreground">{order.customer_name}</div>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Phone className="w-4 h-4 mr-2" />
                                <a href={`tel:${order.customer_phone}`} className="hover:underline">{order.customer_phone}</a>
                            </div>
                            {order.customer_address && (
                                <div className="flex items-start text-sm text-muted-foreground">
                                    <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                                    {order.customer_address}
                                </div>
                            )}
                            {order.note && (
                                <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm italic">
                                    " {order.note} "
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Info */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle>Payment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Method</span>
                                <span className="font-medium uppercase">{linkedBill?.payment_method || order.payment_method || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Status</span>
                                <span className={`font-medium capitalize ${(linkedBill?.payment_status || order.payment_status) === 'paid' ? 'text-green-600' :
                                    (linkedBill?.payment_status || order.payment_status) === 'partial' ? 'text-blue-600' :
                                        'text-yellow-600'
                                    }`}>
                                    {linkedBill?.payment_status || order.payment_status || 'Pending'}
                                </span>
                            </div>
                            {linkedBill && linkedBill.payment_status === 'partial' && (
                                <div className="flex justify-between text-sm mt-1 pt-1 border-t border-border">
                                    <span className="text-muted-foreground">Balance Due</span>
                                    <span className="font-medium text-red-600">
                                        {formatCurrency((linkedBill.total || 0) - (linkedBill.paid_amount || 0))}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>

            <GenerateBillDialog
                order={order as any}
                open={showBillDialog}
                onOpenChange={(open) => {
                    setShowBillDialog(open);
                    if (!open) {
                        // Refresh order/bill when dialog closes (in case bill was generated)
                        const fetchOrder = async () => {
                            const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
                            if (data) {
                                setOrder(prev => ({ ...prev, ...data }));
                                // trigger full refresh logic ideally, but this helps status update
                                window.location.reload();
                            }
                        };
                        fetchOrder();
                    }
                }}
            />
        </div>
    );
}
