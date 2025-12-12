'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBusiness } from '@/components/providers/business-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Store } from 'lucide-react';

export default function ShopProfilePage() {
    const supabase = createClient();
    const { selectedShop, setShop, isLoading: contextLoading } = useBusiness();
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        name_ml: '',
        phone_number: '',
        address_line1: '',
        city: '',
        description: '',
        opening_time: '',
        closing_time: '',
        delivery_available: false,
        takeaway_available: false,
    });

    useEffect(() => {
        if (selectedShop) {
            setFormData({
                name: selectedShop.name || '',
                name_ml: selectedShop.name_ml || '',
                phone_number: selectedShop.phone_number || '',
                address_line1: selectedShop.address_line1 || '',
                city: selectedShop.city || '',
                description: selectedShop.description || '',
                opening_time: selectedShop.opening_time || '',
                closing_time: selectedShop.closing_time || '',
                delivery_available: selectedShop.delivery_available || false,
                takeaway_available: selectedShop.takeaway_available || false,
            });
        }
    }, [selectedShop]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData(prev => ({ ...prev, [e.target.name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedShop) return;

        setSaving(true);
        try {
            const updates = {
                name: formData.name,
                name_ml: formData.name_ml || null,
                phone_number: formData.phone_number || null,
                address_line1: formData.address_line1 || null,
                city: formData.city || null,
                description: formData.description || null,
                opening_time: formData.opening_time || null,
                closing_time: formData.closing_time || null,
                delivery_available: formData.delivery_available,
                takeaway_available: formData.takeaway_available,
                updated_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from('shops')
                .update(updates)
                .eq('id', selectedShop.id)
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setShop(data); // Update context
                alert('Shop profile updated successfully!');
            }

        } catch (error: unknown) {
            console.error('Error updating shop:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to update shop: ${message}`);
        } finally {
            setSaving(false);
        }
    };

    if (contextLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
    }

    if (!selectedShop) {
        return (
            <div className="p-8 text-center bg-card border border-border rounded-lg max-w-2xl mx-auto">
                <Store className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-foreground">No Shop Selected</h2>
                <p className="text-muted-foreground mt-2">Please select a shop from the business dashboard to manage its settings.</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Shop Profile</h1>
                <p className="text-muted-foreground">Manage your shop details.</p>
            </div>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Shop Information</CardTitle>
                    <CardDescription className="text-muted-foreground">Update details for {selectedShop.name}.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xl font-bold">
                                <Store className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">{selectedShop.name}</p>
                                <p className="text-xs text-muted-foreground">Shop ID: {selectedShop.id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Shop Name</label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Shop Name"
                                    required
                                    className="bg-background border-input text-foreground"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Shop Name (Malayalam)</label>
                                <Input
                                    name="name_ml"
                                    value={formData.name_ml}
                                    onChange={handleChange}
                                    placeholder="Shop Name (ML)"
                                    className="bg-background border-input text-foreground"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Description</label>
                            <Input
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe your shop..."
                                className="bg-background border-input text-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Phone Number</label>
                            <Input
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                placeholder="Shop Phone"
                                className="bg-background border-input text-foreground"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">City</label>
                                <Input
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="City"
                                    className="bg-background border-input text-foreground"
                                />
                            </div>
                            {/* Address Line 1 */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Address</label>
                                <Input
                                    name="address_line1"
                                    value={formData.address_line1}
                                    onChange={handleChange}
                                    placeholder="Address"
                                    className="bg-background border-input text-foreground"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Opening Time</label>
                                <Input
                                    name="opening_time"
                                    type="time"
                                    value={formData.opening_time}
                                    onChange={handleChange}
                                    className="bg-background border-input text-foreground"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Closing Time</label>
                                <Input
                                    name="closing_time"
                                    type="time"
                                    value={formData.closing_time}
                                    onChange={handleChange}
                                    className="bg-background border-input text-foreground"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="delivery_available"
                                    name="delivery_available"
                                    checked={formData.delivery_available}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                                />
                                <label htmlFor="delivery_available" className="text-sm font-medium text-foreground">Delivery Available</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="takeaway_available"
                                    name="takeaway_available"
                                    checked={formData.takeaway_available}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                                />
                                <label htmlFor="takeaway_available" className="text-sm font-medium text-foreground">Takeaway / Booking Available</label>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t border-border flex justify-end p-4">
                        <Button type="submit" disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
