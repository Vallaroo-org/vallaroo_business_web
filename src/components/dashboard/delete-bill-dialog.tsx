'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteBillDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    billId: string;
    billNumber: string;
    onSuccess: () => void;
}

export default function DeleteBillDialog({
    open,
    onOpenChange,
    billId,
    billNumber,
    onSuccess
}: DeleteBillDialogProps) {
    const [confirmText, setConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);
    const supabase = createClient();

    const handleDelete = async () => {
        if (confirmText !== 'DELETE') return;

        setDeleting(true);
        try {
            const { error } = await supabase
                .from('bills')
                .delete()
                .eq('id', billId);

            if (error) throw error;

            toast.success('Bill deleted successfully');
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error deleting bill:', error);
            toast.error(error.message || 'Failed to delete bill');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-red-100 dark:bg-red-900/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <DialogTitle className="text-center">Delete Bill #{billNumber}?</DialogTitle>
                    <DialogDescription className="text-center space-y-2">
                        <span className="block text-red-600 font-medium">
                            Warning: This action cannot be undone.
                        </span>
                        <span>
                            This will permanently delete the bill and its associated records.
                            To confirm, please type <span className="font-bold text-foreground">DELETE</span> below.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Type DELETE to confirm"
                        className="text-center tracking-widest uppercase"
                        autoFocus
                    />
                </div>

                <DialogFooter className="sm:justify-center">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={deleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={confirmText !== 'DELETE' || deleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {deleting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete Bill'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
