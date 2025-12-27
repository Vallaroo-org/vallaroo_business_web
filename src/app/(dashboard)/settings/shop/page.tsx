'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBusiness } from '@/components/providers/business-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Store } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { QRCodeUpload } from './_components/qr-code-upload';

// Validation Schema
const shopProfileSchema = z.object({
    name: z.string().min(1, 'Shop name is required').max(100, 'Shop name must be 100 characters or less'),
    name_ml: z.string().optional(),
    phone_number: z.string().optional().refine(
        (val) => !val || /^[0-9+\-\s()]{10,15}$/.test(val),
        { message: 'Please enter a valid phone number' }
    ),
    address_line1: z.string().optional(),
    city: z.string().optional(),
    description: z.string().optional(),
    opening_time: z.string().optional(),
    closing_time: z.string().optional(),
    delivery_available: z.boolean(),
    takeaway_available: z.boolean(),
    upi_id: z.string().optional(),
    qr_code_url: z.string().optional(),
    shop_type: z.string(),
    is_temporarily_closed: z.boolean(),
    closure_reason: z.string().optional(),
    closure_start_date: z.string().optional(),
    closure_end_date: z.string().optional(),
    hide_shop_during_closure: z.boolean(),
    hide_products_during_closure: z.boolean(),
    hide_services_during_closure: z.boolean(),
});

type FormErrors = Partial<Record<keyof z.infer<typeof shopProfileSchema>, string>>;

