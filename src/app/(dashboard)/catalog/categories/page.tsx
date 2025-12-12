'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProductCategory } from '@/lib/types';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBusiness } from '@/components/providers/business-provider';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const supabase = createClient();
    const { selectedBusiness, isLoading: contextLoading } = useBusiness();

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Partial<ProductCategory>>({});
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        if (!contextLoading && selectedBusiness) {
            fetchCategories();
        }
    }, [contextLoading, selectedBusiness]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchCategories = async () => {
        try {
            setLoading(true);
            if (!selectedBusiness) return;

            const { data, error } = await supabase
                .from('product_categories')
                .select('*')
                .eq('business_id', selectedBusiness.id)
                .order('name');

            if (error) throw error;
            setCategories(data || []);

        } catch (error) {
            console.error('Error loading categories:', JSON.stringify(error, null, 2));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            if (!selectedBusiness) throw new Error('No business selected');

            const categoryData = {
                business_id: selectedBusiness.id,
                name: currentCategory.name,
                description: currentCategory.description,
                name_ml: currentCategory.name_ml,
                description_ml: currentCategory.description_ml,
            };

            let error;
            if (currentCategory.id) {
                // Update
                const { error: updateError } = await supabase
                    .from('product_categories')
                    .update(categoryData)
                    .eq('id', currentCategory.id);
                error = updateError;
            } else {
                // Create
                const { error: insertError } = await supabase
                    .from('product_categories')
                    .insert(categoryData);
                error = insertError;
            }

            if (error) throw error;

            console.log('Category saved successfully');
            setIsEditing(false);
            setCurrentCategory({});
            fetchCategories();

        } catch (error) {
            console.error('Error saving category:', JSON.stringify(error, null, 2));
            alert('Failed to save category');
        } finally {
            setFormLoading(false);
        }
    };

    const startEdit = (category: ProductCategory) => {
        setCurrentCategory(category);
        setIsEditing(true);
    };

    const startNew = () => {
        setCurrentCategory({});
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const { error } = await supabase
                .from('product_categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchCategories();

        } catch (error) {
            console.error('Error deleting category:', JSON.stringify(error, null, 2));
            alert('Failed to delete category');
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/catalog" className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </Link>
                    <h1 className="text-2xl font-bold text-foreground">Categories</h1>
                </div>
                {!isEditing && (
                    <Button onClick={startNew}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                    </Button>
                )}
            </div>

            {isEditing && (
                <Card className="border-border shadow-sm bg-card">
                    <CardHeader>
                        <CardTitle>{currentCategory.id ? 'Edit Category' : 'New Category'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                                    <Input
                                        value={currentCategory.name || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                                        required
                                        placeholder="e.g. Beverages"
                                        className="bg-background border-input text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Name (Malayalam)
                                        <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                    </label>
                                    <Input
                                        value={currentCategory.name_ml || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentCategory({ ...currentCategory, name_ml: e.target.value })}
                                        placeholder="e.g. പാനീയങ്ങൾ"
                                        className="bg-background border-input text-foreground"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                                    <Input
                                        value={currentCategory.description || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                                        placeholder="Brief description of this category"
                                        className="bg-background border-input text-foreground"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={formLoading}>
                                    {formLoading ? 'Saving...' : 'Save Category'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="bg-card border-border">
                <div className="p-4 border-b border-border">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-8 bg-background border-input text-foreground"
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <CardContent className="p-0 bg-card">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading categories...</div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="p-12 text-center">
                            <h3 className="text-sm font-semibold text-foreground">No categories found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Create your first category to organize products.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                                        <th scope="col" className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {filteredCategories.map((cat) => (
                                        <tr key={cat.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-foreground">{cat.name}</div>
                                                {cat.name_ml && <div className="text-xs text-muted-foreground">{cat.name_ml}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {cat.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => startEdit(cat)}
                                                        className="p-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(cat.id)}
                                                        className="p-1 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
