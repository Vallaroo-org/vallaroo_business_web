'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Service } from '@/lib/types';
import Link from 'next/link';
import { Plus, Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBusiness } from '@/components/providers/business-provider';

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { selectedShop } = useBusiness();
    const supabase = createClient();

    const fetchServices = useCallback(async () => {
        if (!selectedShop) return;

        try {
            setLoading(true);
            let query = supabase
                .from('services')
                .select(`
                    *,
                    category:service_categories(name)
                `)
                .eq('shop_id', selectedShop.id)
                .order('created_at', { ascending: false });

            if (searchTerm) {
                query = query.ilike('name', `%${searchTerm}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedShop, searchTerm, supabase]);

    useEffect(() => {
        if (selectedShop) {
            fetchServices();
        }
    }, [selectedShop, fetchServices]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (selectedShop) fetchServices();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedShop, fetchServices]);

    if (!selectedShop) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <p className="text-muted-foreground">Please select a shop to manage services.</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Services</h1>
                    <p className="text-muted-foreground">Manage your shop's service offerings</p>
                </div>
                <Link href="/services/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Service
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search services..."
                        className="pl-9 pr-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        maxLength={50}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {loading && services.length === 0 ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : services.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                    <p className="text-muted-foreground mb-4">No services found.</p>
                    <Link href="/services/new">
                        <Button variant="outline">Create your first service</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {services.map((service) => (
                        <div key={service.id} className="group bg-card border rounded-xl overflow-hidden hover:shadow-md transition-all">
                            <div className="aspect-video bg-muted relative">
                                {service.image_urls?.[0] ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={service.image_urls[0]}
                                        alt={service.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/50">
                                        No Image
                                    </div>
                                )}
                                {!service.is_active && (
                                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                                        <span className="px-2 py-1 bg-background/80 text-muted-foreground text-xs font-medium rounded-full border">
                                            Inactive
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-lg line-clamp-1" title={service.name}>{service.name}</h3>
                                    <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">
                                        {/* @ts-ignore - Supabase join returns category object */}
                                        {service.category?.name || 'Uncategorized'}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5em]">
                                    {service.description || 'No description'}
                                </p>
                                <div className="flex items-center justify-between mt-2 pt-3 border-t">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Price</span>
                                        <span className="font-bold">
                                            ₹{service.price}
                                            {service.price_type === 'STARTING_FROM' && <span className="text-xs font-normal text-muted-foreground ml-1">(starts from)</span>}
                                        </span>
                                    </div>
                                    {/* Future: Edit Button */}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
