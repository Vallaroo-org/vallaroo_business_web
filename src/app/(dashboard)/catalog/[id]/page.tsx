'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ProductCategory } from '@/lib/types';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils'; // Assuming cn utility is available from previous steps

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params?.id as string;
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [categories, setCategories] = useState<ProductCategory[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        name_ml: '',
        price: '',
        mrp: '',
        stock: '',
        unit: 'pcs',
        category_id: '',
        description: '',
        min_stock_alert: '5',
        sku: '',
        is_active: true,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setFetching(true);
                const { data: catData } = await supabase.from('product_categories').select('*');
                if (catData) setCategories(catData);

                if (productId) {
                    const { data: product, error } = await supabase
                        .from('products')
                        .select('*')
                        .eq('id', productId)
                        .single();

                    if (error) throw error;
                    if (product) {
                        setFormData({
                            name: product.name,
                            name_ml: product.name_ml || '',
                            price: product.price.toString(),
                            mrp: product.mrp.toString(),
                            stock: product.stock.toString(),
                            unit: product.unit || 'pcs',
                            category_id: product.category_id || '',
                            description: product.description || '',
                            min_stock_alert: product.min_stock_alert.toString(),
                            sku: product.sku || '',
                            is_active: product.is_active ?? true,
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching product details:', error);
                alert('Could not load product details.');
                router.push('/catalog');
            } finally {
                setFetching(false);
            }
        };
        fetchData();
    }, [productId, router, supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.from('products').update({
                name: formData.name,
                name_ml: formData.name_ml || null,
                price: parseFloat(formData.price) || 0,
                mrp: parseFloat(formData.mrp) || 0,
                stock: parseFloat(formData.stock) || 0,
                unit: formData.unit,
                category_id: formData.category_id || null,
                description: formData.description || null,
                min_stock_alert: parseFloat(formData.min_stock_alert) || 0,
                sku: formData.sku || null,
                is_active: formData.is_active,
            }).eq('id', productId);

            if (error) throw error;

            router.push('/catalog');
            router.refresh();
        } catch (error: unknown) {
            console.error('Error updating product:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            alert(`Error: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (fetching) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/catalog" className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Active</span>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                        className={cn(
                            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                            formData.is_active ? "bg-indigo-600" : "bg-gray-200"
                        )}
                    >
                        <span className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            formData.is_active ? "translate-x-5" : "translate-x-0"
                        )} />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6 space-y-6">

                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">Product Name *</label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="name_ml" className="block text-sm font-medium leading-6 text-gray-900">Name (Malayalam)</label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="name_ml"
                                id="name_ml"
                                value={formData.name_ml}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="price" className="block text-sm font-medium leading-6 text-gray-900">Selling Price *</label>
                        <div className="mt-2 relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 sm:text-sm">₹</span>
                            </div>
                            <input
                                type="number"
                                name="price"
                                id="price"
                                required
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 pl-7 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="mrp" className="block text-sm font-medium leading-6 text-gray-900">MRP</label>
                        <div className="mt-2 relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 sm:text-sm">₹</span>
                            </div>
                            <input
                                type="number"
                                name="mrp"
                                id="mrp"
                                min="0"
                                step="0.01"
                                value={formData.mrp}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 pl-7 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="stock" className="block text-sm font-medium leading-6 text-gray-900">Current Stock *</label>
                        <div className="mt-2">
                            <input
                                type="number"
                                name="stock"
                                id="stock"
                                required
                                min="0"
                                step="any"
                                value={formData.stock}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="unit" className="block text-sm font-medium leading-6 text-gray-900">Unit</label>
                        <div className="mt-2">
                            <select
                                id="unit"
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            >
                                <option value="pcs">Pieces (pcs)</option>
                                <option value="kg">Kilogram (kg)</option>
                                <option value="g">Gram (g)</option>
                                <option value="l">Liter (l)</option>
                                <option value="ml">Milliliter (ml)</option>
                                <option value="m">Meter (m)</option>
                                <option value="box">Box</option>
                                <option value="packet">Packet</option>
                            </select>
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="category_id" className="block text-sm font-medium leading-6 text-gray-900">Category</label>
                        <div className="mt-2">
                            <select
                                id="category_id"
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">Description</label>
                        <div className="mt-2">
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                value={formData.description}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="sku" className="block text-sm font-medium leading-6 text-gray-900">SKU</label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="sku"
                                id="sku"
                                value={formData.sku}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="min_stock_alert" className="block text-sm font-medium leading-6 text-gray-900">Low Stock Alert Level</label>
                        <div className="mt-2">
                            <input
                                type="number"
                                name="min_stock_alert"
                                id="min_stock_alert"
                                min="0"
                                value={formData.min_stock_alert}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                </div>

                <div className="flex items-center justify-end gap-x-6 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => router.back()} className="text-sm font-semibold leading-6 text-gray-900">Cancel</button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
