'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Product, ProductCategory } from '@/lib/types';
import { ArrowLeft, Loader2 } from 'lucide-react'; // Save is used in button
import Link from 'next/link';
import { GLOBAL_CATEGORIES_HIERARCHY } from '@/lib/constants';

import { useBusiness } from '@/hooks/use-business';
import { uploadToR2 } from '@/lib/r2-upload';
import { Camera, Image as ImageIcon, X } from 'lucide-react'; // Add icons
import { toast } from 'sonner';
import { z } from 'zod';

// Validation Schema
const productSchema = z.object({
    name: z.string().min(1, 'Product name is required').max(200, 'Name must be 200 characters or less'),
    price: z.number().min(0, 'Selling price must be 0 or greater'),
    stock: z.number().min(0, 'Stock must be 0 or greater'),
});

type ProductErrors = Partial<Record<'name' | 'price' | 'stock', string>>;

export default function NewProductPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const { selectedBusiness, selectedShop, isLoading: contextLoading } = useBusiness();

    // Form State
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '',
        price: 0,
        stock: 0,
        description: '',
        category_id: '',
        global_category_id: '',
        global_sub_category_id: '',
        unit: 'pcs',
        name_ml: '',
        mrp: 0,
        min_stock_alert: 5,
        sku: '',
        cost_price: 0,
        brand_name: '',
        barcode: '',
        manufacturing_date: '',
        expiry_date: '',
        // We'll handle variants as a separate simple string for now to match mobile "Size"
        // variant_size: '' (Not in Product type directly, will handle separately or cast)
    });
    const [variantSize, setVariantSize] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState<ProductErrors>({});

    const [globalCategories, setGlobalCategories] = useState<ProductCategory[]>([]);
    const [subCategories, setSubCategories] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        if (!contextLoading && selectedBusiness) {
            fetchCategories();
        }
    }, [contextLoading, selectedBusiness]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchCategories = async () => {
        if (!selectedBusiness) return;

        // Fetch Global Categories (repurposed product_categories)
        const { data } = await supabase
            .from('product_categories')
            .select('*')
            .order('name');

        if (data) {
            setCategories(data);
            setGlobalCategories(data);
        }
    };

    const fetchSubCategories = async (categoryId: string) => {
        const { data } = await supabase
            .from('product_sub_categories')
            .select('id, name')
            .eq('category_id', categoryId)
            .order('name');

        setSubCategories(data || []);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const { publicUrl } = await uploadToR2(file, 'products');
            setImageUrl(publicUrl);
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        const validation = productSchema.safeParse({
            name: formData.name,
            price: Number(formData.price) || 0,
            stock: Number(formData.stock) || 0,
        });

        if (!validation.success) {
            const newErrors: ProductErrors = {};
            validation.error.issues.forEach((issue) => {
                if (issue.path[0]) {
                    newErrors[issue.path[0] as keyof ProductErrors] = issue.message;
                }
            });
            setErrors(newErrors);
            toast.error('Please fix the errors in the form');
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            if (!selectedBusiness || !selectedShop) {
                toast.error("Context missing. Please select a business and shop.");
                return;
            }

            const { error } = await supabase.from('products').insert({
                name: formData.name,
                name_ml: formData.name_ml || null,
                price: formData.price || 0,
                mrp: formData.mrp || 0,
                stock: formData.stock || 0,
                unit: formData.unit,
                category_id: null, // Legacy field not used anymore
                // We map global_category_id to the same as category_id if chosen? 
                // Or user chooses distinct fields?
                // Save the explicit fields.
                global_category_id: formData.global_category_id || null,
                global_sub_category_id: formData.global_sub_category_id || null,

                description: formData.description || null,
                min_stock_alert: formData.min_stock_alert || 0,
                sku: formData.sku || null,

                cost_price: formData.cost_price || 0,
                brand_name: formData.brand_name || null,
                barcode: formData.barcode || null,
                manufacturing_date: formData.manufacturing_date || null,
                expiry_date: formData.expiry_date || null,
                image_urls: imageUrl ? [imageUrl] : null,
                variants: variantSize ? [{ size: variantSize }] : null,

                business_id: selectedBusiness.id,
                shop_id: selectedShop.id,
                is_active: true,
            });

            if (error) throw error;

            toast.success('Product created successfully!');
            router.push('/catalog');
            router.refresh();
        } catch (error: unknown) {
            console.error('Error creating product:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Error: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name as keyof ProductErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/catalog" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Product</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700 sm:rounded-xl p-6 space-y-6">

                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100 mb-2">Product Image</label>

                        {imageUrl ? (
                            <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={imageUrl} alt="Product" className="w-full h-full object-contain" />
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

                    <div className="sm:col-span-2">
                        <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                            Product Name <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${errors.name ? 'ring-red-500' : 'ring-gray-300 dark:ring-gray-700'}`}
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                            )}
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="name_ml" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Name (Malayalam)</label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="name_ml"
                                id="name_ml"
                                value={formData.name_ml || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="price" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                            Selling Price <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2 relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">₹</span>
                            </div>
                            <input
                                type="number"
                                name="price"
                                id="price"
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={handleChange}
                                className={`block w-full rounded-md border-0 py-1.5 pl-7 text-gray-900 dark:text-white dark:bg-gray-900 ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${errors.price ? 'ring-red-500' : 'ring-gray-300 dark:ring-gray-700'}`}
                            />
                        </div>
                        {errors.price && (
                            <p className="mt-1 text-xs text-red-500">{errors.price}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="mrp" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">MRP</label>
                        <div className="mt-2 relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">₹</span>
                            </div>
                            <input
                                type="number"
                                name="mrp"
                                id="mrp"
                                min="0"
                                step="0.01"
                                value={formData.mrp}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 pl-7 text-gray-900 dark:text-white dark:bg-gray-900 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="stock" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                            Current Stock <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                            <input
                                type="number"
                                name="stock"
                                id="stock"
                                min="0"
                                step="any"
                                value={formData.stock}
                                onChange={handleChange}
                                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${errors.stock ? 'ring-red-500' : 'ring-gray-300 dark:ring-gray-700'}`}
                            />
                            {errors.stock && (
                                <p className="mt-1 text-xs text-red-500">{errors.stock}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="unit" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Unit</label>
                        <div className="mt-2">
                            <select
                                id="unit"
                                name="unit"
                                value={formData.unit || 'pcs'}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
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

                    {/* Removed Shop Category Field as per request */}

                    <div className="sm:col-span-2">
                        <label htmlFor="global_category_id" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Global Category</label>
                        <div className="mt-2">
                            <select
                                id="global_category_id"
                                name="global_category_id"
                                value={formData.global_category_id || ''}
                                onChange={(e) => {
                                    handleChange(e);
                                    fetchSubCategories(e.target.value);
                                    setFormData(prev => ({ ...prev, global_sub_category_id: '' })); // Reset sub
                                }}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            >
                                <option value="">Select a global category</option>
                                {globalCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Helps customers find your product across Vallaroo.</p>
                        </div>
                    </div>

                    {formData.global_category_id && (
                        <div className="sm:col-span-2">
                            <label htmlFor="global_sub_category_id" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Global Sub-Category</label>
                            <div className="mt-2">
                                <select
                                    id="global_sub_category_id"
                                    name="global_sub_category_id"
                                    value={formData.global_sub_category_id || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                >
                                    <option value="">Select a sub-category</option>
                                    {subCategories.map((sub) => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="sm:col-span-2">
                        <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Description</label>
                        <div className="mt-2">
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                value={formData.description || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="sku" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">SKU</label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="sku"
                                id="sku"
                                value={formData.sku || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="min_stock_alert" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Low Stock Alert Level</label>
                        <div className="mt-2">
                            <input
                                type="number"
                                name="min_stock_alert"
                                id="min_stock_alert"
                                min="0"
                                value={formData.min_stock_alert}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="cost_price" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Cost Price</label>
                        <div className="mt-2 relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">₹</span>
                            </div>
                            <input
                                type="number"
                                name="cost_price"
                                id="cost_price"
                                min="0"
                                step="0.01"
                                value={formData.cost_price || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 pl-7 text-gray-900 dark:text-white dark:bg-gray-900 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2 border-t border-gray-100 dark:border-gray-700 pt-6 mt-2">
                        <h3 className="text-base font-semibold leading-7 text-gray-900 dark:text-white mb-4">Additional Details</h3>
                    </div>

                    <div>
                        <label htmlFor="brand_name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Brand Name</label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="brand_name"
                                id="brand_name"
                                value={formData.brand_name || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="barcode" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Barcode</label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="barcode"
                                id="barcode"
                                value={formData.barcode || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="manufacturing_date" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Manufacturing Date</label>
                        <div className="mt-2">
                            <input
                                type="date"
                                name="manufacturing_date"
                                id="manufacturing_date"
                                value={formData.manufacturing_date || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="expiry_date" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Expiry Date</label>
                        <div className="mt-2">
                            <input
                                type="date"
                                name="expiry_date"
                                id="expiry_date"
                                value={formData.expiry_date || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="variant_size" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Size / Variant</label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="variant_size"
                                id="variant_size"
                                value={variantSize}
                                onChange={(e) => setVariantSize(e.target.value)}
                                placeholder="e.g. XL, 1kg, Red"
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                </div>

                <div className="flex items-center justify-end gap-x-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button type="button" onClick={() => router.back()} className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400">Cancel</button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Product
                    </button>
                </div>
            </form >
        </div >
    );
}