export default function ShopProfilePage() {
    const supabase = createClient();
    const { selectedShop, setShop, isLoading: contextLoading } = useBusiness();
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

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
        upi_id: '',
        qr_code_url: '',
        shop_type: 'product',
        is_temporarily_closed: false,
        closure_reason: '',
        closure_start_date: '',
        closure_end_date: '',
        hide_shop_during_closure: false,
        hide_products_during_closure: false,
        hide_services_during_closure: false,
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
                upi_id: selectedShop.upi_id || '',
                qr_code_url: selectedShop.qr_code_url || '',
                shop_type: selectedShop.shop_type || 'product',
                is_temporarily_closed: selectedShop.is_temporarily_closed || false,
                closure_reason: selectedShop.closure_reason || '',
                closure_start_date: selectedShop.closure_start_date || '',
                closure_end_date: selectedShop.closure_end_date || '',
                hide_shop_during_closure: selectedShop.hide_shop_during_closure || false,
                hide_products_during_closure: selectedShop.hide_products_during_closure || false,
                hide_services_during_closure: selectedShop.hide_services_during_closure || false,
            });
        }
    }, [selectedShop]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));
        // Clear error for this field when user types
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedShop) return;

        // Validate form
        const validation = shopProfileSchema.safeParse(formData);
        if (!validation.success) {
            const newErrors: FormErrors = {};
            validation.error.issues.forEach((issue) => {
                if (issue.path[0]) {
                    newErrors[issue.path[0] as keyof FormErrors] = issue.message;
                }
            });
            setErrors(newErrors);
            toast.error('Please fix the errors in the form');
            return;
        }

        setErrors({});
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
                upi_id: formData.upi_id || null,
                qr_code_url: formData.qr_code_url || null,
                shop_type: formData.shop_type,
                is_temporarily_closed: formData.is_temporarily_closed,
                closure_reason: formData.closure_reason || null,
                closure_start_date: formData.closure_start_date || null,
                closure_end_date: formData.closure_end_date || null,
                hide_shop_during_closure: formData.hide_shop_during_closure,
                hide_products_during_closure: formData.hide_products_during_closure,
                hide_services_during_closure: formData.hide_services_during_closure,
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
                toast.success('Shop profile updated successfully!');
            }

        } catch (error: unknown) {
            console.error('Error updating shop:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Failed to update shop: ${message}`);
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
        <div className="max-w-2xl mx-auto space-y-6 px-2 sm:px-0">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Shop Profile</h1>
                <p className="text-muted-foreground text-sm sm:text-base">Manage your shop details.</p>
            </div>

            <Card className="bg-card border-border">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-foreground text-base sm:text-lg">Shop Information</CardTitle>
                    <CardDescription className="text-muted-foreground text-sm">Update details for {selectedShop.name}.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                        <div className="flex items-center gap-3 sm:gap-4 mb-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-lg sm:text-xl font-bold flex-shrink-0">
                                <Store className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{selectedShop.name}</p>
                                <p className="text-xs text-muted-foreground truncate">Shop ID: {selectedShop.id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Shop Name <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Shop Name"
                                    className={`bg-background border-input text-foreground ${errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">{errors.name}</p>
                                )}
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
                                className={`bg-background border-input text-foreground ${errors.phone_number ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                            />
                            {errors.phone_number && (
                                <p className="text-xs text-destructive">{errors.phone_number}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Shop Type</label>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-1">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer border p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                        <input
                                            type="radio"
                                            name="shop_type"
                                            value="product"
                                            checked={formData.shop_type === 'product' || !formData.shop_type}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-primary"
                                        />
                                        <span className="text-xs sm:text-sm">Product Based</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer border p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                        <input
                                            type="radio"
                                            name="shop_type"
                                            value="service"
                                            checked={formData.shop_type === 'service'}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-primary"
                                        />
                                        <span className="text-xs sm:text-sm">Service Based</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer border p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                        <input
                                            type="radio"
                                            name="shop_type"
                                            value="both"
                                            checked={formData.shop_type === 'both'}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-primary"
                                        />
                                        <span className="text-xs sm:text-sm">Both</span>
                                    </label>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Select 'Product Based' for retail/inventory, 'Service Based' for appointments/services, or 'Both'.
                                </p>
                            </div>

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


                        {/* Temporary Closure Settings */}
                        <div className="pt-6 border-t border-border mt-6">
                            <h3 className="text-base sm:text-lg font-medium text-foreground mb-4">Temporary Closure</h3>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_temporarily_closed"
                                        name="is_temporarily_closed"
                                        checked={formData.is_temporarily_closed}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                                    />
                                    <label htmlFor="is_temporarily_closed" className="text-sm font-medium text-foreground">Mark Shop as Temporarily Closed</label>
                                </div>

                                {formData.is_temporarily_closed && (
                                    <div className="pl-4 sm:pl-6 space-y-4 border-l-2 border-muted ml-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Reason for Closure</label>
                                            <Textarea
                                                name="closure_reason"
                                                value={formData.closure_reason}
                                                onChange={(e) => setFormData(prev => ({ ...prev, closure_reason: e.target.value }))}
                                                placeholder="e.g. Taking a short break, Renovation, etc."
                                                className="bg-background border-input text-foreground"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-foreground">Start Date</label>
                                                <Input
                                                    name="closure_start_date"
                                                    type="date"
                                                    value={formData.closure_start_date || ''}
                                                    onChange={handleChange}
                                                    className="bg-background border-input text-foreground"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-foreground">End Date (Optional)</label>
                                                <Input
                                                    name="closure_end_date"
                                                    type="date"
                                                    value={formData.closure_end_date || ''}
                                                    onChange={handleChange}
                                                    className="bg-background border-input text-foreground"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Visibility Options</label>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id="hide_shop"
                                                        name="hide_shop_during_closure"
                                                        checked={formData.hide_shop_during_closure}
                                                        onChange={handleChange}
                                                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                                                    />
                                                    <label htmlFor="hide_shop" className="text-sm text-foreground">Hide shop from lists completely</label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id="hide_products"
                                                        name="hide_products_during_closure"
                                                        checked={formData.hide_products_during_closure}
                                                        onChange={handleChange}
                                                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                                                    />
                                                    <label htmlFor="hide_products" className="text-sm text-foreground">Hide Products</label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id="hide_services"
                                                        name="hide_services_during_closure"
                                                        checked={formData.hide_services_during_closure}
                                                        onChange={handleChange}
                                                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                                                    />
                                                    <label htmlFor="hide_services" className="text-sm text-foreground">Hide Services</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Settings */}
                        <div className="pt-6 border-t border-border mt-6">
                            <h3 className="text-base sm:text-lg font-medium text-foreground mb-4">Payment Settings</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">UPI ID</label>
                                        <Input
                                            name="upi_id"
                                            value={formData.upi_id}
                                            onChange={handleChange}
                                            placeholder="e.g. merchant@upi"
                                            className="bg-background border-input text-foreground"
                                        />
                                        <p className="text-xs text-muted-foreground">This ID will be used for UPI payments.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Store QR Code</label>
                                    <QRCodeUpload
                                        shopId={selectedShop.id}
                                        url={formData.qr_code_url}
                                        onUpload={(url) => setFormData(prev => ({ ...prev, qr_code_url: url }))}
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">Upload a QR code image for payments.</p>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t border-border flex justify-end p-3 sm:p-4">
                        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
