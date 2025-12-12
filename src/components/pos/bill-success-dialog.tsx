'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, MessageCircle, FileText, Share2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Bill {
    id: string;
    bill_number: string;
    total: number;
    customer_name: string;
    customer_phone?: string;
}

interface BillSuccessDialogProps {
    isOpen: boolean;
    onClose: () => void;
    bill: Bill | null;
}

export default function BillSuccessDialog({
    isOpen,
    onClose,
    bill
}: BillSuccessDialogProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted || !isOpen || !bill) return null;

    const handleWhatsAppShare = () => {
        if (!bill.customer_phone) return;
        const message = `Hi ${bill.customer_name}, here is your bill #${bill.bill_number} from our shop. Total Amount: ₹${bill.total}. Thank you for shopping with us!`;
        const url = `https://wa.me/${bill.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleViewInvoice = () => {
        window.open(`/bill-history/${bill.id}/invoice`, '_blank');
    };

    const content = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Success Animation Area */}
                <div className="flex flex-col items-center justify-center pt-8 pb-6 bg-green-50 dark:bg-green-900/10 border-b border-green-100 dark:border-green-900/20">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Payment Successful!</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Bill #{bill.bill_number}</p>
                    <div className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
                        ₹{bill.total.toFixed(2)}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 space-y-3">
                    {bill.customer_phone && (
                        <Button
                            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
                            onClick={handleWhatsAppShare}
                        >
                            <MessageCircle className="w-5 h-5 mr-2" />
                            Say Hi on WhatsApp
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleViewInvoice}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        View / Print Invoice
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={onClose}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Close & New Bill
                    </Button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
