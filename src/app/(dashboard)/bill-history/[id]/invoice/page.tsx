'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Order } from '@/lib/types';
import { Loader2, Printer, Share2, ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBusiness } from '@/components/providers/business-provider';
import Link from 'next/link';
// import { useLanguage } from '@/contexts/language-context';

export default function InvoicePage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params?.id as string;
    const supabase = createClient();
    const { selectedBusiness, selectedShop } = useBusiness();
    // const { t } = useLanguage();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data, error } = await supabase
                    .from('bills')
                    .select('*, items:bill_items(*)')
                    .eq('id', orderId)
                    .single();

                if (error) throw error;
                setOrder(data);
            } catch (error) {
                console.error('Error fetching bill for invoice:', error);
                alert('Invoice not found');
                router.push('/bill-history');
            } finally {
                setLoading(false);
            }
        };
        if (orderId) fetchOrder();
    }, [orderId, router, supabase]);

    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Invoice #${order?.bill_number}`,
                    text: `Invoice from ${selectedBusiness?.name}`,
                    url: window.location.href,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            alert('Sharing is not supported on this browser/device.');
        }
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;
    }

    if (!order) return null;

    return (
        <div className="min-h-screen bg-white text-black p-4 md:p-8 print:p-0 font-sans">
            {/* Toolbar - Hidden when printing */}
            <div className="max-w-3xl mx-auto mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                <Link href={`/bill-history/${orderId}`} className="flex items-center text-gray-600 hover:text-black">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Details
                </Link>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleShare}
                        className="border-gray-200 text-gray-900 hover:bg-gray-100 hover:text-black"
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print / Save PDF
                    </Button>
                </div>
            </div>

            {/* Invoice Container */}
            <div className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-sm print:border-none print:shadow-none p-8 md:p-12 print:p-0" id="invoice-content">

                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900 mb-1">{selectedBusiness?.name}</h1>
                        <p className="text-sm text-gray-500">{selectedShop?.name}</p>
                        {selectedShop?.address_line1 && <p className="text-sm text-gray-500 mt-1">{selectedShop.address_line1}</p>}
                        {selectedShop?.city && <p className="text-sm text-gray-500">{selectedShop.city}</p>}
                        {selectedShop?.phone_number && <p className="text-sm text-gray-500 mt-1">Phone: {selectedShop.phone_number}</p>}
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-light text-gray-400 uppercase tracking-widest mb-2">Invoice</h2>
                        <div className="text-sm text-gray-600">
                            <p className="font-semibold">#{order.bill_number}</p>
                            <p>{new Date(order.issued_at).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(order.issued_at).toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 my-8"></div>

                {/* Bill To */}
                <div className="mb-8">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
                    {order.customer_name ? (
                        <>
                            <p className="font-semibold text-gray-900">{order.customer_name}</p>
                            {order.customer_phone && <p className="text-sm text-gray-600">Phone: {order.customer_phone}</p>}
                            {order.customer_address && <p className="text-sm text-gray-600 max-w-xs">{order.customer_address}</p>}
                        </>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Walking Customer</p>
                    )}
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-gray-100">
                            <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                            <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {order.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-4 text-sm text-gray-900">
                                    <div className="font-medium">{item.name}</div>
                                    {item.name_ml && <div className="text-xs text-gray-400">{item.name_ml}</div>}
                                </td>
                                <td className="py-4 text-right text-sm text-gray-600">{item.quantity} {item.unit}</td>
                                <td className="py-4 text-right text-sm text-gray-600">₹{item.price.toFixed(2)}</td>
                                <td className="py-4 text-right text-sm font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-full sm:w-1/2 space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span>₹{order.subtotal.toFixed(2)}</span>
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Discount</span>
                                <span>- ₹{order.discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                            <span className="text-base font-bold text-gray-900">Total</span>
                            <span className="text-xl font-bold text-indigo-600">₹{order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Message */}
                <div className="mt-16 text-center text-sm text-gray-500">
                    <p>Thank you for your business!</p>
                    <p className="text-xs mt-1">Generated by Vallaroo</p>
                </div>

            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page { margin: 0; }
                    body { 
                        background: white; 
                        -webkit-print-color-adjust: exact; 
                    }
                    div[class*="min-h-screen"] {
                        padding: 0;
                    }
                    #invoice-content {
                        border: none;
                        box-shadow: none;
                        padding: 2cm;
                        max-width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
