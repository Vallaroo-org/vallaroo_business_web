'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'destructive' | 'default';
}

export default function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default'
}: ConfirmationDialogProps) {
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted || !isOpen) return null;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const content = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-sm bg-background rounded-lg shadow-lg border border-border flex flex-col gap-4 p-6 animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex flex-col gap-2">
                    <div className={`flex items-center gap-2 ${variant === 'destructive' ? 'text-red-600' : 'text-foreground'}`}>
                        {variant === 'destructive' && <AlertTriangle className="w-5 h-5" />}
                        <h2 className="text-lg font-semibold">{title}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={handleConfirm}
                        disabled={loading}
                        className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
