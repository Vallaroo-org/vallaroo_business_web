'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ServiceCategory, Service } from '@/lib/types';
import { ArrowLeft, Loader2, Upload, X, Image as ImageIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useBusiness } from '@/components/providers/business-provider';
import { uploadToR2 } from '@/lib/r2-upload';
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

export default function EditServicePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const supabase = createClient();
    const { selectedBusiness, selectedShop } = useBusiness();

    // params.id is available, but wait, Next.js 13+ app dir params are async in some versions/configs?
    // Usually { params: { id: string } } works for page props.
    const serviceId = params.id;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
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
        is_active: true,
    });

    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const { publicUrl } = await uploadToR2(file, 'services');
            setImageUrl(publicUrl);
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setInitialLoading(true);
                // Fetch Categories
                const { data: catData } = await supabase
                    .from('service_categories')
                    .select('*')
                    .eq('is_active', true)
                    .order('name');
                if (catData) setCategories(catData);

                // Fetch Service
                const { data: service, error } = await supabase
                    .from('services')
                    .select('*')
                    .eq('id', serviceId)
                    .single();

                if (error) throw error;
                if (service) {
                    setFormData({
                        name: service.name,
                        name_ml: service.name_ml || '',
                        description: service.description || '',
                        description_ml: service.description_ml || '',
                        price: service.price.toString(),
                        price_type: service.price_type,
                        category_id: service.category_id || '',
                        is_active: service.is_active,
                    });
                    if (service.image_urls && service.image_urls.length > 0) {
                        setImageUrl(service.image_urls[0]);
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                router.push('/services');
            } finally {
                setInitialLoading(false);
            }
        };

        if (serviceId) {
            fetchData();
        }
    }, [supabase, serviceId, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBusiness || !selectedShop) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('services')
                .update({
                    category_id: formData.category_id || null,
                    name: formData.name,
                    name_ml: formData.name_ml || null,
                    description: formData.description || null,
                    description_ml: formData.description_ml || null,
                    price: parseFloat(formData.price) || 0,
                    price_type: formData.price_type,
                    image_urls: imageUrl ? [imageUrl] : [],
                    is_active: formData.is_active,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', serviceId);

            if (error) throw error;
            router.push('/services');
            router.refresh();
        } catch (error) {
            console.error('Error updating service:', error);
            toast.error('Failed to update service. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this service?')) return;
        setLoading(true);
        try {
            // We can check if we want soft delete or hard delete. Repository code showed delete().
            // Let's stick to simple delete for now or soft delete if 'deleted_at' exists.
            // Mobile app repo uses `deleteService` which calls `delete()`.
            // But services table might have constraints.
            // Let's try direct delete for now.
            const { error } = await supabase.from('services').delete().eq('id', serviceId);
            if (error) throw error;
            router.push('/services');
            router.refresh();
        } catch (error) {
            console.error('Error deleting service:', error);
            toast.error('Failed to delete service.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (initialLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/services">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Service</h1>
                        <p className="text-muted-foreground">Update service details</p>
                    </div>
                </div>
                <div>
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Service
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-card p-6 rounded-xl border shadow-sm">

                {/* Status Toggle or similar could go here */}
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="font-medium">Active (Visible to customers)</span>
                    </label>
                </div>

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
                    <div className="space-y-4">
                        <Label>Service Image</Label>

                        {imageUrl ? (
                            <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={imageUrl} alt="Service" className="w-full h-full object-contain" />
                                <button
                                    type="button"
                                    onClick={() => setImageUrl(null)}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-center rounded-lg border border-dashed border-gray-900/25 dark:border-gray-600 px-6 py-10 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className="text-center">
                                    {uploading ? (
                                        <Loader2 className="mx-auto h-12 w-12 text-gray-300 animate-spin" />
                                    ) : (
                                        <ImageIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                                    )}
                                    <div className="mt-4 flex text-sm leading-6 text-gray-600 dark:text-gray-400 justify-center">
                                        <label
                                            htmlFor="file-upload"
                                            className="relative cursor-pointer rounded-md bg-transparent font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                                        >
                                            <span>Upload a file</span>
                                            <input
                                                id="file-upload"
                                                name="file-upload"
                                                type="file"
                                                className="sr-only"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                            />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">PNG, JPG, GIF up to 5MB</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-4">
                    <Link href="/services">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Update Service
                    </Button>
                </div>
            </form>
        </div>
    );
}
