'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ServiceCategory } from '@/lib/types';
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { useBusiness } from '@/components/providers/business-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function NewServicePage() {
    const router = useRouter();
    const supabase = createClient();
    const { selectedBusiness, selectedShop } = useBusiness();

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        name_ml: '',
        description: '',
        description_ml: '',
        price: '',
        price_type: 'FIXED', // 'FIXED' | 'STARTING_FROM'
        category_id: '',
        image_url: ''
    });

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase
                .from('service_categories')
                .select('*')
                .eq('is_active', true)
                .order('name');
            if (data) setCategories(data);
        };
        fetchCategories();
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBusiness || !selectedShop) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('services').insert({
                business_id: selectedBusiness.id,
                shop_id: selectedShop.id,
                category_id: formData.category_id || null,
                name: formData.name,
                name_ml: formData.name_ml || null,
                description: formData.description || null,
                description_ml: formData.description_ml || null,
                price: parseFloat(formData.price) || 0,
                price_type: formData.price_type,
                image_urls: formData.image_url ? [formData.image_url] : [],
                is_active: true
            });

            if (error) throw error;
            router.push('/services');
            router.refresh();
        } catch (error) {
            console.error('Error creating service:', error);
            alert('Failed to create service. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="max-w-2xl mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/services">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Add New Service</h1>
                    <p className="text-muted-foreground">Create a new service offering for your shop</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-card p-6 rounded-xl border shadow-sm">

                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Service Name (English) *</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g. Hair Cut"
                                required
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name_ml">Service Name (Malayalam)</Label>
                            <Input
                                id="name_ml"
                                name="name_ml"
                                placeholder="e.g. ഹെയർ കട്ട്"
                                value={formData.name_ml}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select
                            value={formData.category_id}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, category_id: val }))}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (English)</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Short description of the service..."
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description_ml">Description (Malayalam)</Label>
                            <Textarea
                                id="description_ml"
                                name="description_ml"
                                placeholder="വിവരണം..."
                                value={formData.description_ml}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Pricing</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (₹) *</Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                min="0"
                                placeholder="0.00"
                                required
                                value={formData.price}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Price Type</Label>
                            <div className="flex items-center gap-4 pt-2">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="radio"
                                        name="price_type"
                                        value="FIXED"
                                        checked={formData.price_type === 'FIXED'}
                                        onChange={(e) => setFormData(prev => ({ ...prev, price_type: e.target.value }))}
                                        className="w-4 h-4 text-primary"
                                    />
                                    Fixed Price
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="radio"
                                        name="price_type"
                                        value="STARTING_FROM"
                                        checked={formData.price_type === 'STARTING_FROM'}
                                        onChange={(e) => setFormData(prev => ({ ...prev, price_type: e.target.value }))}
                                        className="w-4 h-4 text-primary"
                                    />
                                    Starting From
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Media */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Media</h3>
                    <div className="space-y-2">
                        <Label htmlFor="image_url">Image URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="image_url"
                                name="image_url"
                                placeholder="https://..."
                                value={formData.image_url}
                                onChange={handleChange}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            For MVP, please provide a direct image link. Upload functionality coming soon.
                        </p>
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-4">
                    <Link href="/services">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create Service
                    </Button>
                </div>
            </form>
        </div>
    );
}
