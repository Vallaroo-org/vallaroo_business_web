'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Store, Clock, MapPin, Truck, ShoppingBag, PlusCircle, CheckCircle2 } from 'lucide-react';
import { createShopAction } from '@/app/actions/onboarding';
import { createClient } from '@/lib/supabase/client';

// Simple select component since we don't have a complex one in UI kit yet or want to keep it simple
function CategorySelect({
    value,
    onChange,
    categories
}: {
    value: string;
    onChange: (val: string) => void;
    categories: any[];
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
            <option value="" disabled>Select a category</option>
            {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.nameMl ? `(${cat.nameMl})` : ''}
                </option>
            ))}
            <option value="add_new">+ Add New Category</option>
        </select>
    );
}

function CreateShopForm() {
    const searchParams = useSearchParams();
    const businessId = searchParams.get('businessId');
    const [loading, setLoading] = useState(false);
    const [showMalayalam, setShowMalayalam] = useState(false);

    // Data Loading
    const [categories, setCategories] = useState<any[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        nameMl: '',
        address: '',
        addressMl: '',
        city: '',
        cityMl: '',
        categoryId: '',
        openingTime: '',
        closingTime: '',
        deliveryAvailable: false,
        takeawayAvailable: false
    });

    useEffect(() => {
        async function fetchCategories() {
            const supabase = createClient();
            const { data, error } = await supabase.from('shop_categories').select('*');
            if (data) {
                setCategories(data);
            }
            setCategoriesLoading(false);
        }
        fetchCategories();
    }, []);

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessId) {
            alert('Business ID missing');
            return;
        }

        if (formData.categoryId === 'add_new') {
            alert('Please select a valid category or implement new category creation.');
            // TODO: Implement Add New Category dialog if needed, for now block
            return;
        }

        setLoading(true);

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (typeof value === 'boolean') {
                    if (value) data.append(key, 'on');
                } else {
                    data.append(key, value);
                }
            });

            const result = await createShopAction(businessId, data);

            if (result.error) {
                alert(result.error);
                return;
            }

            // Force refetch and redirect
            window.location.href = '/';

        } catch (error) {
            console.error('Error creating shop:', error);
            alert('Failed to create shop');
        } finally {
            setLoading(false);
        }
    };

    if (!businessId) {
        return <div className="text-center p-8 text-red-500">Error: No Business ID provided. Please go back.</div>;
    }

    return (
        <Card className="max-w-2xl mx-auto p-6 md:p-8 my-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold leading-6 text-gray-900">Create your first Shop</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Add details for your primary location.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                    <button
                        type="button"
                        onClick={() => setShowMalayalam(false)}
                        className={`text-xs font-bold px-2 py-1 rounded transition-colors ${!showMalayalam ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        ENGLISH
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowMalayalam(true)}
                        className={`text-xs font-bold px-2 py-1 rounded transition-colors ${showMalayalam ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        MALAYALAM
                    </button>
                </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Name */}
                <div>
                    <label className="text-sm font-medium mb-1.5 block">
                        Shop Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Store className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            className="pl-9"
                            required
                            value={showMalayalam ? formData.nameMl : formData.name}
                            onChange={(e) => updateField(showMalayalam ? 'nameMl' : 'name', e.target.value)}
                            placeholder={showMalayalam ? "ഷോപ്പിന്റെ പേര്" : "e.g. MG Road Branch"}
                        />
                    </div>
                </div>

                {/* Address */}
                <div>
                    <label className="text-sm font-medium mb-1.5 block">
                        Address {showMalayalam && '(Malayalam)'}
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            className="pl-9"
                            value={showMalayalam ? formData.addressMl : formData.address}
                            onChange={(e) => updateField(showMalayalam ? 'addressMl' : 'address', e.target.value)}
                            placeholder={showMalayalam ? "വിലാസം" : "Street, Building, etc."}
                        />
                    </div>
                </div>

                {/* City */}
                <div>
                    <label className="text-sm font-medium mb-1.5 block">
                        City <span className="text-red-500">*</span>
                    </label>
                    <Input
                        required
                        value={showMalayalam ? formData.cityMl : formData.city}
                        onChange={(e) => updateField(showMalayalam ? 'cityMl' : 'city', e.target.value)}
                        placeholder="e.g. Kochi"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="text-sm font-medium mb-1.5 block">
                        Category
                    </label>
                    {categoriesLoading ? (
                        <div className="h-10 w-full animate-pulse bg-gray-100 rounded-md" />
                    ) : (
                        <CategorySelect
                            value={formData.categoryId}
                            onChange={(val) => updateField('categoryId', val)}
                            categories={categories}
                        />
                    )}
                </div>

                {/* Timings */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Opening Time</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                type="time"
                                className="pl-9"
                                value={formData.openingTime}
                                onChange={(e) => updateField('openingTime', e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Closing Time</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                type="time"
                                className="pl-9"
                                value={formData.closingTime}
                                onChange={(e) => updateField('closingTime', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4 pt-2">
                    <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-600"
                            checked={formData.deliveryAvailable}
                            onChange={(e) => updateField('deliveryAvailable', e.target.checked)}
                        />
                        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                            <Truck className="h-4 w-4 text-gray-500" />
                            Delivery Available
                        </div>
                    </label>

                    <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-600"
                            checked={formData.takeawayAvailable}
                            onChange={(e) => updateField('takeawayAvailable', e.target.checked)}
                        />
                        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                            <ShoppingBag className="h-4 w-4 text-gray-500" />
                            Takeaway / Booking Available
                        </div>
                    </label>
                </div>

                <div className="pt-4">
                    <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Create Shop & Get Started
                    </Button>
                </div>
            </form>
        </Card>
    );
}

export default function CreateShopPage() {
    return (
        <div className="min-h-screen bg-gray-50/50 py-8">
            <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>}>
                <CreateShopForm />
            </Suspense>
        </div>
    );
}
