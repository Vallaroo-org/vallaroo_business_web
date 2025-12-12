'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Product, ProductCategory } from '@/lib/types';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Card, CardContent } from '@/components/ui/card'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { useRouter } from 'next/navigation'; // eslint-disable-line @typescript-eslint/no-unused-vars

import { useBusiness } from '@/hooks/use-business';

export default function CatalogPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const supabase = createClient();
    const { selectedBusiness, selectedShop, isLoading: contextLoading } = useBusiness();

    useEffect(() => {
        if (!contextLoading && selectedBusiness && selectedShop) {
            fetchData();
        }
    }, [contextLoading, selectedBusiness, selectedShop]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchData = async () => {
        try {
            setIsLoading(true);
            if (!selectedBusiness || !selectedShop) return;

            // Fetch Categories (Business Level)
            const { data: cats, error: catError } = await supabase
                .from('product_categories')
                .select('*')
                .eq('business_id', selectedBusiness.id);

            if (catError) console.error('Error fetching categories:', catError);
            else setCategories(cats || []);

            // Fetch Products (Shop Level)
            const { data: prods, error: prodError } = await supabase
                .from('products')
                .select('*')
                .eq('shop_id', selectedShop.id)
                .order('created_at', { ascending: false });

            if (prodError) console.error('Error fetching products:', JSON.stringify(prodError, null, 2));
            else setProducts(prods || []);

        } catch (error) {
            console.error('Error loading catalog:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold text-foreground">Catalog</h1>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/catalog/categories">
                            Manage Categories
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/catalog/new">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Product
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg shadow-sm border border-border">
                <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-md border-0 py-1.5 pl-10 text-foreground bg-background ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                        placeholder="Search products by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="sm:w-64">
                    <select
                        className="block w-full rounded-md border-0 py-1.5 text-foreground bg-background ring-1 ring-inset ring-input focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Product List */}
            <div className="bg-card shadow-sm border border-border sm:rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-12 text-center">
                        <h3 className="text-sm font-semibold text-foreground">No products found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Get started by creating a new product.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">Name</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Price</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Stock</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Category</th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                            {product.name}
                                            {product.name_ml && <span className="block text-xs text-muted-foreground">{product.name_ml}</span>}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">₹{product.price}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                            <span className={product.stock <= product.min_stock_alert ? 'text-destructive font-medium' : ''}>
                                                {product.stock} {product.unit}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                            {categories.find(c => c.id === product.category_id)?.name || '-'}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            <Link href={`/catalog/${product.id}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-4">
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
