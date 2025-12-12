'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function CreateBusinessPage() {
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const { data: business, error } = await supabase
                .from('businesses')
                .insert({
                    name,
                    city,
                    owner_id: user.id,
                    currency: 'INR',
                    is_verified: false
                })
                .select()
                .single();

            if (error) throw error;

            // Redirect to Shop creation with business ID
            router.push(`/onboarding/shop?businessId=${business.id}`);

        } catch (error) {
            console.error('Error creating business:', error);
            alert('Failed to create business. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Business Name
                </label>
                <div className="mt-1">
                    <Input
                        id="name"
                        name="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. My Awesome Store"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    Headquarters City
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

            <div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Create Business
                </Button>
            </div>
        </form>
    );
}
