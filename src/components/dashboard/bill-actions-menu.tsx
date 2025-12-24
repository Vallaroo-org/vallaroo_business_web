'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    MoreVertical,
    Eye,
    Trash2,
    Share2,
    MessageCircle,
    Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { Order } from '@/lib/types';
import DeleteBillDialog from './delete-bill-dialog';

interface BillActionsMenuProps {
    bill: Order;
    onDeleteSuccess?: () => void;
    currentBusinessName?: string;
}

export default function BillActionsMenu({
    bill,
    onDeleteSuccess,
    currentBusinessName
}: BillActionsMenuProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Invoice #${bill.bill_number}`,
                    text: `Invoice from ${currentBusinessName || 'Vallaroo'}`,
                    url: `${window.location.origin}/bill-history/${bill.id}/invoice`,
                });
            } catch (error: any) {
                if (error.name !== 'AbortError') console.error('Share failed:', error);
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(`${window.location.origin}/bill-history/${bill.id}/invoice`);
            toast.success('Invoice URL copied to clipboard');
        }
    };

    const handleSayHi = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!bill.customer_phone) {
            toast.error('No phone number available for this customer');
            return;
        }

        // Basic formatting for Indian numbers
        let phone = bill.customer_phone.replace(/[^0-9]/g, '');
        if (phone.length === 10) phone = '91' + phone;

        const customerName = bill.customer_name || 'Customer';
        const text = encodeURIComponent(`Hi ${customerName}, here is your invoice for bill #${bill.bill_number}: ${window.location.origin}/bill-history/${bill.id}/invoice`);
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link href={`/bill-history/${bill.id}/invoice`} className="cursor-pointer flex items-center">
                            <Eye className="mr-2 h-4 w-4" />
                            Preview Bill
                        </Link>
                    </DropdownMenuItem>

                    {/* Only show Edit if NOT fully paid or strictly per requirement. 
                        For now enabling it as requested 'Implement Edit Bill' */}
                    <DropdownMenuItem asChild>
                        <Link href={`/new-bill?edit=${bill.id}`} className="cursor-pointer flex items-center">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Bill
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteDialog(true);
                        }}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10 cursor-pointer"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Bill
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Invoice
                    </DropdownMenuItem>

                    {bill.customer_phone && (
                        <DropdownMenuItem onClick={handleSayHi} className="cursor-pointer">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Say Hi to {bill.customer_name || 'Customer'}
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <DeleteBillDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                billId={bill.id}
                billNumber={bill.bill_number}
                onSuccess={() => {
                    if (onDeleteSuccess) onDeleteSuccess();
                    // If we are on details page, we might want to redirect. 
                    // The caller should handle this via onDeleteSuccess usually, 
                    // or we check path. But keeping it simple.
                }}
            />
        </>
    );
}
