'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    title: string;
    description: string;
    confirmPhrase: string;
}

export default function DeleteConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmPhrase
}: DeleteConfirmDialogProps) {
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // State reset is now handled by key prop in parent

    if (!mounted || !isOpen) return null;

    const handleConfirm = async () => {
        if (inputValue !== confirmPhrase) return;

        setLoading(true);
        try {
            await onConfirm();
        } catch (error) {
            console.error(error);
            setLoading(false); // Only stop loading on error, success might navigate away
        }
    };

    const content = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-md bg-background rounded-lg shadow-lg border border-border flex flex-col gap-4 p-6 animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        <h2 className="text-lg font-semibold">{title}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">
                        Type <span className="font-bold text-red-600 dark:text-red-400">{confirmPhrase}</span> to confirm.
                    </p>
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={`Type "${confirmPhrase}"`}
                        className="bg-muted/50"
                        autoFocus
                    />
                </div>

                <div className="flex justify-end gap-3 mt-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={inputValue !== confirmPhrase || loading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Delete Account
                    </Button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
