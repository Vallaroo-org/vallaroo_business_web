'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { Order } from '@/lib/types';
import { toast } from 'sonner';

interface AddPaymentDialogProps {
    bill: Order;
    onPaymentAdded: () => void;
}

export function AddPaymentDialog({ bill, onPaymentAdded }: AddPaymentDialogProps) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('cash');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSave = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        const payAmount = Number(amount);
        const maxPayable = bill.total - (bill.paid_amount || 0);

        if (payAmount > maxPayable + 0.1) { // Tolerance
            toast.error(`Amount exceeds balance due (${maxPayable})`);
            return;
        }

        setLoading(true);

        try {
            // 1. Create Transaction
            const { error: txError } = await supabase.from('bill_transactions').insert({
                bill_id: bill.id,
                business_id: bill.business_id,
                shop_id: bill.shop_id,
                amount: payAmount,
                payment_method: method,
                note: note,
                recorded_at: new Date().toISOString(),
            });

            if (txError) throw txError;

            // 2. Update Bill Status
            const newPaid = (bill.paid_amount || 0) + payAmount;
            let newStatus = 'unpaid';
            if (newPaid >= bill.total - 0.1) newStatus = 'paid';
            else if (newPaid > 0) newStatus = 'partial';

            const { error: billError } = await supabase
                .from('bills')
                .update({
                    paid_amount: newPaid,
                    payment_status: newStatus
                })
                .eq('id', bill.id);

            if (billError) throw billError;

            toast.success('Payment recorded successfully');
            setOpen(false);
            setAmount('');
            setNote('');
            onPaymentAdded();

        } catch (error: any) {
            console.error('Error adding payment:', error);
            toast.error('Failed to add payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Payment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Payment</DialogTitle>
                    <DialogDescription>
                        Record a payment for Bill #{bill.bill_number}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                            Amount
                        </Label>
                        <Input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="col-span-3"
                            placeholder={`Max: ${bill.total - (bill.paid_amount || 0)}`}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="method" className="text-right">
                            Method
                        </Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="upi">UPI</SelectItem>
                                <SelectItem value="card">Card</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="note" className="text-right">
                            Note
                        </Label>
                        <Input
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="col-span-3"
                            placeholder="Optional"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
