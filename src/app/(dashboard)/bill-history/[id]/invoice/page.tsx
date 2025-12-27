'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Order, BillTransaction } from '@/lib/types';
import { Loader2, Printer, Share2, ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBusiness } from '@/components/providers/business-provider';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
// import { useLanguage } from '@/contexts/language-context';
import { toast } from 'sonner';

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
                    .select('*, items:bill_items(*), transactions:bill_transactions(*)')
                    .eq('id', orderId)
                    .single();

                if (error) throw error;
                setOrder(data);
            } catch (error) {
                console.error('Error fetching bill for invoice:', error);
                toast.error('Invoice not found');
                router.push('/bill-history');
            } finally {
                setLoading(false);
            }
        };
        if (orderId) fetchOrder();
    }, [orderId, router, supabase]);

    useEffect(() => {
        if (order) {
            document.title = `Invoice #${order.bill_number}`;
        }
    }, [order]);

    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = `invoice-${order?.bill_number || 'bill'}`;
        window.print();
        document.title = originalTitle;
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Invoice #${order?.bill_number}`,
                    text: `Invoice from ${selectedBusiness?.name}`,
                    url: window.location.href,
                });
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                }
            }
        } else {
            toast.error('Sharing is not supported on this browser/device.');
        }
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;
    }

    if (!order) return null;

    return (
        <div className="min-h-screen bg-white text-black p-4 md:p-8 print:p-0 print:min-h-0 print:h-auto font-sans">
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
                        className="border-gray-300 bg-white text-gray-900 hover:bg-gray-100 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
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
                            <p>{new Date(order.issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(order.issued_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
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
                            {/* Only show phone if address is missing, to avoid duplication (since address often contains phone) */}
                            {!order.customer_address && order.customer_phone && <p className="text-sm text-gray-600">Phone: {order.customer_phone}</p>}

                            {order.customer_address && (
                                <div className="text-sm text-gray-600 mt-1">
                                    {order.customer_address.split(',').map((part, i) => (
                                        <div key={i}>{part.trim()}</div>
                                    ))}
                                </div>
                            )}
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
                                <td className="py-4 text-right text-sm text-gray-600">
                                    {formatCurrency(item.price)}
                                </td>
                                <td className="py-4 text-right text-sm font-medium text-gray-900">
                                    {formatCurrency(item.price * item.quantity)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals & QR Code Section */}
                <div className="flex flex-col md:flex-row justify-between items-start mt-8 gap-8">

                    {/* QR Code */}
                    <div className="w-full md:w-1/2">
                        {selectedShop?.upi_id && (order.total - (order.paid_amount || 0) > 0) && (
                            <div className="flex flex-col items-center md:items-start border p-4 rounded-lg bg-gray-50 max-w-[200px]">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                                        `upi://pay?pa=${selectedShop.upi_id}&pn=${encodeURIComponent(selectedShop.name)}&am=${(order.total - (order.paid_amount || 0)).toFixed(2)}&cu=INR`
                                    )}`}
                                    alt="Payment QR"
                                    className="w-24 h-24 mb-2 mix-blend-multiply"
                                />
                                <p className="text-xs font-semibold text-gray-900">Scan to Pay</p>
                                <p className="text-[10px] text-gray-500 break-all">{selectedShop.upi_id}</p>
                            </div>
                        )}
                        {!selectedShop?.upi_id && selectedShop?.qr_code_url && (
                            <div className="flex flex-col items-center md:items-start border p-4 rounded-lg bg-gray-50 max-w-[200px]">
                                <img src={selectedShop.qr_code_url} alt="Shop QR" className="w-24 h-24 mb-2" />
                                <p className="text-xs font-semibold text-gray-900">Scan to Pay</p>
                            </div>
                        )}
                    </div>

                    {/* Totals Summary */}
                    <div className="w-full md:w-1/2 space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Discount:</span>
                                <span>-{formatCurrency(order.discount)}</span>
                            </div>
                        )}
                        {order.delivery_charge && order.delivery_charge > 0 && (
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Delivery Charge:</span>
                                <span>{formatCurrency(order.delivery_charge)}</span>
                            </div>
                        )}

                        <div className="border-t border-gray-200 my-2"></div>

                        <div className="flex justify-between items-center text-yellow-600 font-bold">
                            <span className="text-base uppercase">Grand Total:</span>
                            <span className="text-xl">{formatCurrency(order.total)}</span>
                        </div>

                        <div className="flex justify-between text-sm mt-2">
                            <span className="text-gray-600">Payment Status:</span>
                            <span className={`font-semibold uppercase ${(order.payment_status || 'unpaid') === 'paid' ? 'text-green-600' :
                                (order.payment_status || 'unpaid') === 'partial' ? 'text-blue-600' : 'text-red-500'
                                }`}>
                                {order.payment_status || 'UNPAID'}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-600">Amount Paid:</span>
                            <span className="font-medium text-green-600">
                                {formatCurrency(order.paid_amount || 0)}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Balance Due:</span>
                            <span className="font-bold text-red-500">
                                {formatCurrency(order.total - (order.paid_amount || 0))}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                {order.transactions && order.transactions.length > 0 && (
                    <div className="mt-8 border-t border-gray-200 pt-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment History</h3>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                    <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Method</th>
                                    <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {order.transactions.map((txn: any) => (
                                    <tr key={txn.id}>
                                        <td className="py-2 text-sm text-gray-600">
                                            {new Date(txn.recorded_at).toLocaleString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="py-2 text-sm text-gray-600 uppercase">{txn.payment_method}</td>
                                        <td className="py-2 text-right text-sm font-medium text-gray-900">
                                            {formatCurrency(txn.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer Message */}
                <div className="mt-16 text-center text-sm text-gray-500">
                    <p className="font-medium text-gray-900 mb-1">Thank you for your business!</p>
                    <p className="text-xs">Payment due within 30 days. Please make checks payable to {selectedBusiness?.name}.</p>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center gap-4 text-xs text-gray-400">
                        <span>www.vallaroo.com</span>
                        <span>|</span>
                        <span>contact@vallaroo.com</span>
                    </div>
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
