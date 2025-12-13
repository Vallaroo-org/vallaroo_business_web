'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Store, User, CheckCircle2, Globe, Building2, MapPin, Phone } from 'lucide-react';
import { createBusinessAction } from '@/app/actions/onboarding';

enum Step {
    BUSINESS = 0,
    OWNER = 1,
    REVIEW = 2
}

export default function CreateBusinessPage() {
    const [step, setStep] = useState<Step>(Step.BUSINESS);
    const [loading, setLoading] = useState(false);
    const [showMalayalam, setShowMalayalam] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        nameMl: '',
        description: '',
        descriptionMl: '',
        website: '',
        city: '', // Headquarters
        ownerName: '', // Although not used in DB yet, we collect for parity/potential
        ownerPhone: ''
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (step === Step.BUSINESS) {
            if (!formData.name || !formData.city) {
                alert('Business Name and City are required');
                return;
            }
            setStep(Step.OWNER);
        } else if (step === Step.OWNER) {
            if (!formData.ownerName || !formData.ownerPhone) {
                alert('Owner Name and Phone are required');
                return;
            }
            setStep(Step.REVIEW);
        }
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value);
            });

            const result = await createBusinessAction(data);

            if (result.error) {
                alert(result.error);
                return;
            }

            if (result.businessId) {
                router.push(`/onboarding/shop?businessId=${result.businessId}`);
            }

        } catch (error) {
            console.error('Error creating business:', error);
            alert('Failed to create business. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="mb-8">
                <nav aria-label="Progress">
                    <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
                        {['Business Details', 'Owner Info', 'Review'].map((label, index) => {
                            const isComplete = step > index;
                            const isCurrent = step === index;
                            return (
                                <li key={label} className="md:flex-1">
                                    <div className={`
                                        group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4
                                        ${isComplete ? 'border-indigo-600' : isCurrent ? 'border-indigo-600' : 'border-gray-200'}
                                    `}>
                                        <span className={`text-sm font-medium ${isComplete || isCurrent ? 'text-indigo-600' : 'text-gray-500'}`}>
                                            Step {index + 1}
                                        </span>
                                        <span className="text-sm font-medium">{label}</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </nav>
            </div>

            <Card className="p-6 md:p-8">
                {step === Step.BUSINESS && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Store className="h-5 w-5 text-gray-500" />
                                Business Details
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${!showMalayalam ? 'text-indigo-600' : 'text-gray-400'}`}>EN</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={showMalayalam} onChange={e => setShowMalayalam(e.target.checked)} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                                <span className={`text-xs font-bold ${showMalayalam ? 'text-indigo-600' : 'text-gray-400'}`}>ML</span>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">
                                    Business Name {showMalayalam && '(Malayalam)'} <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={showMalayalam ? formData.nameMl : formData.name}
                                    onChange={(e) => updateField(showMalayalam ? 'nameMl' : 'name', e.target.value)}
                                    placeholder={showMalayalam ? "വല്ലാറൂ" : "e.g. Vallaroo Inc"}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">
                                    Description {showMalayalam && '(Malayalam)'}
                                </label>
                                <Input
                                    value={showMalayalam ? formData.descriptionMl : formData.description}
                                    onChange={(e) => updateField(showMalayalam ? 'descriptionMl' : 'description', e.target.value)}
                                    placeholder={showMalayalam ? "വിവരണം" : "Brief description of your business"}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">
                                    Website (Optional)
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        className="pl-9"
                                        value={formData.website}
                                        onChange={(e) => updateField('website', e.target.value)}
                                        placeholder="https://vallaroo.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">
                                    Headquarters City <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        className="pl-9"
                                        value={formData.city}
                                        onChange={(e) => updateField('city', e.target.value)}
                                        placeholder="e.g. Kochi"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === Step.OWNER && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <User className="h-5 w-5 text-gray-500" />
                                Owner Information
                            </h2>
                        </div>

                        <div className="grid gap-6">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">
                                    Owner Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={formData.ownerName}
                                    onChange={(e) => updateField('ownerName', e.target.value)}
                                    placeholder="Your Full Name"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        className="pl-9"
                                        type="tel"
                                        value={formData.ownerPhone}
                                        onChange={(e) => updateField('ownerPhone', e.target.value)}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === Step.REVIEW && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-gray-500" />
                                Review & Confirm
                            </h2>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg space-y-4 text-sm">
                            <div className="grid grid-cols-3 gap-2 border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Business Name</span>
                                <span className="col-span-2 font-medium">{formData.name}</span>
                            </div>
                            {formData.nameMl && (
                                <div className="grid grid-cols-3 gap-2 border-b border-gray-200 pb-2">
                                    <span className="text-gray-500">Name (ML)</span>
                                    <span className="col-span-2 font-medium">{formData.nameMl}</span>
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-2 border-b border-gray-200 pb-2">
                                <span className="text-gray-500">City</span>
                                <span className="col-span-2 font-medium">{formData.city}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Owner</span>
                                <span className="col-span-2 font-medium">{formData.ownerName}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-gray-500">Phone</span>
                                <span className="col-span-2 font-medium">{formData.ownerPhone}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-between pt-4 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={step === Step.BUSINESS || loading}
                    >
                        Back
                    </Button>

                    {step === Step.REVIEW ? (
                        <Button onClick={handleSubmit} disabled={loading} className="px-8">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Business
                        </Button>
                    ) : (
                        <Button onClick={handleNext} className="px-8">
                            Next
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
