'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
    Loader2, Store, Clock, MapPin, Truck, ShoppingBag,
    CheckCircle2, Phone, Globe, ChevronRight, ChevronLeft, Map as MapIcon,
    AlignLeft
} from 'lucide-react';
import { createShopAction } from '@/app/actions/onboarding';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/language-context';

// Helper for Indian States
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

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
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
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

    const { locale } = useLanguage();
    const isMalayalam = locale === 'ml';

    // Stepper State
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    // Data Loading
    const [categories, setCategories] = useState<any[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    const [formData, setFormData] = useState({
        // Step 1: Basic Details
        name: '', nameMl: '',
        description: '', descriptionMl: '',
        categoryId: '',
        shopType: 'product',
        phone: '', whatsapp: '',

        // Step 2: Location
        address1: '', address1Ml: '',
        address2: '', address2Ml: '',
        city: '', cityMl: '',
        state: 'Kerala',
        postalCode: '',
        country: 'India',
        latitude: '', longitude: '',

        // Step 3: Operations
        openingTime: '', closingTime: '',
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

    const validateStep = (step: number) => {
        if (step === 1) {
            if (!formData.name) return false;
            if (!formData.categoryId && formData.categoryId !== 'add_new') return false;
            if (!formData.phone) return false;
            // Additional basic validation
        }
        if (step === 2) {
            if (!formData.city) return false;
            // if (!formData.address1) return false; // Enforce address if needed
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        } else {
            alert('Please fill in all required fields marked with *');
        }
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!businessId) {
            alert('Business ID missing');
            return;
        }

        if (formData.categoryId === 'add_new') {
            alert('Please select a valid category or implement new category creation.');
            return;
        }

        setLoading(true);

        try {
            const data = new FormData();

            // Map state to FormData expected by implementation
            // Note: Adjust mapping based on what createShopAction expects
            // Usually matching the input names
            data.append('name', formData.name);
            data.append('nameMl', formData.nameMl);
            data.append('description', formData.description);
            data.append('descriptionMl', formData.descriptionMl);
            data.append('categoryId', formData.categoryId);
            data.append('phoneNumber', formData.phone);
            data.append('whatsappNumber', formData.whatsapp);
            data.append('shopType', formData.shopType || 'product');

            data.append('addressLine1', formData.address1);
            data.append('addressLine1Ml', formData.address1Ml);
            data.append('addressLine2', formData.address2);
            data.append('addressLine2Ml', formData.address2Ml);
            data.append('city', formData.city);
            data.append('cityMl', formData.cityMl);
            data.append('state', formData.state);
            data.append('postalCode', formData.postalCode);
            data.append('country', formData.country);

            data.append('latitude', formData.latitude);
            data.append('longitude', formData.longitude);

            data.append('openingTime', formData.openingTime);
            data.append('closingTime', formData.closingTime);

            if (formData.deliveryAvailable) data.append('deliveryAvailable', 'on');
            if (formData.takeawayAvailable) data.append('takeawayAvailable', 'on');

            const result = await createShopAction(businessId, data);

            if (result.error) {
                alert(result.error);
                return;
            }

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
        <Card className="max-w-3xl mx-auto my-8 overflow-hidden bg-card border-border">
            {/* Header */}
            <div className="bg-muted/30 border-b border-border p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Add New Shop</h3>
                        <p className="text-sm text-muted-foreground">Provide details to setup your new location.</p>
                    </div>
                </div>

                {/* Stepper */}
                <div className="relative flex items-center justify-between w-full px-4">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-muted -z-10" />
                    {['Basic Details', 'Location', 'Operations'].map((stepName, idx) => {
                        const stepNum = idx + 1;
                        const isActive = currentStep === stepNum;
                        const isCompleted = currentStep > stepNum;

                        return (
                            <div key={idx} className="flex flex-col items-center bg-card px-2 rounded-lg z-10">
                                <div className={`
                                     w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 mb-2 transition-colors
                                     ${isActive ? 'border-primary bg-primary text-primary-foreground' :
                                        isCompleted ? 'border-green-500 bg-green-500 text-white' : 'border-muted bg-card text-muted-foreground'}
                                 `}>
                                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : stepNum}
                                </div>
                                <span className={`text-xs font-medium ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
                                    {stepName}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Form Content */}
            <div className="p-6 md:p-8 min-h-[400px]">
                {/* Step 1: Basic Details */}
                {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="text-sm font-medium mb-1.5 block text-foreground">Shop Name <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        required
                                        value={isMalayalam ? formData.nameMl : formData.name}
                                        onChange={(e) => updateField(isMalayalam ? 'nameMl' : 'name', e.target.value)}
                                        placeholder={isMalayalam ? "ഷോപ്പിന്റെ പേര്" : "e.g. MG Road Branch"}
                                    />
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="text-sm font-medium mb-1.5 block text-foreground">Shop Type <span className="text-red-500">*</span></label>
                                <div className="flex gap-4">
                                    <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors flex-1">
                                        <input
                                            type="radio"
                                            name="shopType"
                                            className="h-4 w-4 text-primary"
                                            checked={formData.shopType === 'product' || !formData.shopType}
                                            onChange={() => updateField('shopType', 'product')}
                                        />
                                        <span className="text-sm font-medium">Product Based</span>
                                    </label>
                                    <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors flex-1">
                                        <input
                                            type="radio"
                                            name="shopType"
                                            className="h-4 w-4 text-primary"
                                            checked={formData.shopType === 'service'}
                                            onChange={() => updateField('shopType', 'service')}
                                        />
                                        <span className="text-sm font-medium">Service Based</span>
                                    </label>
                                    <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors flex-1">
                                        <input
                                            type="radio"
                                            name="shopType"
                                            className="h-4 w-4 text-primary"
                                            checked={formData.shopType === 'both'}
                                            onChange={() => updateField('shopType', 'both')}
                                        />
                                        <span className="text-sm font-medium">Both</span>
                                    </label>
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="text-sm font-medium mb-1.5 block text-foreground">Description</label>
                                <div className="relative">
                                    <AlignLeft className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    {/* Note: Using Input as Textarea replacement for simplicity or add Textarea to UI Kit */}
                                    <Input
                                        className="pl-9 h-24 py-2" // Hacky textarea height if Input supports multiline or use Textarea component
                                        value={isMalayalam ? formData.descriptionMl : formData.description}
                                        onChange={(e) => updateField(isMalayalam ? 'descriptionMl' : 'description', e.target.value)}
                                        placeholder={isMalayalam ? "വിവരണം" : "Detailed description of the shop..."}
                                    />
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="text-sm font-medium mb-1.5 block text-foreground">Category <span className="text-red-500">*</span></label>
                                {categoriesLoading ? (
                                    <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
                                ) : (
                                    <CategorySelect
                                        value={formData.categoryId}
                                        onChange={(val) => updateField('categoryId', val)}
                                        categories={categories}
                                    />
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block text-foreground">Phone Number <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => updateField('phone', e.target.value)}
                                        placeholder="+91 9876543210"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block text-foreground">WhatsApp Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-green-500" />
                                    <Input
                                        className="pl-9"
                                        type="tel"
                                        value={formData.whatsapp}
                                        onChange={(e) => updateField('whatsapp', e.target.value)}
                                        placeholder="+91 9876543210"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )
                }

                {/* Step 2: Location */}
                {
                    currentStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-sm font-medium mb-1.5 block text-foreground">Address Line 1</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            className="pl-9"
                                            value={isMalayalam ? formData.address1Ml : formData.address1}
                                            onChange={(e) => updateField(isMalayalam ? 'address1Ml' : 'address1', e.target.value)}
                                            placeholder={isMalayalam ? "വിലാസം 1" : "Street, Building, etc."}
                                        />
                                    </div>
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-sm font-medium mb-1.5 block text-foreground">Address Line 2</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            className="pl-9"
                                            value={isMalayalam ? formData.address2Ml : formData.address2}
                                            onChange={(e) => updateField(isMalayalam ? 'address2Ml' : 'address2', e.target.value)}
                                            placeholder={isMalayalam ? "വിലാസം 2" : "Apartment, Suite, Unit, etc."}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1.5 block text-foreground">City <span className="text-red-500">*</span></label>
                                    <Input
                                        required
                                        value={isMalayalam ? formData.cityMl : formData.city}
                                        onChange={(e) => updateField(isMalayalam ? 'cityMl' : 'city', e.target.value)}
                                        placeholder="e.g. Kochi"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1.5 block text-foreground">State</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                                        value={formData.state}
                                        onChange={(e) => updateField('state', e.target.value)}
                                    >
                                        {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1.5 block text-foreground">Postal Code</label>
                                    <Input
                                        value={formData.postalCode}
                                        onChange={(e) => updateField('postalCode', e.target.value)}
                                        placeholder="682001"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1.5 block text-foreground">Country</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            className="pl-9"
                                            value={formData.country}
                                            onChange={(e) => updateField('country', e.target.value)}
                                            placeholder="India"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1.5 block text-foreground">Latitude</label>
                                    <div className="relative">
                                        <MapIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            className="pl-9"
                                            type="number"
                                            step="any"
                                            value={formData.latitude}
                                            onChange={(e) => updateField('latitude', e.target.value)}
                                            placeholder="e.g. 9.9312"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block text-foreground">Longitude</label>
                                    <div className="relative">
                                        <MapIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            className="pl-9"
                                            type="number"
                                            step="any"
                                            value={formData.longitude}
                                            onChange={(e) => updateField('longitude', e.target.value)}
                                            placeholder="e.g. 76.2673"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Step 3: Operations */}
                {
                    currentStep === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block text-foreground">Opening Time</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="time"
                                            className="pl-9"
                                            value={formData.openingTime}
                                            onChange={(e) => updateField('openingTime', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block text-foreground">Closing Time</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="time"
                                            className="pl-9"
                                            value={formData.closingTime}
                                            onChange={(e) => updateField('closingTime', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                <label className="flex items-center space-x-3 p-4 border rounded-xl hover:bg-muted/50 cursor-pointer transition-colors bg-card border-border shadow-sm">
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 text-primary rounded border-input focus:ring-primary"
                                        checked={formData.deliveryAvailable}
                                        onChange={(e) => updateField('deliveryAvailable', e.target.checked)}
                                    />
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <Truck className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="text-sm text-foreground font-medium">
                                            Delivery Available
                                        </div>
                                    </div>
                                </label>

                                <label className="flex items-center space-x-3 p-4 border rounded-xl hover:bg-muted/50 cursor-pointer transition-colors bg-card border-border shadow-sm">
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 text-primary rounded border-input focus:ring-primary"
                                        checked={formData.takeawayAvailable}
                                        onChange={(e) => updateField('takeawayAvailable', e.target.checked)}
                                    />
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <ShoppingBag className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="text-sm text-foreground font-medium">
                                            Takeaway / Booking Available
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )
                }
            </div >

            {/* Footer / Actions */}
            < div className="bg-muted/30 p-6 border-t border-border flex justify-between" >
                <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={currentStep === 1 || loading}
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                {
                    currentStep < totalSteps ? (
                        <Button onClick={handleNext}>
                            Next
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading} className="px-6">
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Create Shop
                        </Button>
                    )
                }
            </div >
        </Card >
    );
}

export default function CreateShopPage() {
    return (
        <div className="min-h-screen bg-muted/10 py-8 px-4">
            <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>}>
                <CreateShopForm />
            </Suspense>
        </div>
    );
}
