'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBusiness } from '@/components/providers/business-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Building2 } from 'lucide-react';

export default function BusinessProfilePage() {
    const supabase = createClient();
    const { selectedBusiness, isLoading: contextLoading } = useBusiness();
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        address_line1: '',
        city: '',
        state: ''
    });

    useEffect(() => {
        if (selectedBusiness) {
            setFormData({
                name: selectedBusiness.name || '',
                phone_number: selectedBusiness.phone_number || '',
                address_line1: selectedBusiness.address_line1 || '',
                city: selectedBusiness.city || '',
                state: selectedBusiness.state || ''
            });
        }
    }, [selectedBusiness]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBusiness) return;

        setSaving(true);
        try {
            const updates = {
                id: selectedBusiness.id,
                name: formData.name,
                phone_number: formData.phone_number,
                address_line1: formData.address_line1,
                city: formData.city,
                state: formData.state,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('businesses')
                .update(updates)
                .eq('id', selectedBusiness.id);

            if (error) throw error;

            alert('Business profile updated successfully! Changes will reflect after reload.');
            // Ideally we'd update context here, but reload effectively does it

        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Error updating business:', error);
            alert(`Failed to update business: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (contextLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
    }

    if (!selectedBusiness) {
        return <div className="p-8 text-center text-gray-500">No business selected.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Business Profile</h1>
                <p className="text-muted-foreground">Manage your business details.</p>
            </div>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                    <CardDescription>Update details for {selectedBusiness.name}.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl font-bold">
                                <Building2 className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">{selectedBusiness.name}</p>
                                <p className="text-xs text-muted-foreground">Business ID: {selectedBusiness.id}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Business Name</label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Business Name"
                                required
                                className="bg-background border-input text-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Phone Number</label>
                            <Input
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                placeholder="Business Phone"
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
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">State</label>
                                <Input
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="State"
                                    className="bg-background border-input text-foreground"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Address</label>
                            <Input
                                name="address_line1"
                                value={formData.address_line1}
                                onChange={handleChange}
                                placeholder="Address Line 1"
                                className="bg-background border-input text-foreground"
                            />
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
