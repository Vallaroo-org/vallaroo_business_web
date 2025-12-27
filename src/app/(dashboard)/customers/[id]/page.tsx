'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Customer } from '@/lib/types';
import { ArrowLeft, Loader2, Phone, MapPin, ReceiptText } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
// import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomerDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const customerId = params?.id as string;
    const supabase = createClient();

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('id', customerId)
                    .single();

                if (error) throw error;
                setCustomer(data);
            } catch (error) {
                console.error('Error fetching customer:', error);
                toast.error('Customer not found');
                router.push('/customers');
            } finally {
                setLoading(false);
            }
        };
        if (customerId) fetchCustomer();
    }, [customerId, router, supabase]);

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
    }

    if (!customer) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/customers" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{customer.name}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Customer Info Card */}
                <Card className="md:col-span-1 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">Contact Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center text-sm">
                            <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                            <span className="text-gray-900 dark:text-gray-200">{customer.phone_number}</span>
                        </div>
                        {customer.address && (
                            <div className="flex items-start text-sm">
                                <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2 mt-0.5" />
                                <span className="text-gray-900 dark:text-gray-200">{customer.address}</span>
                            </div>
                        )}
                        {customer.name_ml && (
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Malayalam Name</span>
                                <span className="text-sm font-medium font-malayalam text-gray-900 dark:text-gray-100">{customer.name_ml}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Transaction History Placeholder */}
                <Card className="md:col-span-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-lg">
                            No orders found for this customer.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
