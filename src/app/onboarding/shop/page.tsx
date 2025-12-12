'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

import { Suspense } from 'react';

function CreateShopForm() {
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [openingTime, setOpeningTime] = useState('');
    const [closingTime, setClosingTime] = useState('');
    const [deliveryAvailable, setDeliveryAvailable] = useState(false);
    const [takeawayAvailable, setTakeawayAvailable] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const businessId = searchParams.get('businessId');
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessId) {
            alert('Business ID missing');
            return;
        }
        setLoading(true);

        try {
            const { error } = await supabase
                .from('shops')
                .insert({
                    business_id: businessId,
                    name,
                    city,
                    opening_time: openingTime || null,
                    closing_time: closingTime || null,
                    delivery_available: deliveryAvailable,
                    takeaway_available: takeawayAvailable,
                    is_verified: false,
                    is_hidden: false
                });

            if (error) throw error;

            // Force a reload or redirect to dashboard to trigger context refresh
            // Since context runs on mount/load, a full navigation to / should restart it
            window.location.href = '/';

        } catch (error) {
            console.error('Error creating shop:', error);
            alert('Failed to create shop');
        } finally {
            setLoading(false);
        }
    };

    if (!businessId) {
        return <div>Error: No Business ID provided. Please go back.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Create your first Shop</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Every business needs at least one shop or location.
                </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Shop Name
                    </label>
                    <div className="mt-1">
                        <Input
                            id="name"
                            name="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. MG Road Branch"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        City
                    </label>
                    <div className="mt-1">
                        <Input
                            id="city"
                            name="city"
                            required
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="e.g. Kochi"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="openingTime" className="block text-sm font-medium text-gray-700">Opening Time</label>
                        <div className="mt-1">
                            <Input
                                id="openingTime"
                                type="time"
                                value={openingTime}
                                onChange={(e) => setOpeningTime(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="closingTime" className="block text-sm font-medium text-gray-700">Closing Time</label>
                        <div className="mt-1">
                            <Input
                                id="closingTime"
                                type="time"
                                value={closingTime}
                                onChange={(e) => setClosingTime(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center">
                        <input
                            id="deliveryAvailable"
                            name="deliveryAvailable"
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked={deliveryAvailable}
                            onChange={(e) => setDeliveryAvailable(e.target.checked)}
                        />
                        <label htmlFor="deliveryAvailable" className="ml-2 block text-sm text-gray-900">
                            Delivery Available
                        </label>
                    </div>
                    <div className="flex items-center">
                        <input
                            id="takeawayAvailable"
                            name="takeawayAvailable"
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked={takeawayAvailable}
                            onChange={(e) => setTakeawayAvailable(e.target.checked)}
                        />
                        <label htmlFor="takeawayAvailable" className="ml-2 block text-sm text-gray-900">
                            Takeaway / Booking Available
                        </label>
                    </div>
                </div>

                <div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Create Shop & Get Started
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default function CreateShopPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
            <CreateShopForm />
        </Suspense>
    );
}
