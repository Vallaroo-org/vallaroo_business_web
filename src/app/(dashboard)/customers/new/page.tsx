'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function NewCustomerPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        name_ml: '',
        phone_number: '',
        address: '',
        gstin: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Logic to resolve business/shop context (Same as Product)
            const { data: staffMember } = await supabase
                .from('staff_members')
                .select('business_id, shop_ids')
                .eq('user_id', user.id)
                .single();

            let finalBusinessId = staffMember?.business_id;
            let finalShopId = '';

            if (!finalBusinessId) {
                const { data: business } = await supabase.from('businesses').select('id').eq('user_id', user.id).single();
                if (business) finalBusinessId = business.id;
            }

            if (finalBusinessId) {
                const { data: shop } = await supabase.from('shops').select('id').eq('business_id', finalBusinessId).limit(1).single();
                if (shop) finalShopId = shop.id;
            }

            if (!finalBusinessId || !finalShopId) {
                toast.error("Could not determine Business or Shop context.");
                setLoading(false);
                return;
            }

            const { error } = await supabase.from('customers').insert({
                name: formData.name,
                name_ml: formData.name_ml || null,
                phone_number: formData.phone_number,
                address: formData.address || null,
                gstin: formData.gstin || null,
                business_id: finalBusinessId,
                shop_id: finalShopId,
                is_active: true,
            });

            if (error) throw error;

            router.push('/customers');
            router.refresh();
        } catch (error: unknown) {
            console.error('Error creating customer:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Error: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/customers" className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Add Customer</h1>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium mb-2">Customer Name *</label>
                                <Input
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium mb-2">Name (Malayalam)</label>
                                <Input
                                    name="name_ml"
                                    value={formData.name_ml}
                                    onChange={handleChange}
                                    placeholder="Optional"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                                <Input
                                    name="phone_number"
                                    required
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    placeholder="+91 9876543210"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium mb-2">Address</label>
                                <Input
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Enter full address"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium mb-2">GSTIN</label>
                                <Input
                                    name="gstin"
                                    value={formData.gstin}
                                    onChange={handleChange}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" type="button" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Customer
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
