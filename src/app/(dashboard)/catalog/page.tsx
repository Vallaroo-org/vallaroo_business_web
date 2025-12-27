'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Product, ProductCategory } from '@/lib/types';
import Link from 'next/link';
import { Plus, Search, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Card, CardContent } from '@/components/ui/card'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRouter } from 'next/navigation'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { toast } from 'sonner';

import { useBusiness } from '@/hooks/use-business';

export default function CatalogPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

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
                .select('*');

            if (catError) console.error('Error fetching categories:', JSON.stringify(catError, null, 2));
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

    const handleDeleteProduct = async () => {
        if (!deleteProduct) return;
        setDeleteLoading(true);

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', deleteProduct.id);

            if (error) throw error;

            setProducts(prev => prev.filter(p => p.id !== deleteProduct.id));
            toast.success('Product deleted successfully');
            setDeleteProduct(null);
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold text-foreground">Catalog</h1>
                <div className="flex gap-2">

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
                        className="block w-full rounded-md border-0 py-1.5 pl-10 pr-8 text-foreground bg-background ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                        placeholder="Search products by name or SKU..."
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
                                    <th scope="col" className="py-3.5 pl-3 sm:pl-6 pr-3 text-left text-sm font-semibold text-foreground">Name</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Price</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground hidden sm:table-cell">Stock</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground hidden md:table-cell">Category</th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-3 sm:pr-6">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="whitespace-nowrap py-4 pl-3 sm:pl-6 pr-3 text-sm font-medium text-foreground">
                                            {product.name}
                                            {product.name_ml && <span className="block text-xs text-muted-foreground">{product.name_ml}</span>}
                                            {/* Mobile: show stock inline */}
                                            <span className="sm:hidden block text-xs text-muted-foreground mt-0.5">
                                                Stock: <span className={product.stock <= product.min_stock_alert ? 'text-destructive font-medium' : ''}>{product.stock} {product.unit}</span>
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">₹{product.price}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                                            <span className={product.stock <= product.min_stock_alert ? 'text-destructive font-medium' : ''}>
                                                {product.stock} {product.unit}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground hidden md:table-cell">
                                            {categories.find(c => c.id === product.category_id)?.name || '-'}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-3 sm:pr-6 text-right text-sm font-medium">
                                            <div className="flex justify-end items-center gap-2 sm:gap-3">
                                                <Link href={`/catalog/${product.id}`} className="text-primary hover:text-primary/80 transition-colors text-xs sm:text-sm">
                                                    Edit
                                                </Link>
                                                <Link href={`/catalog/${product.id}?view=true`} className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm">
                                                    View
                                                </Link>
                                                <button
                                                    onClick={() => setDeleteProduct(product)}
                                                    className="p-1 sm:p-1.5 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/10 transition-colors"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteProduct} onOpenChange={(open) => !open && setDeleteProduct(null)}>
                <DialogContent className="max-w-md mx-4 sm:mx-0">
                    <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deleteProduct?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setDeleteProduct(null)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteProduct} disabled={deleteLoading} className="w-full sm:w-auto">
                            {deleteLoading ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
