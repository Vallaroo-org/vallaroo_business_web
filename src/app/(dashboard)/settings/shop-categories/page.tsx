'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBusiness } from '@/components/providers/business-provider';
import { createClient } from '@/lib/supabase/client';
import { ShopCategory } from '@/lib/types';
import { Loader2, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

export default function ShopCategoriesPage() {
    const { selectedBusiness } = useBusiness();
    const supabase = createClient();
    const { t } = useLanguage();

    // Using simple English strings for now as translation keys might not exist for this specific page yet
    // I will use direct strings for new UI elements to be safe and clear.

    const [categories, setCategories] = useState<ShopCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newItem, setNewItem] = useState<{ name: string, name_ml: string } | null>(null);
    const [editForm, setEditForm] = useState<{ name: string, name_ml: string }>({ name: '', name_ml: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (selectedBusiness) {
            fetchCategories();
        }
    }, [selectedBusiness]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('shop_categories') // Assumed table name from SQL
                .select('*')
                .eq('business_id', selectedBusiness!.id)
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartEdit = (cat: ShopCategory) => {
        setEditingId(cat.id);
        setEditForm({ name: cat.name, name_ml: cat.name_ml || '' });
        setNewItem(null);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({ name: '', name_ml: '' });
    };

    const handleSaveEdit = async (id: string) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('shop_categories')
                .update({
                    name: editForm.name,
                    name_ml: editForm.name_ml || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editForm.name, name_ml: editForm.name_ml || null } : c));
            setEditingId(null);
        } catch (error) {
            console.error('Error updating category:', error);
            alert('Failed to update category');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? Check if any shop is using it first.`)) return;

        // TODO: ideally check for usage in shops table before delete.
        // For now, simple delete. DB might throw FK constraint error if used.

        try {
            const { error } = await supabase
                .from('shop_categories')
                .delete()
                .eq('id', id);

            if (error) {
                // Check for FK violation message usually contained in error details
                console.error("Delete error", error);
                alert("Cannot delete this category because it is being used by a shop.");
                return;
            }

            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Failed to delete category');
        }
    };

    const handleStartAdd = () => {
        setNewItem({ name: '', name_ml: '' });
        setEditingId(null);
    };

    const handleSaveNew = async () => {
        if (!newItem?.name) return;
        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('shop_categories')
                .insert({
                    business_id: selectedBusiness!.id,
                    name: newItem.name,
                    name_ml: newItem.name_ml || null
                })
                .select()
                .single();

            if (error) throw error;

            setCategories(prev => [...prev, data]);
            setNewItem(null);
        } catch (error) {
            console.error('Error adding category:', error);
            alert('Failed to add category');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Shop Categories</h1>
                    <p className="text-muted-foreground">Manage types of shops (e.g. Grocery, Bakery).</p>
                </div>
                {!newItem && (
                    <Button onClick={handleStartAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                    </Button>
                )}
            </div>

            <Card className="bg-card border-border">
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {newItem && (
                            <div className="p-4 bg-muted/30">
                                <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                                    <div className="w-full sm:w-1/3">
                                        <label className="text-xs font-medium mb-1 block">Name (English)</label>
                                        <Input
                                            value={newItem.name}
                                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                            placeholder="e.g. Supermarket"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="w-full sm:w-1/3">
                                        <label className="text-xs font-medium mb-1 block">Name (Malayalam)</label>
                                        <Input
                                            value={newItem.name_ml}
                                            onChange={e => setNewItem({ ...newItem, name_ml: e.target.value })}
                                            placeholder="e.g. സൂപ്പർമാർക്കറ്റ്"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={handleSaveNew} disabled={saving || !newItem.name}>
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setNewItem(null)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {categories.map((cat) => (
                            <div key={cat.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                                {editingId === cat.id ? (
                                    <div className="flex flex-col sm:flex-row gap-4 w-full items-end sm:items-center">
                                        <Input
                                            className="sm:w-1/3"
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        />
                                        <Input
                                            className="sm:w-1/3"
                                            value={editForm.name_ml}
                                            onChange={e => setEditForm({ ...editForm, name_ml: e.target.value })}
                                            placeholder="Malayalam Name"
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleSaveEdit(cat.id)} disabled={saving || !editForm.name}>
                                                <Save className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <h3 className="font-medium text-foreground">{cat.name}</h3>
                                            {cat.name_ml && <p className="text-sm text-muted-foreground">{cat.name_ml}</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="icon" variant="ghost" onClick={() => handleStartEdit(cat)}>
                                                <Pencil className="w-4 h-4 text-muted-foreground" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10" onClick={() => handleDelete(cat.id, cat.name)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {categories.length === 0 && !loading && !newItem && (
                            <div className="p-8 text-center text-muted-foreground">
                                No categories found. Add one to get started.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
