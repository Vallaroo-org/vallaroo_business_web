'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, User, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

interface Customer {
    id: string;
    name: string;
    phone_number: string;
}

interface AddCustomerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (customer: Customer) => void;
    businessId: string;
}

export default function AddCustomerDialog({
    isOpen,
    onClose,
    onSuccess,
    businessId
}: AddCustomerDialogProps) {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted || !isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        const newErrors: Record<string, string> = {};
        if (!name.trim()) newErrors.name = 'Name is required';
        if (!phone.trim()) newErrors.phone = 'Phone Number is required';
        else if (!/^[0-9]{10}$/.test(phone.replace(/\D/g, ''))) newErrors.phone = 'Invalid phone number';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        const supabase = createClient();

        try {
            const { data, error } = await supabase
                .from('customers')
                .insert({
                    business_id: businessId,
                    name,
                    phone_number: phone,
                    address,
                    type: 'Individual' // Default type
                })
                .select()
                .single();

            if (error) throw error;

            onSuccess(data);
            onClose();
            // Reset form
            setName('');
            setPhone('');
            setAddress('');
            setErrors({});
        } catch (error) {
            console.error('Error creating customer:', error);
            setSubmitError('Failed to create customer');
        } finally {
            setLoading(false);
        }
    };

    const content = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add New Customer</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Customer Name"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                                }}
                                className={`pl-9 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                        </div>
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Phone Number"
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value);
                                    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                                }}
                                className={`pl-9 ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                type="tel"
                            />
                        </div>
                        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Address (Optional)</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {submitError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                            {submitError}
                        </div>
                    )}

                    <div className="pt-4 flex gap-3 justify-end">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Customer
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
