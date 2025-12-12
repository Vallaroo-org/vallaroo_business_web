'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Business, Shop } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Building2, Store } from 'lucide-react';
import Link from 'next/link';
import { useBusiness } from '@/components/providers/business-provider';

export default function BusinessesPage() {
    const router = useRouter();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const { setBusiness, selectedBusiness, shops, setShop } = useBusiness();

    useEffect(() => {
        fetchBusinesses();
    }, [supabase, setBusiness]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchBusinesses = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Fetch owned businesses
            const { data: ownedBusinesses, error: ownedError } = await supabase
                .from('businesses')
                .select('*')
                .eq('owner_id', user.id);

            if (ownedError) throw ownedError;

            // Fetch businesses where user is staff
            const { data: staffData, error: staffError } = await supabase
                .from('staff_members')
                .select('business:businesses(*)')
                .eq('user_id', user.id);

            if (staffError) throw staffError;

            // Ensure staffData is an array of objects with a 'business' property
            const staffBusinesses = staffData?.map((item: { business: Business | Business[] | null }) => {
                if (!item.business) return null;
                // If 'business' is an array (e.g., from a join that returns multiple), take the first one
                return Array.isArray(item.business) ? item.business[0] : item.business;
            }).filter((b): b is Business => b !== null) || []; // Filter out nulls and assert type

            // Combine and deduplicate
            const allBusinesses = [...(ownedBusinesses || []), ...staffBusinesses];
            const unique = Array.from(new Map(allBusinesses.map(b => [b.id, b])).values());

            setBusinesses(unique);
        } catch (error: unknown) {
            console.error('Error fetching businesses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBusinessSelect = (business: Business) => {
        setBusiness(business);
        // Don't auto-redirect to '/shops' (which redirects back here).
        // Stay here so user can see shops or select one.
        // Or if we want to auto-select first shop? 
        // Logic in provider already tries to select first shop.
    };

    const handleShopSelect = (shop: Shop) => {
        setShop(shop);
        router.push('/');
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
    }

    if (!selectedBusiness) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Select Business</h1>
                        <p className="text-muted-foreground">Choose a business to manage.</p>
                    </div>
                    <Link href="/onboarding/business">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Business
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {businesses.map((business) => (
                        <Card
                            key={business.id}
                            className="cursor-pointer hover:border-primary transition-colors bg-card border-border"
                            onClick={() => handleBusinessSelect(business)}
                        >
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-base text-foreground">{business.name}</CardTitle>
                                    {business.city && <CardDescription className="text-muted-foreground">{business.city}</CardDescription>}
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Manage Access</h1>
                    <p className="text-muted-foreground">Select a shop or switch business.</p>
                </div>
            </div>

            {/* Current Business */}
            <div className="space-y-4">
                <h2 className="text-lg font-medium text-foreground">Current Business</h2>
                <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-foreground">{selectedBusiness.name}</CardTitle>
                                {/* TODO: Show actual role */}
                                <CardDescription className="text-muted-foreground">Active Business</CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => setBusiness(null)} className="dark:bg-zinc-800 dark:border-zinc-700">Change Business</Button>
                    </CardHeader>
                </Card>
            </div>

            {/* Shops List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-foreground">Shops</h2>
                    <Link href="/onboarding/shop">
                        <Button variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            New Shop
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shops.map((shop) => (
                        <Card
                            key={shop.id}
                            className="cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors bg-card border-border group"
                            onClick={() => handleShopSelect(shop)}
                        >
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                                    <Store className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-base text-foreground">{shop.name}</CardTitle>
                                    {shop.city && <CardDescription className="text-muted-foreground">{shop.city}</CardDescription>}
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                    {shops.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-muted/30 border border-dashed border-border rounded-lg">
                            <Store className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                            <h3 className="text-sm font-medium text-foreground">No shops found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Create a shop to start selling.</p>
                            <Link href="/onboarding/shop" className="mt-4 inline-block">
                                <Button size="sm">Create First Shop</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
