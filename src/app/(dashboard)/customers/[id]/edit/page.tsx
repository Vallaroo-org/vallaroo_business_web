'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Customer } from '@/lib/types';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { z } from 'zod';

// Validation Schema
const customerSchema = z.object({
    name: z.string().min(1, 'Customer name is required').max(100, 'Name must be 100 characters or less'),
    name_ml: z.string().optional(),
    phone_number: z.string().min(1, 'Phone number is required').regex(/^[+]?[\d\s-]{10,15}$/, 'Please enter a valid phone number'),
    address: z.string().optional(),
});

type CustomerErrors = Partial<Record<keyof z.infer<typeof customerSchema>, string>>;

export default function EditCustomerPage() {
    const router = useRouter();
    const params = useParams();
    const customerId = params?.id as string;
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [errors, setErrors] = useState<CustomerErrors>({});

    const [formData, setFormData] = useState({
        name: '',
        name_ml: '',
        phone_number: '',
        address: '',
    });

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('id', customerId)
                    .single();

                if (error) throw error;

                setFormData({
                    name: data.name || '',
                    name_ml: data.name_ml || '',
                    phone_number: data.phone_number || '',
                    address: data.address || '',
                });
            } catch (error) {
                console.error('Error fetching customer:', error);
                toast.error('Customer not found');
                router.push('/customers');
            } finally {
                setPageLoading(false);
            }
        };

        if (customerId) fetchCustomer();
    }, [customerId, router, supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        const validation = customerSchema.safeParse(formData);
        if (!validation.success) {
            const newErrors: CustomerErrors = {};
            validation.error.issues.forEach((issue) => {
                if (issue.path[0]) {
                    newErrors[issue.path[0] as keyof CustomerErrors] = issue.message;
                }
            });
            setErrors(newErrors);
            toast.error('Please fix the errors in the form');
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            const { error } = await supabase
                .from('customers')
                .update({
                    name: formData.name,
                    name_ml: formData.name_ml || null,
                    phone_number: formData.phone_number,
                    address: formData.address || null,
                })
                .eq('id', customerId);

            if (error) throw error;

            toast.success('Customer updated successfully!');
            router.push('/customers');
            router.refresh();
        } catch (error: unknown) {
            console.error('Error updating customer:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Error: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name as keyof CustomerErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    if (pageLoading) {
        return (
            <div className="p-8 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
            <div className="flex items-center gap-3 sm:gap-4">
                <Link href="/customers" className="p-2 hover:bg-muted rounded-full transition-colors">
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </Link>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Edit Customer</h1>
            </div>

            <Card className="border-border bg-card">
                <CardContent className="p-4 sm:p-6">
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">
                                    Customer Name <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">Name (Malayalam)</label>
                                <Input
                                    name="name_ml"
                                    value={formData.name_ml}
                                    onChange={handleChange}
                                    placeholder="Optional"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">
                                    Phone Number <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    placeholder="+91 9876543210"
                                    className={errors.phone_number ? 'border-destructive focus-visible:ring-destructive' : ''}
                                />
                                {errors.phone_number && (
                                    <p className="text-xs text-destructive">{errors.phone_number}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">Address</label>
                                <Input
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Enter full address"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-border">
                            <Button variant="outline" type="button" onClick={() => router.back()} className="w-full sm:w-auto">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Update Customer
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
